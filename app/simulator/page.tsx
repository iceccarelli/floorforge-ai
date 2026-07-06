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
    </div>
  );
}
