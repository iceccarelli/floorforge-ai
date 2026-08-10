#!/usr/bin/env node
/** Horizontal-overflow detector: every route x every viewport. P0 if any. */
import { chromium } from "playwright";
import { VIEWPORTS, ROUTES, BASE, settle, waitForServer } from "./viewports.mjs";

await waitForServer();
const browser = await chromium.launch();
const rows = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.width < 900,
    hasTouch: vp.width < 900,
  });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
    } catch { /* keep going; networkidle can time out on WebGL routes */ }
    await settle(page);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const over = de.scrollWidth - de.clientWidth;
      const culprits = [];
      if (over > 0) {
        for (const el of document.querySelectorAll("*")) {
          const b = el.getBoundingClientRect();
          if (b.width === 0) continue;
          if (b.right > de.clientWidth + 1 || b.left < -1) {
            const cs = getComputedStyle(el);
            // ignore elements inside an element that scrolls itself
            let p = el.parentElement, contained = false;
            while (p) {
              const pcs = getComputedStyle(p);
              if (/auto|scroll|hidden/.test(pcs.overflowX)) { contained = true; break; }
              p = p.parentElement;
            }
            if (contained) continue;
            culprits.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || "")).slice(0, 90),
              left: Math.round(b.left), right: Math.round(b.right),
              overflowX: cs.overflowX,
            });
          }
        }
      }
      return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, over, culprits: culprits.slice(0, 6) };
    });
    rows.push({ viewport: vp.name, w: vp.width, route, ...r });
  }
  await ctx.close();
}
await browser.close();

const bad = rows.filter((r) => r.over > 0);
console.log(JSON.stringify({ checked: rows.length, overflowing: bad.length, bad, all: rows }, null, 2));
process.exit(bad.length ? 1 : 0);
