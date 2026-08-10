#!/usr/bin/env node
/** Heading hierarchy, landmarks, chrome consistency (Phase 4 / Phase 8). */
import { chromium } from "playwright";
import { ROUTES, BASE, settle, waitForServer } from "./viewports.mjs";
await waitForServer();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const rows = [];
for (const route of ROUTES) {
  try { await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 }); } catch {}
  await settle(page);
  rows.push(await page.evaluate((route) => {
    const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({
      level: +h.tagName[1], text: h.textContent.trim().slice(0, 54),
    }));
    const skips = [];
    for (let i = 1; i < hs.length; i++) if (hs[i].level > hs[i - 1].level + 1) skips.push(`${hs[i - 1].level}→${hs[i].level} before "${hs[i].text}"`);
    const chrome = (sel) => [...document.querySelectorAll(sel)].map((e) => ({
      h: Math.round(e.getBoundingClientRect().height),
      cls: String(e.className || "").slice(0, 60),
    }));
    return {
      route,
      h1Count: hs.filter((h) => h.level === 1).length,
      h1s: hs.filter((h) => h.level === 1).map((h) => h.text),
      headingSkips: skips,
      headings: hs,
      landmarks: {
        header: document.querySelectorAll("header").length,
        main: document.querySelectorAll("main").length,
        footer: document.querySelectorAll("footer").length,
        nav: document.querySelectorAll("nav").length,
        navLabelled: [...document.querySelectorAll("nav")].filter((n) => n.getAttribute("aria-label") || n.getAttribute("aria-labelledby")).length,
      },
      chrome: { headers: chrome("header"), footers: chrome("footer") },
      figures: document.querySelectorAll("figure").length,
      imgsNoAlt: [...document.querySelectorAll("img")].filter((i) => i.getAttribute("alt") === null).length,
      imgs: document.querySelectorAll("img").length,
      tables: document.querySelectorAll("table").length,
      thScoped: document.querySelectorAll("th[scope]").length,
      th: document.querySelectorAll("th").length,
      canvases: document.querySelectorAll("canvas").length,
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent.length),
    };
  }, route));
}
await browser.close();
console.log(JSON.stringify(rows, null, 2));
