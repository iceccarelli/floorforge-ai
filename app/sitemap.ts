import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://floorforge-ai.vercel.app";

/**
 * Sitemap.
 *
 * WHAT WAS WRONG (audit/FINDINGS.md §7)
 * -------------------------------------
 * The previous sitemap listed `/` plus five FRAGMENT urls — /#features,
 * /#how-it-works, /#roi, /#pricing, /#waitlist. A fragment is not a distinct
 * URL: search engines normalise it away, so a six-entry sitemap declared
 * exactly one page. Meanwhile `/simulator` — the interactive 3D demo, the
 * site's most distinctive asset and its best answer to "why should I care
 * about a pre-launch robotics company" — was not listed at all.
 *
 * `/pro-simulator` sets `robots: { index: false }` deliberately (it is a gated
 * tool) and stays out. `/dashboard` is disallowed in robots.ts because it is a
 * non-functional mock, and stays out. `/operator/*` is internal.
 *
 * `lastModified` is a real build timestamp rather than a fabricated date.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/estimator`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/jobs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/report`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/systems`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/simulator`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
