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

export interface RobotSpec {
  id: string;
  name: string;
  codename: string;
  role: string;
  /** One-line description of the repetitive task it targets. */
  task: string;
  /** Hex accent used for the robot body + processed-floor tint. */
  color: string;
  /** Effective working width in metres (drives coverage + before/after). */
  workingWidthM: number;
  /** Travel speed in metres/second (drives animation + job-time math). */
  speedMps: number;
  /** Target sustained coverage rate, in m^2 per hour. */
  coverageM2PerHour: number;
  /** Coverage path the planner should generate for this platform. */
  pattern: PathPattern;
  /** Short label for the active tool head shown in the HUD. */
  toolLabel: string;
  /** 2-4 headline specs shown as chips. label + value already formatted. */
  chips: { label: string; value: string }[];
}

export const ROBOTS: RobotSpec[] = [
  {
    id: "sand",
    name: "ForgeSand D1",
    codename: "D1",
    role: "Autonomous multi-grit sander",
    task: "Full-floor abrasion in sequenced grit passes at consistent pressure.",
    color: "#b45309",
    workingWidthM: 0.5,
    speedMps: 0.25,
    coverageM2PerHour: 55,
    pattern: "boustrophedon",
    toolLabel: "Planetary drum · 36→180 grit",
    chips: [
      { label: "Working width", value: "0.50 m" },
      { label: "Grit range", value: "36 → 180" },
      { label: "Dust capture (target)", value: "98% HEPA" },
      { label: "Coverage", value: "~55 m²/h" },
    ],
  },
  {
    id: "edge",
    name: "ForgeEdge E1",
    codename: "E1",
    role: "Semi-autonomous edger",
    task: "Perimeter and transition sanding where the drum can't reach.",
    color: "#0ea5e9",
    workingWidthM: 0.14,
    speedMps: 0.15,
    coverageM2PerHour: 18,
    pattern: "perimeter",
    toolLabel: "Oscillating edge head · vision-guided",
    chips: [
      { label: "Working width", value: "0.14 m" },
      { label: "Edge follow", value: "LiDAR + vision" },
      { label: "Mode", value: "Human-oversight" },
      { label: "Coverage", value: "~18 m²/h" },
    ],
  },
  {
    id: "coat",
    name: "ForgeCoat C1",
    codename: "C1",
    role: "Finish applicator",
    task: "Even film-build application of stain / polyurethane across the field.",
    color: "#15803d",
    workingWidthM: 0.6,
    speedMps: 0.35,
    coverageM2PerHour: 75,
    pattern: "boustrophedon",
    toolLabel: "T-bar / spray · live viscosity monitor",
    chips: [
      { label: "Working width", value: "0.60 m" },
      { label: "Film build (target)", value: "±5%" },
      { label: "Modes", value: "T-bar / spray" },
      { label: "Coverage", value: "~75 m²/h" },
    ],
  },
  {
    id: "lay",
    name: "ForgeLay L1",
    codename: "L1",
    role: "Plank placement gantry",
    task: "Pick, align, and set planks row-by-row with nail/staple indexing.",
    color: "#7c3aed",
    workingWidthM: 0.45,
    speedMps: 0.18,
    coverageM2PerHour: 28,
    pattern: "boustrophedon",
    toolLabel: "Gantry gripper · alignment vision",
    chips: [
      { label: "Row pitch", value: "0.45 m" },
      { label: "Alignment", value: "vision-indexed" },
      { label: "Fastening", value: "nail / staple" },
      { label: "Coverage", value: "~28 m²/h" },
    ],
  },
  {
    id: "scan",
    name: "ForgeScan S1",
    codename: "S1",
    role: "Inspection & flatness scanner",
    task: "Pre/post flatness mapping and coverage QA at survey speed.",
    color: "#0f172a",
    workingWidthM: 0.8,
    speedMps: 0.6,
    coverageM2PerHour: 220,
    pattern: "boustrophedon",
    toolLabel: "LiDAR mast · flatness map",
    chips: [
      { label: "Sweep width", value: "0.80 m" },
      { label: "Flatness res.", value: "sub-mm (target)" },
      { label: "Output", value: "coverage QA map" },
      { label: "Coverage", value: "~220 m²/h" },
    ],
  },
];

export const getRobot = (id: string): RobotSpec =>
  ROBOTS.find((r) => r.id === id) ?? ROBOTS[0];
