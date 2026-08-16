/**
 * Canonical product numbers. One file, one value each, every figure cited.
 *
 * Before this file, the answer to "how long does my floor take" existed in four
 * places with four different values, spread 21x once normalised to a per-job
 * basis (audit/PRODUCT_TRUTH.md T0-2):
 *
 *   lib/robots.ts                55 m²/h per pass  ->   1,579 sqft/robot/day
 *   ROICalculator.tsx            2,200 sqft/robot/day
 *   API_REFERENCE.md:170-175     5,000 sqft in 8 h  ->  5,000 sqft/robot/day
 *   SOFTWARE_HARDWARE_CONTRACT   12,500 sqft in 2h58m -> ~33,000 sqft/day
 *
 * Nobody had picked one, because the machine does not exist yet — which is
 * exactly why it needs one owner rather than four. This file is the owner.
 *
 * The figure adopted is the most conservative of the four: the simulator's
 * per-pass coverage rate. It has one property none of the others do — it is the
 * number a visitor can literally watch run on /simulator. The number you can
 * watch should be the number you quote.
 *
 * EVERY VALUE HERE IS A DESIGN TARGET for hardware in development. None is a
 * measured specification and none is a record of a completed job. Anything
 * derived from these values inherits that status.
 *
 * public/llms.txt is a static file and cannot import this module. If you change
 * a value here, change it there too — it is the only place that duplicates.
 */

import { planFloor } from "@/lib/floorPlan";
import { getRobot } from "@/lib/robots";

/** Square feet in one square metre. Not a product claim; a unit. */
export const SQFT_PER_M2 = 1 / 0.09290304;

/**
 * The sanding platform's coverage rate for ONE pass, in m²/h.
 *
 * Source of record: lib/robots.ts `sand.coverageM2PerHour`, which drives the
 * simulator's live coverage animation and its job estimate. Kept in sync by
 * `audit/scripts/token-drift.mjs`-style review, not by import, because
 * lib/robots.ts is the data file the 3D scene reads directly.
 */
export const SANDER_M2_PER_HOUR_PER_PASS = 55;

/**
 * Passes in a standard sanding sequence.
 *
 * SOFTWARE_HARDWARE_CONTRACT.md:429 and API_REFERENCE.md:171 both specify
 * `"grit_sequence": ["36", "80", "120"]` — three passes. This is the field the
 * firmware reads to plan the job and the field the post-job report writes back
 * as `grit_sequence_executed`, so it is not a marketing number.
 */
export const GRIT_SEQUENCE = ["36", "80", "120"] as const;
export const SANDING_PASSES = GRIT_SEQUENCE.length;

/** Human-readable grit range, derived so it can never drift from the sequence. */
export const GRIT_RANGE_LABEL = `${GRIT_SEQUENCE[0]} → ${GRIT_SEQUENCE[GRIT_SEQUENCE.length - 1]}`;

/** A working day, for turning an hourly rate into a per-day figure. */
export const WORKING_DAY_HOURS = 8;

/**
 * Sqft of FIELD one drum completes in one 8-hour day.
 *
 * Derived, not asserted: 55 m²/h per pass ÷ 3 passes × 8 h × 10.764 sqft/m².
 * Finish coats are additional and are NOT included — the previous figure
 * (2,200 sqft/day "for full multi-grit + finish") conflated the two, which is
 * part of why the four sources never reconciled.
 *
 * THIS IS NOT A WHOLE FLOOR. It counts the drum only. A drum cannot reach the
 * band at the wall, so a floor is not finished when this figure says it is —
 * use `completeFloorSqftPerDay()` below for anything a contractor plans around.
 */
export const SANDING_SQFT_PER_ROBOT_DAY = Math.round(
  (SANDER_M2_PER_HOUR_PER_PASS / SANDING_PASSES) * WORKING_DAY_HOURS * SQFT_PER_M2
); // = 1579

/**
 * Hours to take a floor of `sqft` from raw to sanded — field AND perimeter.
 *
 * A FUNCTION, not a constant, and that is the point. The perimeter scales with
 * the square root of the area while the field scales linearly, so the share of
 * the day spent edging changes with room size: about 17% of the job at 800 sqft
 * and 10% at 2,500. No single sqft-per-day number can be right for both, and
 * publishing one as though it were is how the site came to quote 1,579 sqft per
 * robot-day for a machine that had never been modelled cutting a perimeter.
 *
 * Both rates are the machines' own published specs, and the geometry is the
 * same lib/floorPlan.ts the live console and the 3D stage run on — so the ROI
 * model and the simulation a visitor watches cannot drift apart.
 */
