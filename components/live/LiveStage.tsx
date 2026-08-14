"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Camera, Compass, Move3d, Box } from "lucide-react";
import LiveFloorView from "@/components/LiveFloorView";
import type { CameraMode } from "@/components/live/LiveScene3D";
import { useCanvasActive } from "@/lib/useCanvasActive";
import type { RobotSpec } from "@/lib/robots";

/**
 * The stage: a 3D view of the job, a plan view beside it, and every route by
 * which the 3D view might not be available.
 *
 * The two views are not alternatives, they answer different questions. The
 * scene shows what the machine is and how it works; the plan shows how much of
 * the floor is done and where the machine is in it — which no chase camera can
 * tell you, because it is looking at one lane. Watching a job you want both,
 * which is why every telemetry product ships a map next to the video.
 *
 * FALLBACKS, in the order they are checked:
 *  - no WebGL (old device, hardened browser, GPU blocklist) -> plan view alone
 *  - prefers-reduced-motion -> scene still renders, but the camera stops
 *    drifting and the dust stops moving. Nothing is hidden: a user who asked
 *    for less motion asked for less motion, not less information.
 *  - printing -> the plan view, because a canvas prints as a blank rectangle.
 * The 3D bundle is a dynamic ssr:false import, so a visitor who never scrolls
 * to it never downloads three.js.
 */

const Scene = dynamic(() => import("@/components/live/LiveScene3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <span className="text-sm text-muted-foreground">Loading the 3D view…</span>
    </div>
  ),
});

function hasWebGL(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Coarse pointer + limited memory: drop shadows and DPR rather than the view. */
function lowPower(): boolean {
  if (typeof window === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return (mem !== undefined && mem <= 4) || coarse;
}

const CAMERAS: { key: CameraMode; label: string; icon: typeof Camera }[] = [
  { key: "chase", label: "Follow", icon: Camera },
  { key: "overhead", label: "Overhead", icon: Compass },
  { key: "free", label: "Free look", icon: Move3d },
];

export interface LiveStageProps {
  robot: RobotSpec;
  areaM2: number;
  pass: number;
  passCount: number;
  passPct: number;
  grit: string;
  running: boolean;
}

export default function LiveStage(props: LiveStageProps) {
  const { robot, areaM2, pass, passCount, passPct, grit, running } = props;
  // Client-only component (dynamic ssr:false below the fold), so these can be
  // lazy-initialised instead of set from an effect.
  const [webgl] = useState(hasWebGL);
  const [calm] = useState(prefersReducedMotion);
  const [low] = useState(lowPower);
  const [camera, setCamera] = useState<CameraMode>("chase");
  const { ref: stageRef, active } = useCanvasActive<HTMLDivElement>();

  const plan = (
    <LiveFloorView
      robot={robot}
      areaM2={areaM2}
      pass={pass}
      passCount={passCount}
      passPct={passPct}
      grit={grit}
      running={running}
    />
  );

  if (!webgl) {
    return (
      <div>
        <p className="mb-4 rounded-lg border border-border-strong bg-muted px-4 py-3 text-sm text-muted-foreground">
          Your browser has WebGL turned off, so the 3D view can&apos;t run here. The plan
          below is the same job, from above, and updates identically.
        </p>
        {plan}
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
      <div className="min-w-0">
        <div
          ref={stageRef}
          className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border-strong bg-muted print:hidden"
        >
          <Scene
            robot={robot}
            areaM2={areaM2}
            pass={pass}
            passPct={passPct}
            running={running}
            camera={camera}
            calm={calm}
            quality={low ? "low" : "high"}
            active={active}
          />

          {/* HUD. Reads the same snapshot as everything else on the page — it
              is a caption on the picture, not a second source of truth.

              The chips are OPAQUE. They were translucent for a glass look, and
              bg-accent/90 blended to #bb6421 against the light loading
              placeholder: white on that is 4.23:1, under AA. It only appeared
              in the few hundred milliseconds before the 3D chunk resolved,
              which made it an intermittent axe failure and would have made it
              a bug nobody could reproduce. Opaque, the chip carries its own
              guaranteed contrast (5.02:1 on --accent) no matter what is
              rendered behind it — which for a chip floating over a live 3D
              scene is the only defensible way to build it. */}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white">
              {robot.name}
            </span>
            <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white tabular-nums">
              Pass {pass}/{passCount} · {grit} grit
            </span>
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white">
              {running ? robot.jobVerb : "Paused"}
            </span>
          </div>
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-white">
            Simulated · no hardware connected
          </span>
        </div>

        {/* Camera. Buttons, not tabs — they change the view, not the document.
            role="radiogroup" is the honest control pattern for one-of-N. */}
        <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground">
            CAMERA
          </span>
          <div role="radiogroup" aria-label="Camera view" className="flex flex-wrap gap-1.5">
            {CAMERAS.map((c) => {
              const Icon = c.icon;
              const on = camera === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCamera(c.key)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    on
                      ? "border-accent bg-accent-light text-accent"
                      : "border-border-strong text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {c.label}
                </button>
              );
            })}
          </div>
          {calm && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Box className="h-3.5 w-3.5" aria-hidden="true" />
              Reduced motion on — camera and dust are held still.
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0">{plan}</div>
    </div>
  );
}
