/**
 * Jobsite moisture and readiness — the check that decides whether a floor
 * should be touched at all.
 *
 * WHY THIS TOOL EXISTS. Every other tool here helps a contractor plan, price
 * and document work. This one tells them when not to start. Moisture is the
 * dominant cause of hardwood finish failure — cupping, crowning, gaps,
 * delamination, adhesive failure — and it is the argument a contractor has to
 * win months later when a homeowner points at a cupped board. A reading taken
 * on the day, written down, against a published threshold, is the difference
 * between a warranty claim and a conversation.
 *
 * WHOSE NUMBERS THESE ARE. Not FloorForge's. Every threshold below is published
 * industry guidance with its source recorded next to it, and the source is
 * shown to the user beside the verdict. FloorForge has measured none of this
 * and is not a party to it. Where the flooring manufacturer's own specification
 * differs, the manufacturer wins — that is stated in the UI, not buried here.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not certify a floor, it does not
 * replace a test the standards require a qualified person to run, and it does
 * not invent a threshold for a case the standards do not cover. Where guidance
 * is regional — acceptable wood moisture content depends on local equilibrium
 * moisture content and has no single correct value — this tool refuses to
 * assert one and says why.
 */

export type SubfloorKind = "wood" | "concrete";
/** ASTM F2170 in-situ relative humidity, or ASTM F1869 calcium chloride. */
export type ConcreteMethod = "rh" | "mver";
/** NWFA splits the wood differential at 3 inches of face width. */
export type FlooringWidth = "strip" | "plank";

export interface MoistureInputs {
  subfloor: SubfloorKind;

  /** Wood subfloor moisture content, %. */
  subfloorMcPct: number;
  /** Delivered flooring moisture content, %. */
  flooringMcPct: number;
  width: FlooringWidth;

  concreteMethod: ConcreteMethod;
  /** ASTM F2170 in-situ RH reading, %. */
  slabRhPct: number;
  /** ASTM F1869 MVER, lb per 1,000 sq ft per 24 h. */
  slabMverLb: number;

  /** Ambient conditions at the time of the reading. */
  ambientTempF: number;
  ambientRhPct: number;

  /** Job area, for the F2170 test-location count. */
  sqft: number;
}

export const DEFAULT_MOISTURE: MoistureInputs = {
  subfloor: "wood",
  subfloorMcPct: 9,
  flooringMcPct: 7,
  width: "strip",
  concreteMethod: "rh",
  slabRhPct: 70,
  slabMverLb: 2.5,
  ambientTempF: 70,
  ambientRhPct: 40,
  sqft: 1200,
};

/* ------------------------------------------------------------- thresholds */

/**
 * Published limits, each with the document it comes from.
 *
 * These strings are rendered next to the verdict. A contractor should be able
 * to check every number this tool asserts without taking our word for it, and
 * a homeowner reading the completion report should see whose rule was applied.
 */
export const SOURCES = {
  nwfaDifferential:
    "NWFA Installation Guidelines — solid strip under 3 in.: subfloor no more than 4% above the flooring; solid plank 3 in. and wider: no more than 2%.",
  nwfaAmbient:
    "NWFA Installation Guidelines — acclimate and install at normal living conditions, 60–80 °F and 30–50% relative humidity for most areas.",
  astmF2170:
    "ASTM F2170 — in-situ relative humidity in the slab at or below 75%. Three test locations for the first 1,000 sq ft, one more for each additional 1,000. Every location must pass, not the average.",
  astmF1869:
    "ASTM F1869 — calcium chloride moisture vapour emission at or below 3 lb per 1,000 sq ft per 24 h. Every location must pass, not the average.",
  regional:
    "NWFA — acceptable wood moisture content is regional: flooring should be within about 4% of the average environmental conditions for the area, so no single target percentage is correct everywhere.",
} as const;

export const WOOD_DIFFERENTIAL_MAX_PCT = { strip: 4, plank: 2 } as const;
export const SLAB_RH_MAX_PCT = 75;
export const SLAB_MVER_MAX_LB = 3;
export const AMBIENT_TEMP_F = { min: 60, max: 80 } as const;
export const AMBIENT_RH_PCT = { min: 30, max: 50 } as const;

/** ASTM F2170: three for the first 1,000 sq ft, one per additional 1,000. */
export function requiredSlabTestLocations(sqft: number): number {
  if (!(sqft > 0)) return 0;
  return 3 + Math.max(0, Math.ceil(sqft / 1000) - 1);
}

/* ---------------------------------------------------------------- verdict */

export type CheckStatus = "pass" | "fail" | "watch" | "na";

export interface Check {
  key: string;
  label: string;
  /** What was measured, already formatted. */
  reading: string;
  /** The published limit, already formatted. */
  limit: string;
  status: CheckStatus;
  /** Why it landed where it did, in the contractor's language. */
  note: string;
  /** The document the limit comes from. Rendered with the check. */
  source: string;
}

export interface Readiness {
  checks: Check[];
  /** True only if no check failed. Never means "certified". */
  clear: boolean;
  failing: number;
  watching: number;
}

const fmt = (n: number, d = 1) =>
  Number.isFinite(n) ? n.toFixed(d).replace(/\.0$/, "") : "—";

