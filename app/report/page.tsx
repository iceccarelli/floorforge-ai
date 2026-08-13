import type { Metadata } from "next";
import WorkspaceShell from "@/components/WorkspaceShell";
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
 * Every field maps onto types.PostJobReport, so the document a contractor fills
 * in by hand today is the same document machine telemetry fills in later.
 */
export default function ReportPage() {
  return (
    <WorkspaceShell
      active="report"
      title="Hand over the floor with proof."
      intro={
        <>
          What was done, the conditions it was done in, how to look after it, and what you
          stand behind — on one page, signed. Most callbacks are about something nobody
          wrote down.
        </>
      }
      note={
        <>
          Works with no FloorForge hardware. The fields marked{" "}
          <span className="font-semibold text-accent">auto later</span> are the ones
          machine telemetry is designed to fill in for you — the document itself does not
          change.
        </>
      }
    >
      <JobReport />
    </WorkspaceShell>
  );
}
