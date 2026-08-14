"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  SoftShadows,
} from "@react-three/drei";
import RobotMesh from "@/components/simulator/RobotMesh";
import Room from "@/components/simulator/Room";
import { FloorPainter } from "@/lib/floorPaint";
import { planFloor, pose, perimeterPose, toScene, type FloorPlan } from "@/lib/floorPlan";
import type { RobotSpec } from "@/lib/robots";

/**
 * The job, in three dimensions, driven by the telemetry rather than by itself.
 *
 * The 2D plan answers "how much of the floor is done". It cannot answer the
 * question a contractor actually has, which is "what is this thing and what is
 * it doing to my floor" — for that you have to watch it work.
 *
 * WHAT MAKES THIS HONEST RATHER THAN A CARTOON. Every frame reads `pass` and
 * `passPct` off the same SimSnapshot the numbers, the plan view and the event
 * stream read. The machine is not animated on a loop of its own: pause the
 * clock and it stops mid-lane, scrub back and the floor un-sands. Its position
 * comes from lib/floorPlan.ts, so it is in the same place as the dot on the
 * plan. Its geometry is components/simulator/RobotMesh — the identical model
 * /simulator and /pro-simulator use, so there is one D1 on this site, not three
 * drawings of one.
 *
 * WHAT MAKES IT LOOK LIKE SOMETHING. The floor is a canvas painted by the drum
 * (lib/floorPaint.ts) rather than a grid of recoloured tiles, with a roughness
 * map painted alongside it — so the old finish's sheen visibly stops at the
 * cut line, lit rather than drawn. Everything is procedural: no HDRI, no GLB,
 * no texture fetch, so the scene adds no network cost to the page.
 */

export interface SceneProps {
  /** The sander — defines the field, the lanes and the band it cannot reach. */
  robot: RobotSpec;
  /** The edger — works that band. */
  edger: RobotSpec;
  /** Which machine is on the floor right now. */
  phase: "field" | "edge";
  areaM2: number;
  pass: number;
  passPct: number;
  running: boolean;
  camera: CameraMode;
  /** Honour prefers-reduced-motion: no drifting camera, no dust drift. */
  calm: boolean;
  quality: "high" | "low";
}

export type CameraMode = "chase" | "overhead" | "free";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ------------------------------------------------------------------ floor */

