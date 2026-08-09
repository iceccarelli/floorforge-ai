#!/usr/bin/env node
/** axe-core WCAG 2.1/2.2 A+AA scan of every route. */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { ROUTES, BASE, settle } from "./viewports.mjs";
const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const results = [];
for (const route of ROUTES) {
  try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 }); } catch {}
  await settle(page);
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(async () =>
    await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } })
  );
  results.push({
    route,
    violations: r.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
      targets: v.nodes.slice(0, 4).map((n) => n.target.join(" ")),
      sample: v.nodes[0]?.html?.slice(0, 160),
    })),
  });
}
await browser.close();
const total = results.reduce((a, r) => a + r.violations.length, 0);
console.log(JSON.stringify({ totalViolationTypes: total, results }, null, 2));
process.exit(total ? 1 : 0);
