'use client'

/**
 * Hero3DBackground — Cinematic 3D hero background (v26-build-B4).
 *
 * Converted from `upload/hero-3d-blueprint-center.html` (vanilla Three.js)
 * to React Three Fiber (R3F). The HTML scene was authored as a single-file
 * cinematic 3D background; this module re-implements it as R3F JSX while
 * preserving the project's existing infrastructure (gating, IntersectionObserver,
 * measure(), top-down camera, mobile detection, frameloop toggle).
 *
 * Scene composition (mirrors the HTML file):
 *   1. PALETTE — cinematic warm plum + gold + pink harmony (HTML PALETTE)
 *   2. CUSTOM SHADER GRID — animated pulse/rings/flow via ShaderMaterial
 *   3. RADIAL RINGS — 8 concentric rings (decreasing opacity)
 *   4. MASTER ARCHITECTURE — wireframe platforms/pillars/trusses/tables/
 *      elevation markers/zone markers spread across the full background
 *   5. LUT FURNITURE — velvet + brass + ivory PBR meshes (castShadow) at
 *      sectionZs.lut (rug + sofa + 6 chairs + 2 tables + floor lamp)
 *   6. CENTER BLUEPRINT BIRTHDAY SCENE — full wireframe party scene at
 *      sectionZs.lalounge (cake + balloons + gifts + garland + table +
 *      chairs + confetti + stars + hat + "1")
 *   7. BIRTHDAY PARTY — mylar balloons (iridescence) + 3-tier cake with
 *      gold rings + gift boxes + banner + confetti at sectionZs.birthday
 *   8. GOLD SPINE — pulsing horizontal cylinder connecting the 3 sections
 *   9. DUST MOTES — 200 particles drifting (sin-based Y oscillation)
 *  10. MOUSE PARALLAX — camera smoothly follows mouse (damped)
 *  11. CINEMATIC LIGHTING — ambient + hemi + 3 directional (key/fill/rim)
 *      + 2 spotlights + 3 point lights
 *  12. SHADOWS — Canvas `shadows` + castShadow on furniture + receiveShadow
 *      on rug + shadowMaterial floor
 *
 * Project integrations (preserved from v25-fix-F5):
 *   - shouldEnable3D() gating (returns null on low-end / reduced-motion / no WebGL)
 *   - IntersectionObserver + frameloop toggle (inView → 'always', else 'never')
 *   - measure() computes sectionZs dynamically from card centers via
 *     document.querySelectorAll('[role=button]')
 *   - Top-down pitched camera (~60° from horizontal) — same as HTML file
 *   - Mobile detection (isMobile) for camera distance + scene scale
 */

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  type ReactElement,
  type MutableRefObject,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { shouldEnable3D } from '@/lib/device-capabilities'
import { BRAND_COLORS } from '@/lib/brand-colors'

// ═════════════════════════════════════════════════════════════════
// PALETTE — Cinematic warm/cool harmony (from HTML file)
// ═════════════════════════════════════════════════════════════════
const PALETTE = {
  DEEP_PLUM: '#0d0609',
  WARM_FOG: '#1a0f12',
  GRID_MAIN: '#E8D5E0',
  GRID_LIGHT: '#F0E6EB',
  GRID_ACCENT: '#C9A96E',
  GRID_PULSE: '#FFD1E8',
  RING_COLOR: '#B890A0',
  VELVET_PLUM: '#6B3A5A',
  VELVET_GOLD: '#8B6F47',
  IVORY_LACQUER: '#F8F4EC',
  BRASS_POLISHED: '#C9A96E',
  MYLAR_PINK: '#E8A4C8',
  MYLAR_GOLD: '#F0D878',
  LUT: BRAND_COLORS.LUT,
  LA_LOUNGE: BRAND_COLORS.LA_LOUNGE,
  YOUR_BIRTHDAY: BRAND_COLORS.YOUR_BIRTHDAY,
  WARM_KEY: '#FFF0DD',
  COOL_FILL: '#C8D8E8',
  AMBIENT_BASE: '#E8D8E0',
  CRYSTAL_RIM: '#FF88CC',
} as const

type Vec3 = [number, number, number]

// ═════════════════════════════════════════════════════════════════
// SHADER STRINGS — Custom animated grid (from HTML file)
// ═════════════════════════════════════════════════════════════════
const gridVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const gridFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorMain;
  uniform vec3 uColorAccent;
  uniform vec3 uColorLight;
  uniform vec3 uColorPulse;
  uniform float uFadeStart;
  uniform float uFadeEnd;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  float gridLine(vec2 coord, float width) {
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y);
    return 1.0 - min(line, 1.0);
  }

  void main() {
    float dist = length(vWorldPos.xz);
    float fade = 1.0 - smoothstep(uFadeStart, uFadeEnd, dist);
    float fine = gridLine(vUv * 60.0, 1.0) * 0.15;
    float major = gridLine(vUv * 12.0, 1.0) * 0.35;
    float accent = gridLine(vUv * 6.0, 1.0) * 0.5;
    float pulse = sin(dist * 0.15 - uTime * 0.8) * 0.5 + 0.5;
    float ring = smoothstep(0.02, 0.0, abs(fract(dist * 0.08 - uTime * 0.12) - 0.5) * 2.0) * pulse * 0.4;
    float flow = smoothstep(0.02, 0.0, abs(fract(vUv.y * 40.0 + uTime * 0.05) - 0.5) * 2.0) * 0.08;
    vec3 color = mix(uColorLight, uColorMain, fine + major);
    color = mix(color, uColorAccent, accent);
    color = mix(color, uColorPulse, ring);
    color += uColorAccent * flow;
    float alpha = (fine + major * 0.6 + accent * 0.4 + ring + flow) * fade;
    gl_FragColor = vec4(color, alpha * 0.9);
  }
