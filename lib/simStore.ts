"use client";

import { create } from "zustand";
import { ROBOTS } from "@/lib/robots";

export interface SimMetrics {
  coveragePct: number; // 0..100, cells processed on the CURRENT pass
  elapsedSec: number; // wall-clock seconds of the running sim
  jobEtaSec: number; // realistic full-job estimate (all passes) from coverage rate
  areaM2: number; // room area
  pass: number; // 1-based index of the pass in progress
  passCount: number; // total passes this machine runs
  passTag: string; // short label of the current pass ("36", "Seal", "Scan")
}

export type CameraMode = "orbit" | "follow" | "top";

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

  /** 0 = assembled, 1 = fully exploded. Drives the web inspection view. */
  exploded: number;
  /** Show the chassis as a cutaway (hide the top shell) to reveal internals. */
  cutaway: boolean;
  /** How the camera behaves: free orbit, chase the robot, or plan view. */
  cameraMode: CameraMode;

  select: (id: string) => void;
  setRoom: (w: number, l: number) => void;
  setSpeed: (s: number) => void;
  toggleRun: () => void;
  reset: () => void;
  setMetrics: (m: Partial<SimMetrics>) => void;
  setExploded: (v: number) => void;
  toggleCutaway: () => void;
  setCameraMode: (m: CameraMode) => void;
}

export const useSim = create<SimState>((set) => ({
  selectedId: ROBOTS[0].id,
  roomW: 6,
  roomL: 5,
  running: false,
  speed: 8,
  metrics: {
    coveragePct: 0,
    elapsedSec: 0,
    jobEtaSec: 0,
    areaM2: 30,
    pass: 1,
    passCount: 1,
    passTag: "",
  },
  resetToken: 0,
  exploded: 0,
  cutaway: false,
  cameraMode: "orbit",

  select: (id) =>
    set((s) => ({
      selectedId: id,
      running: false,
      resetToken: s.resetToken + 1,
      metrics: { ...s.metrics, coveragePct: 0, elapsedSec: 0, pass: 1 },
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
        pass: 1,
      },
    })),
  setSpeed: (speed) => set({ speed }),
  toggleRun: () => set((s) => ({ running: !s.running })),
  setExploded: (exploded) => set({ exploded: Math.max(0, Math.min(1, exploded)) }),
  toggleCutaway: () => set((s) => ({ cutaway: !s.cutaway })),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  reset: () =>
    set((s) => ({
      running: false,
      resetToken: s.resetToken + 1,
      metrics: { ...s.metrics, coveragePct: 0, elapsedSec: 0, pass: 1 },
    })),
  setMetrics: (m) => set((s) => ({ metrics: { ...s.metrics, ...m } })),
}));
