/**
 * Coverage path planning for the FloorForge simulator.
 *
 * Two real, textbook coverage strategies:
 *  - boustrophedon ("ox-plough"): parallel back-and-forth lanes spaced by
 *    the robot's working width. Standard for area coverage (sanding,
 *    coating, scanning, plank rows).
 *  - perimeter: concentric inward rings, used by the edger which only
 *    services the room boundary + transitions.
 *
 * The floor is modelled on the XZ plane, centred at the origin, so a
 * roomW x roomL room spans x in [-W/2, W/2], z in [-L/2, L/2].
 */

export type Vec2 = { x: number; z: number };

export interface PlanInput {
  roomW: number; // metres (X)
  roomL: number; // metres (Z)
  workingWidthM: number;
  pattern: "boustrophedon" | "perimeter";
}

/** Total travel distance of a waypoint list, in metres. */
export function pathLength(points: Vec2[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
  }
  return d;
}

function boustrophedon(roomW: number, roomL: number, lane: number): Vec2[] {
  const halfW = roomW / 2;
  const halfL = roomL / 2;
  const margin = lane / 2;
  const usableW = Math.max(roomW - lane, 0);
  const lanes = Math.max(1, Math.ceil(usableW / lane) + 1);
  const pts: Vec2[] = [];
  for (let i = 0; i < lanes; i++) {
    const x = lanes === 1 ? 0 : -halfW + margin + (i * (roomW - lane)) / (lanes - 1);
    const top = -halfL + margin;
    const bottom = halfL - margin;
    if (i % 2 === 0) {
      pts.push({ x, z: top }, { x, z: bottom });
    } else {
      pts.push({ x, z: bottom }, { x, z: top });
    }
  }
  return pts;
}

function perimeter(roomW: number, roomL: number, lane: number): Vec2[] {
  const rings: Vec2[] = [];
  const maxRings = Math.max(
    1,
    Math.floor(Math.min(roomW, roomL) / (2 * lane))
  );
  for (let r = 0; r < maxRings; r++) {
    const inset = lane / 2 + r * lane;
    const x = roomW / 2 - inset;
    const z = roomL / 2 - inset;
    if (x <= 0 || z <= 0) break;
    rings.push(
      { x: -x, z: -z },
      { x, z: -z },
      { x, z },
      { x: -x, z },
      { x: -x, z: -z }
    );
  }
  return rings.length ? rings : [{ x: 0, z: 0 }];
}

export function planPath(input: PlanInput): Vec2[] {
  const lane = Math.max(0.05, input.workingWidthM);
  return input.pattern === "perimeter"
    ? perimeter(input.roomW, input.roomL, lane)
    : boustrophedon(input.roomW, input.roomL, lane);
}
