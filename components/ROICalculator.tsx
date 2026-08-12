"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Clock, Users, Award, ArrowRight } from "lucide-react";
import { scrollToElement } from "@/lib/scroll";
import { openChatbot } from "@/lib/chatbot";
import {
  LABOR_TIME_REDUCTION_PCT,
  JOB_TYPE_ADJUSTMENT_PP,
  BLENDED_LABOR_RATE_USD,
  SANDING_SQFT_PER_ROBOT_DAY,
  GRIT_SEQUENCE,
} from "@/lib/product";

interface ROIInputs {
  sqft: number;
  manualHours: number;
  jobType: "residential" | "commercial";
}

export default function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputs>({
    sqft: 8500,
    manualHours: 95,
    jobType: "commercial",
  });

  const results = useMemo(() => {
    const { sqft, manualHours, jobType } = inputs;

    // Percentage points, not a multiplier, so every step is displayable.
    //
    // The old model multiplied retained time by 1.15 / 0.92 against a 0.38
    // baseline. Two defects, both in audit/PRODUCT_TRUTH.md T0-1: the
    // residential path displayed 64-67%, above the 60% figure
    // PRODUCT_SERVICE_DEFINITION.md:276 names as a claim that must not be made;
    // and the stated "62% baseline" was a number the tool could never actually
    // display, which is a strange thing for a calculator that sells itself on
    // transparency. 50% is now a ceiling — no input produces more.
    const adjustmentPp = JOB_TYPE_ADJUSTMENT_PP[jobType];
    const timeSavedPercent = LABOR_TIME_REDUCTION_PCT + adjustmentPp;

    const robotHours = Math.round(manualHours * (1 - timeSavedPercent / 100));
    const timeSavedHours = manualHours - robotHours;

    // Derived in lib/product.ts from the simulator's own coverage rate, so the
    // number quoted here and the number a visitor watches run on /simulator are
    // the same number. Sanding passes only — finish coats are additional.
    const robotsRecommended = Math.max(
      1,
      Math.ceil(sqft / SANDING_SQFT_PER_ROBOT_DAY)
    );

    const laborSaved = Math.round(timeSavedHours * BLENDED_LABOR_RATE_USD);

    return {
      robotHours,
      timeSavedHours,
      timeSavedPercent,
      adjustmentPp,
      robotsRecommended,
      laborSaved,
      jobTypeLabel: jobType === "commercial" ? "Commercial" : "Residential",
    };
  }, [inputs]);

  const updateInput = (key: keyof ROIInputs, value: number | string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card p-8 md:p-10 bg-card border-2 border-border-strong">
      <div className="flex items-center gap-3 mb-8">
        <div className="feature-icon">
          <Calculator className="h-6 w-6" />
        </div>
        <div>
          <div className="font-semibold text-2xl tracking-tight">Interactive ROI Model</div>
          <div className="text-muted-foreground text-sm">A transparent model of automation economics — estimates from the assumptions below, not measured results</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Both sliders previously had a <label> with no htmlFor and an <input>
              with no id — axe reported `label` (CRITICAL) on each, and a screen
              reader announced an unlabelled slider reading a bare number with no
              unit. Measured hit area was 16px tall against a 44px requirement.
              This is the ROI model, the page's strongest argument and a stated
              conversion path (audit/FINDINGS.md P0-4). */}
          <div>
            <label
              htmlFor="roi-sqft"
              className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
            >
              FLOOR AREA (SQFT)
            </label>
            <div className="flex items-center gap-4">
              <input
                id="roi-sqft"
                type="range"
                min="1500"
                max="45000"
                step="500"
                value={inputs.sqft}
                onChange={(e) => updateInput("sqft", parseInt(e.target.value))}
                aria-valuetext={`${inputs.sqft.toLocaleString()} square feet`}
                aria-describedby="roi-assumptions"
                className="range-control flex-1"
              />
              <output
                htmlFor="roi-sqft"
                className="w-24 text-right font-mono text-lg font-semibold tabular-nums"
              >
                {inputs.sqft.toLocaleString()}
              </output>
            </div>
          </div>

          <div>
            <label
              htmlFor="roi-hours"
              className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2"
            >
              CURRENT MANUAL HOURS PER JOB
            </label>
            <div className="flex items-center gap-4">
              <input
                id="roi-hours"
                type="range"
                min="20"
                max="280"
                step="5"
                value={inputs.manualHours}
                onChange={(e) => updateInput("manualHours", parseInt(e.target.value))}
                aria-valuetext={`${inputs.manualHours} hours per job`}
                aria-describedby="roi-assumptions"
                className="range-control flex-1"
              />
              <output
                htmlFor="roi-hours"
                className="w-16 text-right font-mono text-lg font-semibold tabular-nums"
              >
                {inputs.manualHours}
              </output>
            </div>
          </div>

          {/* Two mutually exclusive options is a radiogroup, not two buttons.
              Previously the only signal for which was selected was background
              colour — no aria-pressed, no role — which is a WCAG 1.4.1 failure
              as well as an ARIA gap. */}
          <fieldset>
            <legend className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">
              JOB TYPE
            </legend>
            <div className="flex gap-2" role="radiogroup" aria-label="Job type">
              {(["residential", "commercial"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={inputs.jobType === type}
                  onClick={() => updateInput("jobType", type)}
                  className={`flex-1 min-h-11 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    inputs.jobType === type
                      ? "bg-accent text-primary-foreground border-accent"
                      : "bg-card border-border-strong text-foreground hover:bg-muted"
                  }`}
                >
                  {type === "residential" ? "Residential" : "Commercial / Multi-unit"}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Results - Live updating */}
        <div className="lg:col-span-3">
          <div className="bg-surface-dark text-on-dark rounded-2xl p-7">
            <div className="uppercase text-xs tracking-[2px] text-white/50 mb-4 flex items-center gap-2">
              MODELED ESTIMATES <div className="flex-1 h-px bg-white/20" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="roi-result">
                <div className="flex items-center gap-2 text-success-on-dark mb-1">
                  <Clock className="h-4 w-4" /> TIME SAVED
                </div>
                <div className="text-4xl lg:text-5xl font-semibold tabular-nums tracking-tighter roi-number">{results.timeSavedPercent}<span className="text-3xl align-super">%</span></div>
                <div className="text-sm text-white/60 mt-1">{results.timeSavedHours} hours per job</div>
                {/* The arithmetic, on screen. A transparent model should be one
                    you can check without reading the source. */}
                <div className="text-xs text-white/60 mt-1 tabular-nums">
                  {LABOR_TIME_REDUCTION_PCT}% baseline
                  {results.adjustmentPp !== 0 && (
                    <> {results.adjustmentPp > 0 ? "+" : "−"}{Math.abs(results.adjustmentPp)} pts {results.jobTypeLabel.toLowerCase()}</>
                  )}
                </div>
              </div>

              <div className="roi-result">
                <div className="flex items-center gap-2 text-success-on-dark mb-1">
                  <Users className="h-4 w-4" /> ROBOTS NEEDED
                </div>
                <div className="text-4xl lg:text-5xl font-semibold tabular-nums tracking-tighter roi-number">{results.robotsRecommended}</div>
                <div className="text-sm text-white/60 mt-1">for parallel execution</div>
              </div>

              <div className="roi-result">
                <div className="flex items-center gap-2 text-success-on-dark mb-1">
                  <TrendingUp className="h-4 w-4" /> LABOR COST SAVED
                </div>
                <div className="text-3xl lg:text-4xl font-semibold tabular-nums tracking-tighter roi-number">${results.laborSaved.toLocaleString()}</div>
                <div className="text-sm text-white/60 mt-1">per typical job</div>
              </div>

              <div className="roi-result">
                <div className="flex items-center gap-2 text-success-on-dark mb-1">
                  <Award className="h-4 w-4" /> ROBOT HOURS
                </div>
                <div className="text-4xl lg:text-5xl font-semibold tabular-nums tracking-tighter roi-number">{results.robotHours}</div>
                <div className="text-sm text-white/60 mt-1">modeled machine time</div>
              </div>
            </div>

            <div id="roi-assumptions" className="mt-7 pt-6 border-t border-white/10 text-xs text-white/60 leading-relaxed">
              <span className="font-medium text-white/80">Model assumptions:</span> ${BLENDED_LABOR_RATE_USD}/hr blended labor rate; a {LABOR_TIME_REDUCTION_PCT}% labor time-reduction baseline{results.adjustmentPp !== 0 ? ` adjusted by ${Math.abs(results.adjustmentPp)} points for ${results.jobTypeLabel.toLowerCase()} complexity` : ""}, giving {results.timeSavedPercent}%; and {SANDING_SQFT_PER_ROBOT_DAY.toLocaleString()} sqft per robot per 8-hour day across a {GRIT_SEQUENCE.join("→")} grit sequence — the same coverage rate the 3D simulator runs, sanding passes only, finish coats additional. These are design targets for the pilot program, not measured field data. Your numbers will differ — that&apos;s exactly what the pilot exists to establish.
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button 
                variant="accent" 
                className="flex-1 md:flex-none"
                onClick={() => scrollToElement("pricing")}
              >
                See planned pricing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 md:flex-none border-white/30 text-white hover:bg-white/10"
                onClick={() => {
                  // Trigger chatbot with context
                  openChatbot();
                }}
              >
                Ask the demo assistant about this scenario
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
