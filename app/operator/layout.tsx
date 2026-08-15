/**
 * Operator console layout.
 *
 * WHAT WAS WRONG (audit/FINDINGS.md P0-5, P1-1, P1-9)
 * ---------------------------------------------------
 * This file used to build a complete second page chrome — its own <header>
 * with an <h1>, its own <nav>, its own <main>, its own <footer> — and Next.js
 * nested all of it inside the root layout's <main id="main">. Measured at
 * 1440x900:
 *
 *     /                        header=1  main=1  footer=1
 *     /operator/jobs           header=2  main=2  footer=2
 *
 * Two <main> landmarks is an unambiguous WCAG 1.3.1 failure: a screen-reader
 * user who jumps to the main landmark lands in the wrong one. Visually it
 * produced a marketing header, then a console header, then a console footer,
 * then ~400px of dead space, then the marketing footer.
 *
 * It also used the raw Tailwind grey palette throughout — bg-gray-50,
 * border-gray-200, text-gray-900 — with zero design tokens, which is how a
 * marketing site and its console drift into looking like two different
 * companies' products.
 *
 * WHAT IT IS NOW
 * --------------
 * A section header inside the app's single <main>. One labelled <nav> with
 * aria-current on the active tab (OperatorNav, a client component so this file
 * can stay a server component and keep its metadata export). Every colour
 * resolves to a token. The console is denser than the marketing pages — that
 * is legitimate and deliberate — but it is denser *within* the same system.
 */

import type { Metadata } from "next";
import React from "react";
import OperatorNav from "@/components/OperatorNav";

/**
 * `robots` and `canonical` added: without them these pages inherited
 * `alternates.canonical: "/"` from the root layout and told every crawler that
 * an internal console's canonical URL was the marketing homepage. robots.txt
 * already disallows /operator/, so nothing was likely to act on it — but a page
 * that misidentifies itself is wrong whether or not anyone is looking, and the
 * noindex here says it a second way for crawlers that never read robots.txt.
 */
export const metadata: Metadata = {
  title: "FloorForge Operator Console",
  description: "Internal pilot management and operations",
  robots: { index: false, follow: false },
  alternates: { canonical: "/operator" },
};

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-muted">
      {/* A section header, NOT a <header> landmark — the page already has one. */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 pt-8 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[3px] text-accent">
            Internal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Operator Console
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilot applications and job management. Internal use only.
          </p>
        </div>
        <OperatorNav />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
