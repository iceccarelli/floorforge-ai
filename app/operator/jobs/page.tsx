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

const STATUS_COLORS: Record<JobStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  queued: "bg-blue-100 text-blue-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  approved: "bg-emerald-100 text-emerald-800",
  rework: "bg-orange-100 text-orange-800",
  failed: "bg-red-100 text-red-800",
  archived: "bg-gray-200 text-gray-700",
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
      const response = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...updates,
        }),
      });

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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Jobs ({filteredJobs.length})
        </h2>

        {/* Tenant selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Pilot Contractor (Tenant)
          </label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">— Choose a contractor —</option>
            {testTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Note: In production, this would list actual pilot contractors
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          {["draft", "queued", "in_progress", "completed", "approved"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as JobStatus)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filterStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
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
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <div className="text-gray-500 py-8">Loading...</div>}

      {/* No contractor selected */}
      {!selectedTenantId && !loading && (
        <div className="text-gray-500 py-8 text-center">
          Select a contractor to view jobs
        </div>
      )}

      {/* List */}
      {!loading && selectedTenantId && filteredJobs.length === 0 && (
        <div className="text-gray-500 py-8 text-center">
          No jobs found
        </div>
      )}

      {!loading && selectedTenantId && filteredJobs.length > 0 && (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded border border-gray-200 hover:border-gray-300"
            >
              {/* Header (clickable) */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === job.id ? null : job.id)
                }
                className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {job.site_name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        STATUS_COLORS[job.status]
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {job.sqft.toLocaleString()} sqft • {job.robot_id} •
                    Coverage: {job.coverage_pct.toFixed(1)}%
                  </p>
                </div>
                <div className="text-gray-400">
                  {expandedId === job.id ? "▼" : "▶"}
                </div>
              </button>

              {/* Details (expanded) */}
              {expandedId === job.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Site Address
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.site_address || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Floor Type
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.floor_type || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Coverage
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.coverage_pct.toFixed(1)}% ({job.coverage_area_m2.toFixed(1)} m²)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Time Elapsed
                      </p>
                      <p className="text-sm text-gray-900">
                        {Math.floor(job.time_elapsed_sec / 3600)}h{" "}
                        {Math.floor((job.time_elapsed_sec % 3600) / 60)}m
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Grit Sequence
                      </p>
                      <p className="text-sm text-gray-900 font-mono">
                        {job.grit_sequence?.join(" → ") || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Approval Score
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.approval_score ? `${job.approval_score}/100` : "—"}
                      </p>
                    </div>
                  </div>

                  {job.site_notes && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                        Site Notes
                      </p>
                      <p className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200">
                        {job.site_notes}
                      </p>
                    </div>
                  )}

                  {/* Status update section */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">
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
                        className="px-3 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50 mr-2"
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
                        className="px-3 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50 mr-2"
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
                          className="px-3 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50 mr-2"
                        >
                          → Complete job
                        </button>
                        <button
                          onClick={() => updateJobStatus(job.id, "paused")}
                          disabled={updatingId === job.id}
                          className="px-3 py-2 bg-yellow-500 text-white rounded text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
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
                        className="px-3 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50 mr-2"
                      >
                        → Approve & finalize
                      </button>
                    )}

                    {/* Manual status selector */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">
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
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              job.status === status
                                ? "bg-gray-300 text-gray-600 cursor-default"
                                : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="border-t border-gray-200 mt-4 pt-4 text-xs text-gray-500">
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
