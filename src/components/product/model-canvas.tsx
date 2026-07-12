'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Float, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface ModelCanvasProps {
  modelUrl: string
  productSlug: string
}

/**
 * Creates a procedural 3D furniture-like object based on the product slug.
 * Since we don't have actual GLB files, we generate simple geometric shapes
 * that represent furniture pieces.
 */
function FurnitureModel({ productSlug }: { productSlug: string }) {
  const groupRef = useRef<THREE.Group>(null)

  // Determine what type of furniture to render based on slug
  const isChair = productSlug.includes('chair')
  const isTable = productSlug.includes('table')
  const isChandelier = productSlug.includes('chandelier')
  const isLamp = productSlug.includes('lamp') || productSlug.includes('light') || productSlug.includes('uplighter')
  const isLantern = productSlug.includes('lantern')

  if (isChair) {
    return (
      <group ref={groupRef} position={[0, -0.5, 0]} scale={0.8}>
        {/* Seat */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial color="#D4A574" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 1, -0.45]} castShadow>
          <boxGeometry args={[1, 1, 0.1]} />
          <meshStandardMaterial color="#D4A574" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Legs */}
        {[
          [-0.4, 0, -0.4],
          [0.4, 0, -0.4],
          [-0.4, 0, 0.4],
          [0.4, 0, 0.4],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
            <meshStandardMaterial color="#8B6F47" roughness={0.6} />
          </mesh>
        ))}
      </group>
    )
  }

  if (isTable) {
    return (
      <group ref={groupRef} position={[0, -0.5, 0]} scale={0.8}>
        {/* Tabletop */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[1, 1, 0.08, 32]} />
          <meshStandardMaterial color="#8B6F47" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Center pole */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1, 16]} />
          <meshStandardMaterial color="#5C3D2E" roughness={0.5} />
        </mesh>
        {/* Base */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.7, 0.1, 32]} />
          <meshStandardMaterial color="#5C3D2E" roughness={0.5} />
        </mesh>
      </group>
    )
  }

  if (isChandelier) {
    return (
      <group ref={groupRef} position={[0, 0.5, 0]} scale={0.7}>
        {/* Top ring */}
        <mesh castShadow>
          <torusGeometry args={[0.3, 0.03, 8, 32]} />
          <meshStandardMaterial color="#D4A574" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Middle ring */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <torusGeometry args={[0.5, 0.03, 8, 32]} />
          <meshStandardMaterial color="#D4A574" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Bottom ring */}
        <mesh position={[0, -0.6, 0]} castShadow>
          <torusGeometry args={[0.7, 0.03, 8, 32]} />
          <meshStandardMaterial color="#D4A574" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Crystal drops */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.5, -0.45, Math.sin(angle) * 0.5]}
              castShadow
            >
              <octahedronGeometry args={[0.05, 0]} />
              <meshStandardMaterial
                color="#FFFFFF"
                metalness={0.1}
                roughness={0}
                transparent
                opacity={0.8}
              />
            </mesh>
          )
        })}
        {/* Center chain */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#8B6F47" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    )
  }

  if (isLamp || isLantern) {
    return (
      <group ref={groupRef} position={[0, -0.3, 0]} scale={0.7}>
        {/* Base */}
        <mesh position={[0, -0.6, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 0.1, 16]} />
          <meshStandardMaterial color="#5C3D2E" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Pole */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
          <meshStandardMaterial color="#8B6F47" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Shade */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <coneGeometry args={[0.35, 0.4, 16, 1, true]} />
          <meshStandardMaterial
            color="#F4EFE6"
            roughness={0.8}
            metalness={0}
            side={THREE.DoubleSide}
            emissive="#FFE4B5"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Bulb glow */}
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    )
  }

  // Default: abstract decorative object
  return (
    <group ref={groupRef} scale={0.8}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial color="#D4A574" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

/**
 * Loads and renders an actual GLB/GLTF model from the given URL.
 * Falls back to the procedural FurnitureModel if modelUrl is empty.
 */
function GLBModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl)
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef} scale={1}>
      <primitive object={scene} />
    </group>
  )
}

export function ModelCanvas({ modelUrl, productSlug }: ModelCanvasProps) {
  const hasModel = Boolean(modelUrl && modelUrl.trim().length > 0)

  // v28-g2-F1 Fix #3: pause the render loop when the canvas is off-screen.
  //
  // Previously the PDP <Canvas> had no `frameloop` prop (default 'always'),
  // so it ran continuously at 60fps even when the user had scrolled past it
  // — burning ~10-15% CPU + 200-400 mW GPU on a mid-range laptop while the
  // page was being read. Combined with `shadows`, `OrbitControls.autoRotate`,
  // and `<Float>`, the canvas also kept a 1024×1024 shadow map allocated the
  // whole time.
  //
  // Now an IntersectionObserver flips `inView` to false when the wrapper div
  // leaves the viewport, and `frameloop` switches to 'never' — R3F stops
  // issuing requestAnimationFrame ticks, freeing the GPU/CPU. The same
  // pattern is used by hero-3d-background.tsx (lines ~1741-1755),
  // purple-waves-3d.tsx, and background-3d.tsx.
  //
  // threshold of 0.05 means as soon as 5% of the canvas is visible we resume
  // rendering — small enough that scrolling back into view restores the
  // animation without a visible "wake-up" flash.
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting)
        }
      },
      { threshold: 0.05 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      // aria-hidden is unnecessary here — the 3D scene is interactive
      // (OrbitControls) and the parent product-3d-viewer.tsx renders a
      // visible heading + hint above/below it.
    >
      <Canvas
        shadows
        frameloop={inView ? 'always' : 'never'}
        camera={{ position: [3, 2, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          // Prevent the page from crashing when the GPU yanks the WebGL context
          // (e.g. tab backgrounding, driver reset). Calling preventDefault lets
          // R3F attempt context restoration instead of tearing down the canvas.
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-3, 2, -3]} intensity={0.3} color="#D4A574" />

        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
            {hasModel ? (
              <GLBModel modelUrl={modelUrl} />
            ) : (
              <FurnitureModel productSlug={productSlug} />
            )}
          </Float>
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.4}
            scale={5}
            blur={2}
            far={3}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate
          autoRotateSpeed={1}
        />
      </Canvas>
    </div>
  )
}
