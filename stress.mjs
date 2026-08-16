#!/usr/bin/env node
/**
 * FloorForge — live stress and integrity harness.
 *
 * Everything else in audit/ runs against a build served on localhost. That
 * proves the code is right. It does not prove the DEPLOYMENT is right, and the
 * gap between those two is where the failures nobody notices live: a canonical
 * pointing at the wrong host, a CDN serving a stale bundle, an edge firewall
 * quietly returning 403 to GPTBot while every browser sees 200.
 *
 * No dependencies. Node 18+. Runs anywhere.
 *
 *   node stress.mjs                                    # the live site
 *   node stress.mjs http://localhost:3111              # a local build
 *   BURST=60 SAMPLES=8 node stress.mjs                 # heavier
 *
 * Exit 0 = clean. Exit 1 = at least one FAIL. WARN never fails the run: it
 * marks something worth a human look rather than something known to be wrong.
 */

const BASE = (process.argv[2] || "https://floorforge-ai.vercel.app").replace(/\/$/, "");
const SAMPLES = Number(process.env.SAMPLES || 4);
const BURST = Number(process.env.BURST || 30);

const PUBLIC = ["/", "/systems", "/estimator", "/jobs", "/live", "/moisture", "/report", "/simulator"];
const PRIVATE = ["/dashboard", "/operator/jobs", "/operator/applications", "/pro-simulator"];
const FILES = ["/robots.txt", "/sitemap.xml", "/llms.txt"];
const TOOLS = ["/estimator", "/jobs", "/live", "/moisture", "/report", "/simulator"];

let pass = 0;
const fails = [];
const warns = [];
const C = { g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m", d: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m" };
const ok = (c, m) => {
  if (c) { pass++; console.log(`  ${C.g}PASS${C.x} ${m}`); }
  else { fails.push(m); console.log(`  ${C.r}FAIL${C.x} ${m}`); }
};
const warn = (c, m) => {
  if (c) { pass++; console.log(`  ${C.g}PASS${C.x} ${m}`); }
  else { warns.push(m); console.log(`  ${C.y}WARN${C.x} ${m}`); }
};
const hdr = (s) => console.log(`\n${C.b}${s}${C.x}\n${"-".repeat(Math.min(78, s.length + 20))}`);

const get = async (path, opts = {}) => {
  const t0 = Date.now();
  try {
    const r = await fetch(BASE + path, { redirect: "manual", ...opts });
    const body = await r.text();
    return { status: r.status, ms: Date.now() - t0, body, headers: r.headers, bytes: body.length };
  } catch (e) {
    return { status: 0, ms: Date.now() - t0, body: "", headers: new Headers(), bytes: 0, err: String(e) };
  }
};
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];

console.log(`${C.b}FloorForge stress + integrity${C.x}`);
console.log(`target   ${BASE}`);
console.log(`samples  ${SAMPLES} per route · burst ${BURST} concurrent\n`);

/* ------------------------------------------------------- 1. availability */
hdr("1. Availability and latency");
const timing = {};
for (const r of [...PUBLIC, ...PRIVATE, ...FILES]) {
  const ms = [];
  let status = 0, bytes = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const res = await get(r + (i ? `?cachebust=${i}` : ""));
    status = res.status; bytes = res.bytes; ms.push(res.ms);
  }
  timing[r] = { p50: pct(ms, 0.5), max: Math.max(...ms), status, bytes };
  const label = `${r.padEnd(24)} ${String(status).padEnd(4)} p50 ${String(timing[r].p50).padStart(5)}ms  max ${String(timing[r].max).padStart(5)}ms  ${(bytes / 1024).toFixed(0).padStart(4)} KB`;
  ok(status === 200, label);
}

