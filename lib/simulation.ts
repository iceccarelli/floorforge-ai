import {
  GRIT_SEQUENCE,
  SANDER_M2_PER_HOUR_PER_PASS,
  SQFT_PER_M2,
  DUST_CAPTURE_TARGET_PCT,
} from "@/lib/product";
import type { EventType } from "@/lib/types";
import { getRobot } from "@/lib/robots";
import { planFloor, type FloorPlan } from "@/lib/floorPlan";

/** The two machines this job uses, read from the canonical spec file. */
const SANDER = getRobot("sand");
const EDGER = getRobot("edge");

/**
 * A simulated ForgeSand D1 running a job.
 *
 * WHAT THIS IS. A deterministic model of a machine that does not exist,
 * emitting telemetry in exactly the shape SOFTWARE_HARDWARE_CONTRACT.md
 * specifies, at the cadence it specifies, into the same event vocabulary
 * `lib/types.ts` defines and `POST /api/telemetry` accepts.
 *
 * WHAT THIS IS NOT. A recording of hardware. No FloorForge machine has
 * refinished a floor. Every number below is generated from the design targets
 * in lib/product.ts plus bounded noise — the console labels it as simulated on
 * every surface, and this comment is the second place that is written down.
 *
 * WHY IT EARNS ITS PLACE. The completion report tells contractors that three of
 * its fields are "auto later" — filled from `pass_completed`, `dust_reading`
 * and `coverage_check` telemetry when hardware exists. That is a promise the
 * site could not previously demonstrate. This runs the loop for real: the
 * simulated machine emits the events, the console consumes them, and the
 * finished run writes those exact fields into the job's completion report. The
 * data path is genuine even though the machine is not, which means the day a
 * real D1 posts to /api/telemetry, nothing downstream changes.
 *
 * Cadences and payloads follow the contract:
 *   pressure_reading      1 Hz     psi, sensor_health
 *   dust_reading          1 Hz     ugm3, location
 *   coverage_checkpoint   ~5 min   pass_number, distance_traveled_m, estimated_coverage_pct
 *   pass_started/completed per pass
 */

/** Deterministic PRNG so a given job always runs the same way. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimEvent {
  seq: number;
  /** Simulated seconds since job start. */
  t: number;
  device_id: string;
  job_id: string;
  timestamp: string;
  event_type: EventType;
  data: Record<string, unknown>;
}

/**
 * Which machine is working, and on what.
 *
 * A job is not one machine's job. The drum cuts the field; the band it cannot
 * reach is the edger's, and a real crew alternates them grit by grit rather
 * than sanding the whole floor and edging at the end.
 */
export type PhaseKind = "field" | "edge";

export interface Phase {
  kind: PhaseKind;
  /** 0-based grit index — both machines work the same sequence. */
  index: number;
  grit: string;
  /** 1-based pass number as it appears in telemetry. */
  passNumber: number;
  t0: number;
  durationSec: number;
  deviceId: string;
  /** lib/robots.ts id, so every renderer looks up the same spec. */
  robotId: "sand" | "edge";
  /** The area this phase is responsible for, in m². */
  areaM2: number;
}

export interface SimSnapshot {
  t: number;
  pass: number;
  passCount: number;
  grit: string;
  /** Which machine is on the floor right now, and what it is working. */
  phase: PhaseKind;
  robotId: "sand" | "edge";
  /** Coverage of the CURRENT phase, 0-100 — drives both machines' poses. */
  passPct: number;
  /** Coverage of the whole job across all passes, 0-100. */
  overallPct: number;
  areaDoneM2: number;
  totalAreaM2: number;
  psi: number;
  ugm3: number;
  distanceM: number;
  finished: boolean;
  /** Per-type counts, matching the contract's volume table. */
  counts: Record<string, number>;
  /** Newest first, capped — a 3-hour job emits ~14,000 events. */
  log: SimEvent[];
  passResults: PassResult[];
}

export interface PassResult {
  pass: number;
  grit: string;
  /** "field" (drum) or "edge" (edger) — a pass number alone is now ambiguous. */
  kind: PhaseKind;
  robotId: "sand" | "edge";
  durationSec: number;
  coveragePct: number;
  /** Area this pass was responsible for, in m². */
  targetAreaM2: number;
  avgPressurePsi: number;
  peakPressurePsi: number;
  avgDustUgm3: number;
}

const LOG_CAP = 60;
const CHECKPOINT_EVERY_SEC = 300;

