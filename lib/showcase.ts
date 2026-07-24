/**
 * Data for the "Autonomous Floor Refinishing Systems" showcase section.
 *
 * HONESTY NOTE (consistent with lib/robots.ts): every figure below is a
 * *design target* for FloorForge's concept platforms, not a measured spec
 * of shipping hardware. Numbers are kept in lockstep with ROBOTS in
 * lib/robots.ts so the showcase, the simulator, and the marketing copy all
 * tell the same story. The imagery shows the concept platforms operating
 * independently on hardwood; the UI labels them as concept renders.
 *
 * Images live in /public/showcase/01.png … 10.png (see the prepare step in
 * the deploy notes — they are unpacked from the committed
 * floorforge-ai_10_images.zip so they never bloat the git history twice).
 */

export interface ShowcaseSpec {
  label: string;
  value: string;
}

export interface ShowcaseItem {
  /** Stable id, also used for deep-grouping "Similar Views". */
  id: string;
  /** 1-indexed source frame → /showcase/0X.png */
  src: string;
  /** Card + modal heading. */
  title: string;
  /** Which concept platform is pictured (matches ROBOTS[].name). */
  platform: string;
  /** Group key — drives the "Similar Views" row in the lightbox. */
  group: "field-sanding" | "edge-detail" | "dust" | "finish" | "qa";
  /** Human label for the group (shown as the card eyebrow). */
  groupLabel: string;
  /** One-line card subtitle. */
  tagline: string;
  /** Precise, at-a-glance measurements (design targets). */
  specs: ShowcaseSpec[];
  /** Longer technical explanation shown in the lightbox. */
  detail: string;
  /** Optional ordered grit / pass sequence chips for the lightbox. */
  sequence?: string[];
}

