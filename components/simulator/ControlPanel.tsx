"use client";

import React from "react";
import { Play, Pause, RotateCcw, Orbit, Video, SquareStack } from "lucide-react";
import type { CameraMode } from "@/lib/simStore";
import { ROBOTS, getRobot } from "@/lib/robots";
import { useSim } from "@/lib/simStore";
import { Button } from "@/components/ui/button";

const ROOM_PRESETS: { label: string; w: number; l: number }[] = [
  { label: "Small · 4×3 m", w: 4, l: 3 },
  { label: "Room · 6×5 m", w: 6, l: 5 },
  { label: "Great room · 9×7 m", w: 9, l: 7 },
];

export default function ControlPanel() {
  const selectedId = useSim((s) => s.selectedId);
  const running = useSim((s) => s.running);
  const speed = useSim((s) => s.speed);
  const roomW = useSim((s) => s.roomW);
  const roomL = useSim((s) => s.roomL);
  const select = useSim((s) => s.select);
  const toggleRun = useSim((s) => s.toggleRun);
  const reset = useSim((s) => s.reset);
  const setSpeed = useSim((s) => s.setSpeed);
  const setRoom = useSim((s) => s.setRoom);
  const exploded = useSim((s) => s.exploded);
  const cutaway = useSim((s) => s.cutaway);
  const setExploded = useSim((s) => s.setExploded);
  const toggleCutaway = useSim((s) => s.toggleCutaway);
  const cameraMode = useSim((s) => s.cameraMode);
  const setCameraMode = useSim((s) => s.setCameraMode);

  const robot = getRobot(selectedId);

  const CAMERAS: { mode: CameraMode; label: string; Icon: typeof Orbit }[] = [
    { mode: "orbit", label: "Orbit", Icon: Orbit },
    { mode: "follow", label: "Follow", Icon: Video },
    { mode: "top", label: "Top", Icon: SquareStack },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* robot picker */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Platform
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {ROBOTS.map((r) => {
            const active = r.id === selectedId;
            return (
              <button
                key={r.id}
                onClick={() => select(r.id)}
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                  active
                    ? "border-accent bg-accent-light"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <span
                  className="mt-0.5 inline-block h-8 w-1.5 shrink-0 rounded-full"
                  style={{ background: r.color }}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {r.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.role}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* spec chips */}
      <div className="flex flex-wrap gap-1.5">
        {robot.chips.map((c) => (
          <span
            key={c.label}
            className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-muted-foreground"
          >
            <span className="text-muted-foreground">{c.label}: </span>
            <span className="font-medium text-foreground">{c.value}</span>
          </span>
        ))}
      </div>

      {/* transport controls */}
      <div className="flex gap-2">
        <Button
          variant={running ? "secondary" : "accent"}
          className="flex-1"
          onClick={toggleRun}
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Run job"}
        </Button>
        <Button variant="outline" size="icon" onClick={reset} aria-label="Reset">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* camera mode */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-foreground">Camera</p>
        <div className="grid grid-cols-3 gap-1.5">
          {CAMERAS.map(({ mode, label, Icon }) => {
            const active = cameraMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setCameraMode(mode)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors ${
                  active
                    ? "border-accent bg-accent-light text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* speed */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="speed" className="text-xs font-semibold text-foreground">
            Playback speed
          </label>
          <span className="font-mono text-xs text-muted-foreground">
            {speed}×
          </span>
        </div>
        <input
          id="speed"
          type="range"
          min={1}
          max={30}
          step={1}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
      </div>

      {/* inspection: exploded view + cutaway */}
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Inspect machine
        </p>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="explode" className="text-xs font-semibold text-foreground">
            Exploded view
          </label>
          <span className="font-mono text-xs text-muted-foreground">
            {Math.round(exploded * 100)}%
          </span>
        </div>
        <input
          id="explode"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={exploded}
          onChange={(e) => setExploded(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <button
          onClick={toggleCutaway}
          aria-pressed={cutaway}
          className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm transition-colors ${
            cutaway
              ? "border-accent bg-accent-light text-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          {cutaway ? "Cutaway: internals visible" : "Cutaway: show internals"}
        </button>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Quick web preview. For the full mechanical teardown — every gear, rotor,
          belt and the dust path — launch the Pro Simulator below.
        </p>
      </div>

      {/* room size */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-foreground">Room size</p>
        <div className="grid grid-cols-1 gap-1.5">
          {ROOM_PRESETS.map((p) => {
            const active = p.w === roomW && p.l === roomL;
            return (
              <button
                key={p.label}
                onClick={() => setRoom(p.w, p.l)}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent-light text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
