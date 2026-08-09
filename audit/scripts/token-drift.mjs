#!/usr/bin/env node
/**
 * Token-drift census: every hardcoded colour and arbitrary Tailwind value in
 * JSX/CSS. "Arbitrary value" = the Tailwind equivalent of a magic number.
 * Reports counts per file so Phase 3 can be measured before/after.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execSync("git ls-files 'app/*' 'components/*' 'lib/*'", { encoding: "utf8" })
  .split("\n").filter((f) => /\.(tsx?|css)$/.test(f));

// Tailwind palette names that bypass the semantic token layer entirely.
const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const RX = {
  hexInJsx:        /#[0-9a-fA-F]{3,8}\b/g,
  rgbHsl:          /\b(?:rgba?|hsla?)\(/g,
  arbitraryValue:  /(?:^|[\s"'`])(?:[a-z-]+:)*[a-z][a-z-]*-\[[^\]\s]+\]/g,
  paletteClass:    new RegExp(`(?:^|[\\s"'\`])(?:[a-z-]+:)*(?:bg|text|border|from|to|via|ring|fill|stroke|decoration|outline|shadow|accent|divide|placeholder)-(?:${PALETTE})-\\d{2,3}(?:\\/\\d{1,3})?\\b`, "g"),
  bareWhiteBlack:  /(?:^|[\s"'`])(?:[a-z-]+:)*(?:bg|text|border|from|to|via|ring|fill|stroke|divide)-(?:white|black)(?:\/\d{1,3})?\b/g,
};

const totals = Object.fromEntries(Object.keys(RX).map((k) => [k, 0]));
const rows = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const counts = {};
  const samples = {};
  for (const [k, rx] of Object.entries(RX)) {
    const m = src.match(rx) || [];
    counts[k] = m.length; totals[k] += m.length;
    samples[k] = [...new Set(m.map((s) => s.trim()))].slice(0, 6);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total) rows.push({ file: f, total, counts, samples });
}
rows.sort((a, b) => b.total - a.total);

console.log("FILE".padEnd(46) + "TOTAL  hex  rgb  arb  palette  white/black");
console.log("-".repeat(104));
for (const r of rows) {
  console.log(r.file.padEnd(46) +
    String(r.total).padStart(5) +
    String(r.counts.hexInJsx).padStart(5) +
    String(r.counts.rgbHsl).padStart(5) +
    String(r.counts.arbitraryValue).padStart(5) +
    String(r.counts.paletteClass).padStart(9) +
    String(r.counts.bareWhiteBlack).padStart(13));
}
console.log("-".repeat(104));
console.log("TOTALS".padEnd(46) +
  String(Object.values(totals).reduce((a, b) => a + b, 0)).padStart(5) +
  String(totals.hexInJsx).padStart(5) + String(totals.rgbHsl).padStart(5) +
  String(totals.arbitraryValue).padStart(5) + String(totals.paletteClass).padStart(9) +
  String(totals.bareWhiteBlack).padStart(13));
if (process.env.SAMPLES) for (const r of rows) console.log("\n" + r.file + "\n  " + JSON.stringify(r.samples));
