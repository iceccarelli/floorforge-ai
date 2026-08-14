"use client";

import React from "react";
import type { RobotSpec } from "@/lib/robots";
import { planFloor, pose, perimeterPose, laneDirection } from "@/lib/floorPlan";

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
  /** The sander. Defines the field, the lanes and the band it cannot reach. */
  robot: RobotSpec;
  /** The edger. Works the band the drum leaves at the wall. */
  edger: RobotSpec;
  /** Which machine is on the floor right now. */
  phase: "field" | "edge";
  /** Total floor area in m². */
  areaM2: number;
  /** 1-based index of the grit pass in progress. */
  pass: number;
  passCount: number;
  /** Progress through the CURRENT phase, 0–100. */
  passPct: number;
  grit: string;
  running: boolean;
}

export default function LiveFloorView({
  robot,
  edger,
  phase,
  areaM2,
  pass,
  passCount,
  passPct,
  grit,
  running,
}: FloorViewProps) {
  // Room, field, band, lane tiling and both machines' poses come from
  // lib/floorPlan.ts — the same module the 3D stage reads, so the two drawings
  // of this job on this page cannot put a machine in two different places.
  const plan = planFloor(areaM2, robot.workingWidthM, robot.edgeGapM ?? 0);
  const { roomW, roomH, fieldW, laneCount, laneH, overlap, inset } = plan;
  const edging = phase === "edge";
  // The machine on screen is whichever one is working.
  const active = edging ? edger : robot;
  const p = edging ? perimeterPose(plan, passPct) : pose(plan, passPct);
  const lanesDone = p.lane;
  const partial = p.laneProgress;

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

  const dirOf = laneDirection;
  const activeLane = p.lane;
  const dir = p.dir;
  const cutW = edging ? 0 : partial * fieldW;
  const cutX = inset + (dir === 1 ? 0 : fieldW - cutW);
  const headX = p.x;
  const headY = p.y;

  // The bright band is the floor the drum has just passed over — a short trail
  // behind the machine, not the whole span cut so far. It was the whole span,
  // under a legend that read "Under the drum", which said something the drawing
  // did not do. Everything further back has cooled to the pass colour.
  const trailW = Math.min(cutW, 1.4);
  const trailX = dir === 1 ? headX - trailW : headX;

  // The band, as a single stroked ring along its centreline. Drawing it as a
  // dash whose "on" length is the distance edged so far is what lets a partly
  // finished perimeter read correctly without four separate rectangles.
  const bh = inset / 2;
  const bandPathD =
    inset > 0
      ? `M ${bh} ${bh} L ${roomW - bh} ${bh} L ${roomW - bh} ${roomH - bh} L ${bh} ${roomH - bh} Z`
      : "";
  const bandLen = plan.bandPathM;
  const partialBand = edging ? Math.max(0, Math.min(1, passPct / 100)) : 0;

  const pad = 0.6;
  const vb = `${-pad} ${-pad} ${roomW + pad * 2} ${roomH + pad * 2}`;

  // Machine footprint, drawn to the same scale as the floor. The edger is a
  // much smaller machine and is drawn that way — its 0.14 m head is what lets
  // it reach a wall the 0.50 m drum cannot.
  const bodyW = edging ? 0.34 : 0.62;
  const bodyH = edging ? 0.30 : 0.46;

  return (
    <figure className="m-0">
      <svg
        viewBox={vb}
        className="block w-full rounded-xl border border-border-strong bg-muted"
        style={{ aspectRatio: `${roomW + pad * 2} / ${roomH + pad * 2}` }}
        role="img"
        aria-label={`Top-down view of a ${Math.round(areaM2)} square metre floor. ${
          edging ? `${edger.name} edging the perimeter` : `${robot.name} on the field`
        }, pass ${pass} of ${passCount} at ${grit} grit, ${Math.round(passPct)} percent of this phase complete.`}
      >
        {/* Floor as left by the previous pass */}
        <rect x={0} y={0} width={roomW} height={roomH} fill={priorColour} />

        {/* Lanes the drum finished in this grit pass. They stop at the field
            edge — the band at the wall is not the drum's to cut. */}
        {Array.from({ length: edging ? laneCount : lanesDone }).map((_, i) => (
          <rect
            key={i}
            x={inset}
            y={inset + i * laneH}
            width={fieldW}
            height={laneH}
            fill={thisPassColour}
          />
        ))}

        {/* The part of the current lane already cut */}
        {cutW > 0 && (
          <rect
            x={cutX}
            y={inset + activeLane * laneH}
            width={cutW}
            height={laneH}
            fill={thisPassColour}
          />
        )}

        {/* The perimeter band, as far as the edger has taken it this pass.
            Drawn as a clipped ring so a partly-edged floor reads correctly. */}
        {inset > 0 && edging && (
          <path
            d={bandPathD}
            fill="none"
            stroke={thisPassColour}
            strokeWidth={inset}
            strokeDasharray={`${bandLen * (partialBand)} ${bandLen}`}
          />
        )}

        {/* ...and the short trail immediately behind the drum */}
        {trailW > 0 && !edging && (
          <rect
            x={trailX}
            y={inset + activeLane * laneH}
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
              const y = inset + (i + 0.5) * laneH;
              const d = dirOf(i);
              return d === 1
                ? `M ${inset} ${y} L ${inset + fieldW} ${y}`
                : `M ${inset + fieldW} ${y} L ${inset} ${y}`;
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
            x1={inset}
            y1={inset + i * laneH}
            x2={inset + fieldW}
            y2={inset + i * laneH}
            stroke="#0f172a"
            strokeOpacity={0.06}
            strokeWidth={0.015}
          />
        ))}

        {/* The line the drum cannot cross. Everything outside it is the
            edger's, and saying so on the drawing is the whole point of this
            patch — the console used to show the drum sanding wall to wall. */}
        {inset > 0 && (
          <rect
            x={inset}
            y={inset}
            width={fieldW}
            height={plan.fieldH}
            fill="none"
            stroke={edger.color}
            strokeOpacity={0.55}
            strokeWidth={0.035}
            strokeDasharray="0.3 0.2"
          />
        )}

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
          stroke={active.color}
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
          {active.emitsDust && running && (
            /* Extraction plume at the point of contact. Decorative, and only
               while the head is turning — a static cloud reads as a defect. */
            <ellipse cx={0.06} cy={0} rx={0.34} ry={0.26} fill={active.color} opacity={0.14} />
          )}
          {/* Dust hose, off the back of the chassis to the extraction canister */}
          <path
            d={`M ${-active.toolOffsetM - bodyW / 2} 0 q -0.55 -0.16 -0.95 0.02`}
            fill="none"
            stroke="#0f172a"
            strokeOpacity={0.4}
            strokeWidth={0.07}
            strokeLinecap="round"
          />
          {/* Chassis, trailing the drum by the published tool offset */}
          <rect
            x={-active.toolOffsetM - bodyW / 2}
            y={-bodyH / 2}
            width={bodyW}
            height={bodyH}
            rx={0.12}
            fill="#0f172a"
          />
          {/* The head — the part that cuts, on the boundary itself. Drawn at
              the ACTIVE machine's working width, so the edger's 0.14 m head is
              visibly a quarter of the drum's 0.50 m. */}
          <rect
            x={-0.07}
            y={-active.workingWidthM / 2}
            width={0.14}
            height={active.workingWidthM}
            rx={0.05}
            fill={active.color}
          />
          {/* Travel direction */}
          <path
            d={`M ${-active.toolOffsetM - 0.09} ${-0.09} L ${-active.toolOffsetM + 0.05} 0 L ${-active.toolOffsetM - 0.09} 0.09 Z`}
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
          Under the head
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-0.5 rounded-sm"
            style={{ background: edger.color }}
            aria-hidden="true"
          />
          Drum&apos;s reach — outside it is {edger.codename}&apos;s
        </span>
        <span className="tabular-nums">
          {roomW.toFixed(1)} × {roomH.toFixed(1)} m · {laneCount} lanes ·{" "}
          {robot.workingWidthM.toFixed(2)} m drum, {Math.round(overlap * 100)}% overlap
        </span>
      </figcaption>
      <p className="mt-2 text-xs text-muted-foreground">
        Room shown at a 4:3 proportion from the job&apos;s area — a real plan would come
        from the site scan. The dashed line is how close the{" "}
        <span className="font-medium text-foreground">{robot.name}</span> can get to a
        wall ({((robot.edgeGapM ?? 0) * 100).toFixed(0)} cm): it reaches{" "}
        <span className="font-medium text-foreground">
          {plan.fieldAreaM2.toFixed(0)} m²
        </span>{" "}
        of this floor, and the{" "}
        <span className="font-medium text-foreground">{plan.bandAreaM2.toFixed(1)} m²</span>{" "}
        band outside it is what the{" "}
        <span className="font-medium text-foreground">{edger.name}</span> is for. Working
        widths, tool offsets and both paths are the published design targets, read from
        the same file the 3D simulator uses.
      </p>
    </figure>
  );
}