export interface SimConfig {
  sqft: number;
  grits: string[];
  /** The sander. Its telemetry carries this in `device_id`. */
  deviceId: string;
  /** The edger. A second machine on the same job means a second device id. */
  edgerDeviceId: string;
  jobId: string;
  startedAt: Date;
  seed: number;
}

export function makeConfig(
  sqft: number,
  grits: string[] | undefined,
  jobId: string,
  startedAt: Date
): SimConfig {
  const seq = grits && grits.length ? grits : [...GRIT_SEQUENCE];
  // Seed from the job so a run is reproducible — a demo that shows different
  // numbers every reload reads as a random-number generator, not a machine.
  let h = 0;
  for (let i = 0; i < jobId.length; i++) h = (h * 31 + jobId.charCodeAt(i)) >>> 0;
  return {
    sqft: Math.max(100, sqft || 1200),
    grits: seq,
    deviceId: "FF-S001",
    edgerDeviceId: "FF-E001",
    jobId,
    startedAt,
    seed: h || 1,
  };
}

/**
 * The whole run, computed up front.
 *
 * Generating the full event stream once and then replaying it against a clock
 * keeps the UI trivially seekable and pausable, and means the completion-report
 * summary is derived from the same events the console displayed — not from a
 * second, parallel calculation that could disagree with it.
 */
export class JobSimulation {
  readonly cfg: SimConfig;
  readonly totalAreaM2: number;
  /** Geometry both renderers and this simulation share. */
  readonly plan: FloorPlan;
  readonly passDurationSec: number;
  readonly edgeDurationSec: number;
  readonly totalDurationSec: number;
  readonly phases: Phase[];
  private readonly events: SimEvent[];
  private readonly rand: () => number;

  constructor(cfg: SimConfig) {
    this.cfg = cfg;
    this.rand = mulberry32(cfg.seed);
    this.totalAreaM2 = cfg.sqft / SQFT_PER_M2;

    // The floor is split the way the machines actually split it: the field the
    // drum can reach, and the band at the wall it cannot. Same module the plan
    // view and the 3D scene read, so all three agree on where the line is.
    this.plan = planFloor(this.totalAreaM2, SANDER.workingWidthM, SANDER.edgeGapM ?? 0);

    // The drum's pass now covers the FIELD, not the whole floor.
    this.passDurationSec = Math.round(
      (this.plan.fieldAreaM2 / SANDER_M2_PER_HOUR_PER_PASS) * 3600
    );
    // The edger's lap comes from its own published spec: 18 m²/h through a
    // 0.14 m head is ~129 linear m/h. Not from the estimator's 40 ft/h, which
    // is the rate for a person on their knees with a hand edger.
    const edgerLinearMPerHour = EDGER.coverageM2PerHour / EDGER.workingWidthM;
    this.edgeDurationSec = Math.max(
      60,
      Math.round((this.plan.bandPathM / edgerLinearMPerHour) * 3600)
    );

    // Field, then edge, at every grit — which is the order a crew works in,
    // because you cannot edge at 120 before the field has been cut at 36.
    let t = 0;
    let passNumber = 0;
    this.phases = [];
    for (let i = 0; i < cfg.grits.length; i++) {
      this.phases.push({
        kind: "field",
        index: i,
        grit: cfg.grits[i],
        passNumber: ++passNumber,
        t0: t,
        durationSec: this.passDurationSec,
        deviceId: cfg.deviceId,
        robotId: "sand",
        areaM2: this.plan.fieldAreaM2,
      });
      t += this.passDurationSec;
      this.phases.push({
        kind: "edge",
        index: i,
        grit: cfg.grits[i],
        passNumber: ++passNumber,
        t0: t,
        durationSec: this.edgeDurationSec,
        deviceId: cfg.edgerDeviceId,
        robotId: "edge",
        areaM2: this.plan.bandAreaM2,
      });
      t += this.edgeDurationSec;
    }
    this.totalDurationSec = t;
    this.events = this.generate();
  }

  /** The phase in progress at simulated time `t`. */
  phaseAt(t: number): Phase {
    const clamped = Math.max(0, Math.min(t, this.totalDurationSec - 0.001));
    for (let i = this.phases.length - 1; i >= 0; i--) {
      if (clamped >= this.phases[i].t0) return this.phases[i];
    }
    return this.phases[0];
  }

  private iso(t: number): string {
    return new Date(this.cfg.startedAt.getTime() + t * 1000).toISOString();
  }

