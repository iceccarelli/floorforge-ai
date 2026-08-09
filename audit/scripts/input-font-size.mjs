#!/usr/bin/env node
/** iOS Safari auto-zooms any focused input whose computed font-size < 16px. */
import { chromium } from "playwright";
import { ROUTES, BASE, settle } from "./viewports.mjs";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const rows = [];
for (const route of ROUTES) {
  try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 }); } catch {}
  await settle(page);
  rows.push(...(await page.evaluate((route) => {
    const out = [];
    for (const el of document.querySelectorAll("input, select, textarea")) {
      const cs = getComputedStyle(el);
      const px = parseFloat(cs.fontSize);
      out.push({ route, tag: el.tagName.toLowerCase(), type: el.getAttribute("type") || "", fontSize: px,
        zooms: px < 16 && !["range","checkbox","radio","submit","button","color","file"].includes(el.getAttribute("type") || ""),
        cls: String(el.className || "").slice(0, 60) });
    }
    return out;
  }, route)));
}
await browser.close();
const bad = rows.filter((r) => r.zooms);
console.log(JSON.stringify({ checked: rows.length, zooming: bad.length, bad, all: rows }, null, 2));
process.exit(bad.length ? 1 : 0);
