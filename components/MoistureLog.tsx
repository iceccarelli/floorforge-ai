"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_MOISTURE,
  assessReadiness,
  requiredSlabTestLocations,
  AMBIENT_RH_PCT,
  AMBIENT_TEMP_F,
  type CheckStatus,
  type MoistureInputs,
} from "@/lib/moisture";
import { getJob, updateJob, type JobRecord } from "@/lib/jobs";

/**
 * The readiness log.
 *
 * Every other tool here helps price or document work. This one exists to say
 * "not today" — and to leave a dated record that it said so.
 *
 * DESIGN RULE. No verdict appears without the published limit it was measured
 * against and the document that limit comes from, side by side, on screen and
 * in print. A tool that says "FAIL" without showing whose rule it applied is
 * asking to be trusted; this one is asking to be checked.
 */

function NumField({
  id,
  label,
  value,
  onChange,
  suffix,
  step = 0.5,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
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
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

const STATUS: Record<
  CheckStatus,
  { icon: typeof CheckCircle; cls: string; word: string }
> = {
  pass: { icon: CheckCircle, cls: "text-success", word: "Within limit" },
  fail: { icon: XCircle, cls: "text-danger", word: "Over limit" },
  watch: { icon: AlertTriangle, cls: "text-accent", word: "Worth noting" },
  na: { icon: Info, cls: "text-muted-foreground", word: "Not scored" },
};

export default function MoistureLog() {
  const [m, setM] = useState<MoistureInputs>(DEFAULT_MOISTURE);
  const [jobId, setJobId] = useState<string | null>(null);
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    // Deferred past a microtask so React commits first — the pattern
    // FLOORFORGE_02 established for react-hooks/set-state-in-effect.
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      setToday(new Date().toLocaleDateString());
      const id = new URLSearchParams(window.location.search).get("job");
      const job: JobRecord | null = getJob(id);
      if (job) {
        setJobId(job.id);
        // A job already knows its area. Reading it here means the slab
        // test-location count is right without anyone retyping the number.
        setM({ ...DEFAULT_MOISTURE, ...(job.moisture ?? {}), sqft: job.estimate.sqft });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!jobId) return;
    updateJob(jobId, { moisture: m });
  }, [jobId, m]);

  const set = <K extends keyof MoistureInputs>(k: K, v: MoistureInputs[K]) =>
    setM((p) => ({ ...p, [k]: v }));

  const r = useMemo(() => assessReadiness(m), [m]);

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* ------------------------------- readings ------------------------- */}
      <div className="lg:col-span-2 print:hidden">
        <div className="card p-6 md:p-7 bg-card border-2 border-border-strong">
          <h2 className="text-lg font-semibold tracking-tight mb-5">The readings</h2>

          <fieldset>
            <legend className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
              SUBFLOOR
            </legend>
            <div className="flex gap-2">
              {(["wood", "concrete"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set("subfloor", k)}
                  aria-pressed={m.subfloor === k}
                  className={`min-h-11 flex-1 rounded-lg border-2 px-3 text-sm font-medium transition-colors ${
                    m.subfloor === k
                      ? "border-accent bg-accent-light text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k === "wood" ? "Wood" : "Concrete"}
                </button>
              ))}
            </div>
          </fieldset>

          {m.subfloor === "wood" ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <NumField
                  id="mo-sub"
                  label="SUBFLOOR MC"
                  value={m.subfloorMcPct}
                  onChange={(n) => set("subfloorMcPct", n)}
                  suffix="%"
                />
                <NumField
                  id="mo-floor"
                  label="FLOORING MC"
                  value={m.flooringMcPct}
                  onChange={(n) => set("flooringMcPct", n)}
                  suffix="%"
                />
              </div>
              <fieldset className="mt-5">
                <legend className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                  FACE WIDTH
                </legend>
                <div className="flex gap-2">
                  {(
                    [
                      ["strip", "Strip — under 3 in."],
                      ["plank", "Plank — 3 in. and wider"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => set("width", k)}
                      aria-pressed={m.width === k}
                      className={`min-h-11 flex-1 rounded-lg border-2 px-3 text-sm font-medium transition-colors ${
                        m.width === k
                          ? "border-accent bg-accent-light text-foreground"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                  The allowable difference is not the same for both: 3 inches is
                  where the published guidance changes.
                </p>
              </fieldset>
            </>
          ) : (
            <>
              <fieldset className="mt-5">
                <legend className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                  TEST METHOD
                </legend>
                <div className="flex gap-2">
                  {(
                    [
                      ["rh", "In-situ RH — F2170"],
                      ["mver", "Calcium chloride — F1869"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => set("concreteMethod", k)}
                      aria-pressed={m.concreteMethod === k}
                      className={`min-h-11 flex-1 rounded-lg border-2 px-3 text-sm font-medium transition-colors ${
                        m.concreteMethod === k
                          ? "border-accent bg-accent-light text-foreground"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {m.concreteMethod === "rh" ? (
                  <NumField
                    id="mo-rh"
                    label="SLAB RH"
                    value={m.slabRhPct}
                    onChange={(n) => set("slabRhPct", n)}
                    suffix="%"
                  />
                ) : (
                  <NumField
                    id="mo-mver"
                    label="EMISSION"
                    value={m.slabMverLb}
                    onChange={(n) => set("slabMverLb", n)}
                    suffix="lb"
                    step={0.1}
                  />
                )}
                <NumField
                  id="mo-sqft"
                  label="SLAB AREA"
                  value={m.sqft}
                  onChange={(n) => set("sqft", n)}
                  suffix="sqft"
                  step={50}
                  hint={
                    <>
                      {requiredSlabTestLocations(m.sqft)} test locations required for this
                      area.
                    </>
                  }
                />
              </div>
            </>
          )}

          <div className="mt-5 grid grid-cols-2 gap-4">
            <NumField
              id="mo-temp"
              label="JOBSITE TEMP"
              value={m.ambientTempF}
              onChange={(n) => set("ambientTempF", n)}
              suffix="°F"
              step={1}
            />
            <NumField
              id="mo-arh"
              label="JOBSITE RH"
              value={m.ambientRhPct}
              onChange={(n) => set("ambientRhPct", n)}
              suffix="%"
              step={1}
            />
          </div>
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
            Normal living conditions are {AMBIENT_TEMP_F.min}–{AMBIENT_TEMP_F.max} °F and{" "}
            {AMBIENT_RH_PCT.min}–{AMBIENT_RH_PCT.max}% RH for most areas.
          </p>
        </div>
      </div>

      {/* ------------------------------- verdict -------------------------- */}
      <div className="lg:col-span-3">
        <div
          className={`card p-6 md:p-7 border-2 ${
            r.clear ? "border-border-strong bg-card" : "border-danger bg-card"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {r.clear
                  ? r.watching > 0
                    ? "Nothing over a published limit — with notes"
                    : "Nothing over a published limit"
                  : `${r.failing} reading${r.failing === 1 ? "" : "s"} over a published limit`}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.clear
                  ? "This is a record of what you measured, not a certification that the floor is ready."
                  : "The guidance says not to install on this. Dry it, or change the assembly."}
              </p>
            </div>
            <Button
              variant="secondary"
              className="h-11 print:hidden shrink-0"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>

          <table className="mt-6 w-full text-sm">
            <caption className="sr-only">
              Each reading, the published limit it was measured against, and the document
              that limit comes from
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Check</th>
                <th scope="col">Reading</th>
                <th scope="col">Published limit</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {r.checks.map((c) => {
                const S = STATUS[c.status];
                const Icon = S.icon;
                return (
                  <tr key={c.key} className="border-t border-border align-top">
                    <td className="py-4 pr-3">
                      <div className="flex gap-2.5">
                        <Icon
                          className={`mt-0.5 h-4 w-4 flex-shrink-0 ${S.cls}`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">{c.label}</div>
                          <div className="mt-1 font-mono text-xs text-foreground">
                            {c.reading}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            Limit: {c.limit} · <span className={S.cls}>{S.word}</span>
                          </div>
                          <p className="mt-2 text-xs leading-snug text-muted-foreground">
                            {c.note}
                          </p>
                          <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                            <span className="font-medium text-foreground">Source:</span>{" "}
                            {c.source}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {today && (
            <p className="mt-6 text-xs text-muted-foreground">
              Recorded {today}
              {jobId ? " · saved to this job" : ""}.
            </p>
          )}
        </div>

        <div
          role="note"
          className="card mt-6 border-2 border-border p-5 text-sm text-muted-foreground"
        >
          <p>
            <strong className="font-semibold text-foreground">
              These are the industry&apos;s numbers, not FloorForge&apos;s.
            </strong>{" "}
            Every limit above comes from NWFA installation guidance or the named ASTM test
            method, and each one is printed beside the reading it judged so you can check
            it. FloorForge has measured none of them and certifies nothing. Where your
            flooring manufacturer&apos;s specification differs, the manufacturer&apos;s
            specification governs — and a passing reading here is a record of one moment
            at one location, not a warranty.
          </p>
        </div>
      </div>
    </div>
  );
}