  /**
   * Pressure rises with coarser grit; bounded to the contract's 0-10 psi range.
   * The edger runs lighter — a small oscillating head against a wall cannot be
   * loaded like a 0.50 m drum, and a model that showed them identical would be
   * saying the two machines are interchangeable.
   */
  private psiFor(passIdx: number, jitter: number, kind: PhaseKind): number {
    const base = (kind === "edge" ? 2.3 : 3.4) - passIdx * 0.25;
    return Math.min(10, Math.max(0, Number((base + (jitter - 0.5) * 0.5).toFixed(2))));
  }

  /** Dust falls as grit gets finer; the coarse pass throws the most. */
  private dustFor(passIdx: number, jitter: number, kind: PhaseKind): number {
    const base = (kind === "edge" ? 12 : 17) - passIdx * 2.2;
    return Math.max(0, Number((base + (jitter - 0.5) * 3).toFixed(1)));
  }

  private generate(): SimEvent[] {
    const out: SimEvent[] = [];
    let seq = 0;

    for (const ph of this.phases) {
      const push = (t: number, event_type: EventType, data: Record<string, unknown>) => {
        out.push({
          seq: seq++,
          t,
          device_id: ph.deviceId,
          job_id: this.cfg.jobId,
          timestamp: this.iso(t),
          event_type,
          data,
        });
      };

      // `zone` is the only addition to the payloads, and it goes INSIDE `data`,
      // which lib/validators.ts:370 accepts as an opaque object. So a two-machine
      // job stays exactly as ingestible as a one-machine job was — which is the
      // claim the console makes above the event stream, and it still holds.
      const zone = ph.kind === "field" ? "field" : "perimeter";
      const path =
        ph.kind === "field"
          ? this.plan.passDistanceM
          : this.plan.bandPathM;

      push(ph.t0, "pass_started", {
        pass_number: ph.passNumber,
        grit_tag: ph.grit,
        zone,
        target_coverage_area_m2: Number(ph.areaM2.toFixed(1)),
        estimated_duration_sec: ph.durationSec,
      });

      const psiSamples: number[] = [];
      const dustSamples: number[] = [];
      // 1 Hz sensor stream, per SOFTWARE_HARDWARE_CONTRACT.md:33 and :239. A
      // real 3-hour job is ~7,200 of each; we generate them all so the counts
      // shown match the contract's volume table rather than a prettier number.
      for (let s = 1; s <= ph.durationSec; s++) {
        const t = ph.t0 + s;
        const psi = this.psiFor(ph.index, this.rand(), ph.kind);
        const ugm3 = this.dustFor(ph.index, this.rand(), ph.kind);
        psiSamples.push(psi);
        dustSamples.push(ugm3);
        push(t, "pressure_reading", { psi, zone, sensor_health: "ok" });
        push(t, "dust_reading", { ugm3, zone, location: "extraction_point" });

        if (s % CHECKPOINT_EVERY_SEC === 0) {
          const pct = Number(((s / ph.durationSec) * 100).toFixed(1));
          push(t, "coverage_checkpoint", {
            pass_number: ph.passNumber,
            zone,
            distance_traveled_m: Number((path * (s / ph.durationSec)).toFixed(1)),
            estimated_coverage_pct: pct,
          });
        }
      }

      const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
      // The edger works to a wall it can see, so it finishes its band more
      // completely than a drum finishes an open field.
      const coverage =
        ph.kind === "field"
          ? Number((97.4 + this.rand() * 2.2).toFixed(1))
          : Number((98.6 + this.rand() * 1.2).toFixed(1));
      push(ph.t0 + ph.durationSec, "pass_completed", {
        pass_number: ph.passNumber,
        grit_tag: ph.grit,
        zone,
        duration_sec: ph.durationSec,
        coverage_area_m2: Number((ph.areaM2 * (coverage / 100)).toFixed(1)),
        target_coverage_area_m2: Number(ph.areaM2.toFixed(1)),
        coverage_pct: coverage,
        avg_pressure_psi: Number(avg(psiSamples).toFixed(2)),
        peak_pressure_psi: Number(Math.max(...psiSamples).toFixed(2)),
        avg_dust_ugm3: Number(avg(dustSamples).toFixed(1)),
      });
    }

    return out;
  }

