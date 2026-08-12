/**
 * Autonomous Floor Refinishing Systems — showcase data (v2, categorized).
 *
 * The full uploaded render library (78 usable frames across the eight source
 * batches; 2 corrupt frames dropped) is optimized to WebP and sorted into the
 * five FloorForge concept platforms. The `cat` on each frame is the ONLY thing
 * that decides where it appears — it is auto-derived from image analytics
 * (gloss / machine-mass / sharpness) plus directly-inspected frames, and is
 * meant to be adjusted by hand freely: to re-file a frame, change its `cat`.
 *
 * HONESTY NOTE (matches lib/robots.ts): all figures are DESIGN TARGETS for
 * concept platforms, not measured specs of shipping hardware. Images are
 * concept renders. Assets live in /public/showcase/gallery/<id>.webp.
 */

export type CatKey = "sand" | "edge" | "dust" | "finish" | "qa";

export interface ShowcaseSpec { label: string; value: string; }

export interface ShowcaseCategory {
  key: CatKey;
  label: string;
  platform: string;
  eyebrow: string;
  blurb: string;
  specs: ShowcaseSpec[];
  sequence?: string[];
}

export interface Frame {
  /** stable id = <set>-<frame>, e.g. "s04-07" -> /showcase/gallery/s04-07.webp */
  id: string;
  cat: CatKey;
}

export const CATEGORIES: ShowcaseCategory[] = [
  { key: "sand", label: "Field Sanding", platform: "ForgeSand D1", eyebrow: "Autonomous multi-grit sanding",
    blurb: "The flagship platform runs a full boustrophedon field pass on its own — load-sensing planetary drum, species and moisture detection, and adaptive pressure holding the same cut across every lap. Pass overlap is planned from the digital twin so no witness lines are left where lanes meet.",
    specs: [{ label: "Sanding width", value: "0.50 m" }, { label: "Grit sequence", value: "36 → 80 → 120" }, { label: "Dust capture", value: "98% HEPA (target)" }, { label: "Coverage", value: "~55 m²/h" }],
    sequence: ["36 · strip", "80 · level", "120 · finish"] },
  { key: "edge", label: "Edge & Perimeter", platform: "ForgeEdge E1", eyebrow: "Semi-autonomous edging",
    blurb: "Where the drum can't reach, the E1 hugs baseboards, thresholds and transitions with an oscillating edge head, tracking the wall line by LiDAR and vision to hold a consistent gap. It runs with a human-oversight mode for complex perimeters, cutting the hand-scraping that eats the schedule.",
    specs: [{ label: "Working width", value: "0.14 m" }, { label: "Edge follow", value: "LiDAR + vision" }, { label: "Mode", value: "human-oversight" }, { label: "Coverage", value: "~18 m²/h" }] },
  { key: "dust", label: "Dust Containment", platform: "ForgeSand D1", eyebrow: "Cyclonic + HEPA extraction",
    blurb: "Dust is pulled at the point of contact by a shrouded head, spun through cyclonic pre-separation, then held by the HEPA stage so the fine filter loads slowly. Per-job airborne particulate is logged — dust performance shows up as a number on the report, not a promise.",
    specs: [{ label: "Pre-separation", value: "cyclonic" }, { label: "Filtration", value: "HEPA" }, { label: "Capture (target)", value: "98%" }, { label: "Logging", value: "per-job PM" }] },
  { key: "finish", label: "Finish Application", platform: "ForgeCoat C1", eyebrow: "Even film-build coating",
    blurb: "The C1 lays stain or polyurethane at a metered rate with live viscosity and ambient monitoring — a seal coat wets the grain, then the finish coat builds the film to target thickness while sensors watch the cure window. Consistent wet-edge timing removes the lap marks a rushed hand pass leaves behind.",
    specs: [{ label: "Working width", value: "0.60 m" }, { label: "Film build", value: "±5% (target)" }, { label: "Modes", value: "T-bar / spray" }, { label: "Coverage", value: "~75 m²/h" }],
    sequence: ["Seal · wets grain", "Finish · builds film"] },
  { key: "qa", label: "Inspection & Result", platform: "ForgeScan S1", eyebrow: "Flatness & coverage QA",
    blurb: "At survey speed the S1 maps flatness before and after and confirms coverage, producing the QA map that ships with the finish and dust logs. The empty, evenly-lit floor is the deliverable a GC or property manager signs off — proof the floor met spec.",
    specs: [{ label: "Sweep width", value: "0.80 m" }, { label: "Flatness res.", value: "sub-mm (target)" }, { label: "Output", value: "coverage QA map" }, { label: "Coverage", value: "~220 m²/h" }] },
];

