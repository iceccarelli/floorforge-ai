#!/usr/bin/env node
/**
 * Deterministic WCAG contrast table for every declared token pair in
 * app/globals.css plus the hardcoded overlay colours used in JSX.
 * Pure arithmetic — no browser, no sampling, reproducible byte-for-byte.
 */
const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05); };

const T = {
  bg: "#ffffff", fg: "#0f172a", muted: "#f8fafc", "muted-foreground": "#64748b",
  border: "#e2e8f0", accent: "#b45309", "accent-hover": "#92400e", "accent-light": "#fef3c7",
  primary: "#0f172a", "primary-foreground": "#ffffff", card: "#ffffff", "card-foreground": "#0f172a",
  success: "#15803d", warning: "#b45309",
  // hardcoded values found in JSX/CSS (see FINDINGS M-* / T-*)
  "slate-950 (hardcoded)": "#020617", "slate-200 (hardcoded)": "#e2e8f0",
  "slate-100 (hardcoded)": "#f1f5f9", "emerald-400 (hardcoded)": "#34d399",
  "#1e293b (hardcoded)": "#1e293b", "#cbd5e1 (hardcoded)": "#cbd5e1",
};

const PAIRS = [
  ["fg", "bg", 4.5, "body copy on page background"],
  ["fg", "card", 4.5, "body copy on card"],
  ["fg", "muted", 4.5, "body copy on muted section"],
  ["muted-foreground", "bg", 4.5, "secondary copy on white — the site's most common pair"],
  ["muted-foreground", "card", 4.5, "secondary copy on card"],
  ["muted-foreground", "muted", 4.5, "secondary copy on muted section"],
  ["muted-foreground", "accent-light", 4.5, "secondary copy on amber tint (badges, /simulator)"],
  ["accent", "bg", 4.5, "amber eyebrow text on white"],
  ["accent", "muted", 4.5, "amber eyebrow text on muted"],
  ["accent", "accent-light", 4.5, "amber on amber tint (Header 3D badge, chips)"],
  ["accent-hover", "bg", 4.5, "hover link colour on white"],
  ["primary-foreground", "accent", 4.5, "white label on amber button"],
  ["primary-foreground", "accent-hover", 4.5, "white label on amber button, hover"],
  ["primary-foreground", "primary", 4.5, "white on dark footer / final CTA"],
  ["success", "bg", 4.5, "success ticks on white"],
  ["success", "card", 4.5, "success ticks on card"],
  ["emerald-400 (hardcoded)", "slate-950 (hardcoded)", 4.5, "ROI metric labels on dark panel"],
  ["border", "bg", 3.0, "card / input boundary on white (UI ≥3:1)"],
  ["border", "muted", 3.0, "card boundary on muted section"],
  ["accent", "bg", 3.0, "focus ring on white (UI ≥3:1)"],
  ["accent", "primary", 3.0, "focus ring on dark footer (UI ≥3:1)"],
  ["accent", "slate-950 (hardcoded)", 3.0, "focus ring on ROI dark panel (UI ≥3:1)"],
];

// alpha overlays used in JSX
const ALPHA = [
  ["#ffffff", 0.40, "primary", 4.5, "footer copyright — text-white/40"],
  ["#ffffff", 0.50, "primary", 4.5, "footer disclaimer + social icons — text-white/50"],
  ["#ffffff", 0.60, "primary", 4.5, "footer link groups — text-white/60"],
  ["#ffffff", 0.70, "primary", 4.5, "footer column headings — text-white/70"],
  ["#ffffff", 0.80, "primary", 4.5, "footer links — text-white/80"],
  ["#ffffff", 0.50, "slate-950 (hardcoded)", 4.5, "ROI 'MODELED ESTIMATES' eyebrow — text-white/50"],
  ["#ffffff", 0.60, "slate-950 (hardcoded)", 4.5, "ROI model-assumptions disclaimer — text-white/60"],
  ["#ffffff", 0.80, "primary", 4.5, "final-CTA subhead — text-white/80"],
  ["#b45309", 0.70, "muted", 3.0, "how-it-works step numerals — text-accent/70, 60px"],
];

const rows = [];
for (const [f, b, req, note] of PAIRS) {
  const r = ratio(hex(T[f]), hex(T[b]));
  rows.push({ fg: `--${f}`, fgHex: T[f], bg: `--${b}`, bgHex: T[b], required: req, ratio: +r.toFixed(2), pass: r >= req, note });
}
for (const [f, a, b, req, note] of ALPHA) {
  const bgc = hex(T[b]);
  const r = ratio(over(hex(f), a, bgc), bgc);
  rows.push({ fg: `${f} @ ${a}`, fgHex: f, bg: `--${b}`, bgHex: T[b], required: req, ratio: +r.toFixed(2), pass: r >= req, note });
}

const w = (s, n) => String(s).padEnd(n);
console.log(w("FOREGROUND", 26) + w("BACKGROUND", 26) + w("REQ", 6) + w("RATIO", 8) + w("", 6) + "CONTEXT");
console.log("-".repeat(140));
for (const r of rows) {
  console.log(w(`${r.fg} ${r.fgHex}`, 26) + w(`${r.bg} ${r.bgHex}`, 26) + w(r.required + ":1", 6) + w(r.ratio + ":1", 8) + w(r.pass ? "PASS" : "FAIL", 6) + r.note);
}
const fails = rows.filter((r) => !r.pass);
console.log("-".repeat(140));
console.log(`${rows.length} pairs measured — ${fails.length} FAIL`);
process.exit(fails.length ? 1 : 0);
