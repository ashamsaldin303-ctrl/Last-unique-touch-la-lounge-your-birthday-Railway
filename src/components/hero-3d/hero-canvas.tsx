'use client'

import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents, Preload, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import { useLocale } from 'next-intl'
import { Model3D } from './model-3d'
import * as THREE from 'three'
import { PerfMonitor } from './perf-monitor'

interface HeroCanvasProps {
  modelsVisible: boolean
  cardRefs: React.RefObject<HTMLElement | null>[]
}

export function HeroCanvas({ modelsVisible, cardRefs }: HeroCanvasProps) {
  const locale = useLocale()
  const isRTL = locale === 'ar'

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 35, near: 0.1, far: 100 }}
      dpr={[1, typeof window !== 'undefined' && window.innerWidth > 768 ? 2 : 1.5]}
      frameloop="always"
      shadows
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: true,
        stencil: false,
        depth: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
      }}
      style={{ background: 'transparent', pointerEvents: 'none' }}
    >
      {/* === Professional 3-point lighting === */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-5, 3, 5]} intensity={0.4} color="#8B6B3D" />
      <directionalLight position={[0, 2, -5]} intensity={0.6} color="#E62129" />
      <ambientLight intensity={0.3} />

      <Environment preset="studio" background={false} />

      <Suspense fallback={null}>
        {/* LUT — chair and table */}
        <Model3D
          url="/models/The_chair_and_the_table_compressed.glb"
          cardRef={cardRefs[0]}
          rotation={[0, -Math.PI / 6, 0]}
          scale={1.6}
          phaseOffset={0}
          visible={modelsVisible}
          corner="top-right"
          isRTL={isRTL}
        />
        {/* La Lounge — sofa */}
        <Model3D
          url="/models/The_unfinished_sofa_compressed.glb"
          cardRef={cardRefs[1]}
          rotation={[0, Math.PI / 6, 0]}
          scale={1.4}
          phaseOffset={1}
          visible={modelsVisible}
          corner="top-right"
          isRTL={isRTL}
        />
        {/* Your Birthday — dance floor */}
        <Model3D
          url="/models/the_dance_floor_and_the_light_holder_compressed.glb"
          cardRef={cardRefs[2]}
          rotation={[0, Math.PI / 4, 0]}
          scale={1.3}
          phaseOffset={2}
          visible={modelsVisible}
          corner="top-right"
          isRTL={isRTL}
        />
      </Suspense>

      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <Preload all />
      <PerfMonitor />
    </Canvas>
  )
}
