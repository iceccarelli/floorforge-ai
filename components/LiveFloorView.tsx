"use client";

import React from "react";
import type { RobotSpec } from "@/lib/robots";

/**
 * Top-down view of the floor, with the machine on it.
 *
 * The console shipped as numbers only: "Pass 1 of 3 · 36 grit · 0 / 111 m²".
 * A contractor reading that has no idea what the machine is, how it moves, or
 * what "coverage" looks like. This draws it — the room, the lanes already cut,
 * the lane being cut right now, and the D1 itself at its actual position.
 *
 * EVERY DIMENSION COMES FROM lib/robots.ts. The 0.50 m working width, the
 * 0.28 m tool offset and the boustrophedon pattern are the same values the 3D
 * simulator and the spec chips use, so the drawing cannot drift from the
 * published spec. The room is derived from the job's area at a 4:3 ratio,
 * which is stated on the page rather than implied.
 *
 * SVG rather than canvas or three.js: it is a few dozen rectangles, it scales
 * to any viewport without a resize observer, it costs nothing on a phone, and
 * it stays legible when a contractor prints the page.
 */

/** Mix two hex colours. Used for the per-pass floor ramp. */
function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const p = pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t))));
  return `#${p.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export interface FloorViewProps {
  robot: RobotSpec;
  /** Total floor area in m². */
  areaM2: number;
  /** 1-based index of the pass in progress. */
  pass: number;
  passCount: number;
  /** Progress through the CURRENT pass, 0–100. */
  passPct: number;
  grit: string;
  running: boolean;
}

export default function LiveFloorView({
  robot,
  areaM2,
  pass,
  passCount,
  passPct,
  grit,
  running,
}: FloorViewProps) {
  // Room proportioned 4:3 from the job's area. Stated on the page — a real
  // floor plan would come from the site scan, which does not exist yet.
  const roomW = Math.sqrt((areaM2 * 4) / 3);
  const roomH = areaM2 / roomW;

  // Lane count comes from the working width; lane PITCH is then the room
  // divided by that count, so the lanes tile the floor exactly.
  //
  // Laying lanes at a flat 0.50 m instead put 19 × 0.50 = 9.50 m of lane into a
  // 9.09 m room: the last lane hung past the bottom wall and the machine
  // finished the job standing outside the building. A real path planner has the
  // same problem and solves it the same way — you never get a whole number of
  // passes out of a room, so the passes overlap slightly. Here that is 0.48 m
  // of pitch under a 0.50 m drum, a 4% overlap, which is also what a floor
  // actually needs if it is not to band at the seams.
  const laneCount = Math.max(1, Math.ceil(roomH / robot.workingWidthM));
  const laneH = roomH / laneCount;

  const progress = Math.max(0, Math.min(1, passPct / 100));
  const finishedPass = progress >= 1;
  const laneFloat = progress * laneCount;
  // At exactly 100% the naive floor() rolls onto a 20th lane that does not
  // exist and snaps the machine back to the start of it. Park it at the end of
  // the last lane instead — where a machine that just finished actually is.
  const lanesDone = finishedPass ? laneCount - 1 : Math.floor(laneFloat);
  const partial = finishedPass ? 1 : laneFloat - lanesDone;

  // Colour ramp: each completed pass leaves the floor lighter than the last.
  //
  // Front-loaded (t^0.6) rather than linear. A linear ramp put pass 1 only a
  // third of the way from raw to finished, and the cut/uncut boundary was
  // almost invisible at a glance — which defeats the entire purpose of drawing
  // this. It also happens to be truer: the 36-grit pass strips the old finish
  // and is by far the biggest visual change a floor goes through.
  const colourAfterPass = (n: number) =>
    mix(robot.floor.base, robot.floor.done, Math.pow(n / passCount, 0.6));
  const priorColour = colourAfterPass(pass - 1);
  const thisPassColour = colourAfterPass(pass);

  // Boustrophedon: even lanes run left→right, odd right→left.
  const dirOf = (i: number) => (i % 2 === 0 ? 1 : -1);
  const activeLane = Math.min(lanesDone, laneCount - 1);
  const dir = dirOf(activeLane);
  const cutW = partial * roomW;
  const cutX = dir === 1 ? 0 : roomW - cutW;
  const headX = dir === 1 ? cutW : roomW - cutW;
  const headY = (activeLane + 0.5) * laneH;

  // The bright band is the floor the drum has just passed over — a short trail
  // behind the machine, not the whole span cut so far. It was the whole span,
  // under a legend that read "Under the drum", which said something the drawing
  // did not do. Everything further back has cooled to the pass colour.
  const trailW = Math.min(cutW, 1.4);
  const trailX = dir === 1 ? headX - trailW : headX;

  const pad = 0.6;
  const vb = `${-pad} ${-pad} ${roomW + pad * 2} ${roomH + pad * 2}`;

  // Machine footprint, drawn to the same scale as the floor.
  const bodyW = 0.62;
  const bodyH = 0.46;

  return (
    <figure className="m-0">
      <svg
        viewBox={vb}
        className="block w-full rounded-xl border border-border-strong bg-muted"
        style={{ aspectRatio: `${roomW + pad * 2} / ${roomH + pad * 2}` }}
        role="img"
        aria-label={`Top-down view of a ${Math.round(areaM2)} square metre floor. Pass ${pass} of ${passCount} at ${grit} grit, ${Math.round(passPct)} percent of this pass complete.`}
      >
        {/* Floor as left by the previous pass */}
        <rect x={0} y={0} width={roomW} height={roomH} fill={priorColour} />

        {/* Lanes finished in the current pass */}
        {Array.from({ length: lanesDone }).map((_, i) => (
          <rect
            key={i}
            x={0}
            y={i * laneH}
            width={roomW}
            height={laneH}
            fill={thisPassColour}
          />
        ))}

        {/* The part of the current lane already cut */}
        {cutW > 0 && (
          <rect
            x={cutX}
            y={activeLane * laneH}
            width={cutW}
            height={laneH}
            fill={thisPassColour}
          />
        )}

        {/* ...and the short trail immediately behind the drum */}
        {trailW > 0 && (
          <rect
            x={trailX}
            y={activeLane * laneH}
            width={trailW}
            height={laneH}
            fill={robot.floor.active}
          />
        )}

        {/* The boustrophedon plan for this pass, drawn across the whole floor.
            Without it a viewer sees a box changing colour and has to infer how
            the machine moves; with it, the up-and-down lane pattern is obvious
            at a glance. */}
        <path
          d={Array.from({ length: laneCount })
            .map((_, i) => {
              const y = (i + 0.5) * laneH;
              const d = dirOf(i);
              return d === 1
                ? `M 0 ${y} L ${roomW} ${y}`
                : `M ${roomW} ${y} L 0 ${y}`;
            })
            .join(" ")}
          fill="none"
          stroke="#0f172a"
          strokeOpacity={0.16}
          strokeWidth={0.03}
          strokeDasharray="0.22 0.22"
        />

        {/* Lane guides — the plan the machine is following */}
        {Array.from({ length: laneCount }).map((_, i) => (
          <line
            key={`g${i}`}
            x1={0}
            y1={i * laneH}
            x2={roomW}
            y2={i * laneH}
            stroke="#0f172a"
            strokeOpacity={0.06}
            strokeWidth={0.015}
          />
        ))}

        {/* Room outline */}
        <rect
          x={0}
          y={0}
          width={roomW}
          height={roomH}
          fill="none"
          stroke="#0f172a"
          strokeOpacity={0.45}
          strokeWidth={0.07}
        />

        {/* Locator halo. The machine is 0.62 m in a 12 m room, which is
            honest and nearly invisible. The halo makes it findable without
            drawing the chassis larger than it is. */}
        <circle
          cx={headX}
          cy={headY}
          r={0.85}
          fill="none"
          stroke={robot.color}
          strokeOpacity={0.5}
          strokeWidth={0.05}
        />

        {/* The machine.
            Local origin is the DRUM, parked on the cut boundary — the floor
            turns from uncut to cut exactly where the abrasive touches it.
            lib/robots.ts defines toolOffsetM as the *forward* distance from
            centre to the working head, so the chassis trails the drum by that
            distance. It was drawn the other way round, with the drum behind
            the body: the caption claimed the drawing read the published spec
            while contradicting the one line of it that says which way the tool
            faces. Everything below is now derived from that value. */}
        <g
          transform={`translate(${headX} ${headY}) scale(${dir} 1)`}
          aria-hidden="true"
        >
          {robot.emitsDust && running && (
            /* Extraction plume at the point of contact. Decorative, and only
               while the drum is turning — a static cloud reads as a defect. */
            <ellipse cx={0.06} cy={0} rx={0.34} ry={0.26} fill={robot.color} opacity={0.14} />
          )}
          {/* Dust hose, off the back of the chassis to the extraction canister */}
          <path
            d={`M ${-robot.toolOffsetM - bodyW / 2} 0 q -0.55 -0.16 -0.95 0.02`}
            fill="none"
            stroke="#0f172a"
            strokeOpacity={0.4}
            strokeWidth={0.07}
            strokeLinecap="round"
          />
          {/* Chassis, trailing the drum by the published tool offset */}
          <rect
            x={-robot.toolOffsetM - bodyW / 2}
            y={-bodyH / 2}
            width={bodyW}
            height={bodyH}
            rx={0.12}
            fill="#0f172a"
          />
          {/* Planetary drum — the part that cuts, on the boundary itself */}
          <rect
            x={-0.07}
            y={-robot.workingWidthM / 2}
            width={0.14}
            height={robot.workingWidthM}
            rx={0.05}
            fill={robot.color}
          />
          {/* Travel direction */}
          <path
            d={`M ${-robot.toolOffsetM - 0.09} ${-0.09} L ${-robot.toolOffsetM + 0.05} 0 L ${-robot.toolOffsetM - 0.09} 0.09 Z`}
            fill="#ffffff"
            opacity={0.85}
          />
        </g>
      </svg>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border border-border-strong"
            style={{ background: priorColour }}
            aria-hidden="true"
          />
          Not yet cut this pass
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border border-border-strong"
            style={{ background: thisPassColour }}
            aria-hidden="true"
          />
          Cut at {grit} grit
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm border border-border-strong"
            style={{ background: robot.floor.active }}
            aria-hidden="true"
          />
          Under the drum
        </span>
        <span className="tabular-nums">
          {roomW.toFixed(1)} × {roomH.toFixed(1)} m · {laneCount} lanes ·{" "}
          {robot.workingWidthM.toFixed(2)} m drum,{" "}
          {Math.round(((robot.workingWidthM - laneH) / robot.workingWidthM) * 100)}% overlap
        </span>
      </figcaption>
      <p className="mt-2 text-xs text-muted-foreground">
        Room shown at a 4:3 proportion from the job&apos;s area — a real plan would come
        from the site scan. Lanes are spaced to tile that room, so the drum overlaps the
        previous pass rather than leaving a seam. Working width, tool offset and the
        boustrophedon path are the published{" "}
        <span className="font-medium text-foreground">{robot.name}</span> design targets,
        read from the same file the 3D simulator uses.
      </p>
    </figure>
  );
}
