"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { ArrowRight } from "lucide-react";
import FloorScene from "@/components/simulator/FloorScene";
import ControlPanel from "@/components/simulator/ControlPanel";
import MetricsHUD from "@/components/simulator/MetricsHUD";
import { getRobot } from "@/lib/robots";
import { useSim } from "@/lib/simStore";
import { Button } from "@/components/ui/button";

function hasWebGL(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Simulator() {
  // Client-only component (loaded with ssr:false), so window is available
  // at first render — lazy-init instead of a setState-in-effect.
  const [webgl] = useState(hasWebGL);
  const selectedId = useSim((s) => s.selectedId);
  const robot = getRobot(selectedId);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* left: controls (below the canvas on mobile, beside it on desktop) */}
      <aside className="order-2 rounded-2xl border border-border bg-muted/40 p-4 lg:order-none">
        <ControlPanel />
      </aside>

      {/* right: canvas + hud */}
      <div className="relative order-1 min-h-[360px] overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-[#f1f5f9] to-[#e2e8f0] sm:min-h-[440px] lg:order-none">
        {webgl ? (
          <>
            <MetricsHUD />
            <Canvas
              shadows
              dpr={[1, 1.75]}
              camera={{ position: [6, 6, 7], fov: 42 }}
              className="h-full w-full"
              aria-label={`3D simulation of the ${robot.name} covering a virtual hardwood floor`}
            >
              <color attach="background" args={["#eef2f6"]} />
              <Suspense fallback={null}>
                <FloorScene />
              </Suspense>
            </Canvas>
            <p className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-muted-foreground">
              Drag to orbit · scroll to zoom · right-drag to pan
            </p>
          </>
        ) : (
          <div className="flex h-full min-h-[360px] flex-col items-center justify-center p-8 text-center sm:min-h-[440px]">
            <p className="text-sm font-semibold text-foreground">
              3D view needs WebGL
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Your browser or device doesn&apos;t support the interactive canvas.
              The {robot.name} runs a {robot.pattern} coverage path at{" "}
              {robot.coverageM2PerHour} m²/h — reach out and we&apos;ll walk you
              through it.
            </p>
          </div>
        )}
      </div>

      {/* full-width honest CTA */}
      <div className="lg:col-span-2">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Want to see the {robot.name} concept applied to your real floor plan?
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              We&apos;re selecting pilot partners now. Tell us your job volume and
              we&apos;ll follow up — no automated sales pitch.
            </p>
          </div>
          <Button asChild variant="accent" className="shrink-0">
            <Link href={`/?interest=${encodeURIComponent(robot.name)}#waitlist`}>
              Join the pilot program <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
