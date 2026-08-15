#!/usr/bin/env node
/**
 * Responsive integrity: the three things the device matrix cannot see.
 *
 * WHY THIS EXISTS. audit/scripts/overflow.mjs sweeps 10 named devices across
 * 11 routes and reported 0 overflow for months. It was right about all 110 of
 * those configurations and blind to a 738px overflow on every page of the site,
 * because a fixed list of widths can only find what it happens to land on, and
 * because horizontal width is not the only axis a layout can fail on.
 *
 * Three checks, each finding a class the matrix cannot:
 *
 * 1. CONTINUOUS WIDTH. Tailwind's breakpoints (640/768/1024/1280/1536) are
 *    exactly where grids change shape, so the widths just either side are the
 *    likeliest to break — and are precisely the ones a 10-point list skips.
 *
 * 2. WCAG 1.4.10 REFLOW (AA). Content must work at 320x256 CSS px, the
 *    equivalent of 400% zoom on a 1280x1024 screen. Short viewports break
 *    layouts that assume vertical room; the matrix's shortest is 393px tall.
 *
 * 3. WCAG 1.4.4 RESIZE TEXT (AA). Text must scale to 200% without loss of
 *    content or function. This is NOT page zoom — it is a user raising their
 *    browser's default font size, which media queries cannot respond to:
 *    `lg:` resolves against the browser's INITIAL font size, so the desktop nav
 *    still renders at twice the text width inside a row sized for one. That is
 *    the failure this script was written to catch, and it is why the header
 *    wraps instead of relying on a breakpoint.
 *
 * The width step is coarse by default so this is runnable in CI. Set
 * RESPONSIVE_STEP=16 for the fine sweep used when hunting a specific defect.
 */
import { chromium } from "playwright";
import { ROUTES, BASE, waitForServer } from "./viewports.mjs";

const STEP = Number(process.env.RESPONSIVE_STEP || 48);
const MIN_W = 320;
const MAX_W = 1920;

await waitForServer();
const browser = await chromium.launch();

/** Horizontal overflow, plus the elements responsible. */
async function probe(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const over = de.scrollWidth - de.clientWidth;
    const culprits = [];
    if (over > 0) {
      const limit = de.clientWidth;
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Fixed elements (the chatbot launcher) are positioned against the
        // viewport and do not contribute to document scroll width.
        if (getComputedStyle(el).position === "fixed") continue;
        if (r.right > limit + 1 || r.left < -1) {
          culprits.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className.toString() || "").slice(0, 60),
            text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40),
          });
        }
      }
    }
    return { over, culprits: culprits.slice(0, 3) };
  });
}

const results = { widthSweep: [], reflow: [], textZoom: [] };
let failures = 0;

// ── 1. continuous width ──────────────────────────────────────────────────────
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: MIN_W, height: 900 } });
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
  } catch {}
  await page.waitForTimeout(500);
  const bad = [];
  for (let w = MIN_W; w <= MAX_W; w += STEP) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(40);
    const { over, culprits } = await probe(page);
    if (over > 0) bad.push({ width: w, over, culprits });
  }
  failures += bad.length;
  results.widthSweep.push({ route, widthsChecked: Math.floor((MAX_W - MIN_W) / STEP) + 1, failing: bad });
  await page.close();
}

// ── 2. reflow, 320x256 ───────────────────────────────────────────────────────
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 320, height: 256 } });
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
  } catch {}
  await page.waitForTimeout(700);
  const r = await probe(page);
  if (r.over > 0) failures++;
  results.reflow.push({ route, ...r });
  await page.close();
}

// ── 3. 200% text ─────────────────────────────────────────────────────────────
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
  } catch {}
  await page.addStyleTag({ content: "html{font-size:200% !important}" });
  await page.waitForTimeout(700);
  const r = await probe(page);
  if (r.over > 0) failures++;
  results.textZoom.push({ route, ...r });
  await page.close();
}

await browser.close();

const line = "-".repeat(92);
console.log(line);
console.log(
  `responsive: ${ROUTES.length} routes · width step ${STEP}px · reflow 320x256 · text zoom 200%`
);
console.log(line);
for (const r of results.widthSweep) {
  const s = r.failing.length
    ? `FAIL at ${r.failing.length}/${r.widthsChecked} widths (max ${Math.max(...r.failing.map((f) => f.over))}px)`
    : `ok across ${r.widthsChecked} widths`;
  console.log(`  width   ${r.route.padEnd(24)} ${s}`);
}
for (const r of results.reflow)
  console.log(`  reflow  ${r.route.padEnd(24)} ${r.over ? `FAIL ${r.over}px` : "ok"}`);
for (const r of results.textZoom)
  console.log(`  200%    ${r.route.padEnd(24)} ${r.over ? `FAIL ${r.over}px` : "ok"}`);
console.log(line);
console.log(failures === 0 ? "0 FAIL" : `${failures} FAIL`);

if (process.env.RESPONSIVE_JSON) {
  console.log(JSON.stringify(results, null, 2));
}
process.exit(failures === 0 ? 0 : 1);
