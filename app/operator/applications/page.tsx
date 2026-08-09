/**
 * Operator: Pilot Applications Management
 * List, filter, and update pilot application status
 */

"use client";

import React, { useState, useEffect } from "react";
import * as types from "@/lib/types";

type ApplicationStatus = types.PilotApplicationStatus;

const STATUS_OPTIONS: ApplicationStatus[] = [
  "new",
  "contacted",
  "engaged",
  "qualified",
  "accepted",
  "onboarded",
  "piloting",
  "completed",
  "declined",
  "churned",
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: "bg-gray-100 text-gray-800",
  contacted: "bg-blue-100 text-blue-800",
  engaged: "bg-cyan-100 text-cyan-800",
  qualified: "bg-green-100 text-green-800",
  accepted: "bg-emerald-100 text-emerald-800",
  onboarded: "bg-teal-100 text-teal-800",
  piloting: "bg-purple-100 text-purple-800",
  completed: "bg-indigo-100 text-indigo-800",
  declined: "bg-orange-100 text-orange-800",
  churned: "bg-red-100 text-red-800",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<types.PilotApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">(
    "all"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch applications.
  //
  // The fetch is inlined into the effect rather than declared below it. The old
  // shape — `useEffect(() => { fetchApplications() }, [filterStatus])` with
  // `async function fetchApplications()` declared afterwards — tripped three
  // React 19 hook rules at once: the function was read before its declaration,
  // the dependency list omitted it, and `setLoading(true)` ran synchronously
  // inside the effect body. See audit/FINDINGS.md P0-6.
  //
  // Two behavioural notes:
  //   • The refetch trigger is unchanged: still exactly filterStatus.
  //   • `active` is new. Previously a fast filter switch could let a slow
  //     earlier response overwrite a newer one; that race is now closed.
  useEffect(() => {
    let active = true;

    void (async () => {
      // Awaiting first means no state update happens synchronously in the
      // effect body — React has committed the render before anything lands.
      await Promise.resolve();
      if (!active) return;

      setLoading(true);
      try {
        const query =
          filterStatus === "all"
            ? "/api/applications"
            : `/api/applications?status=${filterStatus}`;
        const response = await fetch(query);
        const json = (await response.json()) as types.ApiResponse<
          types.PaginatedResponse<types.PilotApplication>
        >;
        if (!active) return;

        if (json.error) {
          setError(json.error.message);
          return;
        }

        setApplications(json.data?.data || []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to fetch applications");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [filterStatus]);

  async function updateApplicationStatus(
    id: string,
    newStatus: ApplicationStatus,
    reason?: string
  ) {
    try {
      setUpdatingId(id);
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          status_reason: reason,
        }),
      });

      const json = (await response.json()) as types.ApiResponse<types.PilotApplication>;

      if (json.error) {
        setError(json.error.message);
        return;
      }

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? json.data! : app))
      );
      setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredApps =
    filterStatus === "all"
      ? applications
      : applications.filter((app) => app.status === filterStatus);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Pilot Applications ({filteredApps.length})
        </h2>

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
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
          {["new", "engaged", "qualified", "piloting"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as ApplicationStatus)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
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

      {/* List */}
      {!loading && filteredApps.length === 0 && (
        <div className="text-gray-500 py-8 text-center">
          No applications found
        </div>
      )}

      {!loading && filteredApps.length > 0 && (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded border border-gray-200 hover:border-gray-300"
            >
              {/* Header (clickable) */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === app.id ? null : app.id)
                }
                className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{app.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        STATUS_COLORS[app.status]
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {app.company} • {app.monthly_sqft_target.toLocaleString()} sqft/mo
                  </p>
                </div>
                <div className="text-gray-400">
                  {expandedId === app.id ? "▼" : "▶"}
                </div>
              </button>

              {/* Details (expanded) */}
              {expandedId === app.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Email
                      </p>
                      <p className="text-sm text-gray-900 font-mono">{app.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Phone
                      </p>
                      <p className="text-sm text-gray-900">{app.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Segment
                      </p>
                      <p className="text-sm text-gray-900">
                        {app.segment || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Source
                      </p>
                      <p className="text-sm text-gray-900">{app.source}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Robot Interest
                      </p>
                      <p className="text-sm text-gray-900">
                        {app.robot_interest || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wider">
                        Location
                      </p>
                      <p className="text-sm text-gray-900">
                        {app.state || "—"}
                      </p>
                    </div>
                  </div>

                  {app.challenge && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                        Challenge / Notes
                      </p>
                      <p className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200">
                        {app.challenge}
                      </p>
                    </div>
                  )}

                  {app.internal_notes && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                        Internal Notes
                      </p>
                      <p className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200">
                        {app.internal_notes}
                      </p>
                    </div>
                  )}

                  {/* Status update section */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">
                      Update Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          onClick={() =>
                            updateApplicationStatus(
                              app.id,
                              status
                            )
                          }
                          disabled={
                            updatingId === app.id || app.status === status
                          }
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            app.status === status
                              ? "bg-gray-300 text-gray-600 cursor-default"
                              : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="border-t border-gray-200 mt-4 pt-4 text-xs text-gray-500">
                    <p>
                      Created: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <p>ID: {app.id}</p>
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
