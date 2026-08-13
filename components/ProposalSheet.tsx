"use client";

import React from "react";
import {
  SPECIES_LABEL,
  CONDITION_LABEL,
  type EstimateResult,
  type EstimatorInputs,
} from "@/lib/estimator";
import {
  formatDate,
  addDays,
  proposalNumber,
  type ContractorProfile,
} from "@/lib/proposal";

/**
 * The client-facing document.
 *
 * This exists because the worksheet must never be handed to a homeowner. The
 * worksheet shows crew hours at cost, the blended labour rate and the margin
 * percentage — everything a customer needs to negotiate you down to your cost
 * base. Printing it by accident is a real way to lose money on a job, and the
 * first version of this tool made that one button-press away.
 *
 * So: two views, one estimate. The proposal shows scope, sequence, materials,
 * duration and price. It does not show hours, rates, cost or margin, and it
 * never can — the numbers it needs are passed in, and the ones it must not show
 * are not rendered anywhere in this component.
 */
export default function ProposalSheet({
  input,
  result,
  profile,
  clientName,
  siteAddress,
  validDays,
  today,
}: {
  input: EstimatorInputs;
  result: EstimateResult;
  profile: ContractorProfile;
  clientName: string;
  siteAddress: string;
  validDays: number;
  today: Date;
}) {
  const ref = proposalNumber(
    `${input.sqft}-${input.species}-${input.condition}-${clientName}`,
    today
  );
  const money = (n: number) => `$${n.toLocaleString()}`;
  const days = Math.max(1, Math.ceil(result.crewDays));

  return (
    <div className="proposal-sheet card bg-card p-8 md:p-10 border-2 border-border-strong">
      {/* Letterhead */}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-border-strong pb-6">
        <div>
          <div className="text-2xl font-semibold tracking-tight">
            {profile.company || "Your Company Name"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {profile.contactName && <div>{profile.contactName}</div>}
            {profile.phone && <div>{profile.phone}</div>}
            {profile.email && <div>{profile.email}</div>}
            {profile.license && <div>License {profile.license}</div>}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-xs font-semibold tracking-[2px] text-muted-foreground">
            PROPOSAL
          </div>
          <div className="mt-1 font-mono text-base">{ref}</div>
          <div className="mt-1 text-muted-foreground">{formatDate(today)}</div>
        </div>
      </div>

      {/* Prepared for */}
      <div className="mt-6 grid sm:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground">
            PREPARED FOR
          </div>
          <div className="mt-1 text-base font-medium">{clientName || "—"}</div>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground">
            SITE
          </div>
          <div className="mt-1 text-base font-medium">{siteAddress || "—"}</div>
        </div>
      </div>

      {/* Scope */}
      <h2 className="mt-8 text-lg font-semibold tracking-tight">Scope of work</h2>
      <p className="mt-2 text-sm leading-relaxed">
        Sand and refinish approximately{" "}
        <strong>{input.sqft.toLocaleString()} square feet</strong> of{" "}
        {SPECIES_LABEL[input.species].toLowerCase()} flooring
        {input.edgingLinearFt > 0 && (
          <>
            , including{" "}
            <strong>{input.edgingLinearFt.toLocaleString()} linear feet</strong> of
            edging, perimeter and transition work
          </>
        )}
        . Floor condition assessed as{" "}
        <strong>{CONDITION_LABEL[input.condition].toLowerCase()}</strong>. Finish applied
        in <strong>{input.coats} coats</strong>.
      </p>

      <div className="mt-6 grid sm:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground">
            ABRASIVE SEQUENCE
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
            {result.grits.map((g: string, i: number) => (
              <React.Fragment key={g}>
                <span className="chip">{g} grit</span>
                {i < result.grits.length - 1 && (
                  <span aria-hidden="true" className="text-muted-foreground">
                    →
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {result.passes} full passes. Each grit removes the scratch pattern left by the
            one before it — skipping a step is what leaves swirl marks visible under the
            finish.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground">
            ESTIMATED DURATION
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
            {days} working {days === 1 ? "day" : "days"}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            On site. Cure time between coats is additional and depends on product and
            conditions.
          </p>
        </div>
      </div>

      {/* Included */}
      <h2 className="mt-8 text-lg font-semibold tracking-tight">What is included</h2>
      <ul className="mt-2 space-y-1.5 text-sm">
        <li>Site protection, dust containment and daily cleanup</li>
        <li>
          Multi-pass machine sanding through the sequence above, with hand detail at
          edges, transitions and corners
        </li>
        <li>
          {result.finishGallons} gallons of finish applied in {input.coats} coats, with
          abrasion between coats
        </li>
        <li>Final inspection walkthrough before sign-off</li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold tracking-tight">Not included</h2>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        <li>Furniture removal and replacement, unless agreed separately</li>
        <li>Board replacement, floor levelling, or repair of water damage</li>
        <li>Stairs, landings and thresholds, unless listed in the scope above</li>
        <li>Shoe moulding removal or replacement</li>
      </ul>

      {/* Price */}
      <div className="mt-8 rounded-xl bg-surface-dark text-on-dark p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="text-xs tracking-[2px] text-white/50">TOTAL</div>
            <div className="mt-1 text-4xl font-semibold tabular-nums tracking-tighter">
              {money(result.quotePrice)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs tracking-[2px] text-white/50">PER SQUARE FOOT</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              ${result.pricePerSqft.toFixed(2)}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/60">
          Labour, materials and equipment included. Valid until{" "}
          {formatDate(addDays(today, validDays))}.
        </p>
      </div>

      {/* Signature */}
      <div className="mt-8 grid sm:grid-cols-2 gap-8">
        <div>
          <div className="border-b border-foreground h-10" />
          <div className="mt-1 text-xs text-muted-foreground">
            Client signature &amp; date
          </div>
        </div>
        <div>
          <div className="border-b border-foreground h-10" />
          <div className="mt-1 text-xs text-muted-foreground">
            {profile.company || "Contractor"} · authorised signature &amp; date
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] leading-relaxed text-muted-foreground">
        Estimate prepared with the FloorForge job estimator. Quantities and duration are
        estimates based on the measurements and conditions stated above; final quantities
        may vary with site conditions discovered during the work.
      </p>
    </div>
  );
}
