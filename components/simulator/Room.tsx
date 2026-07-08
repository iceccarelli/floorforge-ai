"use client";

import React from "react";
import * as THREE from "three";

/**
 * An enclosed job-site room around the work area: a three-wall "set" (back +
 * two sides, front left open for the camera), window with a soft light shaft,
 * a doorway, wall trim, and a little site context (a stack of hardwood bundles
 * waiting to go down, a dust-extraction cart). Everything is procedural and
 * offline — no textures fetched — and sized from the room dimensions so it
 * reframes when you change the room.
 */
export default function Room({ w, l }: { w: number; l: number }) {
  const H = 2.5; // wall height (m)
  const hw = w / 2;
  const hl = l / 2;
  const wallCol = "#e8e4dc";
  const trimCol = "#f4f2ee";

  return (
    <group>
      {/* back wall (z-) */}
      <mesh position={[0, H / 2, -hl - 0.05]} receiveShadow>
        <boxGeometry args={[w + 0.3, H, 0.1]} />
        <meshStandardMaterial color={wallCol} roughness={0.95} />
      </mesh>
      {/* left wall (x-) */}
      <mesh position={[-hw - 0.05, H / 2, 0]} receiveShadow>
        <boxGeometry args={[0.1, H, l + 0.1]} />
        <meshStandardMaterial color={wallCol} roughness={0.95} />
      </mesh>
      {/* right wall (x+) with a doorway gap towards the front */}
      <mesh position={[hw + 0.05, H / 2, -l * 0.2]} receiveShadow>
        <boxGeometry args={[0.1, H, l * 0.6]} />
        <meshStandardMaterial color={wallCol} roughness={0.95} />
      </mesh>
      {/* header above the doorway */}
      <mesh position={[hw + 0.05, H - 0.25, l * 0.28]} receiveShadow>
        <boxGeometry args={[0.1, 0.5, l * 0.44]} />
        <meshStandardMaterial color={wallCol} roughness={0.95} />
      </mesh>

      {/* crown + base trim on the back wall */}
      <mesh position={[0, H - 0.06, -hl + 0.005]}>
        <boxGeometry args={[w + 0.3, 0.08, 0.03]} />
        <meshStandardMaterial color={trimCol} roughness={0.7} />
      </mesh>

      {/* window on the back wall (frame + glazing) */}
      <group position={[hw * 0.45, H * 0.58, -hl + 0.02]}>
        <mesh>
          <boxGeometry args={[1.3, 1.1, 0.06]} />
          <meshStandardMaterial color="#d7d2c8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.15, 0.95]} />
          <meshStandardMaterial
            color="#dff1ff"
            emissive="#cfe8ff"
            emissiveIntensity={0.7}
            roughness={0.1}
          />
        </mesh>
        {/* muntin bars */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.03, 0.95, 0.02]} />
          <meshStandardMaterial color="#d7d2c8" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[1.15, 0.03, 0.02]} />
          <meshStandardMaterial color="#d7d2c8" />
        </mesh>
      </group>

      {/* soft daylight shaft angled in from the window */}
      <spotLight
        position={[hw * 0.45, H * 0.62, -hl + 0.4]}
        target-position={[-hw * 0.2, 0, hl * 0.2]}
        angle={0.5}
        penumbra={0.9}
        intensity={9}
        distance={14}
        color="#fff4e0"
        castShadow={false}
      />
      {/* faint visible shaft (additive, very low opacity) */}
      <mesh
        position={[hw * 0.2, H * 0.3, -hl * 0.2]}
        rotation={[Math.PI / 3.2, 0, 0.25]}
      >
        <planeGeometry args={[1.2, 2.6]} />
        <meshBasicMaterial
          color="#fff3d8"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* --- site context props --- */}
      {/* stack of hardwood bundles waiting in the back-left corner */}
      <group position={[-hw + 0.5, 0.0, -hl + 0.35]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.05 + i * 0.09, 0]} rotation={[0, i * 0.05, 0]} castShadow>
            <boxGeometry args={[0.9, 0.08, 0.28]} />
            <meshStandardMaterial color={i % 2 ? "#b9843f" : "#a9743a"} roughness={0.8} />
          </mesh>
        ))}
        {/* strap */}
        <mesh position={[0.2, 0.14, 0]}>
          <boxGeometry args={[0.03, 0.3, 0.29]} />
          <meshStandardMaterial color="#1f2937" roughness={0.6} />
        </mesh>
      </group>

      {/* dust-extraction cart in the back-right corner */}
      <group position={[hw - 0.45, 0, -hl + 0.4]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.19, 0.56, 20]} />
          <meshStandardMaterial color="#334155" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.08, 20]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.42, 0.04, 0.42]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
