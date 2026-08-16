import type { Metadata } from "next";
import PageSchema from "@/components/PageSchema";
import { pageAlternates } from "@/lib/discovery";
import WorkspaceShell from "@/components/WorkspaceShell";
import MoistureLog from "@/components/MoistureLog";
import {
  AMBIENT_RH_PCT,
  AMBIENT_TEMP_F,
  SLAB_MVER_MAX_LB,
  SLAB_RH_MAX_PCT,
  WOOD_DIFFERENTIAL_MAX_PCT,
} from "@/lib/moisture";

export const metadata: Metadata = {
  title: "Moisture & Readiness Log | FloorForge — Know Before You Sand",
  description:
    `A free jobsite readiness log for hardwood refinishing contractors. Checks subfloor and flooring ` +
    `moisture against the NWFA differential (${WOOD_DIFFERENTIAL_MAX_PCT.strip}% for strip, ` +
    `${WOOD_DIFFERENTIAL_MAX_PCT.plank}% for plank), concrete slabs against ASTM F2170 ` +
    `(${SLAB_RH_MAX_PCT}% RH) and ASTM F1869 (${SLAB_MVER_MAX_LB} lb), and jobsite conditions against ` +
    `${AMBIENT_TEMP_F.min}–${AMBIENT_TEMP_F.max} °F and ${AMBIENT_RH_PCT.min}–${AMBIENT_RH_PCT.max}% RH. ` +
    `Every limit is shown with the document it comes from. Works with no FloorForge hardware.`,
  alternates: pageAlternates("/moisture"),
};

/**
 * The tool that tells a contractor not to start.
 *
 * WHY IT IS WORTH BUILDING. Moisture is the dominant cause of hardwood finish
 * failure, and it is the dispute a contractor loses months later with nothing
 * written down. The other six tools help win and document work. This one is the
 * only one that can prevent the job — and the only one that produces evidence
 * on a day when nothing appears to be wrong.
 *
 * WHOSE NUMBERS. None of the thresholds are FloorForge's. They come from NWFA
 * installation guidance and the named ASTM test methods, and every one is
 * rendered beside the reading it judged, with its source, on screen and in
 * print. Where the guidance is regional — acceptable wood moisture content
 * depends on local equilibrium moisture content — lib/moisture.ts refuses to
 * score it rather than invent a national number, and says so in the row.
 *
 * This does not certify a floor and does not replace a test the standards
 * require a qualified person to run. It records what was measured, against what
 * limit, on what date.
 */
export default function MoisturePage() {
  return (
    <WorkspaceShell
      active="moisture"
      eyebrow="FREE TOOL · PUBLISHED INDUSTRY LIMITS"
      title="Know before you sand."
      intro={
        <>
          Subfloor and flooring moisture, slab readings, and the conditions in the room —
          checked against the published limits and written down with the date. Most
          callbacks start on a day when the floor looked fine.
        </>
      }
      note={
        <>
          Works with no FloorForge hardware. Every limit here is the industry&apos;s, not
          ours — NWFA installation guidance and the named ASTM test methods — and each one
          is printed beside the reading it judged so you can check it. FloorForge
          certifies nothing, and your flooring manufacturer&apos;s specification governs
          where it differs.
        </>
      }
    >
      <PageSchema
        page={{
          path: "/moisture",
          name: "Moisture & Readiness Log — know before you sand",
          description: String(metadata.description),
          crumb: "Moisture & readiness",
        }}
      />
      <MoistureLog />
    </WorkspaceShell>
  );
}
