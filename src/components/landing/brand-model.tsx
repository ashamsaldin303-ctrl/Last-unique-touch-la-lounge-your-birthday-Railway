'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows, Float } from '@react-three/drei'
import { Suspense, useRef, useMemo } from 'react'
import * as THREE from 'three'

type BrandModelType = 'chair' | 'display' | 'balloon'

function ChairModel() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.25
  })
  const acrylic = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#E62129', roughness: 0.05, metalness: 0, transmission: 0.6,
    transparent: true, opacity: 0.85, clearcoat: 1, clearcoatRoughness: 0.05, ior: 1.4,
  }), [])
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#C9A227', roughness: 0.15, metalness: 0.9 }), [])
  return (
    <group ref={groupRef} position={[0, -0.35, 0]} scale={0.65}>
      <mesh position={[0, 0.45, 0]} castShadow material={acrylic}><boxGeometry args={[1, 0.06, 1]} /></mesh>
      <mesh position={[0, 0.95, -0.45]} castShadow material={acrylic}><boxGeometry args={[1, 0.95, 0.05]} /></mesh>
      <mesh position={[0, 1.45, -0.45]} material={gold}><boxGeometry args={[1.02, 0.03, 0.07]} /></mesh>
      <mesh position={[-0.5, 0.7, -0.2]} castShadow material={acrylic}><boxGeometry args={[0.05, 0.4, 0.6]} /></mesh>
      <mesh position={[0.5, 0.7, -0.2]} castShadow material={acrylic}><boxGeometry args={[0.05, 0.4, 0.6]} /></mesh>
      {[[-0.42,0,-0.42],[0.42,0,-0.42],[-0.42,0,0.42],[0.42,0,0.42]].map((p,i)=>(
        <mesh key={i} position={p as [number,number,number]} castShadow material={gold}><cylinderGeometry args={[0.03,0.025,0.9,12]} /></mesh>
      ))}
    </group>
  )
}

function DisplayModel() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.25 })
  const panel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1A1A1A', roughness: 0.2, metalness: 0.7 }), [])
  const accent = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9D174D', roughness: 0.3, metalness: 0.5, emissive: '#9D174D', emissiveIntensity: 0.15 }), [])
  const led = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: '#E8D5E8', emissiveIntensity: 0.8 }), [])
  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={0.55}>
      <mesh position={[0, 0.7, 0]} castShadow material={panel}><boxGeometry args={[1.3, 1, 0.05]} /></mesh>
      <mesh position={[0, 1.22, 0.01]} material={accent}><boxGeometry args={[1.32, 0.03, 0.06]} /></mesh>
      <mesh position={[-0.55, 0.7, 0.04]} material={led}><boxGeometry args={[0.02, 0.9, 0.01]} /></mesh>
      <mesh position={[0.55, 0.7, 0.04]} material={led}><boxGeometry args={[0.02, 0.9, 0.01]} /></mesh>
      <mesh position={[0, 0.05, 0]} castShadow material={panel}><boxGeometry args={[1.6, 0.15, 0.6]} /></mesh>
      <mesh position={[0, 0.35, 0]} castShadow material={panel}><cylinderGeometry args={[0.04, 0.06, 0.5, 12]} /></mesh>
      <mesh position={[0, -0.08, 0]} castShadow material={panel}><cylinderGeometry args={[0.5, 0.55, 0.04, 16]} /></mesh>
      <mesh position={[0.3, 0.15, 0.1]} castShadow material={accent}><boxGeometry args={[0.15, 0.2, 0.15]} /></mesh>
    </group>
  )
}

function BalloonModel() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = t * 0.3
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.1
  })
  const mats = useMemo(() => [
    new THREE.MeshPhysicalMaterial({ color: '#FFD700', roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
    new THREE.MeshPhysicalMaterial({ color: '#E62129', roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
    new THREE.MeshPhysicalMaterial({ color: '#FF1493', roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
  ], [])
  const stringMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9 }), [])
  const positions: [number, number, number][] = [[-0.35, 0.35, 0.05], [0.15, 0.55, 0.1], [0.45, 0.25, -0.05]]
  return (
    <group ref={groupRef} scale={0.5}>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow material={mats[i]} scale={[1, 1.15, 1]}><sphereGeometry args={[0.3, 32, 32]} /></mesh>
          <mesh position={[0, -0.34, 0]} material={mats[i]}><coneGeometry args={[0.04, 0.06, 8]} /></mesh>
          <mesh position={[0.1, 0.1, 0.25]}><sphereGeometry args={[0.05, 16, 16]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} /></mesh>
        </group>
      ))}
      {positions.map((pos, i) => (
        <mesh key={`s${i}`} position={[pos[0], pos[1] - 0.4, pos[2]]} material={stringMat}><cylinderGeometry args={[0.004, 0.004, 0.5, 4]} /></mesh>
      ))}
      <mesh position={[0.08, -0.25, 0.05]} castShadow><boxGeometry args={[0.2, 0.15, 0.2]} /><meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.2} /></mesh>
    </group>
  )
}

function Model({ type }: { type: BrandModelType }) {
  if (type === 'chair') return <ChairModel />
  if (type === 'display') return <DisplayModel />
  return <BalloonModel />
}

export function BrandModel({ type, className = '' }: { type: BrandModelType; className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas camera={{ position: [2.5, 1.5, 3.5], fov: 38 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 3]} intensity={1.0} castShadow />
        <pointLight position={[-2, 2, -2]} intensity={0.4} color="#E62129" />
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}><Model type={type} /></Float>
          <ContactShadows position={[0, -0.8, 0]} opacity={0.35} scale={4} blur={2.5} far={2.5} />
          <Environment preset="apartment" />
        </Suspense>
      </Canvas>
    </div>
  )
}
