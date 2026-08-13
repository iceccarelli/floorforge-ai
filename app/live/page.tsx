import type { Metadata } from "next";
import WorkspaceShell from "@/components/WorkspaceShell";
import LiveJobConsole from "@/components/LiveJobConsole";

export const metadata: Metadata = {
  title: "Live Job Console | FloorForge — Watch a Simulated D1 Run a Floor",
  description:
    "A simulated ForgeSand D1 runs a multi-grit job and emits telemetry in the exact shape the firmware contract specifies, then fills in the completion report from what it emitted. No hardware is connected; the data path is real.",
  alternates: { canonical: "/live" },
};

/**
 * The demonstration that closes the loop.
 *
 * The completion report tells contractors three of its fields are "auto later",
 * filled from telemetry when hardware exists. Until now that was a promise the
 * site could not show. This runs it: a simulated machine emits contract-shaped
 * events, the console consumes them, and the finished run writes those exact
 * fields into the job's report.
 *
 * The machine is simulated and the page says so twice — in the note above the
 * console and in lib/simulation.ts. What is NOT simulated is the data path: the
 * event vocabulary, the envelope and the cadences are the ones in
 * SOFTWARE_HARDWARE_CONTRACT.md and lib/types.ts, which is what makes this a
 * demonstration rather than an animation.
 */
export default function LivePage() {
  return (
    <WorkspaceShell
      active="live"
      eyebrow="FREE TOOL · SIMULATED MACHINE"
      title="Watch a D1 run the floor."
      intro={
        <>
          A simulated ForgeSand D1 works through the grit sequence for your job, reporting
          pressure, dust and coverage the whole way — then hands the results to the
          completion report.
        </>
      }
      note={
        <>
          No FloorForge machine has refinished a floor, and none is connected here. The
          numbers are generated from the design targets published elsewhere on this site.
          What is real is the shape of the data — the same events, envelope and cadences
          the firmware contract specifies.
        </>
      }
    >
      <LiveJobConsole />
    </WorkspaceShell>
  );
}
