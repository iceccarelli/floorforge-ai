import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Info } from "lucide-react";
import { getRobot } from "@/lib/robots";

export const metadata: Metadata = {
  title: "Pro Simulator | FloorForge — High-Fidelity Mechanical Inspection",
  description:
    "High-fidelity concept teardown of FloorForge platforms: exploded views, cutaway cameras, animated gears/rotors/drums and realistic multi-grit passes. A pre-production inspection tool, not a shipping-hardware telemetry feed.",
  alternates: { canonical: "/pro-simulator" },
  robots: { index: false }, // gated tool; keep out of the index
};

// The Godot 4 web build (single-threaded, so NO COOP/COEP headers needed) is
// exported into /public/pro-sim/. Same-origin iframe => Godot reads its own
// query string via JavaScriptBridge (see JobParams.gd).
const GODOT_BUILD = "/pro-sim/index.html";

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

  const frameParams = new URLSearchParams({
    robot: robotId,
    roomW,
    roomL,
    target: "web",
  });
  const frameSrc = `${GODOT_BUILD}?${frameParams.toString()}`;

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

      {/* Godot web player (single-threaded build => no special headers) */}
      <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
        <iframe
          src={frameSrc}
          title={`FloorForge Pro Simulator — ${robot.name}`}
          className="h-full w-full"
          allow="autoplay; fullscreen; cross-origin-isolated"
          // sandbox kept permissive enough for WASM + pointer lock; tighten as needed
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen"
        />
      </div>

      {/* desktop downloads */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Download className="h-4 w-4" /> Desktop build (max fidelity)
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Native executables run heavier physics and higher-poly internals than
            the browser build.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent-light"
              href="/pro-sim/downloads/floorforge-pro-sim-win.zip"
            >
              Windows (.zip)
            </a>
            <a
              className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent-light"
              href="/pro-sim/downloads/floorforge-pro-sim-linux.zip"
            >
              Linux (.zip)
            </a>
            <a
              className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent-light"
              href="/pro-sim/downloads/floorforge-pro-sim-mac.zip"
            >
              macOS (.zip)
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info className="h-4 w-4" /> Setup note
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The player loads from <code>/public/pro-sim/</code>. Export the Godot
            project (single-threaded web preset) there and this page goes live —
            no server header changes required.
          </p>
        </div>
      </div>
    </div>
  );
}
