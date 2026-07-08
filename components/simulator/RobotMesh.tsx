"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useSim } from "@/lib/simStore";
import type { RobotSpec } from "@/lib/robots";

/**
 * Procedural robot bodies — no external GLB/HDRI downloads, so the scene has
 * no network dependency and no licensing risk. Each platform is modelled with
 * a distinct, function-driven silhouette and moving tool heads so it reads as
 * a real machine doing a real job, not a labelled box.
 *
 * Inspection affordances driven by the sim store:
 *  - exploded (0..1): parts slide along their mount axis like an industrial
 *    exploded diagram.
 *  - cutaway: the painted top shell hides to reveal the motor, rotor, meshing
 *    gears and drum shaft inside.
 * These are the fast, network-free web previews. The Godot "Pro Simulator" is
 * the high-fidelity teardown (every gear/rotor/belt). See /pro-simulator.
 */

const BODY_H = 0.2; // chassis body height
const DECK_Y = 0.24; // top deck surface height

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

/** Reusable materials (memoised colours only; JSX materials stay cheap). */
function useMats(color: string) {
  return useMemo(
    () => ({
      body: color,
      frame: "#232a35",
      steel: "#aab2bd",
      rubber: "#14171c",
      dark: "#0f1319",
    }),
    [color]
  );
}

/** A toothed spur gear facing +Z: a disc plus radial teeth, all in the group's
 *  XY plane so the caller can spin the whole group about Z. */
const Gear = React.forwardRef<THREE.Group, { r: number; teeth: number; color: string }>(
  function Gear({ r, teeth, color }, ref) {
    const teethEls = [];
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      teethEls.push(
        <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0]} rotation={[0, 0, a]}>
          <boxGeometry args={[0.018, 0.014, 0.03]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.35} />
        </mesh>
      );
    }
    return (
      <group ref={ref}>
        {/* disc: cylinder axis along Y, tilt to face +Z */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r, r, 0.028, 24]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
        </mesh>
        {teethEls}
      </group>
    );
  }
);