`

// ═════════════════════════════════════════════════════════════════
// SHARED MOUSE REF TYPE — for camera parallax
// ═════════════════════════════════════════════════════════════════
type MouseState = {
  x: number
  y: number
  targetX: number
  targetY: number
}
type MouseRef = MutableRefObject<MouseState>

// ═════════════════════════════════════════════════════════════════
// LUT FURNITURE — velvet + brass + ivory PBR meshes (castShadow)
// Mirrors HTML's createChair / createTable / createSofa / createLamp
// ═════════════════════════════════════════════════════════════════

function FurnitureChair({
  position,
  color,
  rotation = [0, 0, 0] as Vec3,
}: {
  position: Vec3
  color: string
  rotation?: Vec3
}) {
  // Velvet material: MeshPhysicalMaterial with sheen (HTML's createVelvetMat)
  const sheenColor = useMemo(
    () => new THREE.Color(color).multiplyScalar(1.3),
    [color],
  )
  return (
    <group position={position} rotation={rotation}>
      {/* Seat — velvet */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.2, 0.15, 1.2]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.9}
          metalness={0}
          sheen={1.0}
          sheenRoughness={0.5}
          sheenColor={sheenColor}
          clearcoat={0.1}
        />
      </mesh>
      {/* Backrest — velvet */}
      <mesh position={[0, 1.1, -0.5]} castShadow>
        <boxGeometry args={[1.2, 1.2, 0.15]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.9}
          metalness={0}
          sheen={1.0}
          sheenRoughness={0.5}
          sheenColor={sheenColor}
          clearcoat={0.1}
        />
      </mesh>
      {/* Brass legs — polished gold (metalness 1.0) */}
      {(
        [
          [-0.5, -0.5],
          [0.5, -0.5],
          [-0.5, 0.5],
          [0.5, 0.5],
        ] as Array<[number, number]>
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.04, 1, 12]} />
          <meshPhysicalMaterial
            color={PALETTE.BRASS_POLISHED}
            metalness={1.0}
            roughness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>
      ))}
    </group>
  )
}

function FurnitureTable({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {/* Ivory top — lacquered (clearcoat 1.0) */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 48]} />
        <meshPhysicalMaterial
          color={PALETTE.IVORY_LACQUER}
          roughness={0.05}
          metalness={0.3}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
        />
      </mesh>
      {/* Wood stem */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 1, 16]} />
        <meshPhysicalMaterial
          color={PALETTE.VELVET_GOLD}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* Wood base */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.1, 48]} />
        <meshPhysicalMaterial
          color={PALETTE.VELVET_GOLD}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* Brass ring around top edge */}
      <mesh position={[0, 1.06, 0]}>
        <torusGeometry args={[1.55, 0.025, 8, 64]} />
        <meshPhysicalMaterial
          color={PALETTE.BRASS_POLISHED}
          metalness={1.0}
          roughness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>
    </group>
  )
}

function FurnitureSofa({
  position,
  color,
}: {
  position: Vec3
  color: string
}) {
  const sheenColor = useMemo(
    () => new THREE.Color(color).multiplyScalar(1.3),
    [color],
  )
  return (
    <group position={position}>
      {/* Base — velvet */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[3, 0.6, 1.2]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.9}
          metalness={0}
          sheen={1.0}
          sheenRoughness={0.5}
          sheenColor={sheenColor}
          clearcoat={0.1}
        />
      </mesh>
      {/* Back — velvet */}
      <mesh position={[0, 1, -0.5]} castShadow>
        <boxGeometry args={[3, 0.8, 0.2]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.9}
          metalness={0}
          sheen={1.0}
          sheenRoughness={0.5}
          sheenColor={sheenColor}
          clearcoat={0.1}
        />
      </mesh>
      {/* Arms — velvet */}
      <mesh position={[-1.5, 0.6, 0]} castShadow>
        <boxGeometry args={[0.3, 0.8, 1.2]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.9}
          metalness={0}
          sheen={1.0}
          sheenRoughness={0.5}
          sheenColor={sheenColor}
          clearcoat={0.1}
        />
      </mesh>
      <mesh position={[1.5, 0.6, 0]} castShadow>
        <boxGeometry args={[0.3, 0.8, 1.2]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.9}
          metalness={0}
          sheen={1.0}
          sheenRoughness={0.5}
          sheenColor={sheenColor}
          clearcoat={0.1}
        />
      </mesh>
    </group>
  )
}

function FloorLamp({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {/* Brass base */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.2, 24]} />
        <meshPhysicalMaterial
          color={PALETTE.BRASS_POLISHED}
          metalness={1.0}
          roughness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Brass stem */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 2.8, 12]} />
        <meshPhysicalMaterial
          color={PALETTE.BRASS_POLISHED}
          metalness={1.0}
          roughness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Ivory shade — emissive warm glow */}
      <mesh position={[0, 2.9, 0]}>
        <coneGeometry args={[0.45, 0.6, 24, 1, true]} />
        <meshPhysicalMaterial
          color={PALETTE.IVORY_LACQUER}
          roughness={0.6}
          emissive="#FFE4B5"
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Bulb — basic emissive sphere */}
      <mesh position={[0, 2.7, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#FFF8E7" transparent opacity={0.8} />
      </mesh>
      {/* Warm point light inside the shade */}
      <pointLight position={[0, 2.7, 0]} intensity={0.6} color="#FFE4B5" distance={8} decay={2} />
    </group>
  )
}

function LutFurniture({ z, scale }: { z: number; scale: number }) {
  // Group at sectionZs.lut, scaled per viewport (HTML: 0.9 desktop / 0.5 mobile)
  // Y=0.5 lift so chair-leg bottoms rest ON the blueprint floor.
  const deg = Math.PI / 180
  return (
    <group position={[0, 0.5, z]} scale={scale}>
      {/* Rug — flat on floor, receiveShadow */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshPhysicalMaterial
          color="#2D1818"
          roughness={0.95}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Sofa — center-back (LUT velvet) */}
      <FurnitureSofa position={[0, 0, -3]} color={PALETTE.LUT} />
      {/* Flanking chairs */}
      <FurnitureChair position={[-3, 0, -1]} color={PALETTE.LUT} rotation={[0, 25 * deg, 0]} />
      <FurnitureChair position={[3, 0, -1]} color={PALETTE.LUT} rotation={[0, -25 * deg, 0]} />
      {/* Coffee table — center */}
      <FurnitureTable position={[0, 0, 0]} />
      {/* Front chairs facing sofa */}
      <FurnitureChair position={[-2.5, 0, 2]} color={PALETTE.LUT} rotation={[0, Math.PI, 0]} />
      <FurnitureChair position={[2.5, 0, 2]} color={PALETTE.LUT} rotation={[0, Math.PI, 0]} />
      {/* Side chairs — ivory */}
      <FurnitureChair position={[-4, 0, 1]} color={PALETTE.IVORY_LACQUER} rotation={[0, Math.PI / 2, 0]} />
      <FurnitureChair position={[4, 0, 1]} color={PALETTE.IVORY_LACQUER} rotation={[0, -Math.PI / 2, 0]} />
      {/* Side table */}
      <FurnitureTable position={[-4.5, 0, -2]} />
      {/* Floor lamp */}
      <FloorLamp position={[4.5, 0, -2]} />
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════
// BIRTHDAY PARTY — mylar balloons + cake + gifts + banner + confetti
// Mirrors HTML's birthGroup (positioned at sectionZs.birthday)
// ═════════════════════════════════════════════════════════════════

// Mylar balloon material — iridescent physical material (HTML's mylarMat)
function useMylarMaterial(color: string) {
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.15,
        metalness: 0.3,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        iridescence: 1.0,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [100, 400] as [number, number],
      }),
    [color],
  )
}

function Balloon({
  position,
  color,
}: {
  position: Vec3
  color: string
}) {
  const ref = useRef<THREE.Group>(null)
  const mylarMat = useMylarMaterial(color)

  useEffect(
    () => () => {
      mylarMat.dispose()
    },
    [mylarMat],
  )

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    // Float animation (HTML: sin(t*0.35 + baseX*0.8)*0.12 + sin(t*0.6 + baseZ)*0.05)
    ref.current.position.y =
      position[1] +
      Math.sin(t * 0.35 + position[0] * 0.8) * 0.12 +
      Math.sin(t * 0.6 + position[2]) * 0.05
    ref.current.rotation.z = Math.sin(t * 0.2 + position[2]) * 0.04
    ref.current.rotation.x = Math.sin(t * 0.15 + position[0]) * 0.03
  })

  return (
    <group ref={ref} position={position}>
      {/* Balloon body — mylar (iridescence) */}
      <mesh castShadow material={mylarMat}>
        <sphereGeometry args={[0.7, 32, 32]} />
      </mesh>
      {/* Knot */}
      <mesh position={[0, -0.7, 0]} material={mylarMat}>
        <coneGeometry args={[0.1, 0.2, 12]} />
      </mesh>
      {/* String */}
      <mesh position={[0, -1.3, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 1, 4]} />
        <meshBasicMaterial color={PALETTE.IVORY_LACQUER} />
      </mesh>
    </group>
  )
}

function BirthdayCake({ position }: { position: Vec3 }) {
  // 3-tier cake with gold rings + 3 candles with flickering flames
  const flameRefs = useRef<THREE.Mesh[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    flameRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const offset = i * 0.9
      // HTML: 0.7 + sin(t*9 + offset)*0.25 + sin(t*14 + offset*1.3)*0.18 + sin(t*21 + offset*0.7)*0.1
      const flicker =
        0.7 +
        Math.sin(t * 9 + offset) * 0.25 +
        Math.sin(t * 14 + offset * 1.3) * 0.18 +
        Math.sin(t * 21 + offset * 0.7) * 0.1
      ;(mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = flicker
    })
  })

  return (
    <group position={position} scale={1.2}>
      {/* Bottom tier — ivory lacquer */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.6, 48]} />
        <meshPhysicalMaterial
          color={PALETTE.IVORY_LACQUER}
          roughness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Middle tier — birthday gold */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 0.5, 48]} />
        <meshPhysicalMaterial
          color={PALETTE.YOUR_BIRTHDAY}
          roughness={0.25}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
        />
      </mesh>
      {/* Top tier — ivory lacquer */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.4, 48]} />
        <meshPhysicalMaterial
          color={PALETTE.IVORY_LACQUER}
          roughness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Gold ring 1 — between bottom + middle */}
      <mesh position={[0, 0.55, 0]}>
        <torusGeometry args={[1.2, 0.04, 12, 64]} />
        <meshPhysicalMaterial
          color={PALETTE.BRASS_POLISHED}
          metalness={1.0}
          roughness={0.05}
          emissive={PALETTE.YOUR_BIRTHDAY}
          emissiveIntensity={0.4}
          clearcoat={1.0}
        />
      </mesh>
      {/* Gold ring 2 — between middle + top */}
      <mesh position={[0, 1.0, 0]}>
        <torusGeometry args={[0.85, 0.03, 12, 64]} />
        <meshPhysicalMaterial
          color={PALETTE.BRASS_POLISHED}
          metalness={1.0}
          roughness={0.05}
          emissive={PALETTE.YOUR_BIRTHDAY}
          emissiveIntensity={0.4}
          clearcoat={1.0}
        />
      </mesh>
      {/* 3 candles with flames */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <group key={i} position={[x, 1.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 12]} />
            <meshPhysicalMaterial
              color={i === 1 ? PALETTE.LUT : PALETTE.LA_LOUNGE}
              roughness={0.3}
              clearcoat={0.5}
            />
          </mesh>
          <mesh
            ref={(m) => {
              if (m) flameRefs.current[i] = m
            }}
            position={[0, 0.28, 0]}
          >
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial
              color={PALETTE.YOUR_BIRTHDAY}
              emissive={PALETTE.YOUR_BIRTHDAY}
              emissiveIntensity={1}
            />
          </mesh>
          <pointLight position={[0, 0.3, 0]} intensity={0.4} color="#FFD580" distance={3} decay={2} />
        </group>
      ))}
    </group>
  )
}

function GiftBox({
  position,
  color,
}: {
  position: Vec3
  color: string
}) {
  return (
    <group position={position}>
      {/* Box */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 1]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.4}
          metalness={0.1}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
        />
      </mesh>
      {/* Lid — ivory */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[1.1, 0.15, 1.1]} />
        <meshPhysicalMaterial
          color={PALETTE.IVORY_LACQUER}
          roughness={0.2}
          metalness={0.2}
          clearcoat={1.0}
        />
      </mesh>
      {/* Ribbon vertical — brass */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.15, 0.8, 1.01]} />
        <meshPhysicalMaterial
          color={PALETTE.BRASS_POLISHED}
          metalness={1.0}
          roughness={0.05}
          clearcoat={1.0}
        />
      </mesh>
      {/* Ribbon horizontal — brass */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.01, 0.8, 0.15]} />
        <meshPhysicalMaterial
          color={PALETTE.BRASS_POLISHED}
          metalness={1.0}
          roughness={0.05}
          clearcoat={1.0}
        />
      </mesh>
      {/* Bow — brass torus */}
      <mesh position={[0, 1.0, 0]}>
        <torusGeometry args={[0.22, 0.07, 12, 24]} />
        <meshPhysicalMaterial
          color={PALETTE.BRASS_POLISHED}
          metalness={1.0}
          roughness={0.05}
          clearcoat={1.0}
        />
      </mesh>
    </group>
  )
}

function Banner() {
  // Curved garland tube along a Catmull-Rom spline (HTML: 30 segments)
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 30; i++) {
      const t = i / 30
      pts.push(
        new THREE.Vector3(
          -7 + t * 14,
          3.5 + Math.sin(t * Math.PI) * 2.0 + Math.sin(t * Math.PI * 3) * 0.3,
          -1 + Math.sin(t * Math.PI * 2) * 0.5,
        ),
      )
    }
    return new THREE.CatmullRomCurve3(pts)
  }, [])
  return (
    <mesh>
      <tubeGeometry args={[curve, 80, 0.04, 12, false]} />
      <meshPhysicalMaterial
        color={PALETTE.YOUR_BIRTHDAY}
        emissive={PALETTE.YOUR_BIRTHDAY}
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.2}
        clearcoat={0.5}
      />
    </mesh>
  )
}

function Confetti({ count }: { count: number }) {
  // 100 colored points with additive blending (HTML: vertexColors + 4-color palette)
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const palette = [
      new THREE.Color(PALETTE.YOUR_BIRTHDAY),
      new THREE.Color(PALETTE.LA_LOUNGE),
      new THREE.Color(PALETTE.BRASS_POLISHED),
      new THREE.Color(PALETTE.MYLAR_PINK),
    ]
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24
      positions[i * 3 + 1] = Math.random() * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [count])

  const ref = useRef<THREE.Points>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.y = t * 0.015
    ref.current.rotation.x = Math.sin(t * 0.1) * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry key={count}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function BirthdayParty({
  z,
  scale,
}: {
  z: number
  scale: number
}) {
  return (
    <group position={[0, 0, z]} scale={scale}>
      {/* 6 mylar balloons (HTML: -5, -3, -1, 1, 3, 5 X positions) */}
      <Balloon position={[-5, 0.5, 0]} color={PALETTE.YOUR_BIRTHDAY} />
      <Balloon position={[-3, 1, 1]} color={PALETTE.LA_LOUNGE} />
      <Balloon position={[-1, 0.8, -1]} color={PALETTE.MYLAR_PINK} />
      <Balloon position={[1, 1.2, 0]} color={PALETTE.MYLAR_GOLD} />
      <Balloon position={[3, 0.6, 1]} color={PALETTE.YOUR_BIRTHDAY} />
      <Balloon position={[5, 1, -1]} color={PALETTE.LA_LOUNGE} />
      {/* Cake — 3-tier with candles */}
      <BirthdayCake position={[0, 0, 2]} />
      {/* Gift boxes */}
      <GiftBox position={[-4, 0, 2]} color={PALETTE.LUT} />
      <GiftBox position={[4, 0, 2]} color={PALETTE.LA_LOUNGE} />
      {/* Banner — curved garland */}
      <Banner />
      {/* Confetti — 100 colored points */}
      <Confetti count={100} />
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════
// CENTER BLUEPRINT BIRTHDAY SCENE — full wireframe party scene
// Mirrors HTML's centerGroup (positioned at sectionZs.lalounge)
// All elements use LineBasicMaterial in brand colors
// ═════════════════════════════════════════════════════════════════

function BlueprintBalloon({
  position,
  mat,
}: {
  position: Vec3
  mat: THREE.LineBasicMaterial
}) {
  const ref = useRef<THREE.Group>(null)
  // String line (2 points)
  const stringGeo = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.88, 0),
        new THREE.Vector3(0, -2.2, 0),
      ]),
    [],
  )
  // G1-A2 #2: memoize the THREE.Line so it's not re-allocated per render
  // (moved after stringMat definition — see below)
  // Balloon body — wireframe icosahedron
  const balloonEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.8, 1)),
    [],
  )
  // Knot — wireframe cone
  const knotEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.ConeGeometry(0.08, 0.15, 6)),
    [],
  )
  const stringMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: PALETTE.RING_COLOR,
        transparent: true,
        opacity: 0.3,
      }),
    [],
  )
  // G1-A2 #2: memoize the THREE.Line so it's not re-allocated per render
  const stringLine = useMemo(
    () => new THREE.Line(stringGeo, stringMat),
    [stringGeo, stringMat],
  )

  useEffect(
    () => () => {
      stringGeo.dispose()
      balloonEdges.dispose()
      knotEdges.dispose()
      stringMat.dispose()
    },
    [stringGeo, balloonEdges, knotEdges, stringMat],
  )

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    // HTML: sin(t*0.3 + baseX*0.6)*0.15 + sin(t*0.5 + baseZ*0.8)*0.08
    ref.current.position.y =
      position[1] +
      Math.sin(t * 0.3 + position[0] * 0.6) * 0.15 +
      Math.sin(t * 0.5 + position[2] * 0.8) * 0.08
    ref.current.rotation.y = t * 0.1 + position[0]
    ref.current.rotation.z = Math.sin(t * 0.25 + position[2]) * 0.05
  })

  return (
    <group ref={ref} position={position}>
      <lineSegments geometry={balloonEdges} material={mat} />
      <lineSegments position={[0, -0.8, 0]} geometry={knotEdges} material={mat} />
      <primitive object={stringLine} />
    </group>
  )
}

function BlueprintGift({
  position,
  mat,
  matBold,
  matSub,
}: {
  position: Vec3
  mat: THREE.LineBasicMaterial
  matBold: THREE.LineBasicMaterial
  matSub: THREE.LineBasicMaterial
}) {
  // Box + lid + ribbon v + ribbon h + bow (all wireframe)
  const boxEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 0.9, 1.1)),
    [],
  )
  const lidEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.2, 0.15, 1.2)),
    [],
  )
  const bowEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.TorusGeometry(0.18, 0.05, 6, 16)),
    [],
  )
  // Ribbon vertical — 2 segments (4 points)
  const rvGeo = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.45, 0.56),
        new THREE.Vector3(0, 0.6, 0.56),
        new THREE.Vector3(0, -0.45, -0.56),
        new THREE.Vector3(0, 0.6, -0.56),
      ]),
    [],
  )
  // Ribbon horizontal — 2 segments (4 points)
  const rhGeo = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.56, -0.45, 0),
        new THREE.Vector3(0.56, 0.6, 0),
        new THREE.Vector3(-0.56, -0.45, 0),
        new THREE.Vector3(-0.56, 0.6, 0),
      ]),
    [],
  )
  useEffect(
    () => () => {
      boxEdges.dispose()
      lidEdges.dispose()
      bowEdges.dispose()
      rvGeo.dispose()
      rhGeo.dispose()
    },
    [boxEdges, lidEdges, bowEdges, rvGeo, rhGeo],
  )
  return (
    <group position={position}>
      <lineSegments geometry={boxEdges} material={mat} />
      <lineSegments position={[0, 0.52, 0]} geometry={lidEdges} material={matSub} />
      <lineSegments geometry={rvGeo} material={matBold} />
      <lineSegments geometry={rhGeo} material={matBold} />
      <lineSegments
        position={[0, 0.7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={bowEdges}
        material={matBold}
      />
    </group>
  )
}

function BlueprintChair({
  position,
  rotation = [0, 0, 0] as Vec3,
  matSub,
  matDim,
}: {
  position: Vec3
  rotation?: Vec3
  matSub: THREE.LineBasicMaterial
  matDim: THREE.LineBasicMaterial
}) {
  const seatEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.7, 0.08, 0.7)),
    [],
  )
  const backEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.7, 0.6, 0.06)),
    [],
  )
  const legEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4)),
    [],
  )
  useEffect(
    () => () => {
      seatEdges.dispose()
      backEdges.dispose()
      legEdges.dispose()
    },
    [seatEdges, backEdges, legEdges],
  )
  return (
    <group position={position} rotation={rotation}>
      <lineSegments geometry={seatEdges} material={matSub} />
      <lineSegments position={[0, 0.35, -0.32]} geometry={backEdges} material={matSub} />
      {(
        [
          [-0.3, -0.3],
          [0.3, -0.3],
          [-0.3, 0.3],
          [0.3, 0.3],
        ] as Array<[number, number]>
      ).map(([lx, lz], i) => (
        <lineSegments
          key={i}
          position={[lx, -0.2, lz]}
          geometry={legEdges}
          material={matDim}
        />
      ))}
    </group>
  )
}

function BlueprintStar({
  position,
  scale,
  mat,
}: {
  position: Vec3
  scale: number
  mat: THREE.LineBasicMaterial
}) {
  // 5-point star (10-vertex shape)
  const starEdges = useMemo(() => {
    const shape = new THREE.Shape()
    const outerR = 0.3 * scale
    const innerR = 0.12 * scale
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    shape.closePath()
    return new THREE.EdgesGeometry(new THREE.ShapeGeometry(shape))
  }, [scale])
  useEffect(() => () => starEdges.dispose(), [starEdges])
  return (
    <lineSegments position={position} rotation={[-Math.PI / 2, 0, 0]} geometry={starEdges} material={mat} />
  )
}

function CenterBlueprintScene({
  z,
  scale,
}: {
  z: number
  scale: number
}) {
  const groupRef = useRef<THREE.Group>(null)

  // Pre-build all elements once via useMemo (matches MasterArchitecture pattern)
  const { elements, materials, geometries } = useMemo(() => {
    const items: ReactElement[] = []
    const geos: THREE.BufferGeometry[] = []
    const mats: THREE.LineBasicMaterial[] = []
    const track = <T extends THREE.BufferGeometry>(g: T): T => {
      geos.push(g)
      return g
    }
    const trackMat = <T extends THREE.LineBasicMaterial>(m: T): T => {
      mats.push(m)
      return m
    }

    // Blueprint materials (HTML: bpMatBold/Main/Sub/Dim)
    const bpMatBold = trackMat(
      new THREE.LineBasicMaterial({
        color: PALETTE.YOUR_BIRTHDAY,
        transparent: true,
        opacity: 0.7,
      }),
    )
    const bpMatMain = trackMat(
      new THREE.LineBasicMaterial({
        color: PALETTE.LA_LOUNGE,
        transparent: true,
        opacity: 0.6,
      }),
    )
    const bpMatSub = trackMat(
      new THREE.LineBasicMaterial({
        color: PALETTE.GRID_ACCENT,
        transparent: true,
        opacity: 0.4,
      }),
    )
    const bpMatDim = trackMat(
      new THREE.LineBasicMaterial({
        color: PALETTE.RING_COLOR,
        transparent: true,
        opacity: 0.3,
      }),
    )

    // --- Blueprint Cake (3-tier wireframe) ---
    // Bottom tier
    const cakeBottomEdges = track(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.6, 1.6, 0.7, 32)))
    items.push(
      <lineSegments key="cake_b" position={[0, 0.35, 0]} geometry={cakeBottomEdges} material={bpMatBold} />,
    )
    // Middle tier
    const cakeMidEdges = track(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.1, 1.1, 0.55, 32)))
    items.push(
      <lineSegments key="cake_m" position={[0, 0.95, 0]} geometry={cakeMidEdges} material={bpMatMain} />,
    )
    // Top tier
    const cakeTopEdges = track(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.75, 0.75, 0.45, 32)))
    items.push(
      <lineSegments key="cake_t" position={[0, 1.45, 0]} geometry={cakeTopEdges} material={bpMatBold} />,
    )
    // Plate
    const plateEdges = track(new THREE.EdgesGeometry(new THREE.CylinderGeometry(2.0, 2.0, 0.08, 48)))
    items.push(
      <lineSegments key="plate" position={[0, 0.04, 0]} geometry={plateEdges} material={bpMatSub} />,
    )
    // Gold ring 1 (between bottom + middle)
    const ring1Edges = track(new THREE.EdgesGeometry(new THREE.TorusGeometry(1.35, 0.05, 8, 64)))
    items.push(
      <lineSegments
        key="ring1"
        position={[0, 0.72, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={ring1Edges}
        material={bpMatBold}
      />,
    )
    // Gold ring 2 (between middle + top)
    const ring2Edges = track(new THREE.EdgesGeometry(new THREE.TorusGeometry(0.92, 0.04, 8, 64)))
    items.push(
      <lineSegments
        key="ring2"
        position={[0, 1.2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={ring2Edges}
        material={bpMatBold}
      />,
    )
    // Candles (3) — wireframe cylinders + flame dots
    ;[-0.4, 0, 0.4].forEach((x, i) => {
      const candleEdges = track(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8)))
      items.push(
        <lineSegments
          key={`candle_${i}`}
          position={[x, 1.7, 0]}
          geometry={candleEdges}
          material={i === 1 ? bpMatBold : bpMatMain}
        />,
      )
      // Flame dot — small emissive sphere
      items.push(
        <mesh key={`flame_${i}`} position={[x, 1.95, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={PALETTE.YOUR_BIRTHDAY} transparent opacity={0.8} />
        </mesh>,
      )
    })

    // --- Blueprint Balloons (5 — wireframe icosahedrons) ---
    // (Rendered via BlueprintBalloon component below — not pushed to items here)

    // --- Blueprint Gift Boxes (3) ---
    // (Rendered via BlueprintGift component below — not pushed to items here)

    // --- Blueprint Banner / Garland (wireframe tube curve) ---
    const garlandPts: THREE.Vector3[] = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      garlandPts.push(
        new THREE.Vector3(
          -5 + t * 10,
          3.0 + Math.sin(t * Math.PI) * 1.8 + Math.sin(t * Math.PI * 4) * 0.4,
          -2 + Math.sin(t * Math.PI * 2) * 1.0,
        ),
      )
    }
    const garlandCurve = new THREE.CatmullRomCurve3(garlandPts)
    const garlandEdges = track(new THREE.EdgesGeometry(new THREE.TubeGeometry(garlandCurve, 80, 0.03, 8, false)))
    items.push(<lineSegments key="garland" geometry={garlandEdges} material={bpMatMain} />)

    // Small flags on garland (7 flags)
    for (let i = 1; i < 8; i++) {
      const t = i / 8
      const pt = garlandCurve.getPoint(t)
      const tan = garlandCurve.getTangent(t)
      const flagEdges = track(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.4, 0.25)))
      // Compute Euler from tangent direction (approximate lookAt)
      const target = pt.clone().add(tan)
      const m = new THREE.Matrix4().lookAt(pt, target, new THREE.Vector3(0, 1, 0))
      const q = new THREE.Quaternion().setFromRotationMatrix(m)
      const e = new THREE.Euler().setFromQuaternion(q)
      // After lookAt, rotate Y by π/2 (HTML: flag.rotateY(Math.PI / 2))
      const finalRot: Vec3 = [e.x, e.y + Math.PI / 2, e.z]
      items.push(
        <lineSegments
          key={`flag_${i}`}
          position={[pt.x, pt.y, pt.z]}
          rotation={finalRot}
          geometry={flagEdges}
          material={i % 2 === 0 ? bpMatBold : bpMatMain}
        />,
      )
    }

    // --- Blueprint Table (small party table) ---
    const tableTopEdges = track(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.8, 1.8, 0.08, 32)))
    items.push(
      <lineSegments
        key="tab_top"
        position={[0, 0.8, -2.5]}
        geometry={tableTopEdges}
        material={bpMatSub}
      />,
    )
    const tableLegEdges = track(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6)))
    ;([
      [-1.2, -0.8],
      [1.2, -0.8],
      [-1.2, 0.8],
      [1.2, 0.8],
    ] as Array<[number, number]>).forEach(([lx, lz], i) => {
      items.push(
        <lineSegments
          key={`tab_leg_${i}`}
          position={[lx, 0.4, -2.5 + lz]}
          geometry={tableLegEdges}
          material={bpMatDim}
        />,
      )
    })

    // --- Blueprint Confetti (40 floating wireframe triangles/squares) ---
    for (let i = 0; i < 40; i++) {
      const size = 0.08 + Math.random() * 0.12
      const confEdges = track(new THREE.EdgesGeometry(new THREE.PlaneGeometry(size, size)))
      items.push(
        <lineSegments
          key={`bp_conf_${i}`}
          position={[
            (Math.random() - 0.5) * 12,
            0.5 + Math.random() * 4,
            (Math.random() - 0.5) * 8,
          ]}
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
          geometry={confEdges}
          material={Math.random() > 0.5 ? bpMatBold : bpMatMain}
        />,
      )
    }

    // --- Blueprint Party Hat ---
    const hatEdges = track(new THREE.EdgesGeometry(new THREE.ConeGeometry(0.35, 0.8, 8)))
    items.push(
      <lineSegments key="hat" position={[1.5, 0.4, 1.5]} geometry={hatEdges} material={bpMatBold} />,
    )
    // Hat pom-pom
    const pomEdges = track(new THREE.EdgesGeometry(new THREE.SphereGeometry(0.08, 6, 6)))
    items.push(
      <lineSegments key="pom" position={[1.5, 0.85, 1.5]} geometry={pomEdges} material={bpMatBold} />,
    )

    // --- Blueprint Number "1" (wireframe line segments) ---
    const num1Pts = [
      new THREE.Vector3(-0.05, 0, 0),
      new THREE.Vector3(0.05, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(-0.08, 0.08, 0),
      new THREE.Vector3(0, 0.15, 0),
    ]
    const num1Geo = track(new THREE.BufferGeometry().setFromPoints(num1Pts))
    items.push(
      <lineSegments
        key="num1"
        position={[0, 2.0, 0.5]}
        scale={1.5}
        geometry={num1Geo}
        material={bpMatBold}
      />,
    )

    return {
      elements: items,
      materials: { bpMatBold, bpMatMain, bpMatSub, bpMatDim },
      geometries: geos,
      mats,
    }
  }, [])

  // Cleanup on unmount
  useEffect(
    () => () => {
      materials.bpMatBold.dispose()
      materials.bpMatMain.dispose()
      materials.bpMatSub.dispose()
      materials.bpMatDim.dispose()
      geometries.forEach((g) => g.dispose())
    },
    [materials, geometries],
  )

  // Gentle rotation — slow blueprint turntable (HTML: sin(t*0.08)*0.15)
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.15
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, z]} scale={scale}>
      {elements}

      {/* Blueprint balloons (5) */}
      <BlueprintBalloon position={[-3.5, 2.5, -1]} mat={materials.bpMatBold} />
      <BlueprintBalloon position={[3.5, 2.8, 1]} mat={materials.bpMatMain} />
      <BlueprintBalloon position={[-2, 3.5, 1.5]} mat={materials.bpMatMain} />
      <BlueprintBalloon position={[2, 3.2, -1.5]} mat={materials.bpMatBold} />
      <BlueprintBalloon position={[0, 4.0, 0]} mat={materials.bpMatBold} />

      {/* Blueprint gifts (3) */}
      <BlueprintGift position={[-3, 0.45, 2]} mat={materials.bpMatMain} matBold={materials.bpMatBold} matSub={materials.bpMatSub} />
      <BlueprintGift position={[3, 0.45, -2]} mat={materials.bpMatMain} matBold={materials.bpMatBold} matSub={materials.bpMatSub} />
      <BlueprintGift position={[0, 0.45, 3]} mat={materials.bpMatBold} matBold={materials.bpMatBold} matSub={materials.bpMatSub} />

      {/* Blueprint chairs (3 around the table) */}
      <BlueprintChair position={[-2.2, 0.4, -2.5]} rotation={[0, Math.PI / 4, 0]} matSub={materials.bpMatSub} matDim={materials.bpMatDim} />
      <BlueprintChair position={[2.2, 0.4, -2.5]} rotation={[0, -Math.PI / 4, 0]} matSub={materials.bpMatSub} matDim={materials.bpMatDim} />
      <BlueprintChair position={[0, 0.4, -4.2]} rotation={[0, 0, 0]} matSub={materials.bpMatSub} matDim={materials.bpMatDim} />

      {/* Blueprint stars (5 floor decals) */}
      <BlueprintStar position={[-4, 0.05, 0]} scale={1.0} mat={materials.bpMatBold} />
      <BlueprintStar position={[4, 0.05, 1]} scale={0.8} mat={materials.bpMatMain} />
      <BlueprintStar position={[0, 0.05, -3]} scale={0.6} mat={materials.bpMatBold} />
      <BlueprintStar position={[-1.5, 0.05, 1.5]} scale={0.7} mat={materials.bpMatMain} />
      <BlueprintStar position={[1.5, 0.05, -1]} scale={0.9} mat={materials.bpMatBold} />
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════
// SHADER GRID — custom animated grid (HTML's gridMesh + gridUniforms)
// ═════════════════════════════════════════════════════════════════
function ShaderGrid() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  // Build uniforms once (HTML's gridUniforms)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorMain: { value: new THREE.Color(PALETTE.GRID_MAIN) },
      uColorAccent: { value: new THREE.Color(PALETTE.GRID_ACCENT) },
      uColorLight: { value: new THREE.Color(PALETTE.GRID_LIGHT) },
      uColorPulse: { value: new THREE.Color(PALETTE.GRID_PULSE) },
      uFadeStart: { value: 40.0 },
      uFadeEnd: { value: 120.0 },
    }),
    [],
  )

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[300, 300]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={gridVertexShader}
        fragmentShader={gridFragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ═════════════════════════════════════════════════════════════════
// RADIAL RINGS — 8 concentric rings (HTML's ringsGroup)
// ═════════════════════════════════════════════════════════════════
function RadialRings() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.08
    }
  })
  return (
    <group ref={groupRef}>
      {Array.from({ length: 8 }).map((_, i) => {
        const radius = 6 + i * 5
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius, radius + 0.08, 128]} />
            <meshBasicMaterial
              color={PALETTE.RING_COLOR}
              transparent
              opacity={0.12 - i * 0.01}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════
// MASTER ARCHITECTURE — wireframe event structures (HTML's archGroup)
// Platforms + pillars + trusses + tables + elevation markers + zone markers
// ═════════════════════════════════════════════════════════════════
function MasterArchitecture() {
  const { elements, materials, geometries } = useMemo(() => {
    const items: ReactElement[] = []
    const geos: THREE.BufferGeometry[] = []
    const track = <T extends THREE.BufferGeometry>(geo: T): T => {
      geos.push(geo)
      return geo
    }

    // Materials — muted blueprint ink
    const matBold = new THREE.LineBasicMaterial({
      color: PALETTE.LA_LOUNGE,
      transparent: true,
      opacity: 0.5,
    })
    const matMain = new THREE.LineBasicMaterial({
      color: PALETTE.RING_COLOR,
      transparent: true,
      opacity: 0.4,
    })
    const matSub = new THREE.LineBasicMaterial({
      color: PALETTE.GRID_ACCENT,
      transparent: true,
      opacity: 0.3,
    })

    // --- Platforms (HTML: 3 platforms) ---
    const platforms: Array<{ w: number; h: number; d: number; x: number; y: number; z: number; mat: THREE.LineBasicMaterial }> = [
      { w: 14, h: 0.3, d: 7, x: 0, y: 0.15, z: -18, mat: matMain },
      { w: 10, h: 0.3, d: 5, x: -18, y: 0.15, z: 12, mat: matMain },
      { w: 8, h: 0.3, d: 4, x: 18, y: 0.15, z: 8, mat: matMain },
    ]
    platforms.forEach((p, i) => {
      const geo = track(new THREE.BoxGeometry(p.w, p.h, p.d))
      items.push(
        <lineSegments
          key={`plat_${i}`}
          geometry={track(new THREE.EdgesGeometry(geo))}
          material={p.mat}
          position={[p.x, p.y, p.z]}
        />,
      )
    })

    // --- Pillars (HTML: 8 pillars at 4 corner positions + 4 mid-edges) ---
    const pillars: Array<[number, number]> = [
      [-22, -18],
      [22, -18],
      [-22, 18],
      [22, 18],
      [-12, -8],
      [12, -8],
      [-12, 8],
      [12, 8],
    ]
    pillars.forEach(([x, z], i) => {
      // Deterministic pseudo-random height (avoid SSR/hydration mismatch)
      const h = 6 + ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 4
      const geo = track(new THREE.BoxGeometry(0.4, h, 0.4))
      items.push(
        <lineSegments
          key={`pil_${i}`}
          geometry={track(new THREE.EdgesGeometry(geo))}
          material={i < 4 ? matBold : matSub}
          position={[x, h / 2, z]}
        />,
      )
    })

    // --- Truss connections (HTML: 4 truss beams) ---
    const trusses: Array<{ w: number; h: number; d: number; x: number; y: number; z: number }> = [
      { w: 44, h: 0.25, d: 0.25, x: 0, y: 7, z: -18 },
      { w: 44, h: 0.25, d: 0.25, x: 0, y: 9, z: 18 },
      { w: 0.25, h: 0.25, d: 36, x: -22, y: 5, z: 0 },
      { w: 0.25, h: 0.25, d: 36, x: 22, y: 5, z: 0 },
    ]
    trusses.forEach((t, i) => {
      const geo = track(new THREE.BoxGeometry(t.w, t.h, t.d))
      items.push(
        <lineSegments
          key={`truss_${i}`}
          geometry={track(new THREE.EdgesGeometry(geo))}
          material={matBold}
          position={[t.x, t.y, t.z]}
        />,
      )
    })

    // --- Tables (HTML: 5 circular tables) ---
    const tables: Array<[number, number]> = [
      [-10, -6],
      [10, -6],
      [0, 16],
      [-16, 0],
      [16, 0],
    ]
    tables.forEach(([x, z], i) => {
      const geo = track(new THREE.CylinderGeometry(1.2, 1.2, 0.25, 24))
      items.push(
        <lineSegments
          key={`tab_${i}`}
          geometry={track(new THREE.EdgesGeometry(geo))}
          material={matSub}
          position={[x, 0.125, z]}
        />,
      )
    })

    // --- Elevation markers (HTML: 16 random vertical lines) ---
    for (let k = 0; k < 16; k++) {
      // Deterministic pseudo-random positions (avoid hydration mismatch)
      const r1 = ((Math.sin(k * 78.233) * 43758.5453) % 1 + 1) % 1
      const r2 = ((Math.sin(k * 12.9898) * 43758.5453) % 1 + 1) % 1
      const r3 = ((Math.sin(k * 39.346) * 43758.5453) % 1 + 1) % 1
      const px = (r1 - 0.5) * 100
      const pz = (r2 - 0.5) * 100
      const py = 2 + r3 * 10
      const lineGeo = track(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(px, 0, pz),
          new THREE.Vector3(px, py, pz),
        ]),
      )
      // Create the THREE.Line instance in the useMemo body (consistent with
      // how BlueprintBalloon / other tracked primitives are constructed) so
      // the JSX is purely declarative and the instance is reused, not
      // re-allocated on each render of the memo result. `lineGeo` is already
      // tracked above for disposal; the Line wrapper itself holds no native
      // GL resources beyond the tracked geometry/material.
      const elevLine = new THREE.Line(lineGeo, matSub)
      items.push(<primitive key={`elev_${k}`} object={elevLine} />)
    }

    // --- Zone markers (HTML: 4 pink triangular cones at central platform) ---
    const zonePositions: Array<[number, number]> = [
      [-8, -4],
      [8, -4],
      [-8, 4],
      [8, 4],
    ]
    zonePositions.forEach(([x, z], i) => {
      items.push(
        <mesh
          key={`zone_${i}`}
          position={[x, 0.08, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[0.6, 0.15, 4]} />
          <meshBasicMaterial color={PALETTE.LA_LOUNGE} transparent opacity={0.5} />
        </mesh>,
      )
    })

    return {
      elements: items,
      materials: { matBold, matMain, matSub },
      geometries: geos,
    }
  }, [])

  useEffect(
    () => () => {
      materials.matBold.dispose()
      materials.matMain.dispose()
      materials.matSub.dispose()
      geometries.forEach((g) => g.dispose())
    },
    [materials, geometries],
  )

  return <group>{elements}</group>
}

// ═════════════════════════════════════════════════════════════════
// GOLD SPINE — pulsing horizontal cylinder (HTML's spine)
// ═════════════════════════════════════════════════════════════════
function GoldSpine() {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((state) => {
    if (matRef.current) {
      // HTML: 0.5 + sin(t*0.5) * 0.15
      matRef.current.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.15
    }
  })
  return (
    <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.08, 0.08, 70, 12]} />
      <meshBasicMaterial
        ref={matRef}
        color={PALETTE.BRASS_POLISHED}
        transparent
        opacity={0.5}
      />
    </mesh>
  )
}

// ═════════════════════════════════════════════════════════════════
// DUST MOTES — 200 particles drifting (HTML's motes)
// Each mote oscillates Y by ±0.5 around its base position; group rotates
// slowly on Y (HTML: motes.rotation.y = t * 0.008)
// ═════════════════════════════════════════════════════════════════
function DustMotes({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 100 : 200
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, basePos, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const basePos = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 80
      const y = (Math.random() - 0.5) * 50
      const z = (Math.random() - 0.5) * 40
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      basePos[i * 3] = x
      basePos[i * 3 + 1] = y
      basePos[i * 3 + 2] = z
      speeds[i] = 0.5 + Math.random() * 1.5
    }
    return { positions, basePos, speeds }
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = t * 0.008
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      const y = basePos[i * 3 + 1] + Math.sin(t * speeds[i] * 0.2 + i) * 0.5
      attr.setY(i, y)
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={count}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={PALETTE.BRASS_POLISHED}
        size={0.15}
        sizeAttenuation
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ═════════════════════════════════════════════════════════════════
// CAMERA RIG — top-down 60° pitch + mouse parallax (damped)
// Mirrors HTML's camera setup + mousemove parallax
// ═════════════════════════════════════════════════════════════════
function CameraRig({
  sectionZs,
  isMobile,
  mouseRef,
}: {
  sectionZs: { lut: number; lalounge: number; birthday: number }
  isMobile: boolean
  mouseRef: MouseRef
}) {
  useFrame((state) => {
    const centerZ = (sectionZs.lut + sectionZs.birthday) / 2

    // Top-down pitched camera (~60° from horizontal — same as HTML file)
    const camDist = isMobile ? 32 : 52
    const pitch = Math.PI / 3
    const height = camDist * Math.sin(pitch)
    const depth = camDist * Math.cos(pitch)

    // Mouse parallax — smooth damping (HTML: mouseX += (target - mouseX) * 0.03)
    const m = mouseRef.current
    m.x += (m.targetX - m.x) * 0.03
    m.y += (m.targetY - m.y) * 0.03
    const parallaxX = m.x * (isMobile ? 2 : 4)
    const parallaxY = m.y * (isMobile ? 1 : 2)

    state.camera.position.x = parallaxX
    state.camera.position.y = height + parallaxY * 0.3
    state.camera.position.z = centerZ + depth + parallaxY * 0.5
    state.camera.lookAt(parallaxX * 0.3, parallaxY * 0.1, centerZ)

    // FOV sync — R3F's `camera` prop is initial-only, so the mobile 42°
    // value never reaches the actual camera without this per-frame guard.
    const cam = state.camera
    if (cam instanceof THREE.PerspectiveCamera) {
      const targetFov = isMobile ? 42 : 50
      if (Math.abs(cam.fov - targetFov) > 0.1) {
        cam.fov = targetFov
        cam.updateProjectionMatrix()
      }
    }
  })
  return null
}

// ═════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════
export function Hero3DBackground() {
  const [enabled, setEnabled] = useState(false)
  const [inView, setInView] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [sectionZs, setSectionZs] = useState({ lut: -10, lalounge: 0, birthday: 10 })

  // Mouse parallax shared ref — populated by window mousemove listener,
  // consumed by CameraRig's useFrame for smooth damping.
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, targetX: 0, targetY: 0 })

  useEffect(() => {
    setEnabled(shouldEnable3D())
  }, [])

  // Responsive detection — on mobile (<768px) the cards are stacked closer
  // together, so the 3D furniture (top) and party objects (bottom) need a
  // smaller scale to avoid bleeding into the middle (La Lounge) section.
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // measure() — dynamically compute sectionZs from real card centers
  // (preserved from v25-fix-F5; cards carry role="button" per ExperienceCard)
  useEffect(() => {
    const measure = () => {
      const cards = document.querySelectorAll('[role=button]')
      const section = document.querySelector('section')
      if (!cards.length || !section) return
      const sectionRect = section.getBoundingClientRect()
      const sectionH = sectionRect.height
      if (sectionH === 0) return

      const cardCenters = Array.from(cards).map((c) => {
        const r = (c as HTMLElement).getBoundingClientRect()
        return (r.top + r.bottom) / 2 - sectionRect.top
      })

      // Z mapping: card 1 (top, frac~0.36) → negative Z; card 3 (bottom,
      // frac~0.74) → positive Z. 0.7 widens the Z range so each object lands
      // visually behind its card on both desktop and mobile.
      const camDist = isMobile ? 32 : 52
      const pitch = Math.PI / 3
      const visibleZ =
        (camDist / Math.sin(pitch)) *
        Math.tan(((isMobile ? 42 : 50) * Math.PI) / 180 / 2)
      const toZ = (frac: number) => (frac - 0.5) * 2 * visibleZ * 0.7

      if (cardCenters.length >= 3) {
        setSectionZs({
          lut: toZ(cardCenters[0] / sectionH),
          lalounge: toZ(cardCenters[1] / sectionH),
          birthday: toZ(cardCenters[2] / sectionH),
        })
      }
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('load', measure)
    const timeoutId = setTimeout(measure, 500)
    const ro = new ResizeObserver(() => measure())
    const section = document.querySelector('section')
    if (section) ro.observe(section)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('load', measure)
      clearTimeout(timeoutId)
      ro.disconnect()
    }
  }, [isMobile])

  // IntersectionObserver — pause render loop when hero is off-screen
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting)
        }
      },
      { threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled])

  // Mouse parallax — window-level mousemove listener populates the shared ref
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  if (!enabled) return null

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    >
      <Canvas
        shadows
        frameloop={inView ? 'always' : 'never'}
        camera={{
          position: [0, isMobile ? 28 : 45, isMobile ? 16 : 26],
          fov: isMobile ? 42 : 50,
          near: 0.1,
          far: 500,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          // ACES Filmic tone mapping + exposure 1.1 (HTML's renderer config)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.1
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
        }}
      >
        {/* Warm fog (HTML: Fog(WARM_FOG, 50, 160)) */}
        <fog attach="fog" args={[PALETTE.WARM_FOG, 50, 160]} />

        {/* ═══ CINEMATIC LIGHTING (HTML lighting rig) ═══ */}
        {/* Ambient base */}
        <ambientLight color={PALETTE.AMBIENT_BASE} intensity={0.25} />
        {/* Hemisphere — sky/ground bounce */}
        <hemisphereLight
          color={PALETTE.AMBIENT_BASE}
          groundColor={PALETTE.DEEP_PLUM}
          intensity={0.4}
        />
        {/* Key light — warm directional with shadows (HTML: position [8,35,8]) */}
        <directionalLight
          position={[8, 35, 8]}
          intensity={1.4}
          color={PALETTE.WARM_KEY}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={100}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        {/* Fill light — cool side */}
        <directionalLight position={[-18, 22, 12]} intensity={0.5} color={PALETTE.COOL_FILL} />
        {/* Rim light — crystal pink from behind */}
        <directionalLight position={[0, 15, -20]} intensity={0.35} color={PALETTE.CRYSTAL_RIM} />
        {/* Spotlight on LUT section (HTML: spotLUT) */}
        <spotLight
          position={[0, 12, sectionZs.lut]}
          angle={0.5}
          penumbra={0.8}
          decay={2}
          intensity={1.0}
          color={PALETTE.BRASS_POLISHED}
          distance={25}
        />
        {/* Spotlight on Birthday section (HTML: spotBirth) */}
        <spotLight
          position={[0, 12, sectionZs.birthday]}
          angle={0.5}
          penumbra={0.8}
          decay={2}
          intensity={0.8}
          color={PALETTE.YOUR_BIRTHDAY}
          distance={20}
        />
        {/* Point accent lights (HTML: pl1, pl2, pl3) */}
        <pointLight position={[0, 5, sectionZs.lut]} intensity={0.9} color={PALETTE.BRASS_POLISHED} distance={22} decay={2} />
        <pointLight position={[0, 5, sectionZs.birthday]} intensity={0.7} color={PALETTE.YOUR_BIRTHDAY} distance={18} decay={2} />
        <pointLight position={[0, 4, 0]} intensity={0.8} color={PALETTE.CRYSTAL_RIM} distance={15} decay={2} />

        <CameraRig sectionZs={sectionZs} isMobile={isMobile} mouseRef={mouseRef} />

        {/* ═══ SCENE ═══ */}
        {/* Custom shader grid (animated pulse/rings/flow) */}
        <ShaderGrid />

        {/* Radial rings (8 concentric, rotating slowly) */}
        <RadialRings />

        {/* Master architecture — wireframe platforms/pillars/trusses/tables/etc */}
        <MasterArchitecture />

        {/* Shadow-catcher floor — invisible except where shadows fall.
            Lets the castShadow furniture shadows be visible across the
            blueprint floor (the shader grid alone can't receive shadows
            because ShaderMaterial overrides the depth pass). */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <shadowMaterial transparent opacity={0.25} />
        </mesh>

        {/* LUT furniture (top, -Z) — velvet + brass + ivory PBR */}
        <LutFurniture z={sectionZs.lut} scale={isMobile ? 0.5 : 0.9} />

        {/* Center blueprint birthday scene (middle, ~0) — wireframe party */}
        <CenterBlueprintScene z={sectionZs.lalounge} scale={isMobile ? 0.5 : 0.9} />

        {/* Birthday party (bottom, +Z) — mylar balloons + cake + gifts */}
        <BirthdayParty z={sectionZs.birthday} scale={isMobile ? 0.5 : 0.9} />

        {/* Gold spine — pulsing horizontal cylinder */}
        <GoldSpine />

        {/* Atmospheric dust motes — drifting particles */}
        <DustMotes isMobile={isMobile} />
      </Canvas>
    </div>
  )
}