  /** State of the machine at simulated time `t`. */
  snapshotAt(t: number): SimSnapshot {
    const clamped = Math.max(0, Math.min(t, this.totalDurationSec));
    const seen = this.events.filter((e) => e.t <= clamped);
    const counts: Record<string, number> = {};
    for (const e of seen) counts[e.event_type] = (counts[e.event_type] ?? 0) + 1;

    const ph = this.phaseAt(clamped);
    const passIdx = ph.index;
    const inPass = clamped - ph.t0;
    const passPct = Math.min(100, (inPass / ph.durationSec) * 100);

    const lastPsi = [...seen].reverse().find((e) => e.event_type === "pressure_reading");
    const lastDust = [...seen].reverse().find((e) => e.event_type === "dust_reading");

    const passResults: PassResult[] = seen
      .filter((e) => e.event_type === "pass_completed")
      .map((e) => ({
        pass: e.data.pass_number as number,
        grit: e.data.grit_tag as string,
        kind: (e.data.zone === "perimeter" ? "edge" : "field") as PhaseKind,
        robotId: (e.data.zone === "perimeter" ? "edge" : "sand") as "sand" | "edge",
        durationSec: e.data.duration_sec as number,
        coveragePct: e.data.coverage_pct as number,
        targetAreaM2: (e.data.target_coverage_area_m2 as number) ?? 0,
        avgPressurePsi: e.data.avg_pressure_psi as number,
        peakPressurePsi: e.data.peak_pressure_psi as number,
        avgDustUgm3: e.data.avg_dust_ugm3 as number,
      }));

    return {
      t: clamped,
      pass: passIdx + 1,
      passCount: this.cfg.grits.length,
      grit: ph.grit,
      phase: ph.kind,
      robotId: ph.robotId,
      passPct,
      overallPct: Math.min(100, (clamped / this.totalDurationSec) * 100),
      areaDoneM2: ph.areaM2 * (passPct / 100),
      totalAreaM2: this.totalAreaM2,
      psi: (lastPsi?.data.psi as number) ?? 0,
      ugm3: (lastDust?.data.ugm3 as number) ?? 0,
      // Distance is now per machine and per phase, not one figure divided by
      // the drum's width — the edger's head is 0.14 m, not 0.50 m.
      distanceM:
        (ph.kind === "field" ? this.plan.passDistanceM : this.plan.bandPathM) *
        (passPct / 100),
      finished: clamped >= this.totalDurationSec,
      counts,
      log: seen.slice(-LOG_CAP).reverse(),
      passResults,
    };
  }

  /**
   * The completion-report fields this run produces.
   *
   * These are exactly the three the report marks "auto later", derived from the
   * events above and nothing else — which is the point of the whole exercise.
   */
  reportFields(): {
    gritsExecuted: string;
    avgDustUgm3: string;
    approvalScore: string;
    totalHours: number;
    overallCoveragePct: number;
    /** Drum coverage, as a share of the field it is responsible for. */
    fieldCoveragePct: number;
    /** Edger coverage, as a share of the perimeter band. */
    perimeterCoveragePct: number;
    fieldAreaM2: number;
    bandAreaM2: number;
    fieldDeviceId: string;
    perimeterDeviceId: string;
  } {
    const s = this.snapshotAt(this.totalDurationSec);
    const avgDust =
      s.passResults.reduce((a, p) => a + p.avgDustUgm3, 0) / (s.passResults.length || 1);
    const mean = (xs: number[]) =>
      xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

    const field = mean(
      s.passResults.filter((p) => p.kind === "field").map((p) => p.coveragePct)
    );
    const perimeter = mean(
      s.passResults.filter((p) => p.kind === "edge").map((p) => p.coveragePct)
    );

    // The floor figure is AREA-WEIGHTED, not the mean of the two percentages.
    // The band is ~5% of the floor, so averaging the two numbers would let a
    // perfectly edged perimeter paper over a badly cut field, and vice versa.
    const area = this.plan.fieldAreaM2 + this.plan.bandAreaM2;
    const overall =
      (field * this.plan.fieldAreaM2 + perimeter * this.plan.bandAreaM2) / (area || 1);

    return {
      gritsExecuted: this.cfg.grits.join(", "),
      avgDustUgm3: avgDust.toFixed(1),
      // Coverage is the dominant term; a job that covers 98% of the floor does
      // not score 98/100 on its own, so this is deliberately conservative.
      approvalScore: String(Math.min(100, Math.round(overall - 1))),
      totalHours: Number((this.totalDurationSec / 3600).toFixed(2)),
      overallCoveragePct: Number(overall.toFixed(1)),
      fieldCoveragePct: Number(field.toFixed(1)),
      perimeterCoveragePct: Number(perimeter.toFixed(1)),
      fieldAreaM2: Number(this.plan.fieldAreaM2.toFixed(1)),
      bandAreaM2: Number(this.plan.bandAreaM2.toFixed(1)),
      fieldDeviceId: this.cfg.deviceId,
      perimeterDeviceId: this.cfg.edgerDeviceId,
    };
  }
}

/** Design target the dust figures are generated against, for display. */
export const DUST_TARGET_PCT = DUST_CAPTURE_TARGET_PCT;