/** Four wheel assemblies with tyre + hub, tucked under the deck. */
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
        <group key={i} position={[sx * width * 0.42, 0.055, sz * 0.19]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.05, 18]} />
            <meshStandardMaterial color="#14171c" roughness={0.85} metalness={0.1} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.052, 12]} />
            <meshStandardMaterial color="#8a929d" roughness={0.35} metalness={0.7} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function RobotMesh({
  robot,
  animate = false,
}: {
  robot: RobotSpec;
  animate?: boolean;
}) {
  const m = useMats(robot.color);
  const width = robot.workingWidthM;
  const bodyW = Math.max(0.42, width * 0.95);

  const drum = useRef<THREE.Mesh>(null);
  const rotor = useRef<THREE.Mesh>(null);
  const gearA = useRef<THREE.Group>(null);
  const gearB = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Mesh>(null);
  const dome = useRef<THREE.Group>(null);
  const gripper = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.MeshStandardMaterial>(null);
  const scanRing = useRef<THREE.MeshStandardMaterial>(null);
  const sheen = useRef<THREE.MeshStandardMaterial>(null);

  // dust-hose curve for the sander (built once)
  const hoseGeo = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(bodyW * 0.28, 0.05, 0.26),
      new THREE.Vector3(bodyW * 0.34, 0.42, 0.1),
      new THREE.Vector3(bodyW * 0.12, 0.34, -0.14)
    );
    return new THREE.TubeGeometry(curve, 20, 0.022, 8, false);
  }, [bodyW]);

  useFrame((state, delta) => {
    const running = animate || useSim.getState().running;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (beacon.current) {
      beacon.current.emissiveIntensity =
        (running ? 1.6 : 0.5) + Math.sin(t * (running ? 8 : 2)) * 0.5;
    }
    if (scanRing.current) {
      scanRing.current.emissiveIntensity = running
        ? 1.2 + Math.sin(t * 6) * 0.6
        : 0.4;
    }
    if (!running) return;

    if (drum.current) drum.current.rotation.y += dt * 30;
    if (rotor.current) rotor.current.rotation.z += dt * 60;
    if (gearA.current) gearA.current.rotation.z += dt * 26;
    if (gearB.current) gearB.current.rotation.z -= dt * 44;
    if (disc.current) disc.current.rotation.y += dt * 40;
    if (dome.current) dome.current.rotation.y += dt * 3.4;
    if (gripper.current)
      gripper.current.position.y = DECK_Y - 0.02 + Math.abs(Math.sin(t * 3.5)) * 0.08;
    if (sheen.current) sheen.current.opacity = 0.5 + Math.abs(Math.sin(t * 10)) * 0.4;
  });

  return (
    <group>
      {/* ---- shared chassis ------------------------------------------- */}
      {/* painted top shell — hides in cutaway to reveal the drivetrain */}
      <Part base={[0, DECK_Y, 0]} dir={[0, 1, 0]} mag={0.4} hideInCutaway>
        <RoundedBox
          args={[bodyW, BODY_H, 0.5]}
          radius={0.045}
          smoothness={4}
          castShadow
        >
          <meshPhysicalMaterial
            color={m.body}
            metalness={0.5}
            roughness={0.32}
            clearcoat={0.7}
            clearcoatRoughness={0.28}
            envMapIntensity={1}
          />
        </RoundedBox>
        {/* side vent slats (part-relative: part sits at body centre) */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * bodyW * 0.5, -0.02, 0]}>
            {[-0.12, -0.04, 0.04, 0.12].map((z, i) => (
              <mesh key={i} position={[0, 0, z]}>
                <boxGeometry args={[0.012, 0.06, 0.03]} />
                <meshStandardMaterial color={m.dark} roughness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
        {/* front sensor bar with LED strip */}
        <mesh position={[0, -0.05, 0.255]}>
          <boxGeometry args={[bodyW * 0.7, 0.03, 0.02]} />
          <meshStandardMaterial
            color="#cfe8ff"
            emissive="#7fb4ff"
            emissiveIntensity={0.8}
          />
        </mesh>
      </Part>

      {/* deck / frame plate (always visible) */}
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[bodyW * 0.98, 0.05, 0.52]} />
        <meshStandardMaterial color={m.frame} metalness={0.7} roughness={0.4} envMapIntensity={0.8} />
      </mesh>
      {/* under-skid */}
      <mesh position={[0, 0.095, 0]}>
        <boxGeometry args={[bodyW * 0.8, 0.03, 0.4]} />
        <meshStandardMaterial color={m.dark} metalness={0.4} roughness={0.7} />
      </mesh>

      {robot.id !== "lay" && <Wheels width={width} />}

      {/* internal drivetrain — revealed by cutaway / explode.
          Kept mounted centrally so it sits under the shell. */}
      {robot.id === "sand" && (
        <Part base={[0, 0.18, -0.04]} dir={[0, 0, -1]} mag={0.45}>
          {/* motor can */}
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.16, 20]} />
            <meshStandardMaterial color={m.steel} metalness={0.85} roughness={0.3} />
          </mesh>
          {/* rotor shaft */}
          <mesh ref={rotor} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.22, 10]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.4} emissive="#7c2d12" emissiveIntensity={0.3} />
          </mesh>
          {/* meshing gear pair */}
          <group position={[0.02, -0.02, 0.11]}>
            <Gear ref={gearA} r={0.05} teeth={12} color="#c7ccd4" />
          </group>
          <group position={[0.11, -0.02, 0.11]}>
            <Gear ref={gearB} r={0.036} teeth={9} color="#9aa2ad" />
          </group>
        </Part>
      )}

      {/* ---- SANDER: dust shroud, ribbed drum, hose + canister -------- */}
      {robot.id === "sand" && (
        <>
          {/* dust shroud (curved cowl over the drum) */}
          <Part base={[0, 0.17, 0.28]} dir={[0, 1, 0.5]} mag={0.4} hideInCutaway>
            <mesh rotation={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.14, 0.14, bodyW * 0.96, 20, 1, true, Math.PI * 0.05, Math.PI * 0.9]} />
              <meshStandardMaterial color={m.frame} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          </Part>

          {/* ribbed sanding drum */}
          <Part base={[0, 0.1, 0.3]} dir={[0, 0, 1]} mag={0.55}>
            <group rotation={[0, 0, Math.PI / 2]}>
              <mesh ref={drum} castShadow>
                <cylinderGeometry args={[0.1, 0.1, bodyW, 28]} />
                <meshStandardMaterial color={m.dark} metalness={0.5} roughness={0.6} />
              </mesh>
              {/* abrasive band */}
              <mesh>
                <cylinderGeometry args={[0.102, 0.102, bodyW * 0.82, 28]} />
                <meshStandardMaterial color="#6b6560" roughness={0.98} metalness={0.05} />
              </mesh>
              {/* end caps */}
              {[1, -1].map((s) => (
                <mesh key={s} position={[0, (s * bodyW) / 2, 0]}>
                  <cylinderGeometry args={[0.108, 0.108, 0.02, 24]} />
                  <meshStandardMaterial color={m.steel} metalness={0.9} roughness={0.25} />
                </mesh>
              ))}
            </group>
          </Part>

          {/* dust hose arcing to a canister on the rear deck */}
          <Part base={[0, 0, 0]} dir={[0, 1, -0.5]} mag={0.35} hideInCutaway>
            <mesh geometry={hoseGeo}>
              <meshStandardMaterial color="#2b303a" roughness={0.75} metalness={0.2} />
            </mesh>
            {/* canister */}
            <group position={[bodyW * 0.12, 0.36, -0.16]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.2, 20]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.4} transparent opacity={0.82} />
              </mesh>
              <mesh position={[0, -0.06, 0]}>
                <cylinderGeometry args={[0.071, 0.071, 0.07, 20]} />
                <meshStandardMaterial color="#9ca3af" roughness={0.6} />
              </mesh>
            </group>
          </Part>
        </>
      )}

      {/* ---- EDGER: offset arm + spinning disc + skirt ---------------- */}
      {robot.id === "edge" && (
        <Part base={[bodyW * 0.55, 0.12, 0.2]} dir={[1, 0, 0]} mag={0.45}>
          {/* arm */}
          <mesh position={[-0.06, 0, -0.02]} castShadow>
            <boxGeometry args={[0.14, 0.05, 0.05]} />
            <meshStandardMaterial color={m.frame} metalness={0.6} roughness={0.45} />
          </mesh>
          {/* disc head */}
          <mesh ref={disc} position={[0.02, -0.04, 0.02]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.025, 24]} />
            <meshStandardMaterial color="#6b6560" roughness={0.95} />
          </mesh>
          {/* guard skirt */}
          <mesh position={[0.02, 0.0, 0.02]}>
            <cylinderGeometry args={[0.1, 0.1, 0.04, 24, 1, true]} />
            <meshStandardMaterial color={m.dark} roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
        </Part>
      )}

      {/* ---- COATER: fluid tank + applicator bar + feed line --------- */}
      {robot.id === "coat" && (
        <>
          {/* translucent fluid tank on the deck */}
          <Part base={[0, DECK_Y + 0.09, -0.06]} dir={[0, 1, 0]} mag={0.35} hideInCutaway>
            <mesh castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.16, 20]} />
              <meshStandardMaterial color={robot.color} metalness={0.1} roughness={0.25} transparent opacity={0.55} />
            </mesh>
          </Part>
          {/* feed line */}
          <mesh position={[0.02, 0.24, 0.12]} rotation={[Math.PI / 2.6, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.34, 8]} />
            <meshStandardMaterial color="#374151" roughness={0.6} />
          </mesh>
          {/* applicator bar */}
          <mesh position={[0, 0.14, 0.28]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[0.06, bodyW, 0.05] as unknown as [number, number, number]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.5} />
          </mesh>
          {/* wet-sheen strip just laid down */}
          <mesh position={[0, 0.121, 0.31]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[bodyW * 0.98, 0.05]} />
            <meshStandardMaterial ref={sheen} color={robot.color} roughness={0.05} metalness={0.2} transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {/* ---- INSTALLER: gantry + gripper + plank magazine ------------ */}
      {robot.id === "lay" && (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * bodyW * 0.46, 0.4, 0]} castShadow>
              <boxGeometry args={[0.05, 0.5, 0.05]} />
              <meshStandardMaterial color={m.frame} metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 0.64, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[0.05, bodyW, 0.05] as unknown as [number, number, number]} />
            <meshStandardMaterial color={robot.color} metalness={0.5} roughness={0.4} />
          </mesh>
          {/* gripper carrying a plank */}
          <group ref={gripper} position={[0, DECK_Y - 0.02, 0.24]}>
            <mesh castShadow>
              <boxGeometry args={[0.05, 0.06, 0.05]} />
              <meshStandardMaterial color={m.dark} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.05, 0]} castShadow>
              <boxGeometry args={[bodyW * 0.82, 0.02, 0.14]} />
              <meshStandardMaterial color="#c08b4a" roughness={0.7} />
            </mesh>
          </group>
          {/* plank magazine at the rear */}
          <group position={[0, 0.2, -0.22]}>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[0, i * 0.022, 0]} castShadow>
                <boxGeometry args={[bodyW * 0.8, 0.018, 0.12]} />
                <meshStandardMaterial color={i % 2 ? "#b9843f" : "#a9743a"} roughness={0.75} />
              </mesh>
            ))}
          </group>
        </>
      )}

      {/* ---- SCANNER: sensor mast + rotating lidar + camera pods ----- */}
      {robot.id === "scan" && (
        <>
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.032, 0.42, 12]} />
            <meshStandardMaterial color={m.frame} metalness={0.6} roughness={0.4} />
          </mesh>
          <group ref={dome} position={[0, 0.66, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.07, 24]} />
              <meshStandardMaterial color={m.dark} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* scan window ring */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.091, 0.091, 0.03, 24, 1, true]} />
              <meshStandardMaterial ref={scanRing} color="#7fd8e6" emissive="#22d3ee" emissiveIntensity={1} transparent opacity={0.85} side={THREE.DoubleSide} />
            </mesh>
            {/* emitter pod */}
            <mesh position={[0.085, 0, 0]}>
              <boxGeometry args={[0.03, 0.03, 0.03]} />
              <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.4} />
            </mesh>
          </group>
          {/* forward camera pods */}
          {[-0.09, 0.09].map((x) => (
            <mesh key={x} position={[x, DECK_Y - 0.02, 0.24]}>
              <boxGeometry args={[0.04, 0.04, 0.03]} />
              <meshStandardMaterial color="#0b1220" metalness={0.4} roughness={0.3} />
            </mesh>
          ))}
        </>
      )}

      {/* status beacon (all machines) */}
      <mesh position={[-bodyW * 0.4, 0.3, -0.2]}>
        <sphereGeometry args={[0.028, 14, 14]} />
        <meshStandardMaterial ref={beacon} color={robot.color} emissive={robot.color} emissiveIntensity={1} />
      </mesh>
    </group>
  );
}
