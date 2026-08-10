/** Shared device matrix (mission Phase 6) + route list. */
export const VIEWPORTS = [
  { name: "320-min",            width: 320,  height: 640,  dpr: 2 },
  { name: "iphone-se",          width: 375,  height: 667,  dpr: 2 },
  { name: "iphone-15-pro",      width: 393,  height: 852,  dpr: 3 },
  { name: "iphone-15-pro-max",  width: 430,  height: 932,  dpr: 3 },
  { name: "pixel-8",            width: 412,  height: 915,  dpr: 2.6 },
  { name: "phone-landscape",    width: 852,  height: 393,  dpr: 3 },
  { name: "ipad-mini-portrait", width: 744,  height: 1133, dpr: 2 },
  { name: "ipad-pro-landscape", width: 1194, height: 834,  dpr: 2 },
  { name: "laptop",             width: 1440, height: 900,  dpr: 2 },
  { name: "desktop-wide",       width: 1920, height: 1080, dpr: 1 },
];

export const ROUTES = [
  "/",
  "/simulator",
  "/pro-simulator",
  "/dashboard",
  "/operator/applications",
  "/operator/jobs",
];

export const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3111";

/**
 * Wait for the server to answer before driving a browser at it.
 *
 * Without this, running these scripts right after backgrounding `npm run build
 * && next start` fails with "Execution context was destroyed" — the build is
 * still compiling, the port is dead, and Playwright navigates into nothing.
 * That is a confusing failure for a tooling problem, so the tooling handles it.
 */
export async function waitForServer(url = BASE, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `${url} did not respond within ${timeoutMs / 1000}s — is the server running?\n` +
      `  npm run build && npx next start -p 3000 &\n` +
      `  AUDIT_BASE_URL=http://localhost:3000 node audit/scripts/<script>.mjs\n` +
      `  last error: ${lastErr}`
  );
}

/**
 * Scroll the whole page so lazy content and scroll-reveals settle.
 *
 * Tolerant of a navigation landing mid-scroll: that races the evaluate and
 * destroys the execution context, which is a transient condition, not a
 * finding. The caller gets a settled page or a best effort, never a crash.
 */
export async function settle(page) {
  try {
    await page.evaluate(async () => {
      await new Promise((res) => {
        let y = 0;
        const step = () => {
          y += window.innerHeight;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight) requestAnimationFrame(step);
          else {
            window.scrollTo(0, 0);
            res();
          }
        };
        step();
      });
    });
  } catch (err) {
    if (!/Execution context was destroyed|Target closed|Navigation/.test(String(err))) throw err;
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(400);
}
