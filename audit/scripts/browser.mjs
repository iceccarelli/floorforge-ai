/**
 * One place that knows how to start a browser for the audit suite.
 *
 * WHY playwright-core AND NOT playwright
 * --------------------------------------
 * The `playwright` package runs a postinstall that downloads ~150 MB of browser
 * binaries. As a devDependency that fires on every `npm ci` — including the one
 * Vercel runs to build the site, which has no use for a browser at all. So the
 * suite depends on `playwright-core`, which is the same API with no download,
 * and the browser is supplied separately by whoever is actually running audits.
 *
 * WHY THIS FILE EXISTS AT ALL
 * ---------------------------
 * Every script here imported `playwright` directly and called `chromium.launch()`
 * with no arguments — which works only if a Playwright-managed browser happens to
 * be installed. Neither `playwright` nor `axe-core` was in package.json, so
 * `node audit/scripts/axe-scan.mjs` failed with ERR_MODULE_NOT_FOUND in a fresh
 * clone. Thirteen scripts' worth of checks that could not be run by the person
 * who owns the repository.
 *
 * RESOLUTION ORDER for the browser binary:
 *   1. AUDIT_CHROMIUM               explicit override, wins over everything
 *   2. PLAYWRIGHT_BROWSERS_PATH     set by CI images that pre-install browsers
 *   3. known system locations       Debian/Ubuntu/Codespaces, macOS
 *   4. Playwright's own default     if `npx playwright install chromium` was run
 * If none resolves, the error says exactly which command fixes it.
 */
import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CANDIDATES = [
  process.env.AUDIT_CHROMIUM,
  process.env.PLAYWRIGHT_BROWSERS_PATH &&
    join(process.env.PLAYWRIGHT_BROWSERS_PATH, "chromium"),
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);

function resolveExecutable() {
  for (const c of CANDIDATES) if (existsSync(c)) return c;
  // Playwright's default cache, if `npx playwright install chromium` was run.
  const cache =
    process.platform === "darwin"
      ? join(homedir(), "Library", "Caches", "ms-playwright")
      : join(homedir(), ".cache", "ms-playwright");
  if (existsSync(cache)) return null; // let playwright-core find it itself
  return undefined;
}

/**
 * Launch chromium for an audit run.
 * @param {object} [opts] passed through to playwright-core
 */
export async function launchBrowser(opts = {}) {
  const exe = resolveExecutable();
  if (exe === undefined) {
    console.error(
      [
        "",
        "  No Chromium found for the audit suite.",
        "",
        "  Install one once:",
        "      npm run audit:setup",
        "",
        "  or point the suite at a browser you already have:",
        "      AUDIT_CHROMIUM=/path/to/chrome npm run audit",
        "",
      ].join("\n")
    );
    process.exit(2);
  }
  return chromium.launch(exe ? { ...opts, executablePath: exe } : opts);
}

export { chromium };
