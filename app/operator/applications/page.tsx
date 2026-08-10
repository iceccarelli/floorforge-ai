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

/* Status intents, not colours — see app/globals.css `.status-*`. */
const STATUS_INTENT: Record<ApplicationStatus, string> = {
  new: "status-neutral",
  contacted: "status-info",
  engaged: "status-info",
  qualified: "status-active",
  accepted: "status-good",
  onboarded: "status-good",
  piloting: "status-active",
  completed: "status-good",
  declined: "status-warn",
  churned: "status-bad",
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
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">
          Pilot Applications ({filteredApps.length})
        </h2>

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            aria-pressed={filterStatus === "all"}
            className="chip"
          >
            All
          </button>
          {["new", "engaged", "qualified", "piloting"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as ApplicationStatus)}
              aria-pressed={filterStatus === status}
              className="chip"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
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

      {/* List */}
      {!loading && filteredApps.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          No applications found
        </div>
      )}

      {!loading && filteredApps.length > 0 && (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-card rounded border border-border hover:border-border-strong"
            >
              {/* Header (clickable) */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === app.id ? null : app.id)
                }
                className="w-full text-left p-4 hover:bg-muted flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{app.name}</h3>
                    <span className={`status ${STATUS_INTENT[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {app.company} • {app.monthly_sqft_target.toLocaleString()} sqft/mo
                  </p>
                </div>
                <div className="text-muted-foreground">
                  {expandedId === app.id ? "▼" : "▶"}
                </div>
              </button>

              {/* Details (expanded) */}
              {expandedId === app.id && (
                <div className="border-t border-border p-4 bg-muted">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Email
                      </p>
                      <p className="text-sm text-foreground font-mono">{app.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Phone
                      </p>
                      <p className="text-sm text-foreground">{app.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Segment
                      </p>
                      <p className="text-sm text-foreground">
                        {app.segment || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Source
                      </p>
                      <p className="text-sm text-foreground">{app.source}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Robot Interest
                      </p>
                      <p className="text-sm text-foreground">
                        {app.robot_interest || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Location
                      </p>
                      <p className="text-sm text-foreground">
                        {app.state || "—"}
                      </p>
                    </div>
                  </div>

                  {app.challenge && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Challenge / Notes
                      </p>
                      <p className="text-sm text-foreground bg-card p-2 rounded border border-border">
                        {app.challenge}
                      </p>
                    </div>
                  )}

                  {app.internal_notes && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Internal Notes
                      </p>
                      <p className="text-sm text-foreground bg-card p-2 rounded border border-border">
                        {app.internal_notes}
                      </p>
                    </div>
                  )}

                  {/* Status update section */}
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
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
                          className="btn-console btn-console-sm"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="border-t border-border mt-4 pt-4 text-xs text-muted-foreground">
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
