'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { shouldEnable3D } from '@/lib/device-capabilities'

const TUNNEL_LENGTH = 70
const SPEED = 3.5

const PALETTE = [
  '#f5f5dc', '#1b263b', '#6f4e37', '#0d0d0d',
  '#ffffff', '#8e1600', '#4a148c', '#d4af37',
]

function ModernChair({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 0.15, 1]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, -0.45]}>
        <boxGeometry args={[1, 1.2, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
      </mesh>
      {[-0.4, 0.4].map((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`leg-${x}-${z}`} position={[x, -0.5, z]}>
            <cylinderGeometry args={[0.04, 0.02, 1, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
          </mesh>
        )),
      )}
    </group>
  )
}

function LuxurySofa({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.8, 0.4, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.6, -0.45]}>
        <boxGeometry args={[2.8, 0.8, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[-1.25, 0.4, 0.1]}>
        <boxGeometry args={[0.3, 0.6, 1.0]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[1.25, 0.4, 0.1]}>
        <boxGeometry args={[0.3, 0.6, 1.0]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {[-1.2, 1.2].map((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`sofa-leg-${x}-${z}`} position={[x, -0.3, z]}>
            <cylinderGeometry args={[0.06, 0.04, 0.2, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
          </mesh>
        )),
      )}
    </group>
  )
}

function RoundTable({ color }: { color: string }) {
  const topColor = color === '#0d0d0d' ? '#222222' : '#ffffff'
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.1, 48]} />
        <meshStandardMaterial color={topColor} roughness={0.1} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.1, 0.8, 24]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 48]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
      </mesh>
    </group>
  )
}

function FloorLamp({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.05, 24]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 12]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 24, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#ffeba1" />
      </mesh>
    </group>
  )
}

function Sideboard({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.4, 1, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[2.45, 0.05, 0.85]} />
        <meshStandardMaterial color="#ffffff" roughness={0.08} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 0.41]}>
        <boxGeometry args={[0.02, 0.9, 0.02]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
      </mesh>
      <mesh position={[-0.8, 0.6, 0.41]}>
        <boxGeometry args={[0.02, 0.9, 0.02]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
      </mesh>
      <mesh position={[0.8, 0.6, 0.41]}>
        <boxGeometry args={[0.02, 0.9, 0.02]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
      </mesh>
      {[-1.1, 1.1].map((x) =>
        [-0.3, 0.3].map((z) => (
          <mesh key={`sb-leg-${x}-${z}`} position={[x, 0.05, z]}>
            <cylinderGeometry args={[0.04, 0.02, 0.1, 12]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
          </mesh>
        )),
      )}
    </group>
  )
}

interface TunnelItemData {
  index: number
  type: number
  color: string
  x: number
  y: number
  z: number
  scale: number
  rotSpeedX: number
  rotSpeedY: number
  rotSpeedZ: number
  initialRot: [number, number, number]
}

/**
 * Presentational only — no per-item useFrame. The parent InfiniteTunnel drives
 * all animation via a single useFrame over its itemsRef array (1 callback for
 * N items instead of N callbacks, cutting per-frame overhead significantly).
 * Rotation speeds + baseline positions are stashed on mesh.userData so the
 * parent can read them without re-querying React state.
 */
function TunnelItem({
  data,
  registerRef,
}: {
  data: TunnelItemData
  registerRef: (index: number, ref: THREE.Group | null) => void
}) {
  return (
    <group
      ref={(ref) => registerRef(data.index, ref)}
      position={[data.x, data.y, data.z]}
      scale={data.scale}
      rotation={data.initialRot}
      userData={{
        baseY: data.y,
        phaseX: data.x,
        rotSpeedX: data.rotSpeedX,
        rotSpeedY: data.rotSpeedY,
        rotSpeedZ: data.rotSpeedZ,
      }}
    >
      {data.type === 0 && <ModernChair color={data.color} />}
      {data.type === 1 && <LuxurySofa color={data.color} />}
      {data.type === 2 && <RoundTable color={data.color} />}
      {data.type === 3 && <FloorLamp color={data.color} />}
      {data.type === 4 && <Sideboard color={data.color} />}
    </group>
  )
}

function InfiniteTunnel({ isMobile }: { isMobile: boolean }) {
  // Mobile renders ~45% fewer items — big perf win on low-end GPUs.
  // V10 user request: increased desktop count from 18 → 28 for a denser,
  // richer 3D background. Mobile bumped from 10 → 14 proportionally.
  const itemCount = isMobile ? 14 : 28
  const itemsRef = useRef<THREE.Group[]>([])

  const items = useMemo<TunnelItemData[]>(() => {
    const arr: TunnelItemData[] = []
    for (let i = 0; i < itemCount; i++) {
      const type = Math.floor(Math.random() * 5)
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      const angle = Math.random() * Math.PI * 2
      const innerRadius = isMobile ? 2.5 : 5.5
      const radius = innerRadius + Math.random() * (isMobile ? 3.5 : 6)
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const z = -(Math.random() * TUNNEL_LENGTH)
      const scale = (0.4 + Math.random() * 0.6) * (isMobile ? 0.8 : 1)
      const rotSpeedX = (Math.random() - 0.5) * 0.4
      const rotSpeedY = (Math.random() - 0.5) * 0.6
      const rotSpeedZ = (Math.random() - 0.5) * 0.4
      const initialRot: [number, number, number] = [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ]
      arr.push({
        index: i, type, color, x, y, z, scale,
        rotSpeedX, rotSpeedY, rotSpeedZ, initialRot,
      })
    }
    return arr
  }, [itemCount, isMobile])

  const registerRef = useCallback(
    (index: number, ref: THREE.Group | null) => {
      if (ref) {
        itemsRef.current[index] = ref
      } else {
        delete itemsRef.current[index]
      }
    },
    [],
  )

  // Single useFrame drives all N items — replaces N per-item useFrames.
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const meshes = itemsRef.current
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i]
      if (!mesh) continue
      const ud = mesh.userData as {
        baseY: number
        phaseX: number
        rotSpeedX: number
        rotSpeedY: number
        rotSpeedZ: number
      }
      mesh.position.z += SPEED * delta
      mesh.position.y = ud.baseY + Math.sin(t * 1.5 + ud.phaseX) * 0.3
      mesh.rotation.x += ud.rotSpeedX * delta
      mesh.rotation.y += ud.rotSpeedY * delta
      mesh.rotation.z += ud.rotSpeedZ * delta
      if (mesh.position.z > 5) mesh.position.z -= TUNNEL_LENGTH
    }
  })

  return (
    <group>
      {items.map((data) => (
        <TunnelItem
          // Force remount on mobile/desktop switch so userData is freshly set
          // on a new mesh instance (avoids stale props after R3F reconcile).
          key={`${isMobile ? 'm' : 'd'}-${data.index}`}
          data={data}
          registerRef={registerRef}
        />
      ))}
      <Sparkles count={isMobile ? 40 : 60} scale={[20, 20, TUNNEL_LENGTH]} position={[0, 0, -TUNNEL_LENGTH / 2]} size={isMobile ? 1.5 : 2.5} speed={0.4} opacity={0.3} color="#d4af37" />
    </group>
  )
}