/* ------------------------------------------------- 2. concurrency burst */
hdr(`2. Concurrency — ${BURST} simultaneous requests to /`);
const t0 = Date.now();
const burst = await Promise.all(Array.from({ length: BURST }, (_, i) => get(`/?burst=${i}`)));
const wall = Date.now() - t0;
const bad = burst.filter((b) => b.status !== 200);
const bms = burst.map((b) => b.ms);
ok(bad.length === 0, `${BURST - bad.length}/${BURST} returned 200 in ${wall}ms wall`);
console.log(`  ${C.d}p50 ${pct(bms, 0.5)}ms · p95 ${pct(bms, 0.95)}ms · max ${Math.max(...bms)}ms${C.x}`);
warn(pct(bms, 0.95) < 3000, `p95 under load is ${pct(bms, 0.95)}ms`);

/* ---------------------------------------- 3. the crawlers we invited in */
hdr("3. Named AI crawlers can actually reach the site");
// An edge firewall or bot-protection rule can return 403 to a crawler while
// every browser sees 200. robots.txt saying "Allow" means nothing if the
// request never gets that far. This is the check that cannot be done locally.
const AGENTS = {
  GPTBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  "OAI-SearchBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  ClaudeBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0; +claudebot@anthropic.com",
  PerplexityBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot",
  Googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  Bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  "plain-fetch": "node-fetch",
};
for (const [name, ua] of Object.entries(AGENTS)) {
  const home = await get("/", { headers: { "User-Agent": ua } });
  const llms = await get("/llms.txt", { headers: { "User-Agent": ua } });
  ok(
    home.status === 200 && llms.status === 200,
    `${name.padEnd(16)} / ${home.status}  /llms.txt ${llms.status}  (${(home.bytes / 1024).toFixed(0)} KB)`
  );
  // A crawler that gets 200 but an empty shell has been served nothing.
  const text = home.body.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  ok(text.length > 3000, `${name.padEnd(16)} receives ${text.length} chars of rendered text, not a shell`);
}

/* ------------------------------------------------- 4. discovery surfaces */
hdr("4. Discovery surfaces");
const robots = (await get("/robots.txt")).body;
const sitemap = (await get("/sitemap.xml")).body;
const llmsTxt = (await get("/llms.txt")).body;

for (const a of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot", "Amazonbot", "meta-externalagent"])
  ok(new RegExp(`User-Agent: ${a}\\b`, "i").test(robots), `robots.txt names ${a}`);
ok(/Sitemap:\s*https?:\/\//.test(robots), "robots.txt declares an absolute sitemap URL");
ok(!/Disallow:\s*\/\s*$/m.test(robots), "robots.txt does not disallow the whole site");
for (const p of ["/dashboard", "/operator/"])
  ok(robots.includes(`Disallow: ${p}`), `robots.txt keeps crawlers out of ${p}`);

ok(sitemap.startsWith("<?xml"), "sitemap.xml is XML");
for (const r of PUBLIC) {
  const want = r === "/" ? "" : r;
  ok(new RegExp(`<loc>[^<]*${want.replace("/", "\\/")}<\\/loc>`).test(sitemap), `sitemap lists ${r}`);
}
for (const p of PRIVATE)
  ok(!sitemap.includes(`${p}<`), `sitemap does NOT list ${p}`);

ok(llmsTxt.length > 4000, `llms.txt is substantial (${llmsTxt.length} bytes)`);
for (const [re, what] of [
  [/seven free tools/, "states the tool count"],
  [/No hardware ships today/, "leads with the honesty statement"],
  [/design targets/, "frames figures as design targets"],
  [/Do not describe either route as\s*\n?a price, an offer/, "tells agents not to present pricing as an offer"],
  [/Moisture & readiness log/, "describes the moisture tool"],
  [/not FloorForge claims/, "attributes the moisture limits away from FloorForge"],
  [/the page is authoritative/, "handles its own staleness honestly"],
])
  ok(re.test(llmsTxt), `llms.txt ${what}`);

/* ------------------------------------------------------ 5. what a bot reads */
hdr("5. Machine-readable identity, per route");
const graphOf = (html) => {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const d = JSON.parse(m[1]);
      out.push(...(d["@graph"] ?? [d]));
    } catch {
      out.push({ "@type": "__UNPARSEABLE__" });
    }
  }
  return out;
};
const host = new URL(BASE).host;
for (const r of PUBLIC) {
  const html = (await get(r)).body;
  const g = graphOf(html);
  const types = g.map((n) => n["@type"]);
  ok(!types.includes("__UNPARSEABLE__"), `${r.padEnd(12)} JSON-LD parses`);
  ok(types.includes("Organization"), `${r.padEnd(12)} carries Organization`);
  ok(types.includes("WebPage"), `${r.padEnd(12)} describes ITSELF (WebPage)`);
  ok(/llms\.txt/.test(html), `${r.padEnd(12)} points at /llms.txt`);
  const canon = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
  warn(canon.includes(host), `${r.padEnd(12)} canonical is on this host (${canon || "MISSING"})`);
  ok(!types.includes("Product"), `${r.padEnd(12)} no Product markup`);
  const offers = g.flatMap((n) => (n.offers ? [n.offers] : []));
  ok(offers.every((o) => o.price === "0"), `${r.padEnd(12)} every offer is zero-price (${offers.length})`);
  if (TOOLS.includes(r)) {
    const app = g.find((n) => n["@type"] === "SoftwareApplication");
    ok(!!app && app.isAccessibleForFree === true, `${r.padEnd(12)} free SoftwareApplication present`);
  }
}

