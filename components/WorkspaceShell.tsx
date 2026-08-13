"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Calculator, ClipboardCheck } from "lucide-react";
import {
  getJob,
  jobSummary,
  STAGE_LABEL,
  STAGE_TONE,
  type JobRecord,
} from "@/lib/jobs";

/**
 * Shared chrome for the contractor toolkit.
 *
 * Before this, /jobs, /estimator and /report each had their own hand-rolled
 * header and no way to reach one another. A contractor filling in a completion
 * report could not open that job's estimate without navigating back to the job
 * list and finding it again — four pages that happened to share a design
 * system, rather than one application.
 *
 * The shell gives every tool the same three things: where you are, which job
 * you are in, and one click to any other tool **for that same job**. The job id
 * rides along in the query string, so switching tools never loses context.
 *
 * These are LINKS, not tabs. `role="tablist"` would be wrong — a tab shows a
 * panel in the same document, these navigate. `aria-current="page"` is the
 * correct signal, and it is what a screen reader announces.
 */

const TOOLS = [
  { key: "jobs", href: "/jobs", label: "Jobs", icon: ClipboardList, jobScoped: false },
  { key: "estimator", href: "/estimator", label: "Estimate & proposal", icon: Calculator, jobScoped: true },
  { key: "report", href: "/report", label: "Completion report", icon: ClipboardCheck, jobScoped: true },
] as const;

export type ToolKey = (typeof TOOLS)[number]["key"];

export default function WorkspaceShell({
  active,
  eyebrow = "FREE TOOL · NO ACCOUNT NEEDED",
  title,
  intro,
  note,
  children,
}: {
  active: ToolKey;
  eyebrow?: string;
  title: string;
  intro: React.ReactNode;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [job, setJob] = useState<JobRecord | null>(null);

  useEffect(() => {
    // Deferred past a microtask so React commits first — the pattern
    // FLOORFORGE_02 established for react-hooks/set-state-in-effect.
    let active2 = true;
    void Promise.resolve().then(() => {
      if (!active2) return;
      const id = new URLSearchParams(window.location.search).get("job");
      setJob(getJob(id));
    });
    return () => {
      active2 = false;
    };
  }, []);

  const hrefFor = (t: (typeof TOOLS)[number]) =>
    job && t.jobScoped ? `${t.href}?job=${job.id}` : t.href;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-12">
      <div className="print:hidden">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to FloorForge
        </Link>

        {/* Job context — only shown when a job is actually open, so a visitor
            trying a tool cold is not confronted with an empty breadcrumb. */}
        {job && (
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border-strong bg-muted px-4 py-3">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground">
              CURRENT JOB
            </span>
            <span className="font-semibold tracking-tight">
              {job.clientName || "Untitled job"}
            </span>
            <span className="text-sm text-muted-foreground">{jobSummary(job)}</span>
            <span className={`status status-${STAGE_TONE[job.stage]}`}>
              {STAGE_LABEL[job.stage]}
            </span>
            <Link
              href="/jobs"
              className="ml-auto inline-flex min-h-11 items-center text-sm font-medium text-accent hover:text-accent-hover"
            >
              All jobs
            </Link>
          </div>
        )}

        {/* Tool switcher. Links, not tabs — see the note at the top of the file. */}
        <nav aria-label="Contractor tools" className="mt-5">
          <ul className="flex flex-wrap gap-2">
            {TOOLS.map((t) => {
              const isActive = t.key === active;
              const Icon = t.icon;
              return (
                <li key={t.key}>
                  <Link
                    href={hrefFor(t)}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                      isActive
                        ? "border-accent bg-accent-light text-accent"
                        : "border-border-strong text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <header className="mt-8 max-w-3xl">
          <div className="text-accent text-xs tracking-[3px] font-semibold">{eyebrow}</div>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
            {title}
          </h1>
          <div className="mt-4 text-xl text-muted-foreground">{intro}</div>
          {note && <div className="mt-4 text-sm text-muted-foreground">{note}</div>}
        </header>
      </div>

      <div className="mt-10">{children}</div>
    </div>
  );
}
