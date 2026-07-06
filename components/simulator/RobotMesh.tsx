"use client";

import React from "react";
import type { RobotSpec } from "@/lib/robots";

/**
 * Procedural, low-poly robot bodies — no external GLB downloads, so the
 * scene has no network dependency and no licensing risk. Each platform
 * gets a distinct silhouette so it reads clearly from any camera angle.
 */
export default function RobotMesh({ robot }: { robot: RobotSpec }) {
  const c = robot.color;
  const dark = "#1f2937";
  const width = robot.workingWidthM;

  return (
    <group>
      {/* shared chassis */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[width * 0.9, 0.16, 0.42]} />
        <meshStandardMaterial color={c} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[width * 0.95, 0.06, 0.5]} />
        <meshStandardMaterial color={dark} metalness={0.7} roughness={0.35} />
      </mesh>

      {robot.id === "sand" && (
        <mesh position={[0, 0.06, 0.28]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, width, 20]} />
          <meshStandardMaterial color={dark} metalness={0.6} roughness={0.5} />
        </mesh>
      )}

      {robot.id === "edge" && (
        <mesh position={[width * 0.4, 0.05, 0.24]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
          <meshStandardMaterial color={dark} metalness={0.6} roughness={0.5} />
        </mesh>
      )}

      {robot.id === "coat" && (
        <mesh position={[0, 0.2, 0.26]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <boxGeometry args={[width, 0.05, 0.05]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.6} />
        </mesh>
      )}

      {robot.id === "lay" && (
        <>
          <mesh position={[-width * 0.45, 0.32, 0]} castShadow>
            <boxGeometry args={[0.05, 0.45, 0.05]} />
            <meshStandardMaterial color={dark} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[width * 0.45, 0.32, 0]} castShadow>
            <boxGeometry args={[0.05, 0.45, 0.05]} />
            <meshStandardMaterial color={dark} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.54, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[0.05, width, 0.05]} />
            <meshStandardMaterial color={c} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.02, 0.24]} castShadow>
            <boxGeometry args={[width * 0.8, 0.03, 0.12]} />
            <meshStandardMaterial color="#a16207" roughness={0.7} />
          </mesh>
        </>
      )}

      {robot.id === "scan" && (
        <>
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 12]} />
            <meshStandardMaterial color={dark} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.68, 0]} castShadow>
            <sphereGeometry args={[0.08, 20, 20]} />
            <meshStandardMaterial color={c} metalness={0.7} roughness={0.25} />
          </mesh>
        </>
      )}

      {/* status light */}
      <mesh position={[0, 0.25, -0.18]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}
