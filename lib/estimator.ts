import {
  GRIT_SEQUENCE,
  LABOR_TIME_REDUCTION_PCT,
  JOB_TYPE_ADJUSTMENT_PP,
  BLENDED_LABOR_RATE_USD,
} from "@/lib/product";

/**
 * The job estimator model.
 *
 * Why this exists, and why it is the first thing FloorForge ships as a product:
 * a refinishing contractor can use it today, on a job that has nothing to do
 * with robots. It plans the grit sequence, times the passes, sizes the
 * abrasive and finish, and prices the quote. That is useful on its own — which
 * means it earns a place in a contractor's week before any hardware exists,
 * and the hardware later lands into an installed base instead of a cold call.
 *
 * THREE RULES THIS MODEL FOLLOWS, and they are the whole design:
 *
 * 1. **Every number is an assumption the contractor can change.** Nothing here
 *    is presented as a FloorForge measurement, because FloorForge has measured
 *    none of it. Defaults are typical published planning figures; the estimator
 *    says so, and every one is an editable field.
 *
 * 2. **The FloorForge-assisted column reuses lib/product.ts and nothing else.**
 *    The ROI calculator and this estimator must never be able to disagree —
 *    that is exactly the four-sources-of-truth failure the reconciliation found
 *    (audit/PRODUCT_TRUTH.md T0-2). One constant, two surfaces.
 *
 * 3. **The most valuable output is an input.** `sandingSqftPerHourPerPass` is
 *    the number nobody at FloorForge has measured and every claim rests on.
 *    When a contractor overrides the default with what their crew actually
 *    does, that correction is worth more than the estimate it produces.
 */

export type Species = "oak" | "maple" | "pine" | "walnut" | "exotic";
export type Condition = "raw" | "refinish" | "heavy";
export type JobType = "residential" | "commercial";

export interface EstimatorInputs {
  sqft: number;
  edgingLinearFt: number;
  species: Species;
  condition: Condition;
  jobType: JobType;
  coats: number;
}

export interface Assumptions {
  /** Drum-sander throughput for ONE pass, sqft per crew-hour. */
  sandingSqftPerHourPerPass: number;
  /** Edging throughput, linear feet per crew-hour. Edging is the slow part. */
  edgingLinearFtPerHour: number;
  /** Finish application, sqft per crew-hour per coat. */
  finishSqftPerHourPerCoat: number;
  /** Fixed setup, masking, vacuum and cleanup, in hours. */
  fixedOverheadHours: number;
  /** Blended crew rate, $/hour. */
  laborRate: number;
  /** Abrasive coverage, sqft per sheet/disc per pass. */
  abrasiveSqftPerSheet: number;
  /** Abrasive cost, $ per sheet/disc. */
  abrasiveCostPerSheet: number;
  /** Finish coverage, sqft per gallon per coat. */
  finishSqftPerGallon: number;
  /** Finish cost, $ per gallon. */
  finishCostPerGallon: number;
  /** Target gross margin on the quote, as a percentage. */
  marginPct: number;
}

/**
 * Defaults are typical published planning figures for hardwood refinishing, not
 * FloorForge measurements. They are starting points to be overwritten with what
 * a given crew actually does — the estimator says this on screen.
 */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  sandingSqftPerHourPerPass: 350,
  edgingLinearFtPerHour: 40,
  finishSqftPerHourPerCoat: 800,
  fixedOverheadHours: 3,
  laborRate: BLENDED_LABOR_RATE_USD,
  abrasiveSqftPerSheet: 300,
  abrasiveCostPerSheet: 6,
  finishSqftPerGallon: 450,
  finishCostPerGallon: 62,
  marginPct: 35,
};

export const SPECIES_LABEL: Record<Species, string> = {
  oak: "Red / white oak",
  maple: "Maple",
  pine: "Pine / fir",
  walnut: "Walnut",
  exotic: "Exotic hardwood",
};

export const CONDITION_LABEL: Record<Condition, string> = {
  raw: "New / unfinished",
  refinish: "Standard refinish",
  heavy: "Heavy damage or thick old finish",
};

/**
 * Grit sequence for the job.
 *
 * The baseline is GRIT_SEQUENCE from lib/product.ts — 36 → 80 → 120, the
 * sequence the firmware reads and the post-job report writes back. Two
 * documented adjustments:
 *
 *  - A raw floor has no old finish to strip, so it does not need 36.
 *  - Walnut and exotics are started no coarser than 60 to protect colour —
 *    stated in the site's own assistant script and standard practice.
 *
 * A heavy-damage floor gets an intermediate 60 so the 36 scratch is fully
 * removed before levelling; skipping it is how you get a floor that looks
 * fine dry and shows every swirl once the finish goes on.
 */