function CameraRig() {
  // Jitter fix: deadzone + double-smoothing to eliminate light flicker
  const targetX = useRef(0)
  const targetY = useRef(0)
  useFrame((state) => {
    const px = state.pointer.x
    const py = state.pointer.y
    const DEADZONE = 0.05
    const deadX = Math.abs(px) < DEADZONE ? 0 : px
    const deadY = Math.abs(py) < DEADZONE ? 0 : py
    targetX.current = THREE.MathUtils.lerp(targetX.current, deadX * 1.0, 0.08)
    targetY.current = THREE.MathUtils.lerp(targetY.current, deadY * 1.0, 0.08)
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX.current, 0.1)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY.current, 0.1)
    state.camera.lookAt(0, 0, -20)
  })
  return null
}

interface Background3DProps {
  active?: boolean
}

export function Background3D({ active = true }: Background3DProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [enabled, setEnabled] = useState(false)
  // ⚠️ CRITICAL: Keep the Canvas mounted at all times (never unmount via inView).
  // Unmounting/remounting the <Canvas> causes "WebGL Context Lost" errors which
  // produce the visual glitches/flicker the user sees on page entry + scroll.
  // Instead, we toggle `frameloop` between "always" (rendering) and "never"
  // (frozen, GPU idle) when the hero scrolls out of view — no context churn.
  const [inView, setInView] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEnabled(shouldEnable3D())
    // Initial check is synchronous so the first paint uses the right item count;
    // subsequent resize events are debounced (250ms) to avoid thrashing the
    // Canvas with rapid isMobile toggles during drag-resize.
    setIsMobile(window.innerWidth < 768)
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const checkMobile = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768)
      }, 250)
    }
    window.addEventListener('resize', checkMobile)
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !containerRef.current) return
    const el = containerRef.current
    // Use a lower threshold (1%) so the canvas doesn't flip on/off rapidly
    // during small scroll movements. Combined with keeping it mounted,
    // this eliminates the WebGL context loss cycle.
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.01 })
    io.observe(el)
    return () => io.disconnect()
  }, [enabled])

  if (!enabled || !active) return null

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 0], fov: 45 }}
        style={{ pointerEvents: 'none' }}
        dpr={[1, 1.5]}
        // ⚠️ Toggle frameloop instead of unmounting — prevents context loss.
        // "always" = animate (hero visible), "never" = frozen (hero off-screen).
        frameloop={inView ? 'always' : 'never'}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
          // ⚠️ Prevent context loss when tab is backgrounded
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          // Mark context loss as handled so R3F can attempt recovery instead
          // of crashing the page when the GPU temporarily yanks the context.
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
        }}
        >
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', 25, 75]} />
          {/* Simplified lighting — fewer lights = fewer shader passes + no overlighting.
              Was: ambient(0.35) + spotLight(8) + spotLight(12) + spotLight(9) + directional(2.5) + pointLight(3) = ~35 intensity
              Now: ambient(0.5) + directional(3) + directional(2) + pointLight(4) = ~9.5 intensity
              Plus Bloom is removed (was amplifying the lamp glow into harsh flare on mobile). */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 8, 5]} intensity={3} color="#ffedd6" />
          <directionalLight position={[-8, -4, -8]} intensity={2} color="#4f6d8f" />
          <pointLight position={[0, 0, 5]} intensity={4} color="#d4af37" distance={25} />
          <InfiniteTunnel isMobile={isMobile} />
          <CameraRig />
          {/* Bloom removed — it was the #1 GPU bottleneck AND caused the
              "too bright/harsh light" symptom on mobile by amplifying the
              lamp bulb glow into a full-screen flare. The lamp bulbs still
              glow via meshBasicMaterial, just without the bloom halo. */}
        </Canvas>
    </div>
  )
}
