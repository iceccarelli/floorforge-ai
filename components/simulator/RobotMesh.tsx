"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useSim } from "@/lib/simStore";
import type { RobotSpec } from "@/lib/robots";

/**
 * Procedural, low-poly robot bodies — no external GLB downloads, so the
 * scene has no network dependency and no licensing risk. Each platform
 * gets a distinct silhouette AND a moving tool head so it reads as a
 * live machine, not a static prop.
 */
function Wheels({ width }: { width: number }) {
  const offsets: [number, number][] = [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
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
          <meshStandardMaterial color="#111827" roughness={0.7} />
        </mesh>
      ))}
    </>
  );
}

export default function RobotMesh({ robot }: { robot: RobotSpec }) {
  const c = robot.color;
  const dark = "#1f2937";
  const width = robot.workingWidthM;

  const drum = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  const dome = useRef<THREE.Mesh>(null);
  const gripper = useRef<THREE.Group>(null);
  const light = useRef<THREE.MeshStandardMaterial>(null);
  const nozzle = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    const running = useSim.getState().running;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // status light "breathes" faster while working
    if (light.current) {
      light.current.emissiveIntensity =
        (running ? 1.6 : 0.6) + Math.sin(t * (running ? 8 : 2)) * 0.5;
    }
    if (!running) return;

    if (drum.current) drum.current.rotation.y += dt * 26; // sanding drum
    if (head.current) head.current.rotation.y += dt * 30; // edge head
    if (dome.current) dome.current.rotation.y += dt * 3.2; // lidar sweep
    if (gripper.current) gripper.current.position.y = 0.02 + Math.abs(Math.sin(t * 4)) * 0.06;
    if (nozzle.current) nozzle.current.emissiveIntensity = 0.4 + Math.abs(Math.sin(t * 12)) * 0.9;
  });

  return (
    <group>
      {/* shared chassis */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[width * 0.9, 0.16, 0.42]} />
        <meshStandardMaterial color={c} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[width * 0.95, 0.06, 0.5]} />
        <meshStandardMaterial color={dark} metalness={0.7} roughness={0.35} />
      </mesh>

      {robot.id !== "lay" && <Wheels width={width} />}

      {robot.id === "sand" && (
        <group position={[0, 0.06, 0.28]} rotation={[0, 0, Math.PI / 2]}>
          <mesh ref={drum} castShadow>
            <cylinderGeometry args={[0.09, 0.09, width, 22]} />
            <meshStandardMaterial color={dark} metalness={0.55} roughness={0.55} />
          </mesh>
          {/* abrasive stripes so the spin is visible */}
          <mesh>
            <cylinderGeometry args={[0.091, 0.091, width * 0.5, 22]} />
            <meshStandardMaterial color="#4b5563" roughness={0.9} />
          </mesh>
        </group>
      )}

      {robot.id === "edge" && (
        <mesh ref={head} position={[width * 0.5, 0.05, 0.22]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.07, 16]} />
          <meshStandardMaterial color={dark} metalness={0.6} roughness={0.6} />
        </mesh>
      )}

      {robot.id === "coat" && (
        <>
          <mesh position={[0, 0.22, 0.26]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[width, 0.05, 0.05]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.6} />
          </mesh>
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
            <meshStandardMaterial color={c} metalness={0.7} roughness={0.25} />
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
