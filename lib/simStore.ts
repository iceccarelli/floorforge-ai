"use client";

import { create } from "zustand";
import { ROBOTS } from "@/lib/robots";

export interface SimMetrics {
  coveragePct: number; // 0..100, cells processed
  elapsedSec: number; // wall-clock seconds of the running sim
  jobEtaSec: number; // realistic full-job estimate from coverage rate
  areaM2: number; // room area
}

interface SimState {
  selectedId: string;
  roomW: number;
  roomL: number;
  running: boolean;
  /** Playback multiplier: how many "sim seconds" pass per real second. */
  speed: number;
  metrics: SimMetrics;
  /** Bump this to force the scene to rebuild the floor + replan. */
  resetToken: number;

  select: (id: string) => void;
  setRoom: (w: number, l: number) => void;
  setSpeed: (s: number) => void;
  toggleRun: () => void;
  reset: () => void;
  setMetrics: (m: Partial<SimMetrics>) => void;
}

export const useSim = create<SimState>((set) => ({
  selectedId: ROBOTS[0].id,
  roomW: 6,
  roomL: 5,
  running: false,
  speed: 8,
  metrics: { coveragePct: 0, elapsedSec: 0, jobEtaSec: 0, areaM2: 30 },
  resetToken: 0,

  select: (id) =>
    set((s) => ({
      selectedId: id,
      running: false,
      resetToken: s.resetToken + 1,
      metrics: { ...s.metrics, coveragePct: 0, elapsedSec: 0 },
    })),
  setRoom: (roomW, roomL) =>
    set((s) => ({
      roomW,
      roomL,
      running: false,
      resetToken: s.resetToken + 1,
      metrics: {
        ...s.metrics,
        areaM2: roomW * roomL,
        coveragePct: 0,
        elapsedSec: 0,
      },
    })),
  setSpeed: (speed) => set({ speed }),
  toggleRun: () => set((s) => ({ running: !s.running })),
  reset: () =>
    set((s) => ({
      running: false,
      resetToken: s.resetToken + 1,
      metrics: { ...s.metrics, coveragePct: 0, elapsedSec: 0 },
    })),
  setMetrics: (m) => set((s) => ({ metrics: { ...s.metrics, ...m } })),
}));
