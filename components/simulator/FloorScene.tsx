"use client";

import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getRobot } from "@/lib/robots";
import { planPath, pathLength, type Vec2 } from "@/lib/pathPlanning";
import { useSim } from "@/lib/simStore";
import RobotMesh from "@/components/simulator/RobotMesh";

/** Point-to-segment distance on the XZ plane. */
function segDist(px: number, pz: number, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  let t = len2 === 0 ? 0 : ((px - a.x) * dx + (pz - a.z) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), pz - (a.z + t * dz));
}

// cell colour states
const RAW = 0;
const DONE = 1;
const ACTIVE = 2;

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

  // per-cell state + cached colours
  const processed = useRef<Uint8Array>(new Uint8Array(grid.count));
  const colorState = useRef<Uint8Array>(new Uint8Array(grid.count));
  const baseColors = useRef<THREE.Color[]>([]);
  const prevActive = useRef<number[]>([]);
  const traveled = useRef(0);
  const elapsed = useRef(0);
  const prevTool = useRef<Vec2>({ x: 0, z: 0 });
  const acc = useRef(0);

  const doneColor = useMemo(() => new THREE.Color(robot.floor.done), [robot.floor.done]);
  const activeColor = useMemo(() => new THREE.Color(robot.floor.active), [robot.floor.active]);
  const baseColor = useMemo(() => new THREE.Color(robot.floor.base), [robot.floor.base]);

  // Initialise / reset instance matrices + colours (flat on the XZ plane).
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    processed.current = new Uint8Array(grid.count);
    colorState.current = new Uint8Array(grid.count);
    baseColors.current = new Array(grid.count);
    prevActive.current = [];
    traveled.current = 0;
    elapsed.current = 0;

    for (let i = 0; i < grid.count; i++) {
      const p = grid.centers[i];
      // Lay each plane FLAT: rotate the instance -90deg about X so its
      // local +Z normal points up (+Y). No mesh-level rotation, so the
      // world XZ positions below are honoured exactly.
      dummy.position.set(p.x, 0.011, p.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(grid.cw * 0.96, grid.ch * 0.96, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // subtle per-plank shade variance so it reads as wood, not a grid
      const v = Math.abs((Math.sin((i + 1) * 12.9898) * 43758.5453) % 1);
      const shade = baseColor.clone().offsetHSL(0, (v - 0.5) * 0.04, (v - 0.5) * 0.05);
      baseColors.current[i] = shade;
      mesh.setColorAt(i, shade);
      colorState.current[i] = RAW;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (robotRef.current && path.length) {
      robotRef.current.position.set(path[0].x, 0, path[0].z);
      prevTool.current = { x: path[0].x, z: path[0].z };
    }
    setMetrics({
      coveragePct: 0,
      elapsedSec: 0,
      areaM2: roomW * roomL,
      jobEtaSec: ((roomW * roomL) / robot.coverageM2PerHour) * 3600,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, path, resetToken, robot.id]);

  useFrame((_, delta) => {
    const { running, speed } = useSim.getState();
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);

    // advance travel only while running
    if (running && totalLen > 0) {
      traveled.current = Math.min(totalLen, traveled.current + robot.speedMps * speed * dt);
      elapsed.current += dt;
    }

    // locate robot position + current segment
    let d = 0;
    let pos: Vec2 = path[0];
    let segA: Vec2 = path[0];
    let segB: Vec2 = path.length > 1 ? path[1] : path[0];
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

    // heading + forward unit vector (direction of travel)
    let fx = segB.x - segA.x;
    let fz = segB.z - segA.z;
    const flen = Math.hypot(fx, fz) || 1;
    fx /= flen;
    fz /= flen;
    const heading = Math.atan2(fx, fz);

    if (robotRef.current) {
      robotRef.current.position.set(pos.x, 0, pos.z);
      robotRef.current.rotation.y = heading;
    }

    // the working head sits ahead of the robot centre
    const tool: Vec2 = {
      x: pos.x + fx * robot.toolOffsetM,
      z: pos.z + fz * robot.toolOffsetM,
    };
    const half = robot.workingWidthM / 2 + Math.max(grid.cw, grid.ch) * 0.5;
    const activeR = robot.workingWidthM / 2 + Math.min(grid.cw, grid.ch) * 0.5;

    let changed = false;

    // 1) mark cells the tool has swept since last frame as processed
    if (running) {
      for (let i = 0; i < grid.count; i++) {
        if (processed.current[i]) continue;
        const p = grid.centers[i];
        if (segDist(p.x, p.z, prevTool.current, tool) <= half) {
          processed.current[i] = 1;
        }
      }
    }

    // 2) resolve colours: active patch (under tool) > done > raw.
    //    Restore last frame's active cells first, then light the new ones.
    for (const idx of prevActive.current) {
      const want = processed.current[idx] ? DONE : RAW;
      if (colorState.current[idx] !== want) {
        mesh.setColorAt(idx, want === DONE ? doneColor : baseColors.current[idx]);
        colorState.current[idx] = want;
        changed = true;
      }
    }
    prevActive.current = [];

    for (let i = 0; i < grid.count; i++) {
      const p = grid.centers[i];
      const underTool =
        running && Math.hypot(p.x - tool.x, p.z - tool.z) <= activeR;
      let want: number;
      if (underTool) want = ACTIVE;
      else if (processed.current[i]) want = DONE;
      else want = RAW;

      if (want === ACTIVE) prevActive.current.push(i);

      if (colorState.current[i] !== want) {
        mesh.setColorAt(
          i,
          want === ACTIVE ? activeColor : want === DONE ? doneColor : baseColors.current[i]
        );
        colorState.current[i] = want;
        changed = true;
      }
    }

    if (changed && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    prevTool.current = tool;

    // metrics (~10hz) + stop at completion
    acc.current += delta;
    const done = totalLen > 0 && traveled.current >= totalLen - 1e-3;
    if (running && (acc.current >= 0.1 || done)) {
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
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[5, 9, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
      />
      <hemisphereLight args={["#ffffff", "#6b5640", 0.5]} />

      {/* dark subfloor so plank seams read as gaps, not holes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW + 0.2, roomL + 0.2]} />
        <meshStandardMaterial color="#2c241d" roughness={0.95} />
      </mesh>

      {/* baseboards */}
      <mesh position={[0, 0.06, -roomL / 2 - 0.03]} castShadow receiveShadow>
        <boxGeometry args={[roomW + 0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#eef0f2" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.06, roomL / 2 + 0.03]} castShadow receiveShadow>
        <boxGeometry args={[roomW + 0.12, 0.12, 0.05]} />
        <meshStandardMaterial color="#eef0f2" roughness={0.9} />
      </mesh>
      <mesh position={[-roomW / 2 - 0.03, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 0.12, roomL + 0.02]} />
        <meshStandardMaterial color="#eef0f2" roughness={0.9} />
      </mesh>
      <mesh position={[roomW / 2 + 0.03, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 0.12, roomL + 0.02]} />
        <meshStandardMaterial color="#eef0f2" roughness={0.9} />
      </mesh>

      {/* instanced plank floor (flat, per-instance oriented) */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, grid.count]}
        receiveShadow
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.5} metalness={0.04} />
      </instancedMesh>

      <group ref={robotRef}>
        <RobotMesh robot={robot} />
      </group>

      <OrbitControls
        enablePan
        enableZoom
        minDistance={2}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.2, 0]}
      />
    </>
  );
}