export function gritSequenceFor(species: Species, condition: Condition): string[] {
  const delicate = species === "walnut" || species === "exotic";
  if (condition === "raw") return delicate ? ["80", "120"] : ["60", "80", "120"];
  if (condition === "heavy") {
    return delicate ? ["60", "80", "100", "120"] : ["36", "60", "80", "120"];
  }
  return delicate ? ["60", "80", "120"] : [...GRIT_SEQUENCE];
}

export interface LineItem {
  label: string;
  hours: number;
  detail: string;
}

export interface EstimateResult {
  grits: string[];
  passes: number;
  lines: LineItem[];
  manualHours: number;
  /** Design-target hours with FloorForge, from lib/product.ts. Never independent. */
  assistedHours: number;
  timeSavedPct: number;
  laborCost: number;
  assistedLaborCost: number;
  abrasiveSheets: number;
  finishGallons: number;
  materialsCost: number;
  quotePrice: number;
  pricePerSqft: number;
  crewDays: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function estimate(
  input: EstimatorInputs,
  a: Assumptions = DEFAULT_ASSUMPTIONS
): EstimateResult {
  const grits = gritSequenceFor(input.species, input.condition);
  const passes = grits.length;

  const sandingHours =
    a.sandingSqftPerHourPerPass > 0
      ? (input.sqft * passes) / a.sandingSqftPerHourPerPass
      : 0;
  const edgingHours =
    a.edgingLinearFtPerHour > 0 ? input.edgingLinearFt / a.edgingLinearFtPerHour : 0;
  const finishHours =
    a.finishSqftPerHourPerCoat > 0
      ? (input.sqft * input.coats) / a.finishSqftPerHourPerCoat
      : 0;

  const lines: LineItem[] = [
    {
      label: "Field sanding",
      hours: round1(sandingHours),
      detail: `${input.sqft.toLocaleString()} sqft × ${passes} passes ÷ ${a.sandingSqftPerHourPerPass} sqft/h`,
    },
    {
      label: "Edging & detail",
      hours: round1(edgingHours),
      detail: `${input.edgingLinearFt.toLocaleString()} linear ft ÷ ${a.edgingLinearFtPerHour} ft/h`,
    },
    {
      label: "Finish application",
      hours: round1(finishHours),
      detail: `${input.sqft.toLocaleString()} sqft × ${input.coats} coats ÷ ${a.finishSqftPerHourPerCoat} sqft/h`,
    },
    {
      label: "Setup, masking & cleanup",
      hours: round1(a.fixedOverheadHours),
      detail: "Fixed per job",
    },
  ];

  const manualHours = lines.reduce((s, l) => s + l.hours, 0);

  // The ONLY place the assisted figure comes from. Same constants, same
  // arithmetic, same ceiling as the ROI calculator on the homepage.
  const timeSavedPct = LABOR_TIME_REDUCTION_PCT + JOB_TYPE_ADJUSTMENT_PP[input.jobType];
  const assistedHours = round1(manualHours * (1 - timeSavedPct / 100));

  const laborCost = Math.round(manualHours * a.laborRate);
  const assistedLaborCost = Math.round(assistedHours * a.laborRate);

  const abrasiveSheets =
    a.abrasiveSqftPerSheet > 0
      ? Math.ceil((input.sqft * passes) / a.abrasiveSqftPerSheet)
      : 0;
  const finishGallons =
    a.finishSqftPerGallon > 0
      ? Math.ceil((input.sqft * input.coats) / a.finishSqftPerGallon)
      : 0;
  const materialsCost = Math.round(
    abrasiveSheets * a.abrasiveCostPerSheet + finishGallons * a.finishCostPerGallon
  );

  // Margin on the full cost base, not a markup on labour alone — the usual way
  // a quote loses money is by pricing materials at cost.
  const costBase = laborCost + materialsCost;
  const marginFactor = a.marginPct >= 100 ? 1 : 1 - a.marginPct / 100;
  const quotePrice = Math.round(costBase / marginFactor);

  return {
    grits,
    passes,
    lines,
    manualHours: round1(manualHours),
    assistedHours,
    timeSavedPct,
    laborCost,
    assistedLaborCost,
    abrasiveSheets,
    finishGallons,
    materialsCost,
    quotePrice,
    pricePerSqft: input.sqft > 0 ? Math.round((quotePrice / input.sqft) * 100) / 100 : 0,
    crewDays: round1(manualHours / 8),
  };
}
