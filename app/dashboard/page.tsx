"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Clock, TrendingUp,
  Zap, BarChart3
} from "lucide-react";
import { shareOfOshaPel, OSHA_NUISANCE_DUST_PEL_UGM3 } from "@/lib/product";

interface Job {
  id: string;
  site: string;
  type: string;
  sqft: number;
  status: string;
  progress: number;
  currentGrit: string;
  robots: number;
  eta: string;
}

const mockJobs: Job[] = [
  {
    id: "RF-2847",
    site: "Meridian Office Tower - Floors 12-18",
    type: "Commercial",
    sqft: 12500,
    status: "In Progress - Sanding",
    progress: 78,
    currentGrit: "120 grit",
    robots: 3,
    eta: "2h 14m",
  },
  {
    id: "RF-2849",
    site: "The Lennox Residences - Unit 4B & 4C",
    type: "Residential",
    sqft: 1850,
    status: "Finishing - Coat 2",
    progress: 91,
    currentGrit: "Finish",
    robots: 1,
    eta: "45m",
  },
];

export default function FloorForgeDashboard() {
  const [activeTab, setActiveTab] = useState<"jobs" | "analytics" | "fleet">("jobs");

  return (
    <div className="min-h-screen bg-muted">
      {/* DEMO banner — every number on this page is illustrative sample data */}
      <div className="bg-accent text-white text-center text-xs font-semibold tracking-wider py-2 px-4">
        PRODUCT PREVIEW — ALL DATA ON THIS PAGE IS SAMPLE DATA ILLUSTRATING THE PLANNED DASHBOARD
      </div>
      {/* Dashboard header.
          Three things were wrong here (audit/FINDINGS.md P0-3, P1-7, P1-4):

            1. The row was `flex justify-between` with no wrap, so it overflowed
               the viewport on every phone tested — 80px at 375, 135px at 320.
               `flex-wrap` plus a wrapping right-hand cluster fixes it without
               hiding anything.
            2. The page had NO <h1> at all; its first heading was an <h3>. This
               is linked from the footer of every page as "Dashboard Preview",
               so it is a prospect-facing surface.
            3. `bg-accent/10` under `text-accent` measured 4.35:1, below the
               4.5 floor. The pill now uses the measured status set. */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to FloorForge.ai
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <h1 className="font-semibold tracking-tight text-foreground">FloorForge Dashboard</h1>
            <span className="status status-active">PRODUCT PREVIEW</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="text-muted-foreground">Good morning, Alex Rivera</div>
            <div className="h-8 w-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">AR</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="dashboard-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground tracking-wider">ACTIVE ROBOTS</div>
                <div className="text-4xl font-semibold tabular-nums mt-1">14</div>
              </div>
              <Zap className="h-8 w-8 text-accent" />
            </div>
            <div className="text-xs text-success mt-3 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +2 since yesterday</div>
          </div>
          <div className="dashboard-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground tracking-wider">JOBS IN PROGRESS</div>
                <div className="text-4xl font-semibold tabular-nums mt-1">4</div>
              </div>
              <Clock className="h-8 w-8 text-accent" />
            </div>
            <div className="text-xs text-muted-foreground mt-3">2 completing today</div>
          </div>
          <div className="dashboard-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground tracking-wider">AVG DUST LEVEL</div>
                <div className="text-4xl font-semibold tabular-nums mt-1">11.4</div>
                <div className="text-xs">µg/m³</div>
              </div>
              <BarChart3 className="h-8 w-8 text-accent" />
            </div>
            {/* Was "Well below OSHA limit" beside a sibling tile claiming "87%
                below OSHA action level". OSHA publishes no action level for
                wood dust — it falls under the generic nuisance-dust PEL of
                15 mg/m³ — and 87% matches no published limit
                (audit/PRODUCT_TRUTH.md T0-3). The correct figure is stronger
                than the wrong one was. */}
            <div className="text-xs text-success mt-3">
              {shareOfOshaPel(11.4)} of the OSHA nuisance-dust PEL
            </div>
          </div>
          <div className="dashboard-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground tracking-wider">MARGIN THIS MONTH</div>
                <div className="text-4xl font-semibold tabular-nums mt-1">+23%</div>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <div className="text-xs text-success mt-3">vs same period last year</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          {(["jobs", "analytics", "fleet"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab 
                ? "border-accent text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab === "jobs" && "Active Jobs"}
              {tab === "analytics" && "Quality & Analytics"}
              {tab === "fleet" && "Fleet Health"}
            </button>
          ))}
        </div>

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              {/* h2, not h3: this is the first section under the page's <h1>, and
                  jumping 1 -> 3 is a WCAG 1.3.1 hierarchy break (FINDINGS P1-7). */}
              <h2 className="min-w-0 font-semibold text-xl tracking-tight">Active Sanding &amp; Finishing Jobs</h2>
              <Button variant="accent" size="sm" className="shrink-0">+ New Job</Button>
            </div>

            {mockJobs.map((job) => (
              <div key={job.id} className="dashboard-card p-7">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{job.id}</div>
                      <div className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{job.type}</div>
                    </div>
                    <div className="font-semibold text-xl tracking-tight">{job.site}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{job.sqft.toLocaleString()} sqft • {job.robots} robot{job.robots > 1 ? "s" : ""} deployed</div>
                  </div>

                  <div className="lg:w-80">
                    <div className="flex justify-between text-xs mb-1.5">
                      <div className="font-medium text-muted-foreground">{job.status}</div>
                      <div className="font-mono tabular-nums">{job.progress}% • {job.eta}</div>
                    </div>
                    <div className="job-progress mb-4">
                      <div className="job-progress-fill" style={{ width: `${job.progress}%` }} />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div>Current: <span className="font-medium">{job.currentGrit}</span></div>
                      <Button variant="ghost" size="sm" className="text-xs">View live telemetry</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Cross-sell to other Forge platforms */}
            <div className="mt-8 rounded-2xl border-2 border-dashed border-accent/40 bg-accent-light p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="uppercase tracking-[2px] text-xs font-semibold text-accent mb-2">CROSS-PLATFORM OPPORTUNITY</div>
                  <div className="text-2xl font-semibold tracking-tight">This client has 42,000 sqft of walls & ceilings still untouched.</div>
                  <p className="mt-2 text-foreground">Future Forge products are planned to share this reporting layer for whole-interior jobs.</p>
                </div>
                <div className="w-full md:w-auto">
                  {/* `whitespace-nowrap` forced this 313px-wide button to sit on
                      one line, which is what still overflowed a 320px viewport
                      after the header row was fixed. The label wraps now; the
                      button stays full-width on narrow screens and shrink-wraps
                      from md up. (audit/FINDINGS.md P0-3) */}
                  <Button variant="accent" className="h-auto w-full py-3 text-center leading-snug md:w-auto">
                    Start walls &amp; ceilings quote in DryForge
                  </Button>
                  {/* Was "Opens in new tab • Shared job context", which asserts
                      a working deep-link into a product that has no definition
                      in any document (audit/PRODUCT_TRUTH.md T2-2). */}
                  <div className="text-xs text-center mt-2 text-foreground">
                    DryForge is a concept for a future Forge product — not available today.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="dashboard-card p-8">
            <h3 className="font-semibold text-xl mb-6 tracking-tight">Quality & Dust Performance — Last 30 Days</h3>
            <div className="grid md:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-muted-foreground mb-2">Average First-Pass Approval</div>
                <div className="text-6xl font-semibold tabular-nums tracking-tighter">96.8<span className="text-3xl">%</span></div>
                <div className="text-emerald-600 text-xs mt-1">↑ 4.2pp from last month</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-2">Mean Dust Reading (active sanding)</div>
                <div className="text-6xl font-semibold tabular-nums tracking-tighter">12.1</div>
                <div className="text-xs">
                  µg/m³ — {shareOfOshaPel(12.1)} of the {OSHA_NUISANCE_DUST_PEL_UGM3 / 1000} mg/m³ OSHA
                  nuisance-dust PEL (8-hour TWA, total dust)
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-2">Finish Uniformity Score</div>
                <div className="text-6xl font-semibold tabular-nums tracking-tighter">94</div>
                <div className="text-xs">/100 across all coats • Target: 92</div>
              </div>
            </div>
            <div className="mt-8 text-xs text-muted-foreground border-t pt-4">Sample data. In production, metrics will be logged per job and exposed via API.</div>
          </div>
        )}

        {/* Fleet Tab */}
        {activeTab === "fleet" && (
          <div className="dashboard-card p-8">
            <h3 className="font-semibold text-xl mb-6 tracking-tight">Fleet Health — 14 Robots Online</h3>
            <div className="text-sm text-muted-foreground mb-6">All units reporting healthy. Next scheduled maintenance in 11 days.</div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 pr-4 font-normal">Robot ID</th>
                    <th className="py-3 pr-4 font-normal">Model / Status</th>
                    <th className="py-3 pr-4 font-normal">Current Job</th>
                    <th className="py-3 pr-4 font-normal">Uptime</th>
                    <th className="py-3 font-normal text-right">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {["FF-03A", "FF-07B", "FF-12C", "FF-04A"].map((id, i) => (
                    <tr key={i}>
                      <td className="py-4 pr-4 font-mono text-xs">{id}</td>
                      {/* Was "Sander Pro v4.2" — a sixth name for the sanding
                          platform, and a version number asserting that v1
                          through v4.1 shipped and were superseded. The machine
                          has not been built (audit/PRODUCT_TRUTH.md T2-2). */}
                      <td className="py-4 pr-4">ForgeSand D1 • Online</td>
                      <td className="py-4 pr-4 text-muted-foreground">{i === 0 ? "RF-2847" : i === 1 ? "RF-2849" : "Standby"}</td>
                      <td className="py-4 pr-4 tabular-nums">847h</td>
                      <td className="py-4 text-right"><span className="inline-block px-3 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">98%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12 text-xs text-muted-foreground">
        This is a fully functional mock dashboard. In production, data pulls live from Supabase with Clerk-authenticated RLS policies. 
        Cross-sell buttons would deep-link into DryForge / PaintForge with pre-populated job context.
      </div>
    </div>
  );
}
