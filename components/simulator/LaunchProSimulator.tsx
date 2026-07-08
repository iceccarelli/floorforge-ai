"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowUpRight, Lock } from "lucide-react";
import { useSim } from "@/lib/simStore";
import { Button } from "@/components/ui/button";

/**
 * Premium upsell: launches the high-fidelity Godot "Pro Simulator" and passes
 * the current job parameters through the URL. The Godot build reads these via
 * JavaScriptBridge (see the Godot project's JobParams.gd).
 *
 * Positioning (honest): the Pro Simulator is a high-fidelity *concept*
 * teardown + inspection tool for pre-production hardware — not a telemetry
 * feed from a shipping machine. Same framing as the rest of the site.
 *
 * Gating: pass `locked` (e.g. from a Clerk entitlement / plan check) to show
 * the pilot-partner lock state instead of the live launch button.
 */
export default function LaunchProSimulator({
  locked = false,
}: {
  locked?: boolean;
}) {
  const selectedId = useSim((s) => s.selectedId);
  const roomW = useSim((s) => s.roomW);
  const roomL = useSim((s) => s.roomL);

  // Job params handed to the Godot build. Keep keys stable — JobParams.gd
  // parses exactly these.
  const params = new URLSearchParams({
    robot: selectedId,
    roomW: String(roomW),
    roomL: String(roomL),
    // "web" | "desktop" hint so the Godot UI can adapt density of controls
    target: "web",
  });
  const href = `/pro-simulator?${params.toString()}`;

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-accent/40 bg-gradient-to-br from-accent-light/60 to-card p-5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            High-Fidelity Pro Simulator
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Pro
            </span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Full mechanical teardown of this platform — every gear, motor rotor,
            drum, belt and the dust path — with exploded views, cutaway cameras
            and realistic multi-grit passes. Opens with your current job loaded.
          </p>
        </div>
      </div>

      {locked ? (
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/?interest=Pro%20Simulator#waitlist">
              <Lock className="h-4 w-4" /> Pilot partners only
            </Link>
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Included with pilot onboarding
          </span>
        </div>
      ) : (
        <Button asChild variant="accent" className="shrink-0">
          <Link href={href}>
            Launch Pro Simulator <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
