"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Printer, RotateCcw } from "lucide-react";
import {
  DEFAULT_ASSUMPTIONS,
  SPECIES_LABEL,
  CONDITION_LABEL,
  estimate,
  suggestedEdgingLinearFt,
  type Assumptions,
  type Condition,
  type EstimatorInputs,
  type Species,
} from "@/lib/estimator";
import ProposalSheet from "@/components/ProposalSheet";
import {
  EMPTY_PROFILE,
  loadProfile,
  saveProfile,
  type ContractorProfile,
} from "@/lib/proposal";
import { getJob, updateJob, type JobRecord } from "@/lib/jobs";

const SPECIES = Object.keys(SPECIES_LABEL) as Species[];
const CONDITIONS = Object.keys(CONDITION_LABEL) as Condition[];

const money = (n: number) => `$${n.toLocaleString()}`;

/** Numeric field that keeps its own string state so the input can be emptied. */
function NumField({
  id,
  label,
  value,
  onChange,
  suffix,
  step = 1,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
  /** Where the number came from. Rendered as the field's description. */
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          className="input min-h-11 w-full text-base"
          value={Number.isFinite(value) ? value : ""}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onChange(Number.isFinite(n) && n >= 0 ? n : 0);
          }}
        />
        {suffix && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>
        )}
      </div>
      {/* aria-describedby, not a bare <p>: the provenance of the number is part
          of the field, and a screen reader should hear it when the field takes
          focus rather than having to hunt for it afterwards. */}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function JobEstimator() {
  const [input, setInput] = useState<EstimatorInputs>({
    sqft: 1200,
    edgingLinearFt: suggestedEdgingLinearFt(1200),
    species: "oak",
    condition: "refinish",
    jobType: "residential",
    coats: 3,
  });
  const [a, setA] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [view, setView] = useState<"worksheet" | "proposal">("worksheet");
  const [clientName, setClientName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  /**
   * Browser-only state, read once on mount.
   *
   * `localStorage` and the current date both differ between the server render
   * and the first client paint, so neither can be read during render without
   * desynchronising a statically prerendered page. One state object rather than
   * two so the effect makes a single setState call.
   */
  const [browserState, setBrowserState] = useState<{
    profile: ContractorProfile;
    today: Date | null;
  }>({ profile: EMPTY_PROFILE, today: null });

  const [jobId, setJobId] = useState<string | null>(null);
  /** True once the perimeter is the contractor's number rather than ours. */
  const [edgingTouched, setEdgingTouched] = useState(false);

  useEffect(() => {
    // Deferred past a microtask so React has committed before the state lands —
    // the same pattern FLOORFORGE_02 established for the operator routes when
    // react-hooks/set-state-in-effect first fired. A synchronous setState here
    // triggers a cascading render on every mount.
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      setBrowserState({ profile: loadProfile(), today: new Date() });

      // ?job=<id> opens an existing record. Read from location rather than
      // useSearchParams so this page stays statically prerenderable.
      const id = new URLSearchParams(window.location.search).get("job");
      const job: JobRecord | null = getJob(id);
      if (job) {
        setJobId(job.id);
        setInput(job.estimate);
        // A saved job's perimeter is already the contractor's decision, whether
        // they typed it or accepted the suggestion. Never overwrite it.
        setEdgingTouched(true);
        setA(job.assumptions);
        setClientName(job.clientName);
        setSiteAddress(job.siteAddress);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Write back whenever anything the job owns changes. One localStorage round
  // trip, and it means a contractor never loses work by navigating away.
  useEffect(() => {
    if (!jobId) return;
    updateJob(jobId, {
      estimate: input,
      assumptions: a,
      clientName,
      siteAddress,
    });
  }, [jobId, input, a, clientName, siteAddress]);

  const { profile, today } = browserState;

  const setProfileField = (k: keyof ContractorProfile, v: string) => {
    setBrowserState((prev) => {
      const next = { ...prev.profile, [k]: v };
      saveProfile(next);
      return { ...prev, profile: next };
    });
  };

  const r = useMemo(() => estimate(input, a), [input, a]);
  const suggested = suggestedEdgingLinearFt(input.sqft);
  const set = <K extends keyof EstimatorInputs>(k: K, v: EstimatorInputs[K]) =>
    setInput((p) => {
      const next = { ...p, [k]: v };
      // The perimeter follows the area until the contractor takes it over.
      // Linked-until-touched rather than always-linked: a real floor's closets
      // and islands are knowledge only they have, and overwriting a number they
      // typed would be worse than the frozen 180 this replaced.
      if (k === "sqft" && !edgingTouched) {
        next.edgingLinearFt = suggestedEdgingLinearFt(next.sqft);
      }
      return next;
    });
  const setAsm = <K extends keyof Assumptions>(k: K, v: Assumptions[K]) =>
    setA((p) => ({ ...p, [k]: v }));

  const dirty = JSON.stringify(a) !== JSON.stringify(DEFAULT_ASSUMPTIONS);

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* ---------------- Inputs ---------------- */}
      <div className="lg:col-span-2 print:hidden">
        <div className="card p-6 md:p-7 bg-card border-2 border-border-strong">
          <h2 className="text-lg font-semibold tracking-tight mb-5">The job</h2>

          <div className="grid grid-cols-2 gap-4">
            <NumField
              id="est-sqft"
              label="FLOOR AREA"
              value={input.sqft}
              onChange={(n) => set("sqft", n)}
              suffix="sqft"
              step={50}
            />
            <NumField
              id="est-edging"
              label="EDGING / PERIMETER"
              value={input.edgingLinearFt}
              onChange={(n) => {
                setEdgingTouched(true);
                set("edgingLinearFt", n);
              }}
              suffix="lin ft"
              step={10}
              hint={
                suggested === input.edgingLinearFt ? (
                  <>
                    A {suggested.toLocaleString()} ft minimum for a 4:3 room of{" "}
                    {input.sqft.toLocaleString()} sqft. Closets, islands and interior
                    walls add to it — raise this to match the floor.
                  </>
                ) : (
                  <>
                    Yours. A 4:3 room of {input.sqft.toLocaleString()} sqft has at least{" "}
                    {suggested.toLocaleString()} ft of wall.
                  </>
                )
              }
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="est-species"
              className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
            >
              SPECIES
            </label>
            <select
              id="est-species"
              className="input min-h-11 w-full text-base"
              value={input.species}
              onChange={(e) => set("species", e.target.value as Species)}
            >
              {SPECIES.map((s) => (
                <option key={s} value={s}>
                  {SPECIES_LABEL[s]}
                </option>
              ))}
            </select>
            {(input.species === "walnut" || input.species === "exotic") && (
              <p className="mt-2 text-xs text-muted-foreground">
                Sequence starts no coarser than 60 grit to protect colour.
              </p>
            )}
          </div>

          <div className="mt-5">
            <label
              htmlFor="est-condition"
              className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
            >
              FLOOR CONDITION
            </label>
            <select
              id="est-condition"
              className="input min-h-11 w-full text-base"
              value={input.condition}
              onChange={(e) => set("condition", e.target.value as Condition)}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABEL[c]}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="mt-5">
            <legend className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
              JOB TYPE
            </legend>
            <div role="radiogroup" aria-label="Job type" className="grid grid-cols-2 gap-2">
              {(["residential", "commercial"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={input.jobType === t}
                  onClick={() => set("jobType", t)}
                  className={`min-h-11 rounded-lg border px-3 text-sm font-medium capitalize transition-colors ${
                    input.jobType === t
                      ? "border-accent bg-accent-light text-accent"
                      : "border-border-strong text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
              FINISH COATS
            </legend>
            <div role="radiogroup" aria-label="Finish coats" className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={input.coats === c}
                  onClick={() => set("coats", c)}
                  className={`min-h-11 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    input.coats === c
                      ? "border-accent bg-accent-light text-accent"
                      : "border-border-strong text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          {/* ---- Assumptions ---- */}
          <div className="mt-7 pt-5 border-t border-border-strong">
            <button
              type="button"
              onClick={() => setShowAssumptions((v) => !v)}
              aria-expanded={showAssumptions}
              aria-controls="est-assumptions"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover"
            >
              {showAssumptions ? "Hide" : "Edit"} planning assumptions
              {dirty && (
                <span className="rounded bg-accent-light px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  edited
                </span>
              )}
            </button>

            <p className="mt-2 text-xs text-muted-foreground">
              These are typical published planning figures, not FloorForge measurements.
              Replace them with what your crew actually does — that is the whole point of
              the field.
            </p>

            {showAssumptions && (
              <div id="est-assumptions" className="mt-5 grid grid-cols-2 gap-4">
                <NumField
                  id="asm-sanding"
                  label="SANDING RATE"
                  value={a.sandingSqftPerHourPerPass}
                  onChange={(n) => setAsm("sandingSqftPerHourPerPass", n)}
                  suffix="sqft/h/pass"
                  step={10}
                />
                <NumField
                  id="asm-edging"
                  label="EDGING RATE"
                  value={a.edgingLinearFtPerHour}
                  onChange={(n) => setAsm("edgingLinearFtPerHour", n)}
                  suffix="ft/h"
                  step={5}
                />
                <NumField
                  id="asm-finish"
                  label="FINISH RATE"
                  value={a.finishSqftPerHourPerCoat}
                  onChange={(n) => setAsm("finishSqftPerHourPerCoat", n)}
                  suffix="sqft/h/coat"
                  step={50}
                />
                <NumField
                  id="asm-overhead"
                  label="SETUP & CLEANUP"
                  value={a.fixedOverheadHours}
                  onChange={(n) => setAsm("fixedOverheadHours", n)}
                  suffix="hours"
                  step={0.5}
                />
                <NumField
                  id="asm-labor"
                  label="BLENDED LABOR RATE"
                  value={a.laborRate}
                  onChange={(n) => setAsm("laborRate", n)}
                  suffix="$/h"
                />
                <NumField
                  id="asm-margin"
                  label="TARGET MARGIN"
                  value={a.marginPct}
                  onChange={(n) => setAsm("marginPct", n)}
                  suffix="%"
                />
                <NumField
                  id="asm-abrasive-cov"
                  label="ABRASIVE COVERAGE"
                  value={a.abrasiveSqftPerSheet}
                  onChange={(n) => setAsm("abrasiveSqftPerSheet", n)}
                  suffix="sqft/sheet"
                  step={25}
                />
                <NumField
                  id="asm-abrasive-cost"
                  label="ABRASIVE COST"
                  value={a.abrasiveCostPerSheet}
                  onChange={(n) => setAsm("abrasiveCostPerSheet", n)}
                  suffix="$/sheet"
                />
                <NumField
                  id="asm-finish-cov"
                  label="FINISH COVERAGE"
                  value={a.finishSqftPerGallon}
                  onChange={(n) => setAsm("finishSqftPerGallon", n)}
                  suffix="sqft/gal"
                  step={25}
                />
                <NumField
                  id="asm-finish-cost"
                  label="FINISH COST"
                  value={a.finishCostPerGallon}
                  onChange={(n) => setAsm("finishCostPerGallon", n)}
                  suffix="$/gal"
                />
                {dirty && (
                  <div className="col-span-2">
                    <Button
                      variant="secondary"
                      className="w-full justify-center"
                      onClick={() => setA(DEFAULT_ASSUMPTIONS)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" /> Reset to defaults
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Output ---------------- */}
      <div className="lg:col-span-3">
        {/* View switch — the worksheet is internal, the proposal is the
            document a client sees. They print separately on purpose: the
            worksheet shows the rate, the hours and the margin. */}
        <div role="tablist" aria-label="Estimate view" className="mb-4 flex gap-2 print:hidden">
          {(["worksheet", "proposal"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`min-h-11 rounded-lg border px-4 text-sm font-semibold capitalize transition-colors ${
                view === v
                  ? "border-accent bg-accent-light text-accent"
                  : "border-border-strong text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "worksheet" ? "Worksheet (internal)" : "Client proposal"}
            </button>
          ))}
        </div>

        <div
          id="estimate-sheet"
          aria-live="polite"
          data-print-view="worksheet"
          hidden={view !== "worksheet"}
          className="card p-6 md:p-8 bg-card border-2 border-border-strong"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-accent text-xs tracking-[3px] font-semibold">
                JOB ESTIMATE · INTERNAL WORKSHEET
              </div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {input.sqft.toLocaleString()} sqft · {SPECIES_LABEL[input.species]}
              </h2>
              <p className="text-sm text-muted-foreground">
                {CONDITION_LABEL[input.condition]} · {input.coats} coats ·{" "}
                {input.jobType}
              </p>
            </div>
            <Button
              variant="secondary"
              className="print:hidden"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" /> Print / PDF
            </Button>
          </div>

          {/* Pass plan */}
          <div className="mt-7">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground">
              PASS PLAN
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {r.grits.map((g, i) => (
                <React.Fragment key={g}>
                  <span className="chip">{g} grit</span>
                  {i < r.grits.length - 1 && (
                    <span aria-hidden="true" className="text-muted-foreground">
                      →
                    </span>
                  )}
                </React.Fragment>
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {r.passes} passes
              </span>
            </div>
          </div>

          {/* Labour breakdown */}
          <div className="mt-7">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground">
              CREW TIME
            </div>
            <table className="mt-3 w-full text-sm">
              <caption className="sr-only">
                Estimated crew hours by task, derived from your inputs and planning
                assumptions
              </caption>
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="pb-2 font-medium">
                    Task
                  </th>
                  <th scope="col" className="pb-2 font-medium">
                    Basis
                  </th>
                  <th scope="col" className="pb-2 font-medium text-right">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {r.lines.map((l) => (
                  <tr key={l.label} className="border-t border-border">
                    <td className="py-2.5 pr-3 font-medium">{l.label}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {l.detail}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{l.hours}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border-strong font-semibold">
                  <td className="py-2.5 pr-3">Total</td>
                  <td className="py-2.5 pr-3 text-xs font-normal text-muted-foreground">
                    ≈ {r.crewDays} crew-days at 8 h
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{r.manualHours}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Materials + quote */}
          <div className="mt-7 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border-strong p-4">
              <div className="text-xs font-semibold tracking-wider text-muted-foreground">
                MATERIALS
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex justify-between">
                  <span>Abrasive</span>
                  <span className="tabular-nums">{r.abrasiveSheets} sheets</span>
                </li>
                <li className="flex justify-between">
                  <span>Finish</span>
                  <span className="tabular-nums">{r.finishGallons} gal</span>
                </li>
                <li className="flex justify-between border-t border-border pt-1 font-semibold">
                  <span>Cost</span>
                  <span className="tabular-nums">{money(r.materialsCost)}</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border-strong p-4">
              <div className="text-xs font-semibold tracking-wider text-muted-foreground">
                LABOR
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex justify-between">
                  <span>{r.manualHours} h × ${a.laborRate}/h</span>
                  <span className="tabular-nums">{money(r.laborCost)}</span>
                </li>
                <li className="flex justify-between text-muted-foreground">
                  <span>Margin</span>
                  <span className="tabular-nums">{a.marginPct}%</span>
                </li>
                <li className="flex justify-between border-t border-border pt-1 font-semibold">
                  <span>Quote</span>
                  <span className="tabular-nums">{money(r.quotePrice)}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-surface-dark text-on-dark p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="text-xs tracking-[2px] text-white/50">SUGGESTED QUOTE</div>
                <div className="mt-1 text-4xl font-semibold tabular-nums tracking-tighter">
                  {money(r.quotePrice)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs tracking-[2px] text-white/50">PER SQFT</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  ${r.pricePerSqft.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* FloorForge column — design targets, clearly separated */}
          <div className="mt-7 rounded-xl border-2 border-accent/30 bg-accent-light p-5">
            <div className="text-xs font-semibold tracking-wider text-accent">
              THE SAME JOB, WITH FLOORFORGE — DESIGN TARGET
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
              <div>
                <div className="text-3xl font-semibold tabular-nums tracking-tight">
                  {r.assistedHours} h
                </div>
                {/* --foreground, not --muted-foreground: #64748b on the amber
                    tint measures 4.27:1, under the 4.5:1 floor.
                    audit/scripts/token-contrast.mjs:34 records that pair as
                    illegal and says to use --foreground or --accent instead. */}
                <div className="text-xs text-foreground">
                  vs {r.manualHours} h · {r.timeSavedPct}% less crew time
                </div>
              </div>
              <div>
                <div className="text-3xl font-semibold tabular-nums tracking-tight">
                  {money(r.laborCost - r.assistedLaborCost)}
                </div>
                <div className="text-xs text-foreground">
                  labor cost released on this job
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-foreground">
              This column is a <strong>design target for hardware in development</strong>,
              not a measured result. No FloorForge machine has refinished a floor. It uses
              the same {r.timeSavedPct}% figure as the ROI model on the homepage, from a
              single constant, so the two can never disagree. Validating it is the entire
              point of the pilot program.
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">How to read this.</strong> Crew time,
            materials and price are computed from your inputs and the planning assumptions
            on the left — they are arithmetic, not a FloorForge claim, and every input is
            yours to change. Published coverage figures vary by product and by crew;
            replace the defaults with your own numbers and the estimate becomes yours.
            Nothing here accounts for stairs, furniture, floor levelling, or
            water damage.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <Button asChild variant="accent">
              <Link href="/?interest=estimator#waitlist">
                Join the pilot waitlist <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/#roi">See the ROI model</Link>
            </Button>
          </div>
        </div>

        {/* ---------------- Client proposal ---------------- */}
        <div data-print-view="proposal" hidden={view !== "proposal"}>
          <div className="card p-6 bg-muted border border-border-strong mb-4 print:hidden">
            <h3 className="text-sm font-semibold tracking-tight">
              Your details &amp; the client
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Your company details are saved in this browser so you only type them once.
              They are never sent anywhere — this tool has no account and no server.
            </p>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {(
                [
                  ["company", "COMPANY NAME"],
                  ["contactName", "YOUR NAME"],
                  ["phone", "PHONE"],
                  ["email", "EMAIL"],
                  ["license", "LICENSE #"],
                ] as const
              ).map(([k, label]) => (
                <div key={k}>
                  <label
                    htmlFor={`pf-${k}`}
                    className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
                  >
                    {label}
                  </label>
                  <input
                    id={`pf-${k}`}
                    className="input min-h-11 w-full text-base"
                    value={profile[k]}
                    onChange={(e) => setProfileField(k, e.target.value)}
                  />
                </div>
              ))}
              <div>
                <label
                  htmlFor="pf-client"
                  className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
                >
                  CLIENT NAME
                </label>
                <input
                  id="pf-client"
                  className="input min-h-11 w-full text-base"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="pf-site"
                  className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
                >
                  SITE ADDRESS
                </label>
                <input
                  id="pf-site"
                  className="input min-h-11 w-full text-base"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-5">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print proposal / save as PDF
              </Button>
            </div>
          </div>

          {today && (
            <ProposalSheet
              input={input}
              result={r}
              profile={profile}
              clientName={clientName}
              siteAddress={siteAddress}
              validDays={30}
              today={today}
            />
          )}
        </div>
      </div>
    </div>
  );
}
