"use client";

import {
  DEFAULT_ASSUMPTIONS,
  type Assumptions,
  type EstimatorInputs,
} from "@/lib/estimator";
import { EMPTY_REPORT, type ReportInput } from "@/lib/report";
import type { MoistureInputs } from "@/lib/moisture";

/**
 * The job record — one floor, all the way through.
 *
 * The estimator, the proposal and the completion report were three separate
 * forms. A contractor who measured a 1,450 sqft oak floor typed it into the
 * estimator, typed it again to produce a proposal, and typed it a third time at
 * completion. That is the most reliable way to lose a user by the second job,
 * and no amount of polish on the individual tools fixes it.
 *
 * So there is now one record. Enter the floor once; every surface reads it.
 *
 * WHY THE SHAPE LOOKS LIKE THIS. `JobRecord` deliberately mirrors
 * `types.Job` (lib/types.ts:114): `site_name`, `site_address`, `sqft`,
 * `grit_sequence`, `status`, `post_job_report`. It is stored in the browser
 * today because the product has no accounts and needs none to be useful. When
 * Supabase credentials exist, `POST /api/jobs` takes almost exactly this
 * object, and these records sync rather than migrate. Local-first is the
 * starting point, not a substitute.
 *
 * Nothing here leaves the browser. No account, no server, no telemetry.
 */

export type JobStage = "estimate" | "proposal" | "in_progress" | "complete";

export const STAGE_LABEL: Record<JobStage, string> = {
  estimate: "Estimating",
  proposal: "Proposal sent",
  in_progress: "In progress",
  complete: "Complete",
};

/** Maps onto the status token classes in globals.css. */
export const STAGE_TONE: Record<JobStage, string> = {
  estimate: "neutral",
  proposal: "info",
  in_progress: "active",
  complete: "good",
};

export const STAGES: JobStage[] = ["estimate", "proposal", "in_progress", "complete"];

export interface JobRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  stage: JobStage;
  clientName: string;
  siteAddress: string;
  estimate: EstimatorInputs;
  assumptions: Assumptions;
  report: ReportInput;
  /**
   * Jobsite readiness readings. OPTIONAL on purpose: these records live in a
   * contractor's own browser, and a job saved before FLOORFORGE_44 must keep
   * opening. Readers use `job.moisture ?? DEFAULT_MOISTURE`.
   */
  moisture?: MoistureInputs;
}

const KEY = "floorforge.jobs.v1";

const DEFAULT_ESTIMATE: EstimatorInputs = {
  sqft: 1200,
  edgingLinearFt: 180,
  species: "oak",
  condition: "refinish",
  jobType: "residential",
  coats: 3,
};

function nowISO(): string {
  return new Date().toISOString();
}

/** Short, sortable, readable. Not a UUID: contractors see these. */
export function newJobId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 6);
  return `job-${t}${r}`;
}

export function listJobs(): JobRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Merge against defaults so a record written by an older build — one that
    // predates a field — still opens instead of throwing on a missing key.
    return parsed.map((j: Partial<JobRecord>) => ({
      id: String(j.id ?? newJobId()),
      createdAt: String(j.createdAt ?? nowISO()),
      updatedAt: String(j.updatedAt ?? nowISO()),
      stage: (STAGES.includes(j.stage as JobStage) ? j.stage : "estimate") as JobStage,
      clientName: String(j.clientName ?? ""),
      siteAddress: String(j.siteAddress ?? ""),
      estimate: { ...DEFAULT_ESTIMATE, ...(j.estimate ?? {}) },
      assumptions: { ...DEFAULT_ASSUMPTIONS, ...(j.assumptions ?? {}) },
      report: { ...EMPTY_REPORT, ...(j.report ?? {}) },
    }));
  } catch {
    return [];
  }
}

function persist(jobs: JobRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(jobs));
  } catch {
    /* storage full or unavailable — the tools still work, they just forget */
  }
}

export function getJob(id: string | null): JobRecord | null {
  if (!id) return null;
  return listJobs().find((j) => j.id === id) ?? null;
}

export function createJob(partial?: Partial<JobRecord>): JobRecord {
  const job: JobRecord = {
    id: newJobId(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    stage: "estimate",
    clientName: "",
    siteAddress: "",
    estimate: { ...DEFAULT_ESTIMATE },
    assumptions: { ...DEFAULT_ASSUMPTIONS },
    report: { ...EMPTY_REPORT },
    ...partial,
  };
  persist([job, ...listJobs()]);
  return job;
}

/** Merge a partial update into a job. Returns the saved record, or null. */
export function updateJob(id: string, patch: Partial<JobRecord>): JobRecord | null {
  const jobs = listJobs();
  const i = jobs.findIndex((j) => j.id === id);
  if (i === -1) return null;
  const next: JobRecord = { ...jobs[i], ...patch, updatedAt: nowISO() };
  jobs[i] = next;
  persist(jobs);
  return next;
}

export function deleteJob(id: string): void {
  persist(listJobs().filter((j) => j.id !== id));
}

/**
 * Seed the completion report from the estimate, so the fields a contractor
 * already answered are not asked again. Only fills blanks — anything typed on
 * the report itself wins, because that is the record of what actually happened
 * rather than what was planned.
 */
export function reportSeededFrom(job: JobRecord, grits: string[]): ReportInput {
  const r = job.report;
  return {
    ...r,
    clientName: r.clientName || job.clientName,
    siteAddress: r.siteAddress || job.siteAddress,
    sqft: r.sqft || job.estimate.sqft,
    coatsApplied: r.coatsApplied || job.estimate.coats,
    gritsExecuted: r.gritsExecuted || grits.join(", "),
  };
}

/** "1,450 sqft oak · standard refinish" — the one-line identity of a job. */
export function jobSummary(job: JobRecord): string {
  const e = job.estimate;
  return `${e.sqft.toLocaleString()} sqft · ${e.species} · ${e.condition}`;
}