function PaintedFloor({
  plan,
  robot,
  pass,
  passPct,
  phase,
}: {
  plan: FloorPlan;
  robot: RobotSpec;
  pass: number;
  passPct: number;
  phase: "field" | "edge";
}) {
  // The painter and its two canvas textures are written to every frame. React
  // 19's react-hooks rules forbid both mutating a memoised value and reading a
  // ref during render, so they are BUILT in an effect, HELD in a ref, and bound
  // to the material by ref rather than passed as props. Nothing about them is
  // render state — the floor's appearance lives in a canvas, not in React.
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const kit = useRef<{
    painter: FloorPainter;
    colour: THREE.CanvasTexture;
    rough: THREE.CanvasTexture;
  } | null>(null);

  const roomW = plan.roomW;
  const roomH = plan.roomH;

  useEffect(() => {
    const p = planFloor(roomW * roomH, robot.workingWidthM, robot.edgeGapM ?? 0);
    const painter = new FloorPainter(p, robot, 1);
    const colour = new THREE.CanvasTexture(painter.colour);
    colour.colorSpace = THREE.SRGBColorSpace;
    colour.anisotropy = 8;
    const rough = new THREE.CanvasTexture(painter.rough);
    kit.current = { painter, colour, rough };

    const mat = matRef.current;
    if (mat) {
      mat.map = colour;
      mat.roughnessMap = rough;
      mat.needsUpdate = true;
    }
    return () => {
      colour.dispose();
      rough.dispose();
      kit.current = null;
    };
  }, [roomW, roomH, robot]);

  // Painted in useFrame, not in an effect: the drum has to lay down floor on
  // the same tick the machine moves over it, or the cut trails the machine by
  // a frame and the two visibly disagree at speed.
  useFrame(() => {
    const k = kit.current;
    if (!k) return;
    k.painter.paintTo(pass, passPct, phase);
    if (k.painter.dirty) {
      k.colour.needsUpdate = true;
      k.rough.needsUpdate = true;
      k.painter.dirty = false;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[plan.roomW, plan.roomH]} />
      <meshStandardMaterial
        ref={matRef}
        color="#ffffff"
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------- dust */

/**
 * Extraction miss. The D1 targets 98% HEPA capture, so what you see is the
 * 2% — a thin haze at the contact point, not a smokescreen. Overselling the
 * dust would contradict the spec chip three inches above it.
 */
const DUST_N = 90;

function Dust({
  headRef,
  running,
  colour,
  calm,
}: {
  headRef: React.RefObject<THREE.Group | null>;
  running: boolean;
  colour: string;
  calm: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  // Mutated every frame, so both the scratch object and the particle pool are
  // refs — see the note on the floor painter above.
  const dummy = useRef(new THREE.Object3D());
  const pool = useRef<
    { life: number; vx: number; vy: number; vz: number; x: number; y: number; z: number; s: number }[]
  >([]);

  useFrame((_, delta) => {
    const m = mesh.current;
    const head = headRef.current;
    const d = dummy.current;
    if (!m || !head) return;
    // Seeded on the first frame rather than during render — reading a ref
    // during render is what react-hooks/refs exists to stop.
    if (pool.current.length === 0) {
      pool.current = Array.from({ length: DUST_N }, (_, i) => ({
        life: i / DUST_N,
        vx: 0,
        vy: 0,
        vz: 0,
        x: 0,
        y: 0,
        z: 0,
        s: 0.02 + (i % 7) * 0.006,
      }));
    }
    const parts = pool.current;
    const dt = Math.min(delta, 0.05);
    const hx = head.position.x;
    const hz = head.position.z;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (running && !calm) p.life -= dt * 0.9;
      if (p.life <= 0) {
        if (!running) {
          // Park spent motes under the floor rather than freezing a cloud in
          // mid-air — a static plume reads as a rendering fault.
          d.position.set(0, -5, 0);
          d.scale.setScalar(0.0001);
          d.updateMatrix();
          m.setMatrixAt(i, d.matrix);
          continue;
        }
        p.life = 1;
        p.x = hx + (Math.random() - 0.5) * 0.16;
        p.y = 0.02;
        p.z = hz + (Math.random() - 0.5) * 0.5;
        p.vx = (Math.random() - 0.5) * 0.25;
        p.vy = 0.18 + Math.random() * 0.3;
        p.vz = (Math.random() - 0.5) * 0.25;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= dt * 0.12;

      d.position.set(p.x, p.y, p.z);
      d.scale.setScalar(p.s * (0.4 + p.life));
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, DUST_N]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={colour} transparent opacity={0.16} depthWrite={false} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------- the machine */

function Machine({
  plan,
  robot,
  phase,
  passPct,
  running,
  headRef,
  dirRef,
}: {
  plan: FloorPlan;
  /** The machine currently working — sander on the field, edger on the band. */
  robot: RobotSpec;
  phase: "field" | "edge";
  passPct: number;
  running: boolean;
  headRef: React.RefObject<THREE.Group | null>;
  dirRef: React.RefObject<number>;
}) {
  const body = useRef<THREE.Group>(null);
  const yaw = useRef(0);

  useFrame((_, delta) => {
    // Same two functions the plan view calls. The edger follows the band's
    // centreline; the sander runs the field's lanes.
    const p = phase === "edge" ? perimeterPose(plan, passPct) : pose(plan, passPct);
    const [dx, dz] = toScene(plan, p.x, p.y);
    const head = headRef.current;
    if (head) head.position.set(dx, 0, dz);

    const b = body.current;
    if (!b) return;
    // The chassis trails the drum by the published tool offset — the same
    // relationship the plan view draws, from the same number.
    //
    // Clamped into the room. At the start of a left-to-right lane the drum is
    // hard against the wall, which puts the chassis 0.28 m THROUGH it: on the
    // opening frame the machine was buried in the drywall and the hero shot
    // looked at an empty corner. A real machine has the same limit — it cannot
    // put its drum where its body would have to be — which is the reason a
    // separate edger exists in the platform at all.
    const halfBody = 0.34;
    b.position.set(
      clamp(dx - p.dir * robot.toolOffsetM, -plan.roomW / 2 + halfBody, plan.roomW / 2 - halfBody),
      0,
      clamp(dz, -plan.roomH / 2 + halfBody, plan.roomH / 2 - halfBody)
    );

    // Turn at the end of a lane instead of teleporting through 180 degrees.
    // The edger runs a rectangle, so its heading is one of four, not two.
    const want =
      phase === "edge"
        ? [-Math.PI / 2, Math.PI, Math.PI / 2, 0][p.lane] ?? 0
        : p.dir === 1
          ? -Math.PI / 2
          : Math.PI / 2;
    const diff = Math.atan2(Math.sin(want - yaw.current), Math.cos(want - yaw.current));
    yaw.current += diff * Math.min(1, delta * 6);
    b.rotation.y = yaw.current;
    // Hand the camera the SMOOTHED heading, not the instantaneous one. Using
    // p.dir made the chase cam cut through 5 m of room in a single frame at
    // every lane turn; easing it means the camera swings around with the
    // machine the way a follow shot does.
    dirRef.current += (p.dir - dirRef.current) * Math.min(1, delta * 3.5);
  });

  return (
    <>
      <group ref={headRef}>
        {/* The contact patch — the floor directly under the abrasive, lit from
            below. The roughness map already makes the sheen stop at the cut
            line, but that only reads on hardware with real reflections; this
            marks the exact point of work on any GPU, and it is the same
            floor.active colour the plan view's legend calls "Under the drum".
            Sits 4 mm proud of the floor so it never z-fights the plane. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <planeGeometry args={[0.16, robot.workingWidthM]} />
          <meshBasicMaterial
            color={robot.floor.active}
            transparent
            opacity={running ? 0.9 : 0.35}
            depthWrite={false}
          />
        </mesh>
      </group>
      <group ref={body}>
        <RobotMesh robot={robot} animate={running} />
      </group>
    </>
  );
}

/* -------------------------------------------------------------- the camera */

function CameraRig({
  plan,
  mode,
  headRef,
  dirRef,
  started,
  calm,
}: {
  plan: FloorPlan;
  mode: CameraMode;
  headRef: React.RefObject<THREE.Group | null>;
  /** Smoothed travel direction, so the camera swings through a lane turn. */
  dirRef: React.RefObject<number>;
  /** Has the job actually begun? Governs the establishing shot. */
  started: boolean;
  calm: boolean;
}) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  const want = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const diag = Math.hypot(plan.roomW, plan.roomH);

  useFrame((state, delta) => {
    if (mode === "free") return;
    const head = headRef.current;
    const k = calm ? 1 : Math.min(1, delta * 2.4);

    if (mode === "overhead") {
      // Near-plan, tilted just enough to keep the machine reading as an object
      // rather than a rectangle. The offset is a fraction of the room so a
      // small job and a large one frame the same way.
      want.current.set(0, diag * 0.78, plan.roomH * 0.30);
      target.current.set(0, 0, 0);
    } else if (!started) {
      // Opening frame: a hero shot of the machine, parked on the untouched
      // floor at the start of lane one.
      //
      // Two earlier versions of this were wrong. The chase camera opened jammed
      // into the corner staring at blank drywall, because the corner is where
      // the machine parks at t=0. Replacing it with a wide of the room fixed the
      // drywall but lost the machine — the first thing a visitor saw was an
      // empty room, and the D1 is the thing they came to look at. So the shot
      // frames the machine from three-quarters, close enough to read the drum
      // and the extraction hose, with the raw floor it is about to cut behind
      // it. Clamped like the chase shot so the corner start does not put the
      // camera outside the building.
      const hx = clamp(head?.position.x ?? 0, -plan.roomW / 2 + 0.34, plan.roomW / 2 - 0.34);
      const hz = clamp(head?.position.z ?? 0, -plan.roomH / 2 + 0.34, plan.roomH / 2 - 0.34);
      const mx = plan.roomW / 2 - 0.9;
      const mz = plan.roomH / 2;
      want.current.set(
        clamp(hx + 2.4, -mx, mx),
        1.7,
        clamp(hz + 2.9, -mz + 1.1, mz + 2.6)
      );
      target.current.set(hx, 0.2, hz);
    } else {
      // Chase. This was a nearly static wide shot scaled off the machine's
      // position, which put the D1 in the far third of frame under a wall of
      // grey drywall — the camera was pointing at the room, not the work.
      // It now sits a fixed 2.6 m behind the drum along the travel axis and
      // 1.45 m up, looking slightly ahead of the cut line, so the machine is
      // the subject and the sheen boundary runs across the middle of frame.
      const hx = head?.position.x ?? 0;
      const hz = head?.position.z ?? 0;
      const back = dirRef.current * 2.6;
      const sway = calm ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.35;
      // Clamped inside the set. Unclamped, every lane that ends at a wall put
      // the camera through it, and the shot cut to the far side of the drywall
      // for a second — the single most obvious way to look like a broken game.
      const mx = plan.roomW / 2 - 0.9;
      const mz = plan.roomH / 2;
      want.current.set(
        clamp(hx - back, -mx, mx),
        1.45,
        // The front of the set is open, so the camera may stand outside it
        // there; the back wall is solid, so it may not pass behind that.
        clamp(hz + 1.75 + sway, -mz + 1.1, mz + 2.6)
      );
      target.current.set(hx + dirRef.current * 0.5, 0.12, hz);
    }
    look.current.lerp(target.current, k);
    camera.position.lerp(want.current, k);
    camera.lookAt(look.current);
  });

  return null;
}

/* --------------------------------------------------------------- the scene */

function Scene({
  robot,
  edger,
  phase,
  areaM2,
  pass,
  passPct,
  running,
  camera,
  calm,
  quality,
}: SceneProps) {
  // The plan is always the SANDER's — it is the machine whose reach defines
  // where the field ends and the band begins.
  const plan = useMemo(
    () => planFloor(areaM2, robot.workingWidthM, robot.edgeGapM ?? 0),
    [areaM2, robot.workingWidthM, robot.edgeGapM]
  );
  const active = phase === "edge" ? edger : robot;
  const headRef = useRef<THREE.Group>(null);
  const dirRef = useRef(1);
  const diag = Math.hypot(plan.roomW, plan.roomH);

  return (
    <>
      <color attach="background" args={["#eef2f6"]} />
      <fog attach="fog" args={["#eef2f6", diag * 1.1, diag * 2.6]} />

      {/* Key light through the window wall, warm, casting the machine's
          shadow onto the floor it is cutting. */}
      <directionalLight
        position={[plan.roomW * 0.34, 5.4, -plan.roomH * 0.12]}
        intensity={2.5}
        color="#fff2dc"
        castShadow={quality === "high"}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-diag * 0.6, diag * 0.6, diag * 0.6, -diag * 0.6, 0.5, 24]}
        />
      </directionalLight>
      {/* Cool bounce off the open side, so the walls read as lit surfaces
          rather than one flat grey. Ambient alone was washing the whole set to
          the same value and the room looked like untextured geometry. */}
      <directionalLight
        position={[-plan.roomW * 0.45, 3.2, plan.roomH * 0.85]}
        intensity={1.15}
        color="#dbe8ff"
      />
      <ambientLight intensity={0.32} />

      {/* Procedural environment — Lightformers, not a fetched HDRI, so the
          scene stays offline and the page pays no network cost for it. */}
      <Environment resolution={quality === "high" ? 256 : 128}>
        <Lightformer intensity={2.2} position={[0, 5, -2]} scale={[10, 4, 1]} color="#ffffff" />
        <Lightformer intensity={1.1} position={[-5, 3, 3]} scale={[6, 3, 1]} color="#e8f1ff" />
        <Lightformer intensity={0.9} position={[5, 2, 4]} scale={[6, 3, 1]} color="#fff0dc" />
      </Environment>

      <PaintedFloor
        plan={plan}
        robot={robot}
        pass={pass}
        passPct={passPct}
        phase={phase}
      />
      <Room w={plan.roomW} l={plan.roomH} siteProps={false} />
      <Machine
        plan={plan}
        robot={active}
        phase={phase}
        passPct={passPct}
        running={running}
        headRef={headRef}
        dirRef={dirRef}
      />
      {active.emitsDust && (
        <Dust headRef={headRef} running={running} colour={active.floor.done} calm={calm} />
      )}

      {quality === "high" && (
        <ContactShadows
          position={[0, 0.002, 0]}
          scale={diag * 1.2}
          opacity={0.4}
          blur={2.2}
          far={2}
          resolution={512}
          frames={running ? Infinity : 1}
        />
      )}

      <CameraRig
        plan={plan}
        mode={camera}
        headRef={headRef}
        dirRef={dirRef}
        started={pass > 1 || passPct > 0.2}
        calm={calm}
      />
      {camera === "free" && (
        <OrbitControls
          makeDefault
          enablePan={false}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={diag * 0.35}
          maxDistance={diag * 1.6}
          target={[0, 0, 0]}
        />
      )}
    </>
  );
}

export default function LiveScene3D(props: SceneProps & { active: boolean }) {
  const { active, ...scene } = props;
  const plan = planFloor(
    scene.areaM2,
    scene.robot.workingWidthM,
    scene.robot.edgeGapM ?? 0
  );
  const diag = Math.hypot(plan.roomW, plan.roomH);

  return (
    <Canvas
      shadows={scene.quality === "high" ? "soft" : false}
      // Stops burning frames when the canvas is off-screen or the tab is
      // hidden — the same gate /simulator uses (audit/FINDINGS.md §6).
      frameloop={active ? "always" : "demand"}
      dpr={scene.quality === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [0, 3.4, diag * 0.72], fov: 46, near: 0.1, far: 80 }}
      gl={{ antialias: scene.quality === "high", powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      className="h-full w-full"
      role="img"
      aria-label={`3D view of a simulated ${
        scene.phase === "edge"
          ? `${scene.edger.name} edging the perimeter of`
          : `${scene.robot.name} sanding`
      } a ${Math.round(scene.areaM2)} square metre floor. Pass ${scene.pass}, ${Math.round(
        scene.passPct
      )} percent of this phase complete.`}
    >
      {scene.quality === "high" && <SoftShadows size={18} samples={8} focus={0.7} />}
      <Scene {...scene} />
    </Canvas>
  );
}
