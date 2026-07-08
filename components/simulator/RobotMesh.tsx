"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useSim } from "@/lib/simStore";
import type { RobotSpec } from "@/lib/robots";

/**
 * Procedural, low-poly robot bodies — no external GLB/HDRI downloads, so the
 * scene has no network dependency and no licensing risk. Each platform gets a
 * distinct silhouette AND moving tool heads so it reads as a live machine.
 *
 * NEW: web-tier "inspection" affordances driven by the sim store:
 *  - exploded (0..1): parts slide along their mount axis so the assembly opens
 *    up like an industrial exploded diagram.
 *  - cutaway: the top shell hides to reveal the motor + drum shaft internals.
 * These are the fast, network-free previews. The Godot "Pro Simulator" is the
 * high-fidelity teardown (every gear/rotor/belt). See /pro-simulator.
 */

/** A part that lerps between its assembled position and an exploded offset. */
function Part({
  base,
  dir = [0, 0, 0],
  mag = 0,
  children,
  hideInCutaway = false,
  onlyInCutaway = false,
}: {
  base: [number, number, number];
  dir?: [number, number, number];
  mag?: number;
  children: React.ReactNode;
  hideInCutaway?: boolean;
  onlyInCutaway?: boolean;
}) {
  const g = useRef<THREE.Group>(null);
  const v = useRef(new THREE.Vector3());
  useFrame(() => {
    const { exploded, cutaway } = useSim.getState();
    const grp = g.current;
    if (!grp) return;
    v.current.set(
      base[0] + dir[0] * mag * exploded,
      base[1] + dir[1] * mag * exploded,
      base[2] + dir[2] * mag * exploded
    );
    grp.position.lerp(v.current, 0.2);
    const shouldHide = (hideInCutaway && cutaway) || (onlyInCutaway && !cutaway);
    grp.visible = !shouldHide;
  });
  return <group ref={g}>{children}</group>;
}

function Wheels({ width }: { width: number }) {
  const offsets: [number, number][] = [
    [-1, 1], [1, 1], [-1, -1], [1, -1],
  ];
  return (
    <>
      {offsets.map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[sx * width * 0.4, 0.03, sz * 0.2]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.04, 0.04, 0.04, 14]} />
          <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
    </>
  );
}

