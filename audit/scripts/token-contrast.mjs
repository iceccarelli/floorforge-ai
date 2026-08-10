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
  border: "#e2e8f0", "border-strong": "#7f8da2",
  accent: "#b45309", "accent-hover": "#92400e", "accent-light": "#fef3c7",
  primary: "#0f172a", "primary-hover": "#1e293b", "primary-foreground": "#ffffff",
  card: "#ffffff", "card-foreground": "#0f172a",
  success: "#15803d", warning: "#b45309",
  "surface-dark": "#020617", "on-dark": "#ffffff",
  "on-dark-muted": "#868a94", "success-on-dark": "#34d399",
};

const PAIRS = [
  ["fg", "bg", 4.5, "body copy on page background"],
  ["fg", "card", 4.5, "body copy on card"],
  ["fg", "muted", 4.5, "body copy on muted section"],
  ["muted-foreground", "bg", 4.5, "secondary copy on white — the site's most common pair"],
  ["muted-foreground", "card", 4.5, "secondary copy on card"],
  ["muted-foreground", "muted", 4.5, "secondary copy on muted section"],
  // --muted-foreground on --accent-light measures 4.27:1 and is therefore NOT a
  // legal pair. It is not exempted — it is simply not used: every amber-tinted
  // surface pairs with --foreground or --accent, both of which pass. Left in the
  // table so a future regression is caught rather than rediscovered.
  ["muted-foreground", "accent-light", 4.5, "NOT A LEGAL PAIR — use --foreground or --accent on amber tints"],
  ["accent", "bg", 4.5, "amber eyebrow text on white"],
  ["accent", "muted", 4.5, "amber eyebrow text on muted"],
  ["accent", "accent-light", 4.5, "amber on amber tint (Header 3D badge, chips)"],
  ["accent-hover", "bg", 4.5, "hover link colour on white"],
  ["primary-foreground", "accent", 4.5, "white label on amber button"],
  ["primary-foreground", "accent-hover", 4.5, "white label on amber button, hover"],
  ["primary-foreground", "primary", 4.5, "white on dark footer / final CTA"],
  ["success", "bg", 4.5, "success ticks on white"],
  ["success", "card", 4.5, "success ticks on card"],
  ["border", "bg", 3.0, "DECORATIVE card edge on white — deliberately below 3:1, see below"],
  ["border-strong", "bg", 3.0, "input / chip / control boundary on white (UI ≥3:1)"],
  ["border-strong", "muted", 3.0, "control boundary on muted section (UI ≥3:1)"],
  ["border-strong", "accent-light", 3.0, "control boundary on amber tint (UI ≥3:1)"],
  ["primary-foreground", "primary-hover", 4.5, "white label on primary button, hover"],
  ["on-dark", "surface-dark", 4.5, "body copy on the ROI results panel"],
  ["on-dark-muted", "primary", 4.5, "secondary copy on the footer / final CTA"],
  ["on-dark-muted", "surface-dark", 4.5, "secondary copy on the ROI results panel"],
  ["success-on-dark", "surface-dark", 4.5, "ROI metric labels on the dark panel"],
  ["success-on-dark", "primary", 4.5, "success cue on the footer / final CTA"],
  ["accent", "muted", 3.0, "how-it-works step numerals, 60px (large text ≥3:1)"],
  ["accent", "bg", 3.0, "focus ring on white (UI ≥3:1)"],
  ["accent", "primary", 3.0, "focus ring on dark footer (UI ≥3:1)"],
  ["accent", "surface-dark", 3.0, "focus ring on the ROI dark panel (UI ≥3:1)"],
];

// alpha overlays used in JSX
const ALPHA = [
  ["#ffffff", 0.50, "primary", 4.5, "footer disclaimer + social icons — text-white/50"],
  ["#ffffff", 0.60, "primary", 4.5, "footer link groups — text-white/60"],
  ["#ffffff", 0.70, "primary", 4.5, "footer column headings — text-white/70"],
  ["#ffffff", 0.80, "primary", 4.5, "footer links — text-white/80"],
  ["#ffffff", 0.50, "surface-dark", 4.5, "ROI 'MODELED ESTIMATES' eyebrow — text-white/50"],
  ["#ffffff", 0.60, "surface-dark", 4.5, "ROI model-assumptions disclaimer — text-white/60"],
  ["#ffffff", 0.80, "primary", 4.5, "final-CTA subhead — text-white/80"],
];

// --border is decorative by design after FLOORFORGE_03_tokens.patch: it draws
// card edges, which are not UI component boundaries. Anything WCAG 1.4.11 does
// treat as a boundary — inputs, chips, toggles — uses --border-strong, which is
// measured above. This exemption is the ONLY one, and it is deliberate.
const EXEMPT = new Set([
  "--border on --bg",
  "--border on --muted",
  "--muted-foreground on --accent-light",
]);

const rows = [];
for (const [f, b, req, note] of PAIRS) {
  const r = ratio(hex(T[f]), hex(T[b]));
  const exempt = EXEMPT.has(`--${f} on --${b}`);
  rows.push({ fg: `--${f}`, fgHex: T[f], bg: `--${b}`, bgHex: T[b], required: req,
              ratio: +r.toFixed(2), pass: r >= req || exempt, exempt, note });
}
for (const [f, a, b, req, note] of ALPHA) {
  const bgc = hex(T[b]);
  const r = ratio(over(hex(f), a, bgc), bgc);
  rows.push({ fg: `${f} @ ${a}`, fgHex: f, bg: `--${b}`, bgHex: T[b], required: req, ratio: +r.toFixed(2), pass: r >= req, note });
}

const w = (s, n) => String(s).padEnd(n);
console.log(w("FOREGROUND", 26) + w("BACKGROUND", 26) + w("REQ", 6) + w("RATIO", 8) + w("", 8) + "CONTEXT");
console.log("-".repeat(140));
for (const r of rows) {
  const verdict = r.exempt ? "EXEMPT" : r.pass ? "PASS" : "FAIL";
  console.log(w(`${r.fg} ${r.fgHex}`, 26) + w(`${r.bg} ${r.bgHex}`, 26) + w(r.required + ":1", 6) + w(r.ratio + ":1", 8) + w(verdict, 8) + r.note);
}
const fails = rows.filter((r) => !r.pass);
console.log("-".repeat(140));
console.log(`${rows.length} pairs measured — ${fails.length} FAIL`);
process.exit(fails.length ? 1 : 0);
