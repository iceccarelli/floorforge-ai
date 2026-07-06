/**
 * FloorForge concept robot platform definitions.
 *
 * IMPORTANT (honesty): these are *concept / pre-production* platform
 * specs used to drive the interactive simulator. They describe the
 * envelope FloorForge is designing toward, consistent with the
 * "designed around / targeting" language used across the marketing
 * site. They are NOT claims that finished, shipping hardware exists.
 * The simulator UI labels them as concepts everywhere they appear.
 */

export type PathPattern = "boustrophedon" | "perimeter";

/**
 * How a machine visibly transforms the floor as it works:
 *  - base:   the floor's colour BEFORE this machine touches it
 *  - done:   the colour it leaves BEHIND once a spot is finished
 *  - active: the "hot" contact patch directly under the tool head right now
 * Chosen per machine so each pass reads like its real job: sanding reveals
 * fresh pale wood, coating lays a rich finish, install reveals planks over
 * bare subfloor, scanning leaves a QA tint rather than refinishing.
 */
export interface FloorTransform {
  base: string;
  done: string;
  active: string;
}

export interface RobotSpec {
  id: string;
  name: string;
  codename: string;
  role: string;
  task: string;
  /** Present-tense verb shown while the machine is running (HUD status). */
  jobVerb: string;
  /** Hex accent used for the robot body + UI dot. */
  color: string;
  floor: FloorTransform;
  /** Effective working width in metres (drives coverage + before/after). */
  workingWidthM: number;
  /** Forward distance from robot centre to the working head, in metres. */
  toolOffsetM: number;
  /** Travel speed in metres/second (drives animation + job-time math). */
  speedMps: number;
  /** Target sustained coverage rate, in m^2 per hour. */
  coverageM2PerHour: number;
  pattern: PathPattern;
  toolLabel: string;
  chips: { label: string; value: string }[];
}

export const ROBOTS: RobotSpec[] = [
  {
    id: "sand",
    name: "ForgeSand D1",
    codename: "D1",
    role: "Autonomous multi-grit sander",
    task: "Full-floor abrasion in sequenced grit passes at consistent pressure.",
    jobVerb: "Sanding",
    color: "#b45309",
    floor: { base: "#b39167", done: "#e7d4ac", active: "#fff3d2" },
    workingWidthM: 0.5,
    toolOffsetM: 0.28,
    speedMps: 0.25,
    coverageM2PerHour: 55,
    pattern: "boustrophedon",
    toolLabel: "Planetary drum \u00b7 36\u2192180 grit",
    chips: [
      { label: "Working width", value: "0.50 m" },
      { label: "Grit range", value: "36 \u2192 180" },
      { label: "Dust capture (target)", value: "98% HEPA" },
      { label: "Coverage", value: "~55 m\u00b2/h" },
    ],
  },
  {
    id: "edge",
    name: "ForgeEdge E1",
    codename: "E1",
    role: "Semi-autonomous edger",
    task: "Perimeter and transition sanding where the drum can't reach.",
    jobVerb: "Edging",
    color: "#0ea5e9",
    floor: { base: "#b39167", done: "#e7d4ac", active: "#e6f7ff" },
    workingWidthM: 0.14,
    toolOffsetM: 0.22,
    speedMps: 0.15,
    coverageM2PerHour: 18,
    pattern: "perimeter",
    toolLabel: "Oscillating edge head \u00b7 vision-guided",
    chips: [
      { label: "Working width", value: "0.14 m" },
      { label: "Edge follow", value: "LiDAR + vision" },
      { label: "Mode", value: "Human-oversight" },
      { label: "Coverage", value: "~18 m\u00b2/h" },
    ],
  },
  {
    id: "coat",
    name: "ForgeCoat C1",
    codename: "C1",
    role: "Finish applicator",
    task: "Even film-build application of stain / polyurethane across the field.",
    jobVerb: "Coating",
    color: "#15803d",
    floor: { base: "#e7d4ac", done: "#6f4320", active: "#c2853a" },
    workingWidthM: 0.6,
    toolOffsetM: 0.26,
    speedMps: 0.35,
    coverageM2PerHour: 75,
    pattern: "boustrophedon",
    toolLabel: "T-bar / spray \u00b7 live viscosity monitor",
    chips: [
      { label: "Working width", value: "0.60 m" },
      { label: "Film build (target)", value: "\u00b15%" },
      { label: "Modes", value: "T-bar / spray" },
      { label: "Coverage", value: "~75 m\u00b2/h" },
    ],
  },
  {
    id: "lay",
    name: "ForgeLay L1",
    codename: "L1",
    role: "Plank placement gantry",
    task: "Pick, align, and set planks row-by-row with nail/staple indexing.",
    jobVerb: "Installing",
    color: "#7c3aed",
    floor: { base: "#8f8b86", done: "#c4a06a", active: "#ffe1a6" },
    workingWidthM: 0.45,
    toolOffsetM: 0.24,
    speedMps: 0.18,
    coverageM2PerHour: 28,
    pattern: "boustrophedon",
    toolLabel: "Gantry gripper \u00b7 alignment vision",
    chips: [
      { label: "Row pitch", value: "0.45 m" },
      { label: "Alignment", value: "vision-indexed" },
      { label: "Fastening", value: "nail / staple" },
      { label: "Coverage", value: "~28 m\u00b2/h" },
    ],
  },
  {
    id: "scan",
    name: "ForgeScan S1",
    codename: "S1",
    role: "Inspection & flatness scanner",
    task: "Pre/post flatness mapping and coverage QA at survey speed.",
    jobVerb: "Scanning",
    color: "#0f172a",
    floor: { base: "#cdb187", done: "#bcd4dc", active: "#7fd8e6" },
    workingWidthM: 0.8,
    toolOffsetM: 0.0,
    speedMps: 0.6,
    coverageM2PerHour: 220,
    pattern: "boustrophedon",
    toolLabel: "LiDAR mast \u00b7 flatness map",
    chips: [
      { label: "Sweep width", value: "0.80 m" },
      { label: "Flatness res.", value: "sub-mm (target)" },
      { label: "Output", value: "coverage QA map" },
      { label: "Coverage", value: "~220 m\u00b2/h" },
    ],
  },
];

export const getRobot = (id: string): RobotSpec =>
  ROBOTS.find((r) => r.id === id) ?? ROBOTS[0];
