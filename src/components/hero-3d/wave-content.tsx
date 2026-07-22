'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Flowing 3D ribbon wave — red & white lines undulating in space.
 * Designed to live inside the hero Canvas. Kept very subtle so the
 * 3D product models and the solid cards remain the visual focus.
 */
export function WaveLines() {
  const groupRef = useRef<THREE.Group>(null)

  const lines = useMemo(() => {
    const lineCount = 24
    const pointsPerLine = 80
    const spacing = 0.4
    const width = 24

    const items: {
      positions: Float32Array
      color: THREE.Color
      offset: number
      speed: number
      amplitude: number
    }[] = []

    for (let i = 0; i < lineCount; i++) {
      const positions = new Float32Array(pointsPerLine * 3)
      const t = i / lineCount
      const z = (t - 0.5) * lineCount * spacing

      const isRed = i % 2 === 0
      const color = isRed
        ? new THREE.Color('#E62129').multiplyScalar(0.6 + Math.random() * 0.4)
        : new THREE.Color('#FFFFFF').multiplyScalar(0.15 + Math.random() * 0.15)

      items.push({
        positions,
        color,
        offset: i * 0.3 + Math.random() * 2,
        speed: 0.5 + Math.random() * 0.5,
        amplitude: 0.5 + Math.random() * 1.5,
      })
      void z
      void width
    }

    return items
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.getElapsedTime()

    groupRef.current.children.forEach((child, idx) => {
      const line = lines[idx]
      if (!line) return

      const geometry = child as THREE.Line
      const positions = geometry.geometry.attributes.position.array as Float32Array
      const pointsPerLine = positions.length / 3

      for (let j = 0; j < pointsPerLine; j++) {
        const x = (j / (pointsPerLine - 1) - 0.5) * 24
        const wave1 = Math.sin(x * 0.3 + time * line.speed + line.offset) * line.amplitude
        const wave2 =
          Math.sin(x * 0.15 + time * line.speed * 0.7 + line.offset * 1.5) *
          line.amplitude *
          0.5
        const wave3 =
          Math.cos(x * 0.2 + time * line.speed * 0.5) * line.amplitude * 0.3

        positions[j * 3] = x
        positions[j * 3 + 1] = wave1 + wave2 + wave3
        positions[j * 3 + 2] = (idx - lines.length / 2) * 0.4
      }

      geometry.geometry.attributes.position.needsUpdate = true
    })
  })

  return (
    <group ref={groupRef} rotation={[Math.PI * 0.15, 0, 0]} position={[0, -1, 0]}>
      {lines.map((line, idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={line.positions.length / 3}
              array={line.positions}
              itemSize={3}
              args={[line.positions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={line.color} transparent opacity={0.12} linewidth={1} />
        </line>
      ))}
    </group>
  )
}

/**
 * Floating red particles for extra depth. Very subtle.
 */
export function Particles() {
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const count = 80
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    const time = state.clock.getElapsedTime()
    pointsRef.current.rotation.y = time * 0.05
    pointsRef.current.position.y = Math.sin(time * 0.3) * 0.5
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#E62129" size={0.08} transparent opacity={0.15} sizeAttenuation />
    </points>
  )
}
