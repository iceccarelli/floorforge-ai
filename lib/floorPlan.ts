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
  /** Number of lanes needed to cover the room at the machine's working width. */
  laneCount: number;
  /** Centre-to-centre lane spacing. Slightly less than the working width. */
  laneH: number;
  /** Fraction of the drum that re-cuts the previous lane, 0–1. */
  overlap: number;
  /** Total distance the machine travels in one pass, in metres. */
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
export function planFloor(areaM2: number, workingWidthM: number): FloorPlan {
  const area = Math.max(1, areaM2);
  const roomW = Math.sqrt((area * 4) / 3);
  const roomH = area / roomW;

  // Lane COUNT comes from the working width; lane PITCH is then the room
  // divided by that count, so the lanes tile the floor exactly.
  //
  // Laying them at a flat working width instead put 19 x 0.50 m of lane into a
  // 9.09 m room: the last lane hung past the wall and the machine finished the
  // job standing outside the building. A real path planner has the same problem
  // and solves it the same way — you never get a whole number of passes out of
  // a room, so the passes overlap slightly. That overlap is also what stops a
  // floor banding at the seams.
  const laneCount = Math.max(1, Math.ceil(roomH / workingWidthM));
  const laneH = roomH / laneCount;

  return {
    roomW,
    roomH,
    laneCount,
    laneH,
    overlap: Math.max(0, (workingWidthM - laneH) / workingWidthM),
    passDistanceM: laneCount * roomW,
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

  const travelled = laneProgress * plan.roomW;
  return {
    x: dir === 1 ? travelled : plan.roomW - travelled,
    y: (lane + 0.5) * plan.laneH,
    dir,
    lane,
    laneProgress,
  };
}

/**
 * Plan metres -> scene metres, origin at the centre of the floor.
 * Plan y (down the page) becomes scene z (away from the camera).
 */
export function toScene(plan: FloorPlan, x: number, y: number): [number, number] {
  return [x - plan.roomW / 2, y - plan.roomH / 2];
}
