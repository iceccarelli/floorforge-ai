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
 * Sqft one robot completes in one 8-hour day, ALL sanding passes included.
 *
 * Derived, not asserted: 55 m²/h per pass ÷ 3 passes × 8 h × 10.764 sqft/m².
 * Finish coats are additional and are NOT included — the previous figure
 * (2,200 sqft/day "for full multi-grit + finish") conflated the two, which is
 * part of why the four sources never reconciled.
 */
export const SANDING_SQFT_PER_ROBOT_DAY = Math.round(
  (SANDER_M2_PER_HOUR_PER_PASS / SANDING_PASSES) * WORKING_DAY_HOURS * SQFT_PER_M2
); // = 1579

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
export const HARDWARE_UNIT_COST_LABEL = "$15–25K";

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
