import type { Metadata } from "next";
import PageSchema from "@/components/PageSchema";
import { pageAlternates } from "@/lib/discovery";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SystemsLibrary from "@/components/SystemsLibrary";
import { CATEGORIES, FRAMES, framesInCat } from "@/lib/showcase";

export const metadata: Metadata = {
  title: "The Forge Platforms | FloorForge — Concept Render Library",
  description:
    "Concept renders of the five FloorForge platforms — field sanding, edge and perimeter, dust containment, finish application, and inspection. All figures are design targets for hardware in development, not measured specifications of shipping hardware.",
  alternates: pageAlternates("/systems"),
};

/**
 * The full concept-render library.
 *
 * Previously embedded in the homepage, which meant every visitor downloaded the
 * 33 frames of the default category whether they scrolled to them or not
 * (audit/FINDINGS.md §6: 43 <img> on first paint, 899 KB of images before any
 * scroll). Here it is a page with a URL, a heading, and a sitemap entry.
 *
 * Nothing was deleted. At this stage the renders are the product's only
 * evidence, and the mission is explicit that they must be delivered better
 * rather than removed.
 */
export default function SystemsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
      <PageSchema
        page={{
          path: "/systems",
          name: "The Forge Platforms — concept render library",
          description: String(metadata.description),
          crumb: "The Forge platforms",
        }}
      />
      <Link
        href="/"
        className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-accent">
          The full system library
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
          Every view, sorted by what the machine is doing.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          {FRAMES.length} concept renders across the {CATEGORIES.length} Forge
          platforms. Renders depict concept platforms; all figures are design
          targets, not measured specifications of shipping hardware.
        </p>
      </div>

      {/* A text index of the library, for crawlers and screen readers. The grid
          below is images and buttons; this is what it contains, in words. */}
      <ul className="sr-only">
        {CATEGORIES.map((c) => (
          <li key={c.key}>
            {c.platform} — {c.label}: {framesInCat(c.key).length} concept
            renders. {c.blurb}
          </li>
        ))}
      </ul>

      <SystemsLibrary />

      <p className="mt-10 text-xs text-muted-foreground">
        Renders depict concept platforms; all figures are design targets, not
        measured specifications of shipping hardware.
      </p>
    </div>
  );
}