export function assessReadiness(i: MoistureInputs): Readiness {
  const checks: Check[] = [];

  if (i.subfloor === "wood") {
    const limit = WOOD_DIFFERENTIAL_MAX_PCT[i.width];
    // NWFA's rule is directional: the subfloor must not be more than N% ABOVE
    // the flooring. A subfloor drier than the flooring is not a violation of
    // that sentence, but it is not nothing either — the flooring will give up
    // moisture and shrink — so it is surfaced as a watch rather than silently
    // passed or wrongly failed.
    const diff = i.subfloorMcPct - i.flooringMcPct;
    checks.push({
      key: "differential",
      label: `Subfloor vs flooring moisture (${i.width === "strip" ? "strip, under 3 in." : "plank, 3 in. and wider"})`,
      reading: `${fmt(i.subfloorMcPct)}% subfloor − ${fmt(i.flooringMcPct)}% flooring = ${diff >= 0 ? "+" : ""}${fmt(diff)}%`,
      limit: `subfloor no more than ${limit}% above flooring`,
      status: diff > limit ? "fail" : diff < -limit ? "watch" : "pass",
      note:
        diff > limit
          ? `The subfloor is ${fmt(diff - limit)}% wetter than this width allows. Installing now is the classic cupping failure.`
          : diff < -limit
            ? `The subfloor is drier than the flooring by more than ${limit}%. Not what the differential rule prohibits, but the flooring will lose moisture and shrink — worth recording.`
            : "Within the published differential for this width.",
      source: SOURCES.nwfaDifferential,
    });

    checks.push({
      key: "regional",
      label: "Flooring moisture content",
      reading: `${fmt(i.flooringMcPct)}%`,
      limit: "no universal target — regional",
      status: "na",
      note:
        "Deliberately not scored. Acceptable moisture content depends on the equilibrium moisture content where the floor lives, so a pass/fail here would be invented. Compare against your area's average and the manufacturer's specification.",
      source: SOURCES.regional,
    });
  } else {
    const locations = requiredSlabTestLocations(i.sqft);
    if (i.concreteMethod === "rh") {
      checks.push({
        key: "slab-rh",
        label: "Slab in-situ relative humidity",
        reading: `${fmt(i.slabRhPct)}% RH`,
        limit: `at or below ${SLAB_RH_MAX_PCT}% RH`,
        status: i.slabRhPct > SLAB_RH_MAX_PCT ? "fail" : "pass",
        note:
          i.slabRhPct > SLAB_RH_MAX_PCT
            ? "Above the limit. The slab needs to dry, or the assembly needs a moisture barrier rated for this reading."
            : "Within the limit at this location.",
        source: SOURCES.astmF2170,
      });
    } else {
      checks.push({
        key: "slab-mver",
        label: "Slab moisture vapour emission",
        reading: `${fmt(i.slabMverLb, 2)} lb / 1,000 sq ft / 24 h`,
        limit: `at or below ${SLAB_MVER_MAX_LB} lb`,
        status: i.slabMverLb > SLAB_MVER_MAX_LB ? "fail" : "pass",
        note:
          i.slabMverLb > SLAB_MVER_MAX_LB
            ? "Above the limit. The slab needs to dry, or the assembly needs a moisture barrier rated for this reading."
            : "Within the limit at this location.",
        source: SOURCES.astmF1869,
      });
    }
    checks.push({
      key: "locations",
      label: "Test locations required",
      reading: `${i.sqft.toLocaleString()} sq ft`,
      limit: `${locations} location${locations === 1 ? "" : "s"}`,
      // Not scorable from one reading, and saying "pass" on a single number
      // would be the most dangerous thing this tool could do: the standard is
      // explicit that every location must pass, not the average.
      status: "na",
      note: `This tool holds one reading. The standard wants ${locations} for this area, and every one of them has to pass on its own — an average that clears the limit is not a pass.`,
      source: i.concreteMethod === "rh" ? SOURCES.astmF2170 : SOURCES.astmF1869,
    });
  }

  const tempOk =
    i.ambientTempF >= AMBIENT_TEMP_F.min && i.ambientTempF <= AMBIENT_TEMP_F.max;
  const rhOk = i.ambientRhPct >= AMBIENT_RH_PCT.min && i.ambientRhPct <= AMBIENT_RH_PCT.max;
  checks.push({
    key: "ambient",
    label: "Jobsite conditions",
    reading: `${fmt(i.ambientTempF, 0)} °F, ${fmt(i.ambientRhPct, 0)}% RH`,
    limit: `${AMBIENT_TEMP_F.min}–${AMBIENT_TEMP_F.max} °F, ${AMBIENT_RH_PCT.min}–${AMBIENT_RH_PCT.max}% RH`,
    status: tempOk && rhOk ? "pass" : "watch",
    note:
      tempOk && rhOk
        ? "Normal living conditions, as the guidelines ask for."
        : `${!tempOk ? "Temperature" : ""}${!tempOk && !rhOk ? " and " : ""}${!rhOk ? "Humidity" : ""} outside the range the guidelines call normal living conditions. Acclimating or installing here means acclimating to conditions the floor will not live in.`,
    source: SOURCES.nwfaAmbient,
  });

  const failing = checks.filter((c) => c.status === "fail").length;
  const watching = checks.filter((c) => c.status === "watch").length;
  return { checks, clear: failing === 0, failing, watching };
}
