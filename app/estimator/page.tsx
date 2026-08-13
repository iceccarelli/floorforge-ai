import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JobEstimator from "@/components/JobEstimator";

export const metadata: Metadata = {
  title: "Job Estimator | FloorForge — Plan, Time and Price a Refinishing Job",
  description:
    "A free planning tool for hardwood refinishing contractors: grit sequence, crew hours, abrasive and finish quantities, and a suggested quote. Every assumption is editable. Works with no FloorForge hardware.",
  alternates: { canonical: "/estimator" },
};

/**
 * The first FloorForge software product that is useful on its own.
 *
 * Everything else on this site describes hardware that does not exist yet. This
 * plans a real job, on real inputs, for a contractor who may never buy a robot —
 * grit sequence, crew hours, abrasive sheets, gallons of finish, and a price to
 * put in front of a homeowner.
 *
 * That is deliberate sequencing rather than a side project. A pre-launch
 * robotics company has one honest way to earn a contractor's attention before it
 * has hardware: be useful this week. A tool that gets opened on a Tuesday to
 * price a job is worth more than a brochure that gets read once, and when the
 * hardware arrives it arrives to people already inside the product.
 *
 * The "with FloorForge" column reads its percentage from lib/product.ts — the
 * same constant the homepage ROI model uses — so the two surfaces cannot drift
 * apart the way four different throughput figures did
 * (audit/PRODUCT_TRUTH.md T0-2).
 */
export default function EstimatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground print:hidden"
      >
        <ArrowLeft size={16} /> Back to FloorForge
      </Link>

      <header className="mt-6 max-w-3xl">
        <div className="text-accent text-xs tracking-[3px] font-semibold">
          FREE TOOL · NO ACCOUNT NEEDED
        </div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
          Plan, time and price a refinishing job.
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Enter the floor. Get the grit sequence, the crew hours, the abrasive and finish
          you need to buy, and a quote you can defend line by line. Every assumption is
          yours to change.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          This tool works with no FloorForge hardware and asks for nothing in return. It
          is arithmetic on your numbers, not a claim about ours — the one column that
          describes FloorForge is labelled a design target, because no FloorForge machine
          has refinished a floor.
        </p>
      </header>

      <div className="mt-10">
        <JobEstimator />
      </div>
    </div>
  );
}
