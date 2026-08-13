import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JobReport from "@/components/JobReport";

export const metadata: Metadata = {
  title: "Completion Report | FloorForge — Hand Over a Floor With Proof",
  description:
    "A free completion-report generator for hardwood refinishing contractors: what was done, the conditions it was done in, care and maintenance instructions, and a workmanship warranty. Works with no FloorForge hardware.",
  alternates: { canonical: "/report" },
};

/**
 * The third piece of the loop: price the job, win the job, prove the job.
 *
 * Most callbacks are about something nobody wrote down — when the rugs could go
 * back, what cleaner to use, what the humidity should be. This puts all of it on
 * one page with the client's signature at the bottom.
 *
 * Every field maps onto types.PostJobReport, so the document a contractor fills
 * in by hand today is the same document machine telemetry fills in later. The
 * hardware becomes the thing that stops them typing, not a new system to learn.
 */
export default function ReportPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground print:hidden"
      >
        <ArrowLeft size={16} /> Back to FloorForge
      </Link>

      <header className="mt-6 max-w-3xl print:hidden">
        <div className="text-accent text-xs tracking-[3px] font-semibold">
          FREE TOOL · NO ACCOUNT NEEDED
        </div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
          Hand over the floor with proof.
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          What was done, the conditions it was done in, how to look after it, and what you
          stand behind — on one page, signed. Most callbacks are about something nobody
          wrote down.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Works with no FloorForge hardware. The fields marked{" "}
          <span className="font-semibold text-accent">auto later</span> are the ones
          machine telemetry is designed to fill in for you — the document itself does not
          change.
        </p>
      </header>

      <div className="mt-10">
        <JobReport />
      </div>
    </div>
  );
}