export default function RobotMesh({ robot }: { robot: RobotSpec }) {
  const c = robot.color;
  const dark = "#1f2937";
  const steel = "#9ca3af";
  const width = robot.workingWidthM;

  const drum = useRef<THREE.Mesh>(null);
  const rotor = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  const dome = useRef<THREE.Mesh>(null);
  const gripper = useRef<THREE.Group>(null);
  const light = useRef<THREE.MeshStandardMaterial>(null);
  const nozzle = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    const running = useSim.getState().running;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (light.current) {
      light.current.emissiveIntensity =
        (running ? 1.6 : 0.6) + Math.sin(t * (running ? 8 : 2)) * 0.5;
    }
    if (!running) return;

    if (drum.current) drum.current.rotation.y += dt * 26;   // sanding drum
    if (rotor.current) rotor.current.rotation.z += dt * 60; // internal motor rotor
    if (head.current) head.current.rotation.y += dt * 30;   // edge head
    if (dome.current) dome.current.rotation.y += dt * 3.2;  // lidar sweep
    if (gripper.current)
      gripper.current.position.y = 0.02 + Math.abs(Math.sin(t * 4)) * 0.06;
    if (nozzle.current)
      nozzle.current.emissiveIntensity = 0.4 + Math.abs(Math.sin(t * 12)) * 0.9;
  });

  return (
    <group>
      {/* shell (upper chassis) — hides in cutaway to reveal internals */}
      <Part base={[0, 0.15, 0]} dir={[0, 1, 0]} mag={0.35} hideInCutaway>
        <mesh castShadow>
          <boxGeometry args={[width * 0.9, 0.16, 0.42]} />
          <meshPhysicalMaterial
            color={c}
            metalness={0.55}
            roughness={0.35}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
            envMapIntensity={0.9}
          />
        </mesh>
      </Part>

      {/* base plate (always visible) */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[width * 0.95, 0.06, 0.5]} />
        <meshStandardMaterial color={dark} metalness={0.75} roughness={0.35} envMapIntensity={0.8} />
      </mesh>

      {robot.id !== "lay" && <Wheels width={width} />}

      {/* ---- SANDER: drum + internal motor rotor + dust port ---- */}
      {robot.id === "sand" && (
        <>
          {/* motor housing behind the drum; explodes backward */}
          <Part base={[0, 0.13, -0.05]} dir={[0, 0, -1]} mag={0.4}>
            <mesh castShadow>
              <boxGeometry args={[0.14, 0.14, 0.16]} />
              <meshStandardMaterial color={steel} metalness={0.85} roughness={0.3} envMapIntensity={1} />
            </mesh>
            {/* spinning rotor visible when exploded/cutaway */}
            <mesh ref={rotor} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.18, 8]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.4} emissive="#7c2d12" emissiveIntensity={0.25} />
            </mesh>
          </Part>

          {/* sanding drum; explodes forward along travel */}
          <Part base={[0, 0.06, 0.28]} dir={[0, 0, 1]} mag={0.5}>
            <group rotation={[0, 0, Math.PI / 2]}>
              <mesh ref={drum} castShadow>
                <cylinderGeometry args={[0.09, 0.09, width, 24]} />
                <meshStandardMaterial color={dark} metalness={0.5} roughness={0.6} envMapIntensity={0.7} />
              </mesh>
              {/* abrasive band so rotation reads */}
              <mesh>
                <cylinderGeometry args={[0.092, 0.092, width * 0.5, 24]} />
                <meshStandardMaterial color="#78716c" roughness={0.95} />
              </mesh>
              {/* end caps */}
              <mesh position={[0, width / 2, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
                <meshStandardMaterial color={steel} metalness={0.9} roughness={0.25} />
              </mesh>
              <mesh position={[0, -width / 2, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
                <meshStandardMaterial color={steel} metalness={0.9} roughness={0.25} />
              </mesh>
            </group>
          </Part>

          {/* dust extraction port; explodes up */}
          <Part base={[0, 0.2, 0.1]} dir={[0, 1, 0.4]} mag={0.5}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.06, 0.12, 16]} />
              <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.7} />
            </mesh>
          </Part>
        </>
      )}

      {robot.id === "edge" && (
        <Part base={[width * 0.5, 0.05, 0.22]} dir={[1, 0, 0]} mag={0.4}>
          <mesh ref={head} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.07, 16]} />
            <meshStandardMaterial color={dark} metalness={0.6} roughness={0.6} envMapIntensity={0.8} />
          </mesh>
        </Part>
      )}

      {robot.id === "coat" && (
        <>
          <Part base={[0, 0.22, 0.26]} dir={[0, 1, 0]} mag={0.35}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <boxGeometry args={[width, 0.05, 0.05]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.6} />
            </mesh>
          </Part>
          <mesh position={[0, 0.16, 0.26]}>
            <boxGeometry args={[width * 0.96, 0.02, 0.03]} />
            <meshStandardMaterial ref={nozzle} color={c} emissive={c} emissiveIntensity={0.5} />
          </mesh>
        </>
      )}

      {robot.id === "lay" && (
        <>
          <mesh position={[-width * 0.45, 0.34, 0]} castShadow>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshStandardMaterial color={dark} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[width * 0.45, 0.34, 0]} castShadow>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshStandardMaterial color={dark} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.58, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[0.05, width, 0.05]} />
            <meshStandardMaterial color={c} metalness={0.5} roughness={0.4} />
          </mesh>
          <group ref={gripper} position={[0, 0.02, 0.24]}>
            <mesh castShadow>
              <boxGeometry args={[width * 0.8, 0.04, 0.14]} />
              <meshStandardMaterial color="#a16207" roughness={0.7} />
            </mesh>
          </group>
        </>
      )}

      {robot.id === "scan" && (
        <>
          <mesh position={[0, 0.44, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 12]} />
            <meshStandardMaterial color={dark} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh ref={dome} position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 20]} />
            <meshStandardMaterial color={c} metalness={0.7} roughness={0.25} envMapIntensity={1} />
          </mesh>
          <mesh position={[0.09, 0.7, 0]}>
            <boxGeometry args={[0.02, 0.03, 0.03]} />
            <meshStandardMaterial color="#7fd8e6" emissive="#7fd8e6" emissiveIntensity={1.5} />
          </mesh>
        </>
      )}

      {/* status beacon */}
      <mesh position={[0, 0.26, -0.18]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial ref={light} color={c} emissive={c} emissiveIntensity={1} />
      </mesh>
    </group>
  );
}
