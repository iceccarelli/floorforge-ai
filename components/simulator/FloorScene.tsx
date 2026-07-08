"use client";

import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import { getRobot } from "@/lib/robots";
import { planPath, pathLength, type Vec2 } from "@/lib/pathPlanning";
import { useSim } from "@/lib/simStore";
import RobotMesh from "@/components/simulator/RobotMesh";
import Room from "@/components/simulator/Room";

/** Point-to-segment distance on the XZ plane. */
function segDist(px: number, pz: number, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  let t = len2 === 0 ? 0 : ((px - a.x) * dx + (pz - a.z) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), pz - (a.z + t * dz));
}

const DUST_MAX = 160;

export default function FloorScene() {
  const selectedId = useSim((s) => s.selectedId);
  const roomW = useSim((s) => s.roomW);
  const roomL = useSim((s) => s.roomL);
  const resetToken = useSim((s) => s.resetToken);
  const cameraMode = useSim((s) => s.cameraMode);
  const setMetrics = useSim((s) => s.setMetrics);

  const robot = getRobot(selectedId);

  // ordered work passes (fallback: single pass leaving floor.done)
  const passList = useMemo(
    () =>
      robot.passes && robot.passes.length
        ? robot.passes
        : [{ label: "", tag: "", leaves: robot.floor.done }],
    [robot.passes, robot.floor.done]
  );
  const passCount = passList.length;
  const leaveColors = useMemo(
    () => passList.map((p) => new THREE.Color(p.leaves)),
    [passList]
  );

  // --- floor grid (instanced) ---------------------------------------
  const grid = useMemo(() => {
    const target = 0.3;
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
  const dustRef = useRef<THREE.Points>(null);

  // per-cell completed-pass count + cached raw colours
  const cellPass = useRef<Uint8Array>(new Uint8Array(grid.count));
  // last colour code written per cell (cellPass value, or 255 = hot/active)
  const colorState = useRef<Uint8Array>(new Uint8Array(grid.count));
  const baseColors = useRef<THREE.Color[]>([]);
  const prevActive = useRef<number[]>([]);
  const traveled = useRef(0);
  const elapsed = useRef(0);
  const curPass = useRef(1);
  const justWrapped = useRef(false);
  const prevTool = useRef<Vec2>({ x: 0, z: 0 });
  const acc = useRef(0);

  // dust particle pool
  const dust = useRef({
    pos: new Float32Array(DUST_MAX * 3),
    vel: new Float32Array(DUST_MAX * 3),
    life: new Float32Array(DUST_MAX),
    spawnAcc: 0,
  });

  const activeColor = useMemo(() => new THREE.Color(robot.floor.active), [robot.floor.active]);
  const baseColor = useMemo(() => new THREE.Color(robot.floor.base), [robot.floor.base]);

  const restColor = (i: number): THREE.Color => {
    const cp = cellPass.current[i];
    return cp === 0 ? baseColors.current[i] : leaveColors[Math.min(cp, passCount) - 1];
  };

  // Initialise / reset -------------------------------------------------
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    cellPass.current = new Uint8Array(grid.count);
    colorState.current = new Uint8Array(grid.count); // 0 = raw resting
    baseColors.current = new Array(grid.count);
    prevActive.current = [];
    traveled.current = 0;
    elapsed.current = 0;
    curPass.current = 1;
    justWrapped.current = false;

    for (let i = 0; i < grid.count; i++) {
      const p = grid.centers[i];
      dummy.position.set(p.x, 0.012, p.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(grid.cw * 0.96, grid.ch * 0.96, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const v = Math.abs((Math.sin((i + 1) * 12.9898) * 43758.5453) % 1);
      const shade = baseColor.clone().offsetHSL(0, (v - 0.5) * 0.04, (v - 0.5) * 0.05);
      baseColors.current[i] = shade;
      mesh.setColorAt(i, shade);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (robotRef.current && path.length) {
      robotRef.current.position.set(path[0].x, 0, path[0].z);
      prevTool.current = { x: path[0].x, z: path[0].z };
    }

    // reset dust
    dust.current.life.fill(0);

    setMetrics({
      coveragePct: 0,
      elapsedSec: 0,
      areaM2: roomW * roomL,
      jobEtaSec: ((roomW * roomL) / robot.coverageM2PerHour) * 3600 * passCount,
      pass: 1,
      passCount,
      passTag: passList[0].tag,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, path, resetToken, robot.id]);

  useFrame((state, delta) => {
    const { running, speed, cameraMode: camMode } = useSim.getState();
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);

    if (running && totalLen > 0) {
      traveled.current = Math.min(totalLen, traveled.current + robot.speedMps * speed * dt);
      elapsed.current += dt;
    }

    // locate robot on the path
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

    const tool: Vec2 = {
      x: pos.x + fx * robot.toolOffsetM,
      z: pos.z + fz * robot.toolOffsetM,
    };
    const half = robot.workingWidthM / 2 + Math.max(grid.cw, grid.ch) * 0.5;
    const activeR = robot.workingWidthM / 2 + Math.min(grid.cw, grid.ch) * 0.5;

    let changed = false;
    const ACTIVE_CODE = 255; // colorState sentinel for "hot patch"

    // 1) upgrade cells the tool swept this frame to the current pass
    if (running && !justWrapped.current) {
      for (let i = 0; i < grid.count; i++) {
        if (cellPass.current[i] >= curPass.current) continue;
        const p = grid.centers[i];
        if (segDist(p.x, p.z, prevTool.current, tool) <= half) {
          cellPass.current[i] = curPass.current;
        }
      }
    }
    justWrapped.current = false;

    // 2) restore last frame's active cells to their resting colour
    for (const idx of prevActive.current) {
      mesh.setColorAt(idx, restColor(idx));
      colorState.current[idx] = cellPass.current[idx];
      changed = true;
    }
    prevActive.current = [];

    // 3) single O(n) diff: light the hot patch, keep everything else at rest
    for (let i = 0; i < grid.count; i++) {
      const p = grid.centers[i];
      const underTool =
        running && Math.hypot(p.x - tool.x, p.z - tool.z) <= activeR;
      if (underTool) {
        if (colorState.current[i] !== ACTIVE_CODE) {
          mesh.setColorAt(i, activeColor);
          colorState.current[i] = ACTIVE_CODE;
          changed = true;
        }
        prevActive.current.push(i);
      } else if (colorState.current[i] !== cellPass.current[i]) {
        mesh.setColorAt(i, restColor(i));
        colorState.current[i] = cellPass.current[i];
        changed = true;
      }
    }

    if (changed && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    prevTool.current = tool;

    // 4) DUST — spawn behind abrasive heads while running -------------
    const dref = dust.current;
    if (dustRef.current) {
      const geo = dustRef.current.geometry;
      const attr = geo.getAttribute("position") as THREE.BufferAttribute;
      if (running && robot.emitsDust) {
        dref.spawnAcc += dt * 90 * (0.5 + speed / 30);
        const toolY = 0.04;
        while (dref.spawnAcc >= 1) {
          dref.spawnAcc -= 1;
          // find a dead slot
          let slot = -1;
          for (let s = 0; s < DUST_MAX; s++) {
            if (dref.life[s] <= 0) {
              slot = s;
              break;
            }
          }
          if (slot < 0) break;
          const j = slot * 3;
          dref.pos[j] = tool.x + (Math.random() - 0.5) * robot.workingWidthM * 0.8;
          dref.pos[j + 1] = toolY;
          dref.pos[j + 2] = tool.z + (Math.random() - 0.5) * 0.1;
          // drift up + backward (opposite heading)
          dref.vel[j] = -fx * 0.15 + (Math.random() - 0.5) * 0.25;
          dref.vel[j + 1] = 0.25 + Math.random() * 0.35;
          dref.vel[j + 2] = -fz * 0.15 + (Math.random() - 0.5) * 0.25;
          dref.life[slot] = 0.7 + Math.random() * 0.5;
        }
      }
      // integrate + write
      for (let s = 0; s < DUST_MAX; s++) {
        const j = s * 3;
        if (dref.life[s] > 0) {
          dref.life[s] -= dt;
          dref.vel[j + 1] -= dt * 0.35; // settle
          dref.pos[j] += dref.vel[j] * dt;
          dref.pos[j + 1] = Math.max(0.01, dref.pos[j + 1] + dref.vel[j + 1] * dt);
          dref.pos[j + 2] += dref.vel[j + 2] * dt;
          attr.setXYZ(s, dref.pos[j], dref.pos[j + 1], dref.pos[j + 2]);
        } else {
          attr.setXYZ(s, 0, -5, 0); // park offscreen
        }
      }
      attr.needsUpdate = true;
      const mat = dustRef.current.material as THREE.PointsMaterial;
      mat.opacity = running && robot.emitsDust ? 0.5 : 0.0;
    }

    // 5) metrics + pass advance --------------------------------------
    acc.current += delta;
    const lapDone = totalLen > 0 && traveled.current >= totalLen - 1e-3;

    if (running && lapDone) {
      if (curPass.current < passCount) {
        // advance to the next, finer pass — re-sweep the field
        curPass.current += 1;
        traveled.current = 0;
        justWrapped.current = true;
        if (robotRef.current) {
          robotRef.current.position.set(path[0].x, 0, path[0].z);
        }
        prevTool.current = { x: path[0].x, z: path[0].z };
        useSim.getState().setMetrics({
          pass: curPass.current,
          passTag: passList[curPass.current - 1].tag,
        });
      } else {
        useSim.setState({ running: false });
      }
    }

    if (running && (acc.current >= 0.1 || lapDone)) {
      acc.current = 0;
      let count = 0;
      for (let i = 0; i < grid.count; i++) {
        if (cellPass.current[i] >= curPass.current) count++;
      }
      setMetrics({
        coveragePct: (count / grid.count) * 100,
        elapsedSec: elapsed.current,
      });
    }

    // 6) camera modes -------------------------------------------------
    const cam = state.camera;
    if (camMode === "follow" && robotRef.current) {
      const behind = new THREE.Vector3(
        pos.x - fx * 2.4,
        1.7,
        pos.z - fz * 2.4
      );
      cam.position.lerp(behind, 0.06);
      cam.lookAt(pos.x, 0.25, pos.z);
    } else if (camMode === "top") {
      const topH = Math.max(roomW, roomL) * 1.15 + 2;
      cam.position.lerp(new THREE.Vector3(0.001, topH, 0.001), 0.08);
      cam.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 9, 4]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
      />
      <hemisphereLight args={["#ffffff", "#6b5640", 0.45]} />

      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} position={[0, 4, 2]} scale={[6, 3, 1]} color="#fff6e8" />
        <Lightformer intensity={1.2} position={[4, 2, -3]} scale={[3, 3, 1]} color="#dce8ff" />
        <Lightformer intensity={0.8} position={[-4, 1, 2]} scale={[3, 3, 1]} color="#ffffff" />
      </Environment>

      <Room w={roomW} l={roomL} />

      {/* dark subfloor so plank seams read as gaps, not holes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW + 0.2, roomL + 0.2]} />
        <meshStandardMaterial color="#2c241d" roughness={0.95} />
      </mesh>

      {/* baseboards */}
      {[
        { p: [0, 0.06, -roomL / 2 - 0.03], a: [roomW + 0.12, 0.12, 0.05] },
        { p: [0, 0.06, roomL / 2 + 0.03], a: [roomW + 0.12, 0.12, 0.05] },
        { p: [-roomW / 2 - 0.03, 0.06, 0], a: [0.05, 0.12, roomL + 0.02] },
        { p: [roomW / 2 + 0.03, 0.06, 0], a: [0.05, 0.12, roomL + 0.02] },
      ].map((b, i) => (
        <mesh key={i} position={b.p as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={b.a as [number, number, number]} />
          <meshStandardMaterial color="#eef0f2" roughness={0.9} />
        </mesh>
      ))}

      {/* instanced plank floor */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, grid.count]} receiveShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.5} metalness={0.04} />
      </instancedMesh>

      {/* dust particle jet */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(DUST_MAX * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#d9c9a8"
          transparent
          opacity={0}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <group ref={robotRef}>
        <RobotMesh robot={robot} />
      </group>

      {cameraMode === "orbit" && (
        <OrbitControls
          enablePan
          enableZoom
          minDistance={2}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.2, 0]}
        />
      )}
    </>
  );
}