export function completeFloorHours(sqft: number): {
  fieldHours: number;
  edgeHours: number;
  totalHours: number;
} {
  const areaM2 = Math.max(1, sqft) / SQFT_PER_M2;
  const sander = getRobot("sand");
  const edger = getRobot("edge");
  const plan = planFloor(areaM2, sander.workingWidthM, sander.edgeGapM ?? 0);

  const fieldHours =
    (plan.fieldAreaM2 / SANDER_M2_PER_HOUR_PER_PASS) * SANDING_PASSES;
  // The edger's linear rate comes from its own coverage spec and head width.
  const edgerLinearMPerHour = edger.coverageM2PerHour / edger.workingWidthM;
  const edgeHours = (plan.bandPathM / edgerLinearMPerHour) * SANDING_PASSES;

  return { fieldHours, edgeHours, totalHours: fieldHours + edgeHours };
}

/** Sqft of FINISHED floor — field and perimeter — per 8-hour day, at this size. */
export function completeFloorSqftPerDay(sqft: number): number {
  const { totalHours } = completeFloorHours(sqft);
  return Math.round(sqft * (WORKING_DAY_HOURS / totalHours));
}

/**
 * Labour time reduction, in percent, before job-type adjustment.
 *
 * PAGE_UX_CONTRACTS.md:115 sanctions exactly one figure for site copy:
 * "Targeting 50% labor time savings". PRODUCT_SERVICE_ROADMAP.md:23 sets the
 * same bar as a phase-2 success metric ("Contractors report ≥ 50% time
 * savings").
 *
 * The previous baseline was 62%, which put the residential path at 64-67% —
 * above the 60% figure PRODUCT_SERVICE_DEFINITION.md:276 names explicitly as a
 * claim that must NOT be made (audit/PRODUCT_TRUTH.md T0-1). 50% is now a
 * ceiling, not a midpoint: no input to the ROI model produces a larger number.
 */
export const LABOR_TIME_REDUCTION_PCT = 50;

/**
 * Job-type adjustment in PERCENTAGE POINTS, applied to the baseline above.
 *
 * Points, not a multiplier, so the arithmetic is displayable. The old model
 * multiplied retained time by 1.15 / 0.92, which meant the stated "62%
 * baseline" was a number the tool could never actually display — the one flaw
 * that undoes a calculator whose selling point is transparency.
 *
 * Commercial work is scored lower: multi-floor jobs carry more transitions,
 * more furniture, more staging and more stop-start than a single residence.
 */
export const JOB_TYPE_ADJUSTMENT_PP = {
  residential: 0,
  commercial: -7,
} as const;

/**
 * Blended crew labour rate, $/hour. Unchanged from the previous model and
 * still an assumption, not a survey — it is displayed as one.
 */
export const BLENDED_LABOR_RATE_USD = 78;

/**
 * Indicative hardware cost per unit, USD.
 *
 * PRODUCT_SERVICE_DEFINITION.md:288 — "~$15–25K (indicative)". The pricing
 * table used to show only the monthly subscription, while
 * PRODUCT_SERVICE_DEFINITION.md:298-299 describes the post-pilot model as
 * hardware sale PLUS SaaS subscription. A contractor reading "$799/mo" would
 * not have budgeted for the machine (audit/PRODUCT_TRUTH.md T1-3).
 */
export const HARDWARE_UNIT_COST_LOW_USD = 15_000;
export const HARDWARE_UNIT_COST_HIGH_USD = 25_000;
/** Renders exactly as before: "$15–25K". Now derived, so a change to the band
 *  above cannot leave the label behind. */
export const HARDWARE_UNIT_COST_LABEL = `$${HARDWARE_UNIT_COST_LOW_USD / 1000}–${
  HARDWARE_UNIT_COST_HIGH_USD / 1000
}K`;

/**
 * The software subscription tiers, USD per month.
 *
 * These four numbers were typed twice: once as JSX literals in the homepage
 * pricing cards and once inside a prose answer in components/ChatbotPanel.tsx.
 * Two hand-kept copies of a price is how this file came to exist — four
 * different throughput figures on four surfaces (audit/PRODUCT_TRUTH.md T0-2) —
 * and a chatbot that quotes a price the pricing table no longer shows is worse
 * than one that refuses to quote at all.
 *
 * The values are lifted from what the site already published, not chosen here.
 * Enterprise is deliberately not a number: it is "custom" on the page and must
 * stay custom in every retelling.
 *
 * Design targets for a launch that has not happened, like everything else in
 * this file. Not an offer.
 */
export const SOFTWARE_TIERS = {
  essentials: { name: "Essentials", baseUsd: 299, perRobotUsd: 149 },
  professional: { name: "Professional", baseUsd: 799, perRobotUsd: 99 },
} as const;

