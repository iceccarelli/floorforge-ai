/**
 * Operator: Jobs Management
 * List, filter, and update job status through workflow
 */

"use client";

import React, { useState, useEffect } from "react";
import * as types from "@/lib/types";

type JobStatus = types.JobStatus;

const STATUS_OPTIONS: JobStatus[] = [
  "draft",
  "queued",
  "in_progress",
  "paused",
  "completed",
  "approved",
  "rework",
  "failed",
];

/* Status intents, not colours. See the `.status-*` classes in app/globals.css:
   every ink/tint pair is measured and clears 4.5:1, and the pill always carries
   its own label so colour is never the sole carrier of meaning. */
const STATUS_INTENT: Record<JobStatus, string> = {
  draft: "status-neutral",
  queued: "status-info",
  in_progress: "status-active",
  paused: "status-warn",
  completed: "status-good",
  approved: "status-good",
  rework: "status-warn",
  failed: "status-bad",
  archived: "status-neutral",
};

interface JobRow extends types.Job {
  tenant_name?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  // Fetch jobs.
  //
  // The fetch is inlined into the effect rather than declared below it. The old
  // shape — `useEffect(() => { fetchJobs() }, [filterStatus, selectedTenantId])`
  // with `async function fetchJobs()` declared afterwards — tripped three React
  // 19 hook rules at once: the function was read before its declaration, the
  // dependency list omitted it, and `setLoading(true)` ran synchronously inside
  // the effect body. See audit/FINDINGS.md P0-6.
  //
  // Two behavioural notes:
  //   • The refetch triggers are unchanged: still exactly filterStatus and
  //     selectedTenantId.
  //   • `active` is new. Previously a fast filter switch could let a slow
  //     earlier response overwrite a newer one; that race is now closed.
  useEffect(() => {
    let active = true;

    void (async () => {
      // Awaiting first means no state update happens synchronously in the
      // effect body — React has committed the render before anything lands.
      await Promise.resolve();
      if (!active) return;

      if (!selectedTenantId) {
        setJobs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const query =
          filterStatus === "all"
            ? `/api/jobs?tenant_id=${selectedTenantId}`
            : `/api/jobs?tenant_id=${selectedTenantId}&status=${filterStatus}`;

        const response = await fetch(query);
        const json = (await response.json()) as types.ApiResponse<
          types.PaginatedResponse<types.Job>
        >;
        if (!active) return;

        if (json.error) {
          setError(json.error.message);
          return;
        }

        setJobs(json.data?.data || []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [filterStatus, selectedTenantId]);

  async function updateJobStatus(
    id: string,
    newStatus: JobStatus,
    updates?: Partial<types.Job>
  ) {
    try {
      setUpdatingId(id);
      // tenant_id is now required on this route: PATCH /api/jobs/[id] used to
      // update any job in any tenant from its id alone.
      const response = await fetch(
        `/api/jobs/${id}?tenant_id=${encodeURIComponent(selectedTenantId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            ...updates,
          }),
        }
      );

      const json = (await response.json()) as types.ApiResponse<types.Job>;

      if (json.error) {
        setError(json.error.message);
        return;
      }

      // Update local state
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? json.data! : job))
      );
      setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update job");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredJobs =
    filterStatus === "all" ? jobs : jobs.filter((job) => job.status === filterStatus);

  // Simple test tenant IDs (in real system, would fetch from database)
  const testTenants = [
    { id: "tenant-001", name: "Test Contractor 1" },
    { id: "tenant-002", name: "Test Contractor 2" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">
          Jobs ({filteredJobs.length})
        </h2>

        {/* Tenant selector */}
        <div className="mb-4">
          <label
            htmlFor="tenant-select"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Select Pilot Contractor (Tenant)
          </label>
          {/* htmlFor/id, not proximity: without it axe reports `select-name`
              (critical) and a screen reader announces an unlabelled combobox.
              text-base is 16px — anything smaller makes iOS Safari zoom the
              whole page on focus (audit/FINDINGS.md P2-13). */}
          <select
            id="tenant-select"
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            aria-describedby="tenant-select-note"
            className="input min-h-11 w-full max-w-sm text-base"
          >
            <option value="">— Choose a contractor —</option>
            {testTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          <p id="tenant-select-note" className="text-xs text-muted-foreground mt-1">
            Note: In production, this would list actual pilot contractors
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            aria-pressed={filterStatus === "all"}
            className="chip"
          >
            All
          </button>
          {["draft", "queued", "in_progress", "completed", "approved"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as JobStatus)}
                aria-pressed={filterStatus === status}
                className="chip"
              >
                {status.replace("_", " ").charAt(0).toUpperCase() +
                  status.replace("_", " ").slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-card text-foreground rounded border border-border">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <div className="text-muted-foreground py-8">Loading...</div>}

      {/* No contractor selected */}
      {!selectedTenantId && !loading && (
        <div className="text-muted-foreground py-8 text-center">
          Select a contractor to view jobs
        </div>
      )}

      {/* List */}
      {!loading && selectedTenantId && filteredJobs.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          No jobs found
        </div>
      )}

      {!loading && selectedTenantId && filteredJobs.length > 0 && (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-card rounded border border-border hover:border-border-strong"
            >
              {/* Header (clickable) */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === job.id ? null : job.id)
                }
                className="w-full text-left p-4 hover:bg-muted flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {job.site_name}
                    </h3>
                    <span className={`status ${STATUS_INTENT[job.status]}`}>
                      {job.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {job.sqft.toLocaleString()} sqft • {job.robot_id} •
                    Coverage: {job.coverage_pct.toFixed(1)}%
                  </p>
                </div>
                <div className="text-muted-foreground">
                  {expandedId === job.id ? "▼" : "▶"}
                </div>
              </button>

              {/* Details (expanded) */}
              {expandedId === job.id && (
                <div className="border-t border-border p-4 bg-muted">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Site Address
                      </p>
                      <p className="text-sm text-foreground">
                        {job.site_address || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Floor Type
                      </p>
                      <p className="text-sm text-foreground">
                        {job.floor_type || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Coverage
                      </p>
                      <p className="text-sm text-foreground">
                        {job.coverage_pct.toFixed(1)}% ({job.coverage_area_m2.toFixed(1)} m²)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Time Elapsed
                      </p>
                      <p className="text-sm text-foreground">
                        {Math.floor(job.time_elapsed_sec / 3600)}h{" "}
                        {Math.floor((job.time_elapsed_sec % 3600) / 60)}m
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Grit Sequence
                      </p>
                      <p className="text-sm text-foreground font-mono">
                        {job.grit_sequence?.join(" → ") || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Approval Score
                      </p>
                      <p className="text-sm text-foreground">
                        {job.approval_score ? `${job.approval_score}/100` : "—"}
                      </p>
                    </div>
                  </div>

                  {job.site_notes && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Site Notes
                      </p>
                      <p className="text-sm text-foreground bg-card p-2 rounded border border-border">
                        {job.site_notes}
                      </p>
                    </div>
                  )}

                  {/* Status update section */}
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Update Status
                    </p>

                    {/* Quick workflow actions */}
                    {job.status === "draft" && (
                      <button
                        onClick={() =>
                          updateJobStatus(job.id, "queued", {
                            scheduled_at: new Date().toISOString(),
                          })
                        }
                        disabled={updatingId === job.id}
                        className="btn-console btn-console-advance mr-2"
                      >
                        → Queue for assignment
                      </button>
                    )}

                    {job.status === "queued" && (
                      <button
                        onClick={() =>
                          updateJobStatus(job.id, "in_progress", {
                            started_at: new Date().toISOString(),
                          })
                        }
                        disabled={updatingId === job.id}
                        className="btn-console btn-console-advance mr-2"
                      >
                        → Start work
                      </button>
                    )}

                    {job.status === "in_progress" && (
                      <>
                        <button
                          onClick={() =>
                            updateJobStatus(job.id, "completed", {
                              completed_at: new Date().toISOString(),
                            })
                          }
                          disabled={updatingId === job.id}
                          className="btn-console btn-console-advance mr-2"
                        >
                          → Complete job
                        </button>
                        <button
                          onClick={() => updateJobStatus(job.id, "paused")}
                          disabled={updatingId === job.id}
                          className="btn-console btn-console-hold"
                        >
                          → Pause
                        </button>
                      </>
                    )}

                    {job.status === "completed" && (
                      <button
                        onClick={() => updateJobStatus(job.id, "approved", {
                          approval_score: 95,
                        })}
                        disabled={updatingId === job.id}
                        className="btn-console btn-console-advance mr-2"
                      >
                        → Approve & finalize
                      </button>
                    )}

                    {/* Manual status selector */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Or set status manually:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            onClick={() => updateJobStatus(job.id, status)}
                            disabled={
                              updatingId === job.id || job.status === status
                            }
                            className="btn-console btn-console-sm"
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="border-t border-border mt-4 pt-4 text-xs text-muted-foreground">
                    <p>Created: {new Date(job.created_at).toLocaleDateString()}</p>
                    <p>ID: {job.id}</p>
                    <p>Robot: {job.robot_id}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
