"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ClipboardCheck, Trash2 } from "lucide-react";
import {
  listJobs,
  createJob,
  deleteJob,
  updateJob,
  jobSummary,
  STAGE_LABEL,
  STAGE_TONE,
  STAGES,
  type JobRecord,
  type JobStage,
} from "@/lib/jobs";

function stageClass(stage: JobStage): string {
  const tone = STAGE_TONE[stage];
  return `status status-${tone}`;
}

export default function JobsWorkspace() {
  const [jobs, setJobs] = useState<JobRecord[] | null>(null);

  useEffect(() => {
    // Deferred past a microtask so React commits before the state lands — the
    // pattern FLOORFORGE_02 established for react-hooks/set-state-in-effect.
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setJobs(listJobs());
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = () => setJobs(listJobs());

  const onNew = () => {
    const job = createJob();
    window.location.href = `/estimator?job=${job.id}`;
  };

  const onDelete = (job: JobRecord) => {
    const label = job.clientName || jobSummary(job);
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    deleteJob(job.id);
    refresh();
  };

  const onStage = (job: JobRecord, stage: JobStage) => {
    updateJob(job.id, { stage });
    refresh();
  };

  // Server render and first paint: nothing, because localStorage does not exist
  // on the server. The skeleton keeps the layout from jumping (CLS is 0 across
  // this site and this route is not going to be the one that breaks it).
  if (jobs === null) {
    return (
      <div className="card p-8 bg-card border-2 border-border-strong">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="mt-4 h-11 w-full rounded bg-muted" />
        <div className="mt-2 h-11 w-full rounded bg-muted" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="card p-10 bg-card border-2 border-border-strong text-center">
        <h2 className="text-2xl font-semibold tracking-tight">No jobs yet.</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Start one and the floor you measure carries straight through to the client
          proposal and the completion report. You enter it once.
        </p>
        <div className="mt-6">
          <Button variant="accent" onClick={onNew} className="h-12 px-6">
            <Plus className="mr-2 h-4 w-4" /> Start a job
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}, saved in this browser.
        </p>
        <Button variant="accent" onClick={onNew}>
          <Plus className="mr-2 h-4 w-4" /> New job
        </Button>
      </div>

      <ul className="mt-5 space-y-4">
        {jobs.map((job) => (
          <li key={job.id} className="card p-5 bg-card border-2 border-border-strong">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold tracking-tight">
                  {job.clientName || "Untitled job"}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {job.siteAddress || "No site address yet"}
                </div>
                <div className="mt-2 text-sm tabular-nums">{jobSummary(job)}</div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <label htmlFor={`stage-${job.id}`} className="sr-only">
                  Stage for {job.clientName || "this job"}
                </label>
                <span className={stageClass(job.stage)}>{STAGE_LABEL[job.stage]}</span>
                <select
                  id={`stage-${job.id}`}
                  className="input min-h-11 text-sm"
                  value={job.stage}
                  onChange={(e) => onStage(job, e.target.value as JobStage)}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href={`/estimator?job=${job.id}`}>
                  <FileText className="mr-2 h-4 w-4" /> Estimate &amp; proposal
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/report?job=${job.id}`}>
                  <ClipboardCheck className="mr-2 h-4 w-4" /> Completion report
                </Link>
              </Button>
              <button
                type="button"
                onClick={() => onDelete(job)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-[color:var(--status-bad-ink)]"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
