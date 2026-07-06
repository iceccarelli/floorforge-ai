"use client";

import React from "react";
import { useSim } from "@/lib/simStore";
import { getRobot } from "@/lib/robots";

function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return "0m";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function MetricsHUD() {
  const metrics = useSim((s) => s.metrics);
  const selectedId = useSim((s) => s.selectedId);
  const running = useSim((s) => s.running);
  const robot = getRobot(selectedId);

  const done = metrics.coveragePct >= 99.5;
  const status = running
    ? `${robot.jobVerb}…`
    : done
    ? "Job complete"
    : metrics.coveragePct > 0
    ? "Paused"
    : "Ready";

  const coveredArea = (metrics.areaM2 * metrics.coveragePct) / 100;
  const remainingJob = Math.max(
    0,
    metrics.jobEtaSec * (1 - metrics.coveragePct / 100)
  );

  const items = [
    { label: "Coverage", value: `${metrics.coveragePct.toFixed(0)}%` },
    {
      label: "Area finished",
      value: `${coveredArea.toFixed(1)} / ${metrics.areaM2.toFixed(0)} m²`,
    },
    { label: "Real-job estimate", value: fmtTime(metrics.jobEtaSec) },
    { label: "Est. remaining", value: fmtTime(remainingJob) },
  ];

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 w-[210px] rounded-xl border border-border/70 bg-card/85 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: robot.color }}
        />
        <span className="text-xs font-semibold text-foreground">
          {robot.name}
        </span>
        <span
          className="ml-auto flex items-center gap-1 text-[10px] font-medium text-muted-foreground"
          aria-live="polite"
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              running ? "animate-pulse" : ""
            }`}
            style={{ background: running ? robot.color : "#94a3b8" }}
          />
          {status}
        </span>
      </div>
      <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        {robot.toolLabel}
      </p>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-baseline justify-between">
            <span className="text-[11px] text-muted-foreground">{it.label}</span>
            <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
              {it.value}
            </span>
          </div>
        ))}
      </div>
      {/* progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-100"
          style={{
            width: `${metrics.coveragePct}%`,
            background: robot.color,
          }}
        />
      </div>
      <p className="mt-2 text-[9px] leading-tight text-muted-foreground">
        Concept simulation. Figures are design targets, not measured results.
      </p>
    </div>
  );
}
