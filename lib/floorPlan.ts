/**
 * The floor plan a job is run against — one definition, two renderers.
 *
 * `/live` draws the same job twice: a top-down plan (components/LiveFloorView)
 * and a 3D stage (components/live/LiveScene3D). Those started as separate
 * pieces of geometry and would have drifted the first time either changed —
 * the room would be one size in the plan and another in the scene, and the
 * machine would be in two places at once on the same page. Both now read this.
 *
 * Everything here derives from two inputs: the job's area, and the machine's
 * published working width from lib/robots.ts. Nothing is hand-tuned.
 *
 * COORDINATES. `pose()` returns plan-space metres with the origin at the room's
 * top-left corner, x to the right, y down — which is what SVG wants. The 3D
 * scene re-centres to its own origin with `toScene()` rather than keeping a
 * second copy of the maths.
 */

export interface FloorPlan {
  /** Room width in metres (long axis). */
  roomW: number;
  /** Room depth in metres. */
  roomH: number;
  /** Total floor area. */
  areaM2: number;

  /**
   * The band at the wall the drum cannot reach, in metres, from the machine's
   * published `edgeGapM`. Zero for a machine that cuts to its own edge.
   */
  inset: number;
  /** The field the drum CAN reach — the room, less the band on all four sides. */
  fieldW: number;
  fieldH: number;
  fieldAreaM2: number;
  /** The band itself: the edger's whole job. */
  bandAreaM2: number;
  /** Length of one lap of the band's centreline, in metres. */
  bandPathM: number;

  /** Number of lanes needed to cover the FIELD at the machine's working width. */
  laneCount: number;
  /** Centre-to-centre lane spacing. Slightly less than the working width. */
  laneH: number;
  /** Fraction of the drum that re-cuts the previous lane, 0–1. */
  overlap: number;
  /** Total distance the machine travels in one field pass, in metres. */
  passDistanceM: number;
}

export interface Pose {
  /** Position of the DRUM — the cut boundary — in plan metres. */
  x: number;
  y: number;
  /** +1 travelling left-to-right, -1 right-to-left. */
  dir: 1 | -1;
  /** 0-based index of the lane being cut. */
  lane: number;
  /** Progress along the current lane, 0–1. */
  laneProgress: number;
}

/**
 * Room proportioned 4:3 from the job's area.
 *
 * A real plan comes from the site scan, which does not exist. Both renderers
 * say so on screen rather than letting a viewer assume this is their floor.
 */
export function planFloor(
  areaM2: number,
  workingWidthM: number,
  edgeGapM = 0
): FloorPlan {
  const area = Math.max(1, areaM2);
  const roomW = Math.sqrt((area * 4) / 3);
  const roomH = area / roomW;

  // The drum's field is the room less the band it cannot reach, on all four
  // walls. Lanes tile the FIELD, not the room — before this, they tiled the
  // room, which is how the console came to report that a 0.50 m drum inside a
  // chassis had cut 100% of the floor while the estimator on the next tab was
  // billing the same contractor for the perimeter.
  const inset = Math.max(0, Math.min(edgeGapM, Math.min(roomW, roomH) / 4));
  const fieldW = roomW - inset * 2;
  const fieldH = roomH - inset * 2;
  const fieldAreaM2 = fieldW * fieldH;

  // Lane COUNT comes from the working width; lane PITCH is then the room
  // divided by that count, so the lanes tile the floor exactly.
  //
  // Laying them at a flat working width instead put 19 x 0.50 m of lane into a
  // 9.09 m room: the last lane hung past the wall and the machine finished the
  // job standing outside the building. A real path planner has the same problem
  // and solves it the same way — you never get a whole number of passes out of
  // a room, so the passes overlap slightly. That overlap is also what stops a
  // floor banding at the seams.
  const laneCount = Math.max(1, Math.ceil(fieldH / workingWidthM));
  const laneH = fieldH / laneCount;

  return {
    roomW,
    roomH,
    areaM2: area,
    inset,
    fieldW,
    fieldH,
    fieldAreaM2,
    bandAreaM2: area - fieldAreaM2,
    // Centreline of the band, half the inset in from each wall.
    bandPathM: 2 * (roomW - inset) + 2 * (roomH - inset),
    laneCount,
    laneH,
    overlap: Math.max(0, (workingWidthM - laneH) / workingWidthM),
    passDistanceM: laneCount * fieldW,
  };
}

/** Boustrophedon: even lanes run left-to-right, odd lanes right-to-left. */
export function laneDirection(lane: number): 1 | -1 {
  return lane % 2 === 0 ? 1 : -1;
}

/**
 * Where the machine is at a given point through a pass.
 *
 * `passPct` is 0–100, straight off SimSnapshot.passPct, so the drawing is a
 * function of the telemetry rather than of its own animation clock. Two
 * renderers reading the same snapshot therefore agree by construction.
 */
export function pose(plan: FloorPlan, passPct: number): Pose {
  const progress = Math.max(0, Math.min(1, passPct / 100));
  const finished = progress >= 1;
  const laneFloat = progress * plan.laneCount;

  // At exactly 100% a naive floor() rolls onto a lane that does not exist and
  // snaps the machine back to the start of it. Park it at the end of the last
  // lane instead — where a machine that just finished actually is.
  const lane = finished ? plan.laneCount - 1 : Math.floor(laneFloat);
  const laneProgress = finished ? 1 : laneFloat - lane;
  const dir = laneDirection(lane);

  const travelled = laneProgress * plan.fieldW;
  return {
    x: plan.inset + (dir === 1 ? travelled : plan.fieldW - travelled),
    y: plan.inset + (lane + 0.5) * plan.laneH,
    dir,
    lane,
    laneProgress,
  };
}

/**
 * Where the EDGER is at a given point through its lap of the perimeter.
 *
 * One continuous loop clockwise from the top-left, along the centreline of the
 * band. Returned in the same plan coordinates as `pose()`, so the two machines
 * are drawn by the same code in both renderers.
 */
export function perimeterPose(plan: FloorPlan, pct: number): Pose {
  const t = Math.max(0, Math.min(1, pct / 100));
  const h = plan.inset / 2;
  const x0 = h;
  const y0 = h;
  const x1 = plan.roomW - h;
  const y1 = plan.roomH - h;
  const top = x1 - x0;
  const right = y1 - y0;
  const legs = [top, right, top, right];
  const total = legs.reduce((a, b) => a + b, 0);

  let d = t * total;
  let leg = 0;
  while (leg < 3 && d > legs[leg]) {
    d -= legs[leg];
    leg++;
  }
  const f = legs[leg] > 0 ? d / legs[leg] : 0;

  // Clockwise: top L->R, right T->B, bottom R->L, left B->T.
  const pts: Array<[number, number, 1 | -1]> = [
    [x0 + f * top, y0, 1],
    [x1, y0 + f * right, 1],
    [x1 - f * top, y1, -1],
    [x0, y1 - f * right, -1],
  ];
  const [x, y, dir] = pts[leg];
  return { x, y, dir, lane: leg, laneProgress: f };
}

/**
 * Plan metres -> scene metres, origin at the centre of the floor.
 * Plan y (down the page) becomes scene z (away from the camera).
 */
export function toScene(plan: FloorPlan, x: number, y: number): [number, number] {
  return [x - plan.roomW / 2, y - plan.roomH / 2];
}
