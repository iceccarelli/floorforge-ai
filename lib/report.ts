/**
 * The post-job completion report.
 *
 * This is the document handed over when the floor is done. It is the third and
 * last piece of the loop the estimator started: price the job, win the job,
 * prove the job. Contractors who hand over a real report get fewer callbacks
 * and more referrals, because most of what a homeowner later complains about is
 * something nobody wrote down at the time.
 *
 * THE DESIGN DECISION THAT MATTERS: every field here maps onto
 * `types.PostJobReport` (lib/types.ts:146) — the record the platform already
 * models and the API already writes on job creation
 * (app/api/jobs/route.ts:41-53).
 *
 * Today the contractor types these values in. When hardware exists, telemetry
 * fills the same fields automatically: `grit_sequence_executed` from
 * `pass_completed` events, `avg_dust_ugm3` and `dust_peak_ugm3` from
 * `dust_reading`, `total_coverage_area_m2` and `coverage_approval_score` from
 * `coverage_check`. The document does not change. That is deliberate — a
 * contractor who already hands this to clients experiences the robot as the
 * thing that stops them typing, not as a new system to learn.
 *
 * Fields marked `autofilled` below are the ones the machine will own.
 */

export interface ReportInput {
  siteName: string;
  clientName: string;
  siteAddress: string;
  startDate: string;
  completionDate: string;
  sqft: number;
  species: string;
  /** Grits actually run, comma-separated as typed. -> grit_sequence_executed */
  gritsExecuted: string;
  finishProduct: string;
  coatsApplied: number;
  sheen: string;
  /** Ambient conditions at coating. Real crews record these; they explain a lot later. */
  tempF: string;
  humidityPct: string;
  /** -> avg_dust_ugm3. autofilled from dust_reading telemetry when hardware exists. */
  avgDustUgm3: string;
  /** -> coverage_approval_score. autofilled from coverage_check when hardware exists. */
  approvalScore: string;
  /**
   * Coverage, split by the machine that produced it.
   *
   * One number was wrong. A drum sander cannot reach the last few inches at a
   * wall — that band is why lib/robots.ts carries an edger and why
   * lib/estimator.ts bills perimeter work separately — so a single "coverage"
   * figure was certifying to a homeowner that the drum had cut floor it
   * physically cannot touch. These are area-weighted separately and reported
   * separately, because they are two machines doing two jobs.
   */
  fieldCoveragePct: string;
  perimeterCoveragePct: string;
  notes: string;
  warrantyMonths: number;
}

export const EMPTY_REPORT: ReportInput = {
  siteName: "",
  clientName: "",
  siteAddress: "",
  startDate: "",
  completionDate: "",
  sqft: 0,
  species: "Red / white oak",
  // Empty, not "36, 80, 120". reportSeededFrom() only fills BLANK fields, so a
  // non-empty default silently beat the sequence carried over from the
  // estimate — and a walnut floor's report would have claimed a 36-grit pass,
  // which is precisely what the estimator's species rule exists to prevent.
  // The input carries "36, 80, 120" as a placeholder instead.
  gritsExecuted: "",
  finishProduct: "",
  coatsApplied: 3,
  sheen: "Satin",
  tempF: "",
  humidityPct: "",
  avgDustUgm3: "",
  approvalScore: "",
  fieldCoveragePct: "",
  perimeterCoveragePct: "",
  notes: "",
  warrantyMonths: 12,
};

/** Fields the machine will populate once telemetry exists. Shown in the UI. */
export const AUTOFILLED_FIELDS: Record<string, string> = {
  gritsExecuted: "pass_completed telemetry",
  avgDustUgm3: "dust_reading telemetry",
  approvalScore: "coverage_check telemetry",
  fieldCoveragePct: "pass_completed, zone=field",
  perimeterCoveragePct: "pass_completed, zone=perimeter",
};

export const SHEENS = ["Matte", "Satin", "Semi-gloss", "Gloss"];

/**
 * Care and maintenance guidance.
 *
 * Standard published practice for site-finished hardwood, not a FloorForge
 * specification. The cure-time and cleaning entries are the two that generate
 * the most callbacks when nobody writes them down, which is the whole reason
 * this section exists on the document rather than in a conversation at the door.
 *
 * The closing line matters: finish manufacturers differ, and their instructions
 * govern. Printing generic advice as if it overrides the product's own data
 * sheet is how a warranty claim gets denied.
 */
export const CARE_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "First 48 hours",
    items: [
      "Keep foot traffic off the floor entirely for the period stated by the finish manufacturer — commonly 24 to 48 hours.",
      "Keep pets off the floor. Claws mark an uncured finish permanently.",
      "Do not replace furniture, and do not slide anything across the surface.",
      "Keep the space ventilated but avoid blowing dust or debris onto the finish.",
    ],
  },
  {
    title: "First 2 to 4 weeks",
    items: [
      "The finish continues to harden after it is dry to the touch. Full cure is commonly 14 to 30 days.",
      "Do not lay area rugs or floor coverings until the finish has fully cured — trapped solvent can discolour the finish beneath.",
      "Do not wet-clean. Sweep or dry-dust only.",
      "Replace furniture gradually, lifting rather than sliding.",
    ],
  },
  {
    title: "Ongoing care",
    items: [
      "Fit felt pads to every furniture leg and replace them as they wear.",
      "Sweep or vacuum with a hard-floor head. Grit is what dulls a finish, not use.",
      "Clean with a pH-neutral hardwood cleaner and a damp — never wet — mop.",
      "Never use steam mops, oil soaps, wax, vinegar or ammonia-based cleaners on a site-finished floor.",
      "Keep indoor relative humidity roughly between 35% and 55% year round. Hardwood moves with humidity; gapping in winter and tightening in summer is normal.",
      "Use walk-off mats at exterior doors, avoiding rubber-backed mats which can trap moisture.",
    ],
  },
];

export const CARE_FOOTNOTE =
  "This is general guidance for site-finished hardwood. Where the finish manufacturer's written instructions differ, those instructions govern — follow them, and keep the product data sheet with this report.";
