/**
 * The floor, painted by the drum.
 *
 * The 3D stage needs the floor to *become* sanded as the machine works, lane by
 * lane, in the machine's own working width. Recolouring a grid of tiles is the
 * cheap way to do that and it looks like a spreadsheet: you see cells flip, not
 * a floor being cut.
 *
 * So the floor is a canvas. The drum draws on it — a stroke the width of the
 * real 0.50 m head, in the colour that pass leaves behind, along the same
 * boustrophedon path lib/floorPlan.ts gives the plan view. That canvas becomes
 * the material's colour map.
 *
 * A SECOND canvas is painted in lockstep as the roughness map, and it is the
 * detail that sells the whole thing. An old polyurethane finish is glossy;
 * freshly cut wood is dead matte. So the sanded region does not merely change
 * colour, it stops reflecting the room — you can see the sheen line travelling
 * across the floor ahead of the machine. That is a real property of the job,
 * rendered for free by the lighting rather than drawn on.
 *
 * No textures are fetched. Both canvases are generated at runtime, so the scene
 * keeps the zero-network-dependency property the rest of the simulator has.
 */

import type { FloorPlan } from "@/lib/floorPlan";
import { laneDirection } from "@/lib/floorPlan";
import type { RobotSpec } from "@/lib/robots";

/** Texels per metre. 96 puts a 12 m room at ~1150 px — plenty at this scale. */
const PX_PER_M = 96;
const MAX_PX = 2048;

/** Gloss of the original finish, and of raw cut wood, as roughness 0–1. */
const ROUGH_FINISHED = 0.28;
const ROUGH_CUT = 0.82;

/** Opacity of a cut stroke, so board grain survives being sanded. */
const CUT_ALPHA = 0.82;

export interface FloorCanvases {
  colour: HTMLCanvasElement;
  rough: HTMLCanvasElement;
  /** Canvas pixels per plan metre, after the MAX_PX clamp. */
  scale: number;
}

/** Deterministic noise so a reset repaints an identical floor. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Board layout + grain for the untouched floor. */
function paintBoards(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  base: string,
  seed: number
) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Strip flooring: boards run the long way, ~76 mm face, random end joints.
  const boardPx = 0.076 * scale;
  for (let y = 0; y < h; y += boardPx) {
    // Per-board tone variation — real hardwood is never one colour.
    const shade = (rnd() - 0.5) * 26;
    ctx.fillStyle = `rgba(${shade > 0 ? 255 : 0},${shade > 0 ? 255 : 0},${
      shade > 0 ? 255 : 0
    },${Math.abs(shade) / 255})`;
    ctx.fillRect(0, y, w, boardPx);

    // Grain: fine lines along the board.
    const lines = 5 + Math.floor(rnd() * 5);
    for (let g = 0; g < lines; g++) {
      const gy = y + rnd() * boardPx;
      ctx.strokeStyle = `rgba(60,38,18,${0.05 + rnd() * 0.09})`;
      ctx.lineWidth = Math.max(0.6, rnd() * 1.6);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      // A slight waver reads as wood; a straight line reads as a UI rule.
      for (let x = 0; x <= w; x += 40) {
        ctx.lineTo(x, gy + Math.sin((x / w) * 6 + g) * 1.2);
      }
      ctx.stroke();
    }

    // End joints between boards.
    let x = rnd() * 1.2 * scale;
    while (x < w) {
      ctx.strokeStyle = "rgba(40,24,10,0.34)";
      ctx.lineWidth = Math.max(1, scale * 0.006);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + boardPx);
      ctx.stroke();
      x += (0.9 + rnd() * 1.6) * scale;
    }

    // Board seam.
    ctx.strokeStyle = "rgba(40,24,10,0.26)";
    ctx.lineWidth = Math.max(1, scale * 0.005);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

/**
 * A painter bound to one job. Owns both canvases and the paint cursor.
 *
 * Painting is INCREMENTAL — each call strokes only the floor covered since the
 * last one, which is a few pixels per frame. Seeking backwards (Reset, or
 * dragging the clock back) is the only case that repaints from scratch, and it
 * is exact rather than approximate because the whole path is a pure function of
 * (pass, passPct).
 */
export class FloorPainter {
  readonly colour: HTMLCanvasElement;
  readonly rough: HTMLCanvasElement;
  readonly scale: number;
  private readonly cctx: CanvasRenderingContext2D;
  private readonly rctx: CanvasRenderingContext2D;
  private readonly plan: FloorPlan;
  private readonly robot: RobotSpec;
  private readonly seed: number;
  /** Last painted point, as absolute progress across all passes. */
  private cursor = -1;
  /** Set true whenever a canvas changed, so the caller can flag the texture. */
  dirty = true;

  constructor(plan: FloorPlan, robot: RobotSpec, seed = 1) {
    this.plan = plan;
    this.robot = robot;
    this.seed = seed;

    const raw = Math.min(MAX_PX, Math.round(plan.roomW * PX_PER_M));
    this.scale = raw / plan.roomW;
    const w = Math.round(plan.roomW * this.scale);
    const h = Math.round(plan.roomH * this.scale);

    this.colour = document.createElement("canvas");
    this.colour.width = w;
    this.colour.height = h;
    this.cctx = this.colour.getContext("2d")!;

    this.rough = document.createElement("canvas");
    this.rough.width = w;
    this.rough.height = h;
    this.rctx = this.rough.getContext("2d")!;

    this.reset();
  }

