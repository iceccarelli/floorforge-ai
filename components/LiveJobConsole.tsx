"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Cpu, ArrowRight } from "lucide-react";
import { JobSimulation, makeConfig, type SimSnapshot } from "@/lib/simulation";
import { gritSequenceFor } from "@/lib/estimator";
import { getJob, updateJob, type JobRecord } from "@/lib/jobs";
import { GRIT_SEQUENCE } from "@/lib/product";
import { ROBOTS } from "@/lib/robots";
import LiveFloorView from "@/components/LiveFloorView";

const SPEEDS = [
  { label: "60×", value: 60 },
  { label: "300×", value: 300 },
  { label: "1200×", value: 1200 },
];

function hms(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(r).padStart(2, "0")}s`;
}

export default function LiveJobConsole() {
  const [job, setJob] = useState<JobRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(300);
  const [t, setT] = useState(0);
  const [written, setWritten] = useState(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    void Promise.resolve().then(() => {
      if (!alive) return;
      const id = new URLSearchParams(window.location.search).get("job");
      setJob(getJob(id));
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // The machine is built from the job when there is one, and from a
  // representative floor when a visitor arrives cold — the demo must run for
  // someone who has never used the estimator.
  const sim = useMemo(() => {
    if (!ready) return null;
    const sqft = job?.estimate.sqft ?? 1200;
    const grits = job
      ? gritSequenceFor(job.estimate.species, job.estimate.condition)
      : [...GRIT_SEQUENCE];
    return new JobSimulation(
      makeConfig(sqft, grits, job?.id ?? "job-demo-0001", new Date(2026, 7, 3, 8, 0, 0))
    );
  }, [ready, job]);

  useEffect(() => {
    if (!running || !sim) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setT((prev) => {
        const next = prev + dt * speed;
        if (next >= sim.totalDurationSec) {
          setRunning(false);
          return sim.totalDurationSec;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [running, speed, sim]);

  if (!ready || !sim) {
    return (
      <div className="card p-8 bg-card border-2 border-border-strong">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="mt-4 h-24 w-full rounded bg-muted" />
      </div>
    );
  }

  const s: SimSnapshot = sim.snapshotAt(t);
  const fields = sim.reportFields();

  const writeReport = () => {
    if (!job) return;
    updateJob(job.id, {
      stage: "complete",
      report: {
        ...job.report,
        gritsExecuted: fields.gritsExecuted,
        avgDustUgm3: fields.avgDustUgm3,
        approvalScore: fields.approvalScore,
        sqft: job.report.sqft || job.estimate.sqft,
        clientName: job.report.clientName || job.clientName,
        siteAddress: job.report.siteAddress || job.siteAddress,
      },
    });
    setWritten(true);
  };

  const totalEvents = Object.values(s.counts).reduce((a, b) => a + b, 0);

  // Displayed coverage is floored below 100 until the run is genuinely over.
  // toFixed(1) rounds 99.97 to "100.0", which put "100.0%" on screen next to a
  // chip still reading "Sanding" — a contradiction a viewer notices instantly.
  const shownPct = s.finished ? 100 : Math.min(99.9, s.overallPct);
  // The canonical record — same object the 3D simulator, the systems library
  // and the homepage chips read. There is one description of this machine.
  const robot = ROBOTS.find((r) => r.id === "sand")!;

  return (
    <div className="space-y-6">
      {/* The label a visitor cannot miss, above everything the machine produces. */}
      <div
        role="note"
        className="rounded-xl border-2 border-accent bg-accent-light px-5 py-4"
      >
        <div className="flex items-start gap-3">
          <Cpu className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" aria-hidden="true" />
          <p className="text-sm text-foreground">
            <strong className="font-semibold">
              Simulated machine. No hardware is connected.
            </strong>{" "}
            A ForgeSand D1 does not exist yet. What is real here is the data path: every
            event below matches the shape, payload and cadence in the firmware contract,
            in the same vocabulary <code className="font-mono text-xs">/api/telemetry</code>{" "}
            accepts. The day a physical unit posts to that endpoint, nothing downstream
            changes.
          </p>
        </div>
      </div>

      {/* Transport */}
      <div className="card p-5 bg-card border-2 border-border-strong">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="accent"
            className="h-12"
            onClick={() => setRunning((r) => !r)}
            disabled={s.finished}
          >
            {running ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> {t > 0 ? "Resume" : "Run the job"}
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            className="h-12"
            onClick={() => {
              setRunning(false);
              setT(0);
              setWritten(false);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground">
              SPEED
            </span>
            <div role="radiogroup" aria-label="Playback speed" className="flex gap-1.5">
              {SPEEDS.map((sp) => (
                <button
                  key={sp.value}
                  type="button"
                  role="radio"
                  aria-checked={speed === sp.value}
                  onClick={() => setSpeed(sp.value)}
                  className={`min-h-11 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    speed === sp.value
                      ? "border-accent bg-accent-light text-accent"
                      : "border-border-strong text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto text-sm text-muted-foreground tabular-nums">
            {hms(s.t)} / {hms(sim.totalDurationSec)} simulated
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-5">
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(shownPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Job progress"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-150"
              style={{ width: `${shownPct}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            <span>
              Pass <strong className="text-foreground">{s.pass}</strong> of {s.passCount} ·{" "}
              <strong className="text-foreground">{s.grit} grit</strong>
            </span>
            <span className="tabular-nums">{s.passPct.toFixed(1)}% of this pass</span>
            <span className="tabular-nums">
              {s.areaDoneM2.toFixed(0)} / {s.totalAreaM2.toFixed(0)} m²
            </span>
          </div>
        </div>
      </div>

      {/* WHAT THE MACHINE IS — the console showed a job running without ever
          saying which machine was running it. */}
      <div className="card p-6 bg-card border-2 border-border-strong">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight">{robot.name}</h2>
              <span className="chip">{robot.codename}</span>
              <span className={`status status-${s.finished ? "good" : running ? "active" : "neutral"}`}>
                {s.finished ? "Job complete" : running ? robot.jobVerb : "Idle"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{robot.role}</p>
            <p className="mt-2 max-w-2xl text-sm">{robot.task}</p>
            <p className="mt-2 text-xs text-muted-foreground">{robot.toolLabel}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4 lg:grid-cols-2">
            {robot.chips.map((c) => (
              <div key={c.label}>
                <dt className="text-xs font-semibold tracking-wider text-muted-foreground">
                  {c.label}
                </dt>
                <dd className="tabular-nums">{c.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* WHAT IT IS DOING — the floor, drawn to the machine's own dimensions. */}
      <div className="card p-6 bg-card border-2 border-border-strong">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">The floor, from above</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            Pass {s.pass} of {s.passCount} · {s.grit} grit
          </span>
        </div>
        <div className="mt-4">
          <LiveFloorView
            robot={robot}
            areaM2={s.totalAreaM2}
            pass={s.pass}
            passCount={s.passCount}
            passPct={s.passPct}
            grit={s.grit}
            running={running}
          />
        </div>
      </div>

      {/* Live sensors */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "COVERAGE", value: `${shownPct.toFixed(1)}%`, sub: "whole job" },
          { label: "PRESSURE", value: `${s.psi.toFixed(2)}`, sub: "psi · target 2–5" },
          { label: "AIRBORNE DUST", value: `${s.ugm3.toFixed(1)}`, sub: "µg/m³ at extraction" },
          { label: "TELEMETRY EVENTS", value: totalEvents.toLocaleString(), sub: "emitted so far" },
        ].map((m) => (
          <div key={m.label} className="card p-5 bg-card border border-border-strong">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground">
              {m.label}
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
              {m.value}
            </div>
            <div className="text-xs text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {/* Pass results */}
        <div className="card p-6 bg-card border-2 border-border-strong">
          <h2 className="text-lg font-semibold tracking-tight">Completed passes</h2>
          {s.passResults.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing yet. Press <strong className="text-foreground">Run the job</strong>{" "}
              and the machine works through the sequence.
            </p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">
                Results reported by the simulated machine for each completed pass
              </caption>
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="pb-2 font-medium">Grit</th>
                  <th scope="col" className="pb-2 font-medium text-right">Coverage</th>
                  <th scope="col" className="pb-2 font-medium text-right">Avg psi</th>
                  <th scope="col" className="pb-2 font-medium text-right">Avg dust</th>
                </tr>
              </thead>
              <tbody>
                {s.passResults.map((pr) => (
                  <tr key={pr.pass} className="border-t border-border">
                    <td className="py-2.5 font-medium">{pr.grit}</td>
                    <td className="py-2.5 text-right tabular-nums">{pr.coveragePct}%</td>
                    <td className="py-2.5 text-right tabular-nums">{pr.avgPressurePsi}</td>
                    <td className="py-2.5 text-right tabular-nums">{pr.avgDustUgm3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Raw event stream */}
        <div className="card min-w-0 p-6 bg-card border-2 border-border-strong">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Telemetry stream</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              newest first · {totalEvents.toLocaleString()} total
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Exactly the envelope in SOFTWARE_HARDWARE_CONTRACT.md §2.2 —{" "}
            <code className="font-mono">device_id</code>,{" "}
            <code className="font-mono">job_id</code>,{" "}
            <code className="font-mono">timestamp</code>,{" "}
            <code className="font-mono">event_type</code>,{" "}
            <code className="font-mono">data</code>.
          </p>
          {/* tabIndex=0: a scrollable region must be reachable by keyboard, or a
              keyboard-only user cannot scroll it at all (axe
              scrollable-region-focusable). The global :focus-visible rule in
              globals.css already gives it a ring. aria-live is off on purpose —
              announcing 7,200 events per pass would make the page unusable with
              a screen reader; the progress bar and pass table carry the state. */}
          <ul
            tabIndex={0}
            aria-label="Telemetry event stream, newest first"
            aria-live="off"
            // min-h: adding tabIndex made this a focusable target, and empty it
            // measured 42.8px — under the 44px floor (audit/scripts/tap-targets.mjs).
            // A fixed floor also stops the panel jumping as the stream fills.
            className="mt-4 min-h-[180px] max-h-72 space-y-1.5 overflow-y-auto font-mono text-[11px] leading-relaxed"
          >
            {s.log.length === 0 && (
              <li className="font-sans text-sm text-muted-foreground">
                No events yet.
              </li>
            )}
            {s.log.map((e) => (
              <li key={e.seq} className="break-all border-b border-border pb-1.5">
                <span className="text-accent">{e.event_type}</span>{" "}
                <span className="text-muted-foreground">{e.timestamp.slice(11, 19)}</span>{" "}
                <span className="text-foreground">{JSON.stringify(e.data)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The payoff */}
      <div className="card p-6 md:p-8 bg-card border-2 border-accent">
        <h2 className="text-xl font-semibold tracking-tight">
          What the machine fills in for you
        </h2>
        <p className="mt-2 text-muted-foreground">
          The completion report marks three fields{" "}
          <span className="font-semibold text-accent">auto later</span>. These are those
          fields, derived from the run above and nothing else.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ["Grit sequence run", fields.gritsExecuted, "from pass_completed"],
            ["Average dust", `${fields.avgDustUgm3} µg/m³`, "from dust_reading"],
            ["Approval score", `${fields.approvalScore} / 100`, "from coverage_checkpoint"],
          ].map(([k, v, src]) => (
            <div key={k} className="rounded-xl border border-border-strong p-4">
              <dt className="text-xs font-semibold tracking-wider text-muted-foreground">
                {k}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
                {s.finished ? v : "—"}
              </dd>
              <dd className="text-xs text-muted-foreground">{src}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {job ? (
            <>
              <Button
                variant="accent"
                className="h-12"
                onClick={writeReport}
                disabled={!s.finished || written}
              >
                {written ? "Written to the report" : "Fill the completion report"}
              </Button>
              {written && (
                <Button asChild variant="secondary" className="h-12">
                  <Link href={`/report?job=${job.id}`}>
                    Open the report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <>
              {/* h-auto + whitespace-normal: the Button primitive sets
                  whitespace-nowrap, and this label is 302px wide — 31px past a
                  320px viewport. Same treatment patch 12 gave the dashboard
                  cross-sell button. */}
              <Button
                asChild
                variant="secondary"
                className="h-auto whitespace-normal py-3 text-center leading-snug"
              >
                <Link href="/jobs">Start a job to write these into a report</Link>
              </Button>
            </>
          )}
          {!s.finished && (
            <span className="text-sm text-muted-foreground">
              Available once the run completes.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
