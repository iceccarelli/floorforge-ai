#!/usr/bin/env node
/**
 * P0 guard: under prefers-reduced-motion: reduce, no content may be left
 * invisible (opacity 0 / zero-size / translated off-screen by a stuck anim).
 */
import { chromium } from "playwright";
import { ROUTES, BASE, settle } from "./viewports.mjs";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const rows = [];
for (const route of ROUTES) {
  try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 }); } catch {}
  await settle(page);
  rows.push(...(await page.evaluate((route) => {
    const out = [];
    for (const el of document.querySelectorAll("main *, footer *, header *")) {
      if (!el.textContent || !el.textContent.trim()) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const op = parseFloat(cs.opacity);
      const b = el.getBoundingClientRect();
      if (op < 0.1 || (b.width === 0 && b.height === 0)) {
        // ignore intentionally-hidden a11y helpers and closed dialogs
        if (el.closest('[aria-hidden="true"], [hidden], .sr-only')) continue;
        // <option> has no layout box until the native picker opens; a zero rect
        // here is the platform, not hidden content.
        if (el.tagName === "OPTION" || el.tagName === "OPTGROUP") continue;
        out.push({ route, tag: el.tagName.toLowerCase(), opacity: op, w: Math.round(b.width), h: Math.round(b.height),
          text: el.textContent.trim().slice(0, 50), cls: String(el.className?.baseVal ?? el.className ?? "").slice(0, 70) });
      }
    }
    // also: any element still running a CSS animation or transition > 0s
    const animating = [];
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.animationName !== "none" && parseFloat(cs.animationDuration) > 0) {
        animating.push({ route, tag: el.tagName.toLowerCase(), animation: cs.animationName, dur: cs.animationDuration,
          cls: String(el.className?.baseVal ?? el.className ?? "").slice(0, 70) });
      }
    }
    return [...out.map(o => ({ kind: "invisible", ...o })), ...animating.map(a => ({ kind: "still-animating", ...a }))];
  }, route)));
}
await browser.close();
const invisible = rows.filter((r) => r.kind === "invisible");
console.log(JSON.stringify({ invisible: invisible.length, stillAnimating: rows.length - invisible.length, rows }, null, 2));
process.exit(invisible.length ? 1 : 0);
