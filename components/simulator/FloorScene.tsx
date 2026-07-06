"use client";

import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getRobot } from "@/lib/robots";
import { planPath, pathLength, type Vec2 } from "@/lib/pathPlanning";
import { useSim } from "@/lib/simStore";

const RAW = new THREE.Color("#cdb187");
const FINISHED = new THREE.Color("#7a4a22");

/** Point-to-segment distance on the XZ plane. */
function segDist(px: number, pz: number, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  let t = len2 === 0 ? 0 : ((px - a.x) * dx + (pz - a.z) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), pz - (a.z + t * dz));
}

export default function FloorScene() {
  const selectedId = useSim((s) => s.selectedId);
  const roomW = useSim((s) => s.roomW);
  const roomL = useSim((s) => s.roomL);
  const resetToken = useSim((s) => s.resetToken);
  const setMetrics = useSim((s) => s.setMetrics);

  const robot = getRobot(selectedId);

  // --- floor grid (instanced) ---------------------------------------
  const grid = useMemo(() => {
    const target = 0.3; // ~30cm plank cells
    const cols = Math.min(64, Math.max(6, Math.round(roomW / target)));
    const rows = Math.min(64, Math.max(6, Math.round(roomL / target)));
    const cw = roomW / cols;
    const ch = roomL / rows;
    const centers: Vec2[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        centers.push({
          x: -roomW / 2 + cw * (c + 0.5),
          z: -roomL / 2 + ch * (r + 0.5),
        });
      }
    }
    return { cols, rows, cw, ch, centers, count: centers.length };
  }, [roomW, roomL]);

  const path = useMemo(
    () =>
      planPath({
        roomW,
        roomL,
        workingWidthM: robot.workingWidthM,
        pattern: robot.pattern,
      }),
    [roomW, roomL, robot.workingWidthM, robot.pattern]
  );
  const totalLen = useMemo(() => pathLength(path), [path]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const robotRef = useRef<THREE.Group>(null);
  const processed = useRef<Uint8Array>(new Uint8Array(grid.count));
  const traveled = useRef(0);
  const elapsed = useRef(0);
  const acc = useRef(0);
  const finishedColor = useMemo(
    () => FINISHED.clone().lerp(new THREE.Color(robot.color), 0.15),
    [robot.color]
  );

  // Initialise / reset instance matrices + colors.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    processed.current = new Uint8Array(grid.count);
    traveled.current = 0;
    elapsed.current = 0;
    for (let i = 0; i < grid.count; i++) {
      const p = grid.centers[i];
      dummy.position.set(p.x, 0, p.z);
      dummy.scale.set(grid.cw * 0.94, 1, grid.ch * 0.94);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // subtle per-plank variance so it reads as wood, not a flat grid
      const v = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const shade = RAW.clone().offsetHSL(0, 0, (v - 0.5) * 0.06);
      mesh.setColorAt(i, shade);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (robotRef.current && path.length) {
      robotRef.current.position.set(path[0].x, 0, path[0].z);
    }
    setMetrics({
      coveragePct: 0,
      elapsedSec: 0,
      areaM2: roomW * roomL,
      jobEtaSec: (roomW * roomL) / robot.coverageM2PerHour * 3600,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, path, resetToken, robot.id]);

  useFrame((_, delta) => {
    const { running, speed } = useSim.getState();
    if (!running || totalLen === 0) return;
    const mesh = meshRef.current;
    if (!mesh) return;

    const prev = traveled.current;
    const step = robot.speedMps * speed * Math.min(delta, 0.05);
    traveled.current = Math.min(totalLen, prev + step);
    elapsed.current += Math.min(delta, 0.05);

    // locate robot position + the segment(s) covered this frame
    let d = 0;
    let pos: Vec2 = path[0];
    let segA: Vec2 = path[0];
    let segB: Vec2 = path[0];
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      const segLen = Math.hypot(b.x - a.x, b.z - a.z);
      if (d + segLen >= traveled.current) {
        const t = segLen === 0 ? 0 : (traveled.current - d) / segLen;
        pos = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
        segA = a;
        segB = b;
        break;
      }
      d += segLen;
    }

    // orient + move robot
    if (robotRef.current) {
      robotRef.current.position.set(pos.x, 0, pos.z);
      const heading = Math.atan2(segB.x - segA.x, segB.z - segA.z);
      robotRef.current.rotation.y = heading;
    }

    // mark swath cells processed (distance to the just-travelled segment)
    const half = robot.workingWidthM / 2 + Math.max(grid.cw, grid.ch) * 0.5;
    const swathA = pos;
    const swathB: Vec2 = { x: pos.x, z: pos.z }; // conservative: fill around pos
    // widen the fill to the segment span covered this frame for high speeds
    const covered = { a: segA, b: pos };
    let changed = false;
    for (let i = 0; i < grid.count; i++) {
      if (processed.current[i]) continue;
      const p = grid.centers[i];
      if (
        segDist(p.x, p.z, covered.a, covered.b) <= half ||
        segDist(p.x, p.z, swathA, swathB) <= half
      ) {
        processed.current[i] = 1;
        mesh.setColorAt(i, finishedColor);
        changed = true;
      }
    }
    if (changed && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // throttle metric pushes (~10hz)
    acc.current += delta;
    const done = traveled.current >= totalLen - 1e-3;
    if (acc.current >= 0.1 || done) {
      acc.current = 0;
      let count = 0;
      for (let i = 0; i < grid.count; i++) count += processed.current[i];
      setMetrics({
        coveragePct: (count / grid.count) * 100,
        elapsedSec: elapsed.current,
      });
      if (done) useSim.setState({ running: false });
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <hemisphereLight args={["#ffffff", "#8a7355", 0.4]} />

      {/* baseboards */}
      <mesh position={[0, 0.05, -roomL / 2]} receiveShadow>
        <boxGeometry args={[roomW + 0.1, 0.12, 0.06]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, roomL / 2]} receiveShadow>
        <boxGeometry args={[roomW + 0.1, 0.12, 0.06]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.9} />
      </mesh>

      {/* instanced plank floor */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, grid.count]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.55} metalness={0.05} />
      </instancedMesh>

      <group ref={robotRef}>
        {/* robot mesh is injected by the parent via children slot below */}
        <RobotChild robotId={robot.id} />
      </group>

      <OrbitControls
        enablePan
        enableZoom
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0.2, 0]}
      />
    </>
  );
}

// Small wrapper so RobotMesh (which imports the spec) stays decoupled.
import RobotMesh from "@/components/simulator/RobotMesh";
function RobotChild({ robotId }: { robotId: string }) {
  return <RobotMesh robot={getRobot(robotId)} />;
}