export const FRAMES: Frame[] = [
  { id: "s04-06", cat: "sand" }, { id: "s02-04", cat: "sand" }, { id: "s07-06", cat: "sand" },
  { id: "s05-04", cat: "sand" }, { id: "s08-03", cat: "sand" }, { id: "s03-02", cat: "sand" },
  { id: "s03-04", cat: "sand" }, { id: "s03-01", cat: "sand" }, { id: "s05-06", cat: "sand" },
  { id: "s02-01", cat: "sand" }, { id: "s08-07", cat: "sand" }, { id: "s01-02", cat: "sand" },
  { id: "s01-01", cat: "sand" }, { id: "s07-03", cat: "sand" }, { id: "s03-08", cat: "sand" },
  { id: "s04-02", cat: "sand" }, { id: "s04-01", cat: "sand" }, { id: "s07-04", cat: "sand" },
  { id: "s05-01", cat: "sand" }, { id: "s01-08", cat: "sand" }, { id: "s07-02", cat: "sand" },
  { id: "s02-09", cat: "sand" }, { id: "s02-03", cat: "sand" }, { id: "s02-10", cat: "sand" },
  { id: "s04-10", cat: "sand" }, { id: "s05-02", cat: "sand" }, { id: "s05-10", cat: "sand" },
  { id: "s01-10", cat: "sand" }, { id: "s06-10", cat: "sand" }, { id: "s08-08", cat: "sand" },
  { id: "s03-09", cat: "sand" }, { id: "s07-09", cat: "sand" }, { id: "s08-10", cat: "sand" },
  { id: "s03-03", cat: "edge" }, { id: "s05-08", cat: "edge" }, { id: "s08-01", cat: "edge" },
  { id: "s04-08", cat: "edge" }, { id: "s06-01", cat: "edge" }, { id: "s03-10", cat: "edge" },
  { id: "s07-10", cat: "edge" }, { id: "s05-03", cat: "dust" }, { id: "s03-06", cat: "dust" },
  { id: "s01-04", cat: "dust" }, { id: "s02-02", cat: "dust" }, { id: "s06-05", cat: "dust" },
  { id: "s04-03", cat: "dust" }, { id: "s07-01", cat: "dust" }, { id: "s01-09", cat: "dust" },
  { id: "s06-04", cat: "dust" }, { id: "s02-07", cat: "dust" }, { id: "s08-09", cat: "dust" },
  { id: "s06-09", cat: "dust" }, { id: "s08-06", cat: "finish" }, { id: "s08-05", cat: "finish" },
  { id: "s08-04", cat: "finish" }, { id: "s02-06", cat: "finish" }, { id: "s06-06", cat: "finish" },
  { id: "s04-05", cat: "finish" }, { id: "s04-04", cat: "finish" }, { id: "s04-07", cat: "finish" },
  { id: "s07-05", cat: "finish" }, { id: "s03-07", cat: "finish" }, { id: "s05-07", cat: "finish" },
  { id: "s07-07", cat: "finish" }, { id: "s02-08", cat: "finish" }, { id: "s01-06", cat: "qa" },
  { id: "s02-05", cat: "qa" }, { id: "s05-05", cat: "qa" }, { id: "s01-07", cat: "qa" },
  { id: "s03-05", cat: "qa" }, { id: "s01-03", cat: "qa" }, { id: "s01-05", cat: "qa" },
  { id: "s05-09", cat: "qa" }, { id: "s08-02", cat: "qa" }, { id: "s04-09", cat: "qa" },
  { id: "s06-07", cat: "qa" }, { id: "s07-08", cat: "qa" }, { id: "s06-08", cat: "qa" },
];

/** Frames chosen for the top "featured" swipe rail (sharpest, spread across categories). */
export const FEATURED: string[] = ["s04-06", "s03-03", "s05-03", "s08-06", "s01-06", "s02-04", "s05-08", "s03-06", "s08-05", "s02-05"];

export const frameSrc = (id: string): string => `/showcase/gallery/${id}.webp`;
export const categoryOf = (key: CatKey): ShowcaseCategory =>
  CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
export const framesInCat = (key: CatKey): Frame[] =>
  FRAMES.filter((f) => f.cat === key);
export const frameById = (id: string): Frame | undefined =>
  FRAMES.find((f) => f.id === id);
