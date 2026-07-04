"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Clock, Users, Award, ArrowRight } from "lucide-react";

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
    
    const complexityMultiplier = jobType === "commercial" ? 1.15 : 0.92;
    const baseRobotEfficiency = 0.38; // 62% time reduction baseline
    
    const adjustedEfficiency = baseRobotEfficiency * complexityMultiplier;
    const robotHours = Math.round(manualHours * adjustedEfficiency);
    const timeSavedHours = manualHours - robotHours;
    const timeSavedPercent = Math.round((timeSavedHours / manualHours) * 100);
    
    // Robot requirement: ~2200 sqft per robot per day for full multi-grit + finish
    const robotsRecommended = Math.max(1, Math.ceil(sqft / 2200));
    
    // Economics
    const blendedLaborRate = 78; // realistic crew blended
    const laborSaved = Math.round(timeSavedHours * blendedLaborRate);
    
    return {
      robotHours,
      timeSavedHours,
      timeSavedPercent,
      robotsRecommended,
      laborSaved,
      jobTypeLabel: jobType === "commercial" ? "Commercial" : "Residential",
    };
  }, [inputs]);

  const updateInput = (key: keyof ROIInputs, value: number | string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card p-8 md:p-10 bg-white border-2 border-slate-200">
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
          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">FLOOR AREA (SQFT)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1500" 
                max="45000" 
                step="500"
                value={inputs.sqft} 
                onChange={(e) => updateInput("sqft", parseInt(e.target.value))}
                className="flex-1 accent-accent" 
              />
              <div className="w-24 text-right font-mono text-lg font-semibold tabular-nums">{inputs.sqft.toLocaleString()}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">CURRENT MANUAL HOURS PER JOB</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="20" 
                max="280" 
                step="5"
                value={inputs.manualHours} 
                onChange={(e) => updateInput("manualHours", parseInt(e.target.value))}
                className="flex-1 accent-accent" 
              />
              <div className="w-16 text-right font-mono text-lg font-semibold tabular-nums">{inputs.manualHours}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-muted-foreground mb-2">JOB TYPE</label>
            <div className="flex gap-2">
              {(["residential", "commercial"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => updateInput("jobType", type)}
                  className={`flex-1 h-11 rounded-lg border text-sm font-medium transition-all ${inputs.jobType === type 
                    ? "bg-accent text-white border-accent" 
                    : "bg-white border-border hover:bg-muted"}`}
                >
                  {type === "residential" ? "Residential" : "Commercial / Multi-unit"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results - Live updating */}
        <div className="lg:col-span-3">
          <div className="bg-slate-950 text-white rounded-2xl p-7">
            <div className="uppercase text-xs tracking-[2px] text-white/50 mb-4 flex items-center gap-2">
              MODELED ESTIMATES <div className="flex-1 h-px bg-white/20" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="roi-result">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Clock className="h-4 w-4" /> TIME SAVED
                </div>
                <div className="text-4xl lg:text-5xl font-semibold tabular-nums tracking-tighter roi-number">{results.timeSavedPercent}<span className="text-3xl align-super">%</span></div>
                <div className="text-sm text-white/60 mt-1">{results.timeSavedHours} hours per job</div>
              </div>

              <div className="roi-result">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Users className="h-4 w-4" /> ROBOTS NEEDED
                </div>
                <div className="text-4xl lg:text-5xl font-semibold tabular-nums tracking-tighter roi-number">{results.robotsRecommended}</div>
                <div className="text-sm text-white/60 mt-1">for parallel execution</div>
              </div>

              <div className="roi-result">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <TrendingUp className="h-4 w-4" /> LABOR COST SAVED
                </div>
                <div className="text-3xl lg:text-4xl font-semibold tabular-nums tracking-tighter roi-number">${results.laborSaved.toLocaleString()}</div>
                <div className="text-sm text-white/60 mt-1">per typical job</div>
              </div>

              <div className="roi-result">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Award className="h-4 w-4" /> ROBOT HOURS
                </div>
                <div className="text-4xl lg:text-5xl font-semibold tabular-nums tracking-tighter roi-number">{results.robotHours}</div>
                <div className="text-sm text-white/60 mt-1">modeled machine time</div>
              </div>
            </div>

            <div className="mt-7 pt-6 border-t border-white/10 text-xs text-white/60 leading-relaxed">
              <span className="font-medium text-white/80">Model assumptions:</span> $78/hr blended labor rate; automation efficiency baseline of 62% time reduction adjusted by job type; ~2,200 sqft per robot per day throughput target for {results.jobTypeLabel.toLowerCase()} work. These are design targets for the pilot program, not measured field data. Your numbers will differ — that&apos;s exactly what the pilot exists to establish.
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button 
                variant="accent" 
                className="flex-1 md:flex-none"
                onClick={() => {
                  const el = document.getElementById('pricing');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                See planned pricing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 md:flex-none border-white/30 text-white hover:bg-white/10"
                onClick={() => {
                  // Trigger chatbot with context
                  const chatBtn = document.querySelector('[aria-label="Open FloorForge Assistant"]') as HTMLButtonElement;
                  chatBtn?.click();
                  setTimeout(() => {
                    // Could enhance to prefill but for now just open
                  }, 300);
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
