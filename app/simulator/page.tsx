import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SimulatorLoader from "@/components/simulator/SimulatorLoader";
import { ROBOTS } from "@/lib/robots";

export const metadata: Metadata = {
  title: "Robot Simulator | FloorForge — Interactive Concept Demo",
  description:
    "Drive FloorForge's concept flooring robots across a virtual room: pick a platform, run a boustrophedon coverage pass, and watch live coverage and job-time estimates. An interactive concept simulation.",
  alternates: { canonical: "/simulator" },
};

export default function SimulatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="mb-8 max-w-2xl">
        <span className="mb-3 inline-block rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Interactive concept simulation
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Drive the robots across a virtual floor
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Pick one of {ROBOTS.length} FloorForge concept platforms, size the room,
          and run the job. You&apos;ll see the coverage path fill in real time,
          with live area and job-time estimates. These are design targets for
          hardware in development — a way to explore the workflow, not a record of
          completed jobs.
        </p>
      </div>

      <SimulatorLoader />

      {/* A 3D canvas is opaque to a screen reader and to every crawler. This is
          the text equivalent of what the simulation demonstrates — same figures
          as the visual, same honesty labelling (audit/FINDINGS.md §7).
          Visible to assistive technology and to a crawler; visually redundant
          beside the canvas, so it is not shown twice. */}
      <section aria-labelledby="sim-text-equivalent" className="sr-only">
        <h2 id="sim-text-equivalent">What the simulator shows</h2>
        <p>
          The simulation runs one FloorForge concept platform across a virtual
          room and fills in its coverage path in real time, reporting the area
          covered and an estimated job time as it goes.
        </p>
        <ul>
          {ROBOTS.map((r) => (
            <li key={r.id}>
              {r.name} — {r.role}. Runs a {r.pattern} coverage pattern at a
              design target of {r.coverageM2PerHour} square metres per hour.
            </li>
          ))}
        </ul>
        <p>
          Every figure here is a design target for hardware in development. The
          simulation is a way to explore how autonomous refinishing would run;
          it is not a record of a completed job and not measured field data.
        </p>
      </section>
    </div>
  );
}
