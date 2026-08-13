import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JobsWorkspace from "@/components/JobsWorkspace";

export const metadata: Metadata = {
  title: "Jobs | FloorForge — One Record From Estimate to Sign-off",
  description:
    "Track refinishing jobs from estimate through proposal to completion report. Enter the floor once; every document reads the same record. Saved in your browser — no account, no server.",
  alternates: { canonical: "/jobs" },
};

/**
 * The workspace that turns three tools into one workflow.
 *
 * Before this, the estimator, the proposal and the completion report were
 * separate forms: the same floor was typed three times. That is the most
 * reliable way to lose a user by their second job, and polishing the individual
 * tools would not have fixed it.
 *
 * A JobRecord mirrors types.Job, so when Supabase credentials exist these
 * records sync to POST /api/jobs rather than needing migration. Local-first is
 * the starting point, not a substitute for the backend.
 */
export default function JobsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to FloorForge
      </Link>

      <header className="mt-6 max-w-3xl">
        <div className="text-accent text-xs tracking-[3px] font-semibold">
          FREE TOOL · NO ACCOUNT NEEDED
        </div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
          One record, estimate to sign-off.
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Measure the floor once. The estimate becomes the proposal, the proposal becomes
          the completion report, and nothing gets typed twice.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Jobs are saved in this browser and never sent anywhere. There is no account to
          create and no server holding your work.
        </p>
      </header>

      <div className="mt-10">
        <JobsWorkspace />
      </div>
    </div>
  );
}