/* --------------------------------------------------- 6. private stays private */
hdr("6. Private routes stay out of the index");
for (const r of PRIVATE) {
  const html = (await get(r)).body;
  ok(/<meta name="robots" content="noindex/.test(html), `${r.padEnd(24)} is noindex`);
  ok(!/llms\.txt/.test(html), `${r.padEnd(24)} does NOT advertise llms.txt`);
}

/* ---------------------------------------------------------- 7. link health */
hdr("7. Internal links resolve");
const seen = new Set();
for (const r of PUBLIC) {
  const html = (await get(r)).body;
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) seen.add(m[1]);
}
const broken = [];
for (const t of [...seen].sort()) {
  const res = await get(t);
  if (res.status !== 200) broken.push(`${t} -> ${res.status}`);
}
ok(broken.length === 0, `${seen.size} distinct internal targets, ${broken.length} broken`);
for (const b of broken) console.log(`       ${C.r}${b}${C.x}`);

/* --------------------------------------------------------- 8. headers */
hdr("8. Transport and caching");
const h = (await get("/")).headers;
warn(!!h.get("content-encoding"), `responses are compressed (${h.get("content-encoding") || "none"})`);
warn(!!h.get("cache-control"), `cache-control present (${h.get("cache-control") || "none"})`);
if (BASE.startsWith("https")) {
  warn(!!h.get("strict-transport-security"), `HSTS (${h.get("strict-transport-security") || "not set"})`);
  warn(!!h.get("x-content-type-options"), `X-Content-Type-Options (${h.get("x-content-type-options") || "not set"})`);
}
const heavy = Object.entries(timing).filter(([, v]) => v.bytes > 250 * 1024);
warn(heavy.length === 0, `no route over 250 KB of HTML${heavy.length ? ` — ${heavy.map(([k, v]) => `${k} ${(v.bytes / 1024).toFixed(0)}KB`).join(", ")}` : ""}`);

/* ------------------------------------------------------------- summary */
const line = "=".repeat(78);
console.log(`\n${line}`);
console.log(`${C.b}${pass} passed · ${fails.length} failed · ${warns.length} warnings${C.x}`);
if (fails.length) {
  console.log(`\n${C.r}FAILURES${C.x}`);
  fails.forEach((f) => console.log(`  - ${f}`));
}
if (warns.length) {
  console.log(`\n${C.y}WORTH A LOOK (does not fail the run)${C.x}`);
  warns.forEach((w) => console.log(`  - ${w}`));
}
console.log(line);
process.exit(fails.length ? 1 : 0);
