"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Cpu } from "lucide-react";
import {
  EMPTY_REPORT,
  AUTOFILLED_FIELDS,
  CARE_SECTIONS,
  CARE_FOOTNOTE,
  SHEENS,
  type ReportInput,
} from "@/lib/report";
import {
  EMPTY_PROFILE,
  loadProfile,
  saveProfile,
  formatDate,
  proposalNumber,
  type ContractorProfile,
} from "@/lib/proposal";
import { getJob, updateJob, reportSeededFrom } from "@/lib/jobs";
import { gritSequenceFor } from "@/lib/estimator";

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autofill,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autofill?: string;
}) {
  return (
    // min-w-0: a grid item's automatic minimum size is its content's intrinsic
    // width, and Chromium gives `type="date"` a ~130px intrinsic minimum. Two of
    // them in a 2-column grid pushed /report 6px past a 320px viewport
    // (audit/scripts/overflow.mjs). min-w-0 lets the track shrink.
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground mb-2"
      >
        {label}
        {autofill && (
          <span
            className="inline-flex items-center gap-1 rounded bg-accent-light px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent"
            title={`FloorForge will fill this from ${autofill}`}
          >
            <Cpu size={9} aria-hidden="true" /> auto later
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="input min-h-11 w-full text-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function JobReport() {
  const [f, setF] = useState<ReportInput>(EMPTY_REPORT);
  const [browserState, setBrowserState] = useState<{
    profile: ContractorProfile;
    today: Date | null;
  }>({ profile: EMPTY_PROFILE, today: null });

  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    // Deferred past a microtask so React commits first — the pattern
    // FLOORFORGE_02 established for react-hooks/set-state-in-effect.
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      setBrowserState({ profile: loadProfile(), today: new Date() });

      const id = new URLSearchParams(window.location.search).get("job");
      const job = getJob(id);
      if (job) {
        setJobId(job.id);
        // Seed the blanks from what was already estimated. Anything typed on
        // the report wins — this document records what happened, not what was
        // planned, and the two are allowed to differ.
        const grits = gritSequenceFor(job.estimate.species, job.estimate.condition);
        setF(reportSeededFrom(job, grits));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!jobId) return;
    updateJob(jobId, { report: f });
  }, [jobId, f]);

  const { profile, today } = browserState;
  const set = (k: keyof ReportInput, v: string | number) =>
    setF((p) => ({ ...p, [k]: v }));
  const setProfileField = (k: keyof ContractorProfile, v: string) =>
    setBrowserState((prev) => {
      const next = { ...prev.profile, [k]: v };
      saveProfile(next);
      return { ...prev, profile: next };
    });

  const grits = f.gritsExecuted
    .split(/[,→>]/)
    .map((g) => g.trim())
    .filter(Boolean);

  const ref = today
    ? proposalNumber(`${f.siteName}-${f.clientName}-${f.sqft}`, today)
    : "————";

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* ---------------- Form ---------------- */}
      <div className="min-w-0 lg:col-span-2 print:hidden">
        <div className="card p-6 md:p-7 bg-card border-2 border-border-strong">
          <h2 className="text-lg font-semibold tracking-tight">The completed job</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Fields marked <span className="font-semibold text-accent">auto later</span>{" "}
            are the ones FloorForge is designed to fill from machine telemetry. Until
            hardware exists you type them, and the document is identical either way.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <Field id="r-client" label="CLIENT" value={f.clientName} onChange={(v) => set("clientName", v)} />
            <Field id="r-site" label="JOB / SITE NAME" value={f.siteName} onChange={(v) => set("siteName", v)} />
            <div className="col-span-2">
              <Field id="r-address" label="SITE ADDRESS" value={f.siteAddress} onChange={(v) => set("siteAddress", v)} />
            </div>
            <Field id="r-start" label="START DATE" type="date" value={f.startDate} onChange={(v) => set("startDate", v)} />
            <Field id="r-end" label="COMPLETION DATE" type="date" value={f.completionDate} onChange={(v) => set("completionDate", v)} />
            <Field id="r-sqft" label="AREA (SQFT)" type="number" value={f.sqft || ""} onChange={(v) => set("sqft", Number(v) || 0)} />
            <Field id="r-species" label="SPECIES" value={f.species} onChange={(v) => set("species", v)} />
          </div>

          <h3 className="mt-7 text-sm font-semibold tracking-tight">Work performed</h3>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field
                id="r-grits"
                label="GRIT SEQUENCE RUN"
                value={f.gritsExecuted}
                onChange={(v) => set("gritsExecuted", v)}
                placeholder="36, 80, 120"
                autofill={AUTOFILLED_FIELDS.gritsExecuted}
              />
            </div>
            <div className="col-span-2">
              <Field id="r-finish" label="FINISH PRODUCT" value={f.finishProduct} onChange={(v) => set("finishProduct", v)} placeholder="Brand and product name" />
            </div>
            <Field id="r-coats" label="COATS APPLIED" type="number" value={f.coatsApplied} onChange={(v) => set("coatsApplied", Number(v) || 0)} />
            <div>
              <label htmlFor="r-sheen" className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                SHEEN
              </label>
              <select id="r-sheen" className="input min-h-11 w-full text-base" value={f.sheen} onChange={(e) => set("sheen", e.target.value)}>
                {SHEENS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <Field id="r-temp" label="TEMP AT COATING (°F)" value={f.tempF} onChange={(v) => set("tempF", v)} />
            <Field id="r-humidity" label="RH AT COATING (%)" value={f.humidityPct} onChange={(v) => set("humidityPct", v)} />
            <Field id="r-dust" label="AVG DUST (µg/m³)" value={f.avgDustUgm3} onChange={(v) => set("avgDustUgm3", v)} autofill={AUTOFILLED_FIELDS.avgDustUgm3} />
            <Field id="r-field-cov" label="FIELD COVERAGE (%)" value={f.fieldCoveragePct} onChange={(v) => set("fieldCoveragePct", v)} autofill={AUTOFILLED_FIELDS.fieldCoveragePct} />
            <Field id="r-perim-cov" label="PERIMETER COVERAGE (%)" value={f.perimeterCoveragePct} onChange={(v) => set("perimeterCoveragePct", v)} autofill={AUTOFILLED_FIELDS.perimeterCoveragePct} />
            <Field id="r-score" label="APPROVAL SCORE /100" value={f.approvalScore} onChange={(v) => set("approvalScore", v)} autofill={AUTOFILLED_FIELDS.approvalScore} />
            <Field id="r-warranty" label="WARRANTY (MONTHS)" type="number" value={f.warrantyMonths} onChange={(v) => set("warrantyMonths", Number(v) || 0)} />
          </div>

          <div className="mt-4">
            <label htmlFor="r-notes" className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
              NOTES / EXCEPTIONS
            </label>
            <textarea
              id="r-notes"
              rows={3}
              className="input w-full text-base"
              value={f.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Board replacements, pre-existing damage noted, anything the client should have in writing."
            />
          </div>

          <h3 className="mt-7 text-sm font-semibold tracking-tight">Your details</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Saved in this browser, shared with the estimator. Never sent anywhere.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field id="rp-company" label="COMPANY" value={profile.company} onChange={(v) => setProfileField("company", v)} />
            </div>
            <Field id="rp-phone" label="PHONE" value={profile.phone} onChange={(v) => setProfileField("phone", v)} />
            <Field id="rp-email" label="EMAIL" value={profile.email} onChange={(v) => setProfileField("email", v)} />
          </div>

          <div className="mt-6">
            <Button variant="accent" className="w-full justify-center" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print report / save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ---------------- Document ---------------- */}
      <div className="min-w-0 lg:col-span-3">
        <div className="proposal-sheet card bg-card p-8 md:p-10 border-2 border-border-strong">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-border-strong pb-6">
            <div>
              <div className="text-2xl font-semibold tracking-tight">
                {profile.company || "Your Company Name"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {profile.phone && <div>{profile.phone}</div>}
                {profile.email && <div>{profile.email}</div>}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-xs font-semibold tracking-[2px] text-muted-foreground">
                COMPLETION REPORT
              </div>
              <div className="mt-1 font-mono text-base">{ref}</div>
              {today && <div className="mt-1 text-muted-foreground">{formatDate(today)}</div>}
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-xs font-semibold tracking-wider text-muted-foreground">CLIENT</div>
              <div className="mt-1 font-medium">{f.clientName || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider text-muted-foreground">SITE</div>
              <div className="mt-1 font-medium">{f.siteAddress || f.siteName || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider text-muted-foreground">DATES</div>
              <div className="mt-1 font-medium">
                {f.startDate || "—"} → {f.completionDate || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider text-muted-foreground">AREA</div>
              <div className="mt-1 font-medium tabular-nums">
                {f.sqft ? `${f.sqft.toLocaleString()} sqft` : "—"} · {f.species}
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-lg font-semibold tracking-tight">Work performed</h2>
          <div className="mt-3">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground">
              ABRASIVE SEQUENCE RUN
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
              {grits.length ? (
                grits.map((g, i) => (
                  <React.Fragment key={`${g}-${i}`}>
                    <span className="chip">{g} grit</span>
                    {i < grits.length - 1 && (
                      <span aria-hidden="true" className="text-muted-foreground">→</span>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <table className="mt-5 w-full text-sm">
            <caption className="sr-only">Finish and site conditions recorded at completion</caption>
            <tbody>
              {[
                ["Finish product", f.finishProduct || "—"],
                ["Coats applied", `${f.coatsApplied} · ${f.sheen.toLowerCase()}`],
                ["Temperature at coating", f.tempF ? `${f.tempF} °F` : "not recorded"],
                ["Relative humidity at coating", f.humidityPct ? `${f.humidityPct} %` : "not recorded"],
                ["Average airborne dust", f.avgDustUgm3 ? `${f.avgDustUgm3} µg/m³` : "not recorded"],
                // Two lines, not one. A drum sander cannot reach a wall; the
                // perimeter is a second machine's work and is measured against
                // its own area. Collapsing them let a well-edged perimeter hide
                // a badly cut field, and certified drum coverage of floor the
                // drum cannot physically touch.
                ["Field coverage (drum)", f.fieldCoveragePct ? `${f.fieldCoveragePct} %` : "not recorded"],
                ["Perimeter coverage (edger)", f.perimeterCoveragePct ? `${f.perimeterCoveragePct} %` : "not recorded"],
                ["Coverage approval score", f.approvalScore ? `${f.approvalScore} / 100` : "not recorded"],
              ].map(([k, v]) => (
                <tr key={k} className="border-t border-border">
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium">{k}</th>
                  <td className="py-2.5 text-right tabular-nums">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {f.notes && (
            <>
              <h2 className="mt-8 text-lg font-semibold tracking-tight">Notes &amp; exceptions</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{f.notes}</p>
            </>
          )}

          <h2 className="mt-8 text-lg font-semibold tracking-tight">Care &amp; maintenance</h2>
          {CARE_SECTIONS.map((sec) => (
            <div key={sec.title} className="mt-4">
              <div className="text-xs font-semibold tracking-wider text-muted-foreground">
                {sec.title.toUpperCase()}
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {sec.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">{CARE_FOOTNOTE}</p>

          <div className="mt-8 rounded-xl border-2 border-border-strong p-5">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground">
              WORKMANSHIP WARRANTY
            </div>
            <p className="mt-2 text-sm">
              {profile.company || "The contractor"} warrants the workmanship above for{" "}
              <strong>{f.warrantyMonths} months</strong> from the completion date, subject
              to the care instructions on this document being followed. Finish product
              performance is covered by the manufacturer&apos;s own warranty.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-8">
            <div>
              <div className="border-b border-foreground h-10" />
              <div className="mt-1 text-xs text-muted-foreground">
                Client acceptance signature &amp; date
              </div>
            </div>
            <div>
              <div className="border-b border-foreground h-10" />
              <div className="mt-1 text-xs text-muted-foreground">
                {profile.company || "Contractor"} · authorised signature &amp; date
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
