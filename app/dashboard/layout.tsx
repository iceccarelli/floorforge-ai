import type { Metadata } from "next";

/**
 * `/dashboard` was the only route on the site with no title and no description.
 *
 * It is a client component (`"use client"` at `app/dashboard/page.tsx:1`), and a
 * client component cannot export `metadata` — which is why it had none. A
 * layout can, so the metadata lives here.
 *
 * This is the route Lighthouse scored 66 on for SEO (audit/PERFORMANCE.md §1).
 * Half of that deduction was `is-crawlable`, which is correct and intentional:
 * `app/robots.ts:12` disallows `/dashboard` because it renders sample data
 * behind a PRODUCT PREVIEW banner, and a preview of a product that does not
 * exist has no business in an index. `robots: { index: false }` states that
 * intent in the page's own head rather than only in robots.txt, so a crawler
 * that never fetches robots.txt still gets the message.
 *
 * The other half was the missing title and description, which mattered for a
 * reason that has nothing to do with search: a pilot customer who is sent this
 * link sees the browser tab, and "localhost" or a bare URL in a shared tab is
 * the kind of detail that reads as unfinished.
 *
 * `alternates.canonical` added later: metadata objects MERGE with the parent's,
 * so declaring title/description/robots here still inherited the root layout's
 * `canonical: "/"` — and this page went on telling every crawler that its
 * canonical URL was the marketing homepage. Verified in the served HTML, not
 * assumed. A page that misidentifies itself is wrong whether or not the
 * disallow rule means anyone acts on it.
 */
export const metadata: Metadata = {
  title: "Dashboard Preview | FloorForge",
  description:
    "A preview of the planned FloorForge operations dashboard — job progress, dust and quality reporting, and fleet health. All figures shown are sample data illustrating the planned interface, not measured results from shipping hardware.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/dashboard" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
