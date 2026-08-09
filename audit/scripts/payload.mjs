#!/usr/bin/env node
/**
 * Cold-load transfer measurement per route, plus proof of whether three.js /
 * @react-three/drei reach a given route's JS. Throttled-4G numbers come from
 * Lighthouse; this measures raw bytes with an empty cache.
 */
import { chromium } from "playwright";
import { ROUTES, BASE, settle } from "./viewports.mjs";

const browser = await chromium.launch();
const out = [];
for (const route of ROUTES) {
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  const byType = {}; const jsUrls = [];
  page.on("response", async (res) => {
    const req = res.request();
    let len = 0;
    try { len = (await res.body()).length; } catch { len = 0; }
    const t = req.resourceType();
    byType[t] = (byType[t] || 0) + len;
    if (t === "script") jsUrls.push({ url: res.url(), bytes: len });
  });
  try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 }); } catch {}
  const initial = JSON.parse(JSON.stringify(byType));
  await settle(page);           // scroll the page: fires every lazy image
  const full = JSON.parse(JSON.stringify(byType));

  // does any script served to this route contain three.js / drei?
  let threeBytes = 0, dreiHit = false, threeHit = false;
  for (const s of jsUrls) {
    try {
      const body = await (await fetch(s.url)).text();
      if (/THREE\.WebGLRenderer|WebGLRenderer: |three\.module|BufferGeometry/.test(body)) { threeHit = true; threeBytes += s.bytes; }
      if (/@react-three\/drei|OrbitControls|drei/.test(body)) dreiHit = true;
    } catch {}
  }
  const kb = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +(v / 1024).toFixed(1)]));
  const sum = (o) => +(Object.values(o).reduce((a, b) => a + b, 0) / 1024).toFixed(1);
  out.push({ route, initialKB: kb(initial), initialTotalKB: sum(initial),
    afterScrollKB: kb(full), afterScrollTotalKB: sum(full),
    scriptCount: jsUrls.length, threeInRouteJS: threeHit, dreiInRouteJS: dreiHit,
    threeChunkKB: +(threeBytes / 1024).toFixed(1) });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
