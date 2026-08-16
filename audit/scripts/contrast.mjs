#!/usr/bin/env node
/**
 * Measured WCAG 2.1 contrast for every rendered text run.
 *
 * Backgrounds are sampled from a real screenshot rather than walked up the
 * DOM, so gradients (.stats-bar), images (showcase cards) and translucent
 * overlays are measured as the user actually sees them. Two captures per
 * route: one with text hidden (background truth), one normal.
 *
 * Thresholds: 4.5:1 normal text, 3:1 large text (>=24px, or >=18.66px @700).
 */
import { launchBrowser } from "./browser.mjs";
import { createRequire } from "node:module";
import { ROUTES, BASE, settle, waitForServer } from "./viewports.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05); };

await waitForServer();
const browser = await launchBrowser();
// reducedMotion:'reduce' makes <Reveal> render its children at full opacity,
// so scroll-revealed copy is measured too instead of being skipped at opacity 0.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const all = [];
/** Per-route count of text runs excluded because they are never painted. */
const skipped = [];

for (const route of ROUTES) {
  try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 }); } catch {}
  await settle(page);

  const { out: nodes, hidden: hiddenCount, clipped: clippedCount } = await page.evaluate(() => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 1;
    const c2 = cv.getContext("2d", { willReadFrequently: true });
    const toRGBA = (col) => {
      try {
        c2.clearRect(0, 0, 1, 1);
        c2.fillStyle = "#000"; c2.fillRect(0, 0, 1, 1);   // known backdrop
        c2.fillStyle = col; c2.fillRect(0, 0, 1, 1);
        const onBlack = c2.getImageData(0, 0, 1, 1).data.slice(0, 3);
        c2.fillStyle = "#fff"; c2.fillRect(0, 0, 1, 1);
        c2.fillStyle = col; c2.fillRect(0, 0, 1, 1);
        const onWhite = c2.getImageData(0, 0, 1, 1).data.slice(0, 3);
        // onWhite = C*a + 255(1-a); onBlack = C*a  ->  a = 1 - (onWhite-onBlack)/255
        const a = 1 - (onWhite[0] - onBlack[0]) / 255;
        if (!(a > 0.001)) return null;
        return [onBlack[0] / a, onBlack[1] / a, onBlack[2] / a, a];
      } catch { return null; }
    };
    // Text that is deliberately not painted. `sr-only` positions a 1x1 box and
    // clips it away; the glyphs still lay out inside it, so a Range around them
    // reports a normal-sized rect and the node survives the >2px filter below.
    // Measured that way, every screen-reader-only string is sampled against
    // whatever is behind the clipped box — usually plain white — and reported
    // as a 1:1 failure. That is not a contrast defect: nothing is rendered.
    // WCAG 1.4.3 applies to text "that is displayed", and this is not.
    //
    // Detected by the clip signature rather than by class name, so it also
    // catches hand-rolled visually-hidden helpers and any future rename of
    // Tailwind's utility.
    const CLIPPED = /^rect\(0(px)?,\s*0(px)?,\s*0(px)?,\s*0(px)?\)$/;
    const isVisuallyHidden = (el) => {
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (CLIPPED.test(s.clip.replace(/\s+/g, " "))) return true;
        if (s.clipPath === "inset(50%)") return true;
        if (
          s.overflow === "hidden" &&
          a.getBoundingClientRect().width <= 1 &&
          a.getBoundingClientRect().height <= 1
        )
          return true;
      }
      return false;
    };

    /** Intersection of a text run's box with every clipping ancestor. */
    const visibleRect = (el, r) => {
      let l = r.left, t = r.top, ri = r.right, b = r.bottom;
      for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (s.overflow === "visible" && s.overflowX === "visible" && s.overflowY === "visible")
          continue;
        const ar = a.getBoundingClientRect();
        l = Math.max(l, ar.left); t = Math.max(t, ar.top);
        ri = Math.min(ri, ar.right); b = Math.min(b, ar.bottom);
      }
      // A run half-scrolled out of a rail is still readable and still measured:
      // the visible half sits on the same background as the hidden half. But
      // once only a sliver survives, the sample point lands on the container's
      // own edge — antialiasing, border, page margin — and measures the frame
      // rather than the text's backdrop. Below half-visible, and below 8px,
      // there is nothing meaningful left to measure.
      const wv = ri - l, hv = b - t;
      if (wv < 8 || hv < 4) return null;
      if (wv < (r.right - r.left) * 0.5 || hv < (r.bottom - r.top) * 0.5) return null;
      return { l, t, r: ri, b };
    };

    const out = [];
    let hidden = 0;
    let clipped = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n, i = 0;
    while ((n = walker.nextNode())) {
      const t = n.textContent.replace(/\s+/g, " ").trim();
      if (!t) continue;
      const el = n.parentElement; if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.95) continue;
      if (isVisuallyHidden(el)) { hidden++; continue; }
      // Tailwind v4 emits color-mix()/oklab() for /alpha utilities; normalise
      // every computed colour to straight rgba() through a canvas.
      const rgba = toRGBA(cs.color); if (!rgba) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      const b = range.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      if (b.top + window.scrollY < 0) continue;
      // Clip the run against every scrolling/clipping ancestor and sample the
      // centre of what SURVIVES, not the centre of the box.
      //
      // The showcase rail is `overflow-x: auto` and its cards run well past the
      // 1440px capture. A card sitting off the right edge still reports a normal
      // rect, whose centre can land a few pixels outside the rail — in the page
      // margin, which is white. White label text sampled against that margin
      // scored 1.00:1 and was reported as the site's worst contrast defect. It
      // is not a defect at all: the user cannot see that card until they scroll
      // the rail, and when they do, it is over a dark render.
      //
      // This generalises the old `x >= screenshotWidth` guard, which only
      // caught the cards that overflowed the DOCUMENT, not the ones clipped by
      // a container inside it.
      const vis = visibleRect(el, b);
      if (!vis) { clipped++; continue; }
      out.push({
        i: i++, text: t.slice(0, 56), color: cs.color, rgba, fontSize: parseFloat(cs.fontSize),
        weight: parseInt(cs.fontWeight) || 400,
        x: Math.round(vis.l + window.scrollX + (vis.r - vis.l) / 2),
        y: Math.round(vis.t + window.scrollY + (vis.b - vis.t) / 2),
        cls: String(el.className?.baseVal ?? el.className ?? "").slice(0, 72),
        tag: el.tagName.toLowerCase(),
      });
    }
    // Reported, not silently dropped: a reader can see how much this route
    // excluded and check the number is plausible.
    return { out, hidden, clipped };
  });

  // background truth: hide all glyphs, keep layout identical
  await page.addStyleTag({ content: `*, *::before, *::after { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }` });
  const bgPng = await page.screenshot({ fullPage: true });
  const { data, info } = await sharp(bgPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const o = (y * info.width + x) * info.channels; return [data[o], data[o + 1], data[o + 2]]; };
  await page.reload({ waitUntil: "domcontentloaded" });

  for (const nd of nodes) {
    if (nd.x < 0 || nd.y < 0 || nd.x >= info.width || nd.y >= info.height) continue;
    const bg = px(nd.x, nd.y);
    const p = nd.rgba; if (!p) continue;
    const a = p[3];
    const fg = [p[0] * a + bg[0] * (1 - a), p[1] * a + bg[1] * (1 - a), p[2] * a + bg[2] * (1 - a)];
    const large = nd.fontSize >= 24 || (nd.fontSize >= 18.66 && nd.weight >= 700);
    const req = large ? 3 : 4.5;
    const r = ratio(fg, bg);
    all.push({ route, text: nd.text, tag: nd.tag, cls: nd.cls, color: nd.color,
      bg: `rgb(${bg.join(", ")})`, px: nd.fontSize, weight: nd.weight, large,
      required: req, ratio: +r.toFixed(2), pass: r >= req });
  }
  skipped.push({ route, visuallyHidden: hiddenCount, clippedOutOfView: clippedCount });
}
await browser.close();
const fails = all.filter((r) => !r.pass);
console.log(
  JSON.stringify(
    {
      checked: all.length,
      failing: fails.length,
      visuallyHiddenSkipped: skipped.reduce((a, s) => a + s.visuallyHidden, 0),
      clippedOutOfViewSkipped: skipped.reduce((a, s) => a + s.clippedOutOfView, 0),
      skipped,
      fails,
      all,
    },
    null,
    2
  )
);
process.exit(fails.length ? 1 : 0);
