import type { Metadata } from "next";
import WorkspaceShell from "@/components/WorkspaceShell";
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
 * The "with FloorForge" column reads its percentage from lib/product.ts — the
 * same constant the homepage ROI model uses — so the two surfaces cannot drift
 * apart the way four different throughput figures did
 * (audit/PRODUCT_TRUTH.md T0-2).
 */
export default function EstimatorPage() {
  return (
    <WorkspaceShell
      active="estimator"
      title="Plan, time and price a refinishing job."
      intro={
        <>
          Enter the floor. Get the grit sequence, the crew hours, the abrasive and finish
          you need to buy, and a quote you can defend line by line. Every assumption is
          yours to change.
        </>
      }
      note={
        <>
          This tool works with no FloorForge hardware and asks for nothing in return. It
          is arithmetic on your numbers, not a claim about ours — the one column that
          describes FloorForge is labelled a design target, because no FloorForge machine
          has refinished a floor.
        </>
      }
    >
      <JobEstimator />
    </WorkspaceShell>
  );
}
