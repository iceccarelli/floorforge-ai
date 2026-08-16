import type { Metadata } from "next";
import PageSchema from "@/components/PageSchema";
import { pageAlternates } from "@/lib/discovery";
import WorkspaceShell from "@/components/WorkspaceShell";
import LiveJobConsole from "@/components/LiveJobConsole";
import { getRobot } from "@/lib/robots";

const SAND = getRobot("sand");
const EDGE = getRobot("edge");
const GAP_CM = Math.round((SAND.edgeGapM ?? 0) * 100);

export const metadata: Metadata = {
  title: "Live Job Console | FloorForge — Watch Two Machines Finish a Floor",
  description:
    `A simulated ${SAND.name} cuts the open field and a simulated ${EDGE.name} cuts the ` +
    `${GAP_CM} cm band at the wall the drum cannot reach, alternating once per grit. Both emit ` +
    "telemetry in the exact shape the firmware contract specifies, and the finished run writes " +
    "field and perimeter coverage into the completion report as separate figures. No hardware is " +
    "connected; the data path is real.",
  alternates: pageAlternates("/live"),
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
 *
 * COPY DRIFT, corrected here. FLOORFORGE_30 made this a two-machine run — the
 * D1 works the field, parks, and the E1 cuts the band the drum physically
 * cannot reach, alternating once per grit — and the report started carrying
 * field and perimeter coverage as separate, separately attributed figures. The
 * stage, the HUD and the status chip were all updated to follow whichever
 * machine is actually cutting. This page's own headline, intro and description
 * were not: they still announced a single D1 running the whole floor. The page
 * was therefore understating what it does and contradicting public/llms.txt,
 * which has described the two-machine run since FLOORFORGE_37. Machine names,
 * and the gap that is the entire reason a second machine exists, are read from
 * lib/robots.ts here rather than typed, so this cannot drift again silently.
 */
export default function LivePage() {
  return (
    <WorkspaceShell
      active="live"
      eyebrow="FREE TOOL · SIMULATED MACHINES"
      title="Two machines. One floor. Every event accounted for."
      intro={
        <>
          A simulated {SAND.name} cuts the open field. It parks, and a simulated{" "}
          {EDGE.name} cuts the {GAP_CM} cm band at the wall a drum physically cannot
          reach. They alternate once per grit, reporting pressure, dust and coverage the
          whole way — and the finished run hands the completion report field coverage and
          perimeter coverage as two figures, each attributed to the machine that earned
          it.
        </>
      }
      note={
        <>
          No FloorForge machine has refinished a floor, and none is connected here.
          Neither the {SAND.codename} nor the {EDGE.codename} has been built. The numbers
          are generated from the design targets published elsewhere on this site. What is
          real is the shape of the data — the same events, envelope and cadences the
          firmware contract specifies.
        </>
      }
    >
      <PageSchema
        page={{
          path: "/live",
          name: "Live Job Console — a simulated two-machine job",
          description: String(metadata.description),
          crumb: "Live job console",
        }}
      />
      <LiveJobConsole />
    </WorkspaceShell>
  );
}