  /** Colour a pass leaves behind, from the machine's published pass list. */
  private leaveColour(passIndex: number): string {
    const passes = this.robot.passes;
    if (!passes || !passes.length) return this.robot.floor.done;
    return passes[Math.min(passIndex, passes.length - 1)].leaves;
  }

  private passCount(): number {
    return this.robot.passes?.length || 1;
  }

  reset() {
    // Alpha leaks otherwise: strokeRange leaves it at CUT_ALPHA, which would
    // make the repainted base boards translucent over whatever was there.
    this.cctx.globalAlpha = 1;
    paintBoards(
      this.cctx,
      this.colour.width,
      this.colour.height,
      this.scale,
      this.robot.floor.base,
      this.seed
    );
    // Untouched floor still wears its old finish, so it is glossy.
    const g = Math.round(ROUGH_FINISHED * 255);
    this.rctx.fillStyle = `rgb(${g},${g},${g})`;
    this.rctx.fillRect(0, 0, this.rough.width, this.rough.height);
    this.cursor = -1;
    this.dirty = true;
  }

  /**
   * Paint up to `pass` (1-based) and `passPct` (0–100).
   *
   * Absolute progress is (pass - 1 + passPct/100), so a later pass repaints
   * over an earlier one in its own colour — which is what the grit sequence
   * does to a floor.
   */
  paintTo(pass: number, passPct: number) {
    const target = Math.max(
      0,
      Math.min(this.passCount(), pass - 1 + Math.max(0, Math.min(100, passPct)) / 100)
    );
    if (target === this.cursor) return;
    // Seeking backwards: the only case that needs a full repaint.
    if (target < this.cursor) this.reset();

    const from = Math.max(0, this.cursor);
    this.strokeRange(from, target);
    this.cursor = target;
    this.dirty = true;
    this.cctx.globalAlpha = 1;
  }

  /** Stroke every lane segment between two absolute-progress points. */
  private strokeRange(from: number, to: number) {
    const { laneCount, roomW, laneH } = this.plan;
    const s = this.scale;
    const drumPx = this.robot.workingWidthM * s;

    for (let p = Math.floor(from); p < Math.ceil(to) && p < this.passCount(); p++) {
      const a = Math.max(from - p, 0);
      const b = Math.min(to - p, 1);
      if (b <= a) continue;

      const laneA = a * laneCount;
      const laneB = b * laneCount;
      this.cctx.strokeStyle = this.leaveColour(p);
      this.cctx.lineCap = "butt";
      this.cctx.lineWidth = drumPx;
      // Translucent, not opaque. A solid stroke covered the boards, the grain
      // and the end joints, so the sanded half of the floor came out a flat
      // cream field — sanding was erasing the wood instead of revealing it,
      // which is the exact opposite of what a contractor is paying for. At 0.82
      // the grain reads through, and successive passes converge on the pass
      // colour the way successive grits actually do.
      this.cctx.globalAlpha = CUT_ALPHA;
      const rg = Math.round(ROUGH_CUT * 255);
      this.rctx.strokeStyle = `rgb(${rg},${rg},${rg})`;
      this.rctx.lineCap = "butt";
      this.rctx.lineWidth = drumPx;

      for (let lane = Math.floor(laneA); lane < Math.ceil(laneB); lane++) {
        const t0 = Math.max(laneA - lane, 0);
        const t1 = Math.min(laneB - lane, 1);
        if (t1 <= t0) continue;
        const dir = laneDirection(lane);
        const y = (lane + 0.5) * laneH * s;
        const x0 = (dir === 1 ? t0 * roomW : roomW - t0 * roomW) * s;
        const x1 = (dir === 1 ? t1 * roomW : roomW - t1 * roomW) * s;

        for (const ctx of [this.cctx, this.rctx]) {
          ctx.beginPath();
          ctx.moveTo(x0, y);
          ctx.lineTo(x1, y);
          ctx.stroke();
        }
        this.cctx.globalAlpha = 1;

        // Planetary swirl. A drum sander leaves fine arcs, not a flat band;
        // without them the cut lane is a solid rectangle and reads as paint.
        // Colour map only — they are a pattern in the surface, not in its
        // gloss, so the roughness map stays uniform across the cut.
        this.cctx.save();
        this.cctx.globalAlpha = 0.06;
        this.cctx.strokeStyle = "#3f2d17";
        this.cctx.lineWidth = Math.max(0.7, drumPx * 0.03);
        const step = drumPx * 0.45;
        const lo = Math.min(x0, x1);
        const hi = Math.max(x0, x1);
        for (let x = Math.ceil(lo / step) * step; x < hi; x += step) {
          this.cctx.beginPath();
          this.cctx.arc(x, y, drumPx * 0.34, 0, Math.PI * 2);
          this.cctx.stroke();
        }
        this.cctx.restore();
        this.cctx.globalAlpha = CUT_ALPHA;
      }
    }
  }
}
