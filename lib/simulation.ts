import {
  GRIT_SEQUENCE,
  SANDER_M2_PER_HOUR_PER_PASS,
  SQFT_PER_M2,
  DUST_CAPTURE_TARGET_PCT,
} from "@/lib/product";
import type { EventType } from "@/lib/types";

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

export interface SimSnapshot {
  t: number;
  pass: number;
  passCount: number;
  grit: string;
  /** Coverage of the CURRENT pass, 0-100. */
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
  durationSec: number;
  coveragePct: number;
  avgPressurePsi: number;
  peakPressurePsi: number;
  avgDustUgm3: number;
}

const LOG_CAP = 60;
const CHECKPOINT_EVERY_SEC = 300;

export interface SimConfig {
  sqft: number;
  grits: string[];
  deviceId: string;
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
  readonly passDurationSec: number;
  readonly totalDurationSec: number;
  private readonly events: SimEvent[];
  private readonly rand: () => number;

  constructor(cfg: SimConfig) {
    this.cfg = cfg;
    this.rand = mulberry32(cfg.seed);
    this.totalAreaM2 = cfg.sqft / SQFT_PER_M2;
    this.passDurationSec = Math.round(
      (this.totalAreaM2 / SANDER_M2_PER_HOUR_PER_PASS) * 3600
    );
    this.totalDurationSec = this.passDurationSec * cfg.grits.length;
    this.events = this.generate();
  }

  private iso(t: number): string {
    return new Date(this.cfg.startedAt.getTime() + t * 1000).toISOString();
  }

  /** Pressure rises with coarser grit; bounded to the contract's 0-10 psi range. */
  private psiFor(passIdx: number, jitter: number): number {
    const base = 3.4 - passIdx * 0.25;
    return Math.min(10, Math.max(0, Number((base + (jitter - 0.5) * 0.5).toFixed(2))));
  }

  /** Dust falls as grit gets finer; the coarse pass throws the most. */
  private dustFor(passIdx: number, jitter: number): number {
    const base = 17 - passIdx * 2.2;
    return Math.max(0, Number((base + (jitter - 0.5) * 3).toFixed(1)));
  }

  private generate(): SimEvent[] {
    const out: SimEvent[] = [];
    let seq = 0;
    const push = (t: number, event_type: EventType, data: Record<string, unknown>) => {
      out.push({
        seq: seq++,
        t,
        device_id: this.cfg.deviceId,
        job_id: this.cfg.jobId,
        timestamp: this.iso(t),
        event_type,
        data,
      });
    };

    this.cfg.grits.forEach((grit, i) => {
      const t0 = i * this.passDurationSec;
      push(t0, "pass_started", {
        pass_number: i + 1,
        grit_tag: grit,
        target_coverage_area_m2: Number(this.totalAreaM2.toFixed(1)),
        estimated_duration_sec: this.passDurationSec,
      });

      const psiSamples: number[] = [];
      const dustSamples: number[] = [];
      // 1 Hz sensor stream, per SOFTWARE_HARDWARE_CONTRACT.md:33 and :239. A
      // real 3-hour job is ~7,200 of each; we generate them all so the counts
      // shown match the contract's volume table rather than a prettier number.
      for (let s = 1; s <= this.passDurationSec; s++) {
        const t = t0 + s;
        const psi = this.psiFor(i, this.rand());
        const ugm3 = this.dustFor(i, this.rand());
        psiSamples.push(psi);
        dustSamples.push(ugm3);
        push(t, "pressure_reading", { psi, sensor_health: "ok" });
        push(t, "dust_reading", { ugm3, location: "extraction_point" });

        if (s % CHECKPOINT_EVERY_SEC === 0) {
          const pct = Number(((s / this.passDurationSec) * 100).toFixed(1));
          push(t, "coverage_checkpoint", {
            pass_number: i + 1,
            distance_traveled_m: Number(
              ((this.totalAreaM2 * (s / this.passDurationSec)) / 0.5).toFixed(1)
            ),
            estimated_coverage_pct: pct,
          });
        }
      }

      const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
      const coverage = Number((97.4 + this.rand() * 2.2).toFixed(1));
      push(t0 + this.passDurationSec, "pass_completed", {
        pass_number: i + 1,
        grit_tag: grit,
        duration_sec: this.passDurationSec,
        coverage_area_m2: Number((this.totalAreaM2 * (coverage / 100)).toFixed(1)),
        coverage_pct: coverage,
        avg_pressure_psi: Number(avg(psiSamples).toFixed(2)),
        peak_pressure_psi: Number(Math.max(...psiSamples).toFixed(2)),
        avg_dust_ugm3: Number(avg(dustSamples).toFixed(1)),
      });
    });

    return out;
  }

  /** State of the machine at simulated time `t`. */
  snapshotAt(t: number): SimSnapshot {
    const clamped = Math.max(0, Math.min(t, this.totalDurationSec));
    const seen = this.events.filter((e) => e.t <= clamped);
    const counts: Record<string, number> = {};
    for (const e of seen) counts[e.event_type] = (counts[e.event_type] ?? 0) + 1;

    const passIdx = Math.min(
      this.cfg.grits.length - 1,
      Math.floor(clamped / this.passDurationSec)
    );
    const inPass = clamped - passIdx * this.passDurationSec;
    const passPct = Math.min(100, (inPass / this.passDurationSec) * 100);

    const lastPsi = [...seen].reverse().find((e) => e.event_type === "pressure_reading");
    const lastDust = [...seen].reverse().find((e) => e.event_type === "dust_reading");

    const passResults: PassResult[] = seen
      .filter((e) => e.event_type === "pass_completed")
      .map((e) => ({
        pass: e.data.pass_number as number,
        grit: e.data.grit_tag as string,
        durationSec: e.data.duration_sec as number,
        coveragePct: e.data.coverage_pct as number,
        avgPressurePsi: e.data.avg_pressure_psi as number,
        peakPressurePsi: e.data.peak_pressure_psi as number,
        avgDustUgm3: e.data.avg_dust_ugm3 as number,
      }));

    return {
      t: clamped,
      pass: passIdx + 1,
      passCount: this.cfg.grits.length,
      grit: this.cfg.grits[passIdx],
      passPct,
      overallPct: Math.min(100, (clamped / this.totalDurationSec) * 100),
      areaDoneM2: this.totalAreaM2 * (passPct / 100),
      totalAreaM2: this.totalAreaM2,
      psi: (lastPsi?.data.psi as number) ?? 0,
      ugm3: (lastDust?.data.ugm3 as number) ?? 0,
      distanceM: (this.totalAreaM2 / 0.5) * (clamped / this.passDurationSec),
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
  } {
    const s = this.snapshotAt(this.totalDurationSec);
    const avgDust =
      s.passResults.reduce((a, p) => a + p.avgDustUgm3, 0) / (s.passResults.length || 1);
    const overall =
      s.passResults.reduce((a, p) => a + p.coveragePct, 0) / (s.passResults.length || 1);
    return {
      gritsExecuted: this.cfg.grits.join(", "),
      avgDustUgm3: avgDust.toFixed(1),
      // Coverage is the dominant term; a job that covers 98% of the floor does
      // not score 98/100 on its own, so this is deliberately conservative.
      approvalScore: String(Math.min(100, Math.round(overall - 1))),
      totalHours: Number((this.totalDurationSec / 3600).toFixed(2)),
      overallCoveragePct: Number(overall.toFixed(1)),
    };
  }
}

/** Design target the dust figures are generated against, for display. */
export const DUST_TARGET_PCT = DUST_CAPTURE_TARGET_PCT;
