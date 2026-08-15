#!/usr/bin/env node
/** WCAG 2.2 AA 2.5.8 target size: every interactive element >= 44x44 CSS px. */
import { launchBrowser } from "./browser.mjs";
import { VIEWPORTS, ROUTES, BASE, settle, waitForServer } from "./viewports.mjs";

const MOBILE = VIEWPORTS.filter((v) => v.width < 900);
await waitForServer();
const browser = await launchBrowser();
const findings = [];

for (const vp of MOBILE) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 }); } catch {}
    await settle(page);
    const small = await page.evaluate(() => {
      const SEL = 'a[href], button, input, select, textarea, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"])';
      const out = [];
      for (const el of document.querySelectorAll(SEL)) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") continue;
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (b.width < 44 || b.height < 44) {
          out.push({
            tag: el.tagName.toLowerCase(),
            w: +b.width.toFixed(1), h: +b.height.toFixed(1),
            label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 48),
            cls: String(el.className?.baseVal ?? el.className ?? "").slice(0, 70),
          });
        }
      }
      return out;
    });
    for (const s of small) findings.push({ viewport: vp.name, route, ...s });
  }
  await ctx.close();
}
await browser.close();

// collapse duplicates across viewports for readability
const key = (f) => `${f.route}|${f.tag}|${f.label}|${f.cls}`;
const grouped = new Map();
for (const f of findings) {
  const k = key(f);
  if (!grouped.has(k)) grouped.set(k, { ...f, viewports: [], sizes: [] });
  grouped.get(k).viewports.push(f.viewport);
  grouped.get(k).sizes.push(`${f.w}x${f.h}`);
}
const rows = [...grouped.values()];
console.log(JSON.stringify({ total: findings.length, unique: rows.length, rows }, null, 2));
process.exit(rows.length ? 1 : 0);