/**
 * The throughput band the site publishes, as a label.
 *
 * `completeFloorSqftPerDay()` needs a job size, because a perimeter grows with
 * the square root of the area while the field grows with the area — so the
 * figure genuinely moves with room size and no single number is honest. Any
 * surface that has no job size in hand (the assistant, prose) must quote the
 * BAND across typical residential sizes rather than pick a point from it.
 *
 * Computed, not typed: change a machine's working width in lib/robots.ts and
 * this label moves with it.
 */
export const TYPICAL_RESIDENTIAL_SQFT = [1000, 3000] as const;
export const COMPLETE_FLOOR_SQFT_PER_DAY_LABEL = `${(
  Math.floor(completeFloorSqftPerDay(TYPICAL_RESIDENTIAL_SQFT[0]) / 50) * 50
).toLocaleString()}–${(
  Math.ceil(completeFloorSqftPerDay(TYPICAL_RESIDENTIAL_SQFT[1]) / 50) * 50
).toLocaleString()}`;

/* ------------------------------------------------------------------ RaaS */

/**
 * Robotics-as-a-service: the machine as a monthly line item, not a purchase.
 *
 * WHY THE SITE NEEDS THIS. A finished floor takes two machines — a D1 for the
 * field and an E1 for the band it cannot reach. At the indicative unit price
 * that is $30–50K of capital before the first floor is sanded, asked of small
 * flooring contractors, which is precisely who the pilot program is recruiting.
 * The purchase model was quietly disqualifying the customer.
 *
 * HOW THE RANGE IS BUILT. Every term below is derived from a figure already
 * published on this site, so the monthly rate can be checked rather than
 * believed:
 *
 *   capital recovery   $15–25K over 36 months        $417 – $694
 *   service reserve    25% of capital recovery       $104 – $174
 *                      (maintenance, consumables, replacement)
 *   platform software  the per-robot tier fee         $99 – $149
 *                                                    ---------------
 *   all-in per robot per month                       $620 – $1,017
 *
 * Rounded outward to a $600–1,000 band, because quoting $620–$1,017 would imply
 * a precision that hardware which has not been manufactured cannot support.
 *
 * THIS IS A DESIGN TARGET, like every other number in this file. No FloorForge
 * machine has been built, no unit cost has been quoted by a manufacturer, and
 * nothing here is an offer. The pilot exists to replace these with real numbers.
 */
export const RAAS_TERM_MONTHS = 36;
export const RAAS_SERVICE_RESERVE_PCT = 25;
export const RAAS_MONTHLY_LOW_USD = 600;
export const RAAS_MONTHLY_HIGH_USD = 1000;
export const RAAS_MONTHLY_LABEL = `$${RAAS_MONTHLY_LOW_USD}–${RAAS_MONTHLY_HIGH_USD.toLocaleString()}`;

/**
 * Machines a complete floor needs: one drum for the field, one edger for the
 * band. Derived from the fact that lib/robots.ts gives the sander an
 * `edgeGapM` — if a machine could cut to the wall, this would be 1.
 */
export const MACHINES_PER_COMPLETE_FLOOR = getRobot("sand").edgeGapM ? 2 : 1;

/**
 * Dust capture design target.
 *
 * The one figure in this audit that already had a single value everywhere.
 * PAGE_UX_CONTRACTS.md:114 sanctions the exact phrasing "Designed to achieve
 * 98% dust capture"; PRODUCT_SERVICE_DEFINITION.md:278 lists "Dust is
 * guaranteed 98% captured" as a claim that must not be made. Target, never
 * guarantee.
 */
export const DUST_CAPTURE_TARGET_PCT = 98;

/**
 * OSHA permissible exposure limit for wood dust as nuisance dust, in µg/m³,
 * 8-hour time-weighted average. Total dust; the respirable fraction limit is
 * 5,000 µg/m³.
 *
 * Present because the dashboard used to claim a sample reading was "87% below
 * OSHA action level". OSHA publishes no action level for wood dust — it falls
 * under the generic nuisance-dust PEL — and 87% does not correspond to any
 * published limit (audit/PRODUCT_TRUTH.md T0-3). Source: OSHA Woodworking
 * eTool, Health Hazards — Wood Dust.
 */
export const OSHA_NUISANCE_DUST_PEL_UGM3 = 15000;

/** Format a µg/m³ reading as a share of the OSHA PEL, correctly. */
export function shareOfOshaPel(ugm3: number): string {
  const pct = (ugm3 / OSHA_NUISANCE_DUST_PEL_UGM3) * 100;
  return pct < 0.1 ? "<0.1%" : `${pct.toFixed(1)}%`;
}
