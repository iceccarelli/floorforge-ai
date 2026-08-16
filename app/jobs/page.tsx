import type { Metadata } from "next";
import PageSchema from "@/components/PageSchema";
import { pageAlternates } from "@/lib/discovery";
import WorkspaceShell from "@/components/WorkspaceShell";
import JobsWorkspace from "@/components/JobsWorkspace";

export const metadata: Metadata = {
  title: "Jobs | FloorForge — One Record From Estimate to Sign-off",
  description:
    "Track refinishing jobs from estimate through proposal to completion report. Enter the floor once; every document reads the same record. Saved in your browser — no account, no server.",
  alternates: pageAlternates("/jobs"),
};

/**
 * The workspace that turns three tools into one workflow.
 *
 * A JobRecord mirrors types.Job, so when Supabase credentials exist these
 * records sync to POST /api/jobs rather than needing migration. Local-first is
 * the starting point, not a substitute for the backend.
 */
export default function JobsPage() {
  return (
    <WorkspaceShell
      active="jobs"
      title="One record, estimate to sign-off."
      intro={
        <>
          Measure the floor once. The estimate becomes the proposal, the proposal becomes
          the completion report, and nothing gets typed twice.
        </>
      }
      note={
        <>
          Jobs are saved in this browser and never sent anywhere. There is no account to
          create and no server holding your work.
        </>
      }
    >
      <PageSchema
        page={{
          path: "/jobs",
          name: "Jobs — one record from estimate to sign-off",
          description: String(metadata.description),
          crumb: "Jobs",
        }}
      />
      <JobsWorkspace />
    </WorkspaceShell>
  );
}
