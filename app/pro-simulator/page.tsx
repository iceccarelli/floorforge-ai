import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info, Monitor } from "lucide-react";
import { getRobot } from "@/lib/robots";
import ProTeardownLoader from "@/components/simulator/ProTeardownLoader";

export const metadata: Metadata = {
  title: "Pro Simulator | FloorForge — High-Fidelity Mechanical Inspection",
  description:
    "High-fidelity concept teardown of FloorForge platforms: exploded views, cutaway cameras, animated gears/rotors/drums and realistic multi-grit passes. A pre-production inspection tool, not a shipping-hardware telemetry feed.",
  alternates: { canonical: "/pro-simulator" },
  robots: { index: false }, // gated tool; keep out of the index
};

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function ProSimulatorPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const robotId = first(sp.robot) ?? "sand";
  const roomW = first(sp.roomW) ?? "6";
  const roomL = first(sp.roomL) ?? "5";
  const robot = getRobot(robotId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/simulator"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to basic simulator
        </Link>
        <span className="rounded-full border border-accent/40 bg-accent-light px-3 py-1 text-xs font-medium text-foreground">
          Pro · high-fidelity concept inspection
        </span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {robot.name} — mechanical teardown
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Exploded views, cutaway cameras, and animated internals (gears, motor
        rotor, sanding drum, dust path). Loaded with your job:{" "}
        <span className="font-medium text-foreground">
          {roomW}×{roomL} m room
        </span>
        . This is a pre-production concept model for inspecting how the machine
        is designed to work — not telemetry from shipping hardware.
      </p>

      {/* live in-browser teardown (WebGL, no plugin, no download) */}
      <div className="mt-6">
        <ProTeardownLoader robotId={robotId} roomW={roomW} roomL={roomL} />
      </div>

      {/* honest context — no dead links */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Monitor className="h-4 w-4" /> Renders live in your browser
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This teardown runs on the same WebGL engine as the simulator — no
            plugin, no download. Drag to orbit, pull the exploded slider, and
            toggle the cutaway to see the drum, motor rotor and reduction gears.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info className="h-4 w-4" /> What you&apos;re looking at
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The geometry reflects how the {robot.name} is designed to operate.
            Dimensions, grit sequence and coverage figures are engineering
            targets for hardware in development — a way to inspect the mechanism,
            not a record of a completed job.
          </p>
        </div>
      </div>
    </div>
  );
}