export const SHOWCASE: ShowcaseItem[] = [
  {
    id: "field-open",
    src: "/showcase/01.png",
    title: "Autonomous field sanding",
    platform: "ForgeSand D1",
    group: "field-sanding",
    groupLabel: "Field sanding",
    tagline: "Open-floor abrasion, no operator on the drum.",
    specs: [
      { label: "Sanding width", value: "0.50 m" },
      { label: "Grit sequence", value: "36 → 180" },
      { label: "Dust capture", value: "98% HEPA (target)" },
      { label: "Coverage", value: "~55 m²/h" },
    ],
    sequence: ["36 · strip", "80 · level", "120 · finish", "180 · polish"],
    detail:
      "The D1 runs a boustrophedon field pass end-to-end on its own: load-sensing drum, species and moisture detection, and adaptive pressure holding the same cut across every lap. Pass overlap is planned from the digital twin so there are no witness lines where one lane meets the next.",
  },
  {
    id: "field-midcut",
    src: "/showcase/02.png",
    title: "Grit-sequence pass · mid-cut",
    platform: "ForgeSand D1",
    group: "field-sanding",
    groupLabel: "Field sanding",
    tagline: "Sequenced 36→180 abrasion at constant pressure.",
    specs: [
      { label: "Sanding width", value: "0.50 m" },
      { label: "Grit sequence", value: "36 → 180" },
      { label: "Pressure control", value: "closed-loop" },
      { label: "Coverage", value: "~55 m²/h" },
    ],
    sequence: ["36 · strip", "80 · level", "120 · finish", "180 · polish"],
    detail:
      "Between coarse strip and finish sand, the planetary head steps through the grit ladder without an operator swapping paper. Real-time load feedback trims speed on hard grain and dense knots so the surface leaves each lap a shade smoother than the last.",
  },
  {
    id: "field-clearance",
    src: "/showcase/03.png",
    title: "Low-profile door clearance",
    platform: "ForgeSand D1",
    group: "field-sanding",
    groupLabel: "Field sanding",
    tagline: "Sub-8″ envelope, designed to clear doorways.",
    specs: [
      { label: "Height envelope", value: "< 8 in (target)" },
      { label: "Sanding width", value: "0.50 m" },
      { label: "Turn radius", value: "in-place" },
      { label: "Coverage", value: "~55 m²/h" },
    ],
    detail:
      "The platform is designed to slip under a standard door slab and pivot in place, so a single machine covers connected rooms without being lifted or reset. The low body keeps the centre of mass over the drum for even contact on cupped boards.",
  },
  {
    id: "edge-perimeter",
    src: "/showcase/04.png",
    title: "Perimeter edge detail",
    platform: "ForgeEdge E1",
    group: "edge-detail",
    groupLabel: "Edge & detail",
    tagline: "Vision-guided edging where the drum can't reach.",
    specs: [
      { label: "Working width", value: "0.14 m" },
      { label: "Edge follow", value: "LiDAR + vision" },
      { label: "Mode", value: "human-oversight" },
      { label: "Coverage", value: "~18 m²/h" },
    ],
    detail:
      "The E1 hugs baseboards and transitions with an oscillating edge head, tracking the wall line by LiDAR and vision to hold a consistent gap. It runs semi-autonomously with a human-oversight mode for complex perimeters, minimising the hand-scraping that usually eats the schedule.",
  },
  {
    id: "edge-transition",
    src: "/showcase/05.png",
    title: "Transition & doorway edging",
    platform: "ForgeEdge E1",
    group: "edge-detail",
    groupLabel: "Edge & detail",
    tagline: "Thresholds, vents, and built-ins without rework.",
    specs: [
      { label: "Working width", value: "0.14 m" },
      { label: "Follow error", value: "sub-mm (target)" },
      { label: "Mode", value: "human-oversight" },
      { label: "Coverage", value: "~18 m²/h" },
    ],
    detail:
      "At thresholds and around vents the edge head slows and shortens its stroke, blending the perimeter cut into the field pass so the two never leave a step. The oversight operator confirms tricky details on-screen rather than kneeling on the floor.",
  },
  {
    id: "dust-head",
    src: "/showcase/06.png",
    title: "Cyclonic capture at the head",
    platform: "ForgeSand D1",
    group: "dust",
    groupLabel: "Dust containment",
    tagline: "Shrouded drum pulls dust at the point of cut.",
    specs: [
      { label: "Capture point", value: "at the drum" },
      { label: "Pre-separation", value: "cyclonic" },
      { label: "Filtration", value: "HEPA" },
      { label: "Capture (target)", value: "98%" },
    ],
    detail:
      "Dust is pulled at the point of contact by a shrouded head, then spun through cyclonic pre-separation before the HEPA stage so the fine filter loads slowly. The goal is a floor that can be sanded inside an occupied home without sheeting the furniture.",
  },
  {
    id: "dust-hepa",
    src: "/showcase/07.png",
    title: "HEPA extraction module",
    platform: "ForgeSand D1",
    group: "dust",
    groupLabel: "Dust containment",
    tagline: "Per-job airborne particulate, logged not promised.",
    specs: [
      { label: "Filtration", value: "HEPA" },
      { label: "Capture (target)", value: "98%" },
      { label: "Logging", value: "per-job PM" },
      { label: "Report", value: "airborne µg/m³" },
    ],
    detail:
      "The onboard module logs airborne particulate for the whole job, so dust performance shows up as a number on the report instead of a claim. That record is what lets a crew bid occupied-space work the competition has to turn down.",
  },
  {
    id: "finish-apply",
    src: "/showcase/08.png",
    title: "Finish application pass",
    platform: "ForgeCoat C1",
    group: "finish",
    groupLabel: "Finish application",
    tagline: "Even film build across the whole field.",
    specs: [
      { label: "Working width", value: "0.60 m" },
      { label: "Film build", value: "±5% (target)" },
      { label: "Modes", value: "T-bar / spray" },
      { label: "Coverage", value: "~75 m²/h" },
    ],
    sequence: ["Seal · wets grain", "Finish · builds film"],
    detail:
      "The C1 lays stain or polyurethane at a metered rate with live viscosity and ambient monitoring, targeting uniform sheen and film thickness edge-to-edge. Consistent wet-edge timing across the field is what removes the lap marks a rushed hand application leaves behind.",
  },
  {
    id: "finish-filmbuild",
    src: "/showcase/09.png",
    title: "Seal-to-topcoat film build",
    platform: "ForgeCoat C1",
    group: "finish",
    groupLabel: "Finish application",
    tagline: "Seal coat then topcoat, monitored for cure.",
    specs: [
      { label: "Working width", value: "0.60 m" },
      { label: "Passes", value: "seal + finish" },
      { label: "Sensing", value: "viscosity + ambient" },
      { label: "Coverage", value: "~75 m²/h" },
    ],
    sequence: ["Seal · wets grain", "Finish · builds film"],
    detail:
      "First a seal coat wets the grain, then the finish coat builds the film to target thickness while environmental sensors watch temperature and humidity against the coating's cure window. The result is a controlled build rather than a best-guess flood.",
  },
  {
    id: "qa-scan",
    src: "/showcase/10.png",
    title: "Flatness & coverage QA scan",
    platform: "ForgeScan S1",
    group: "qa",
    groupLabel: "Inspection & QA",
    tagline: "Sub-mm flatness map, before and after.",
    specs: [
      { label: "Sweep width", value: "0.80 m" },
      { label: "Flatness res.", value: "sub-mm (target)" },
      { label: "Output", value: "coverage QA map" },
      { label: "Coverage", value: "~220 m²/h" },
    ],
    detail:
      "At survey speed the S1 maps flatness before and after the job and confirms coverage, producing the QA map that ships with the finish and dust logs. That digital record is the sign-off a GC or property manager can file — proof the floor met spec, not a promise it did.",
  },
];

/** Items sharing a group, excluding the given id (for "Similar Views"). */
export const similarTo = (item: ShowcaseItem): ShowcaseItem[] =>
  SHOWCASE.filter((s) => s.group === item.group && s.id !== item.id);
