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

/** Scroll the whole page so lazy content and whileInView reveals settle. */
export async function settle(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const step = () => {
        y += window.innerHeight;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) requestAnimationFrame(step);
        else { window.scrollTo(0, 0); res(); }
      };
      step();
    });
  });
  await page.waitForTimeout(400);
}
