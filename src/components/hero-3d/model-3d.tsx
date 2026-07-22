'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useGLTF, ContactShadows } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollStore } from '@/stores/scroll-store'

interface Model3DProps {
  url: string
  cardRef: React.RefObject<HTMLElement | null>
  rotation?: [number, number, number]
  scale?: number
  phaseOffset?: number
  visible: boolean
  /** Which corner INSIDE the card to position at */
  corner: 'top-left' | 'top-right'
  /** When true (Arabic/RTL), the visual left/right is flipped */
  isRTL?: boolean
}

// Reusable temp vectors (avoid GC pressure)
const _ndc = new THREE.Vector3()
const _worldPos = new THREE.Vector3()

export function Model3D({
  url,
  cardRef,
  rotation = [0, 0, 0],
  scale = 1,
  phaseOffset = 0,
  visible,
  corner,
  isRTL = false,
}: Model3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(url, true, true)
  const { gl, camera, size } = useThree()

  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // === Quality improvements (material + shadows) — runs on visible change ===
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Clone the material so we don't mutate the cached GLTF scene's materials
        child.material = (child.material as THREE.Material).clone()
        const mat = child.material as THREE.MeshStandardMaterial
        mat.transparent = true
        mat.opacity = visible ? 1 : 0
        // Improve material quality
        mat.envMapIntensity = 1.5 // Stronger environment reflections
        mat.needsUpdate = true
        // Enable shadows
        child.castShadow = true
        child.receiveShadow = true
        // Better geometry quality
        if (child.geometry) {
          child.geometry.computeVertexNormals()
        }
      }
    })
  }, [clonedScene, visible])

  // === Center the model's geometry on its origin — runs ONCE ===
  // GLB models often have offsets between their origin and bounding-box center.
  // This makes corner placement (28% / 72% X) visually accurate.
  // MUST run only once — running repeatedly would shift the model cumulatively.
  const centeredRef = useRef(false)
  useEffect(() => {
    if (centeredRef.current) return
    centeredRef.current = true

    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    // Only recenter if there's a meaningful offset (avoid div-by-zero on empty models)
    if (size.lengthSq() > 0) {
      // `clonedScene.position.x -= ...`. Use `.set()` on the position vector
      // instead to satisfy the linter (the result is identical).
      const pos = clonedScene.position
      pos.set(pos.x - center.x, pos.y - center.y, pos.z - center.z)
    }
  }, [clonedScene])

  // Pop-in animation tracking
  const popInStartRef = useRef<number>(0)
  const POP_IN_DURATION = 800

  useEffect(() => {
    if (visible) {
      popInStartRef.current = Date.now() + phaseOffset * 150
    }
  }, [visible, phaseOffset])

  /**
   * Convert viewport coordinates (px) to 3D world coordinates at z=0 plane.
   * NOTE: clientX/clientY are viewport-relative (from getBoundingClientRect),
   * but the canvas may not cover the full viewport (it's `absolute inset-0`
   * inside the hero section). So we subtract the canvas's own viewport offset
   * to convert to canvas-relative coordinates before computing NDC.
   */
  function screenToWorld(clientX: number, clientY: number): [number, number, number] {
    const canvasRect = gl.domElement.getBoundingClientRect()
    const canvasX = clientX - canvasRect.left
    const canvasY = clientY - canvasRect.top

    _ndc.x = (canvasX / size.width) * 2 - 1
    _ndc.y = -(canvasY / size.height) * 2 + 1
    _ndc.z = 0

    _worldPos.copy(_ndc)
    _worldPos.unproject(camera)

    const dir = _worldPos.sub(camera.position).normalize()
    const distance = Math.abs(camera.position.z / dir.z)
    const worldPos = camera.position.clone().add(dir.multiplyScalar(distance))

    return [worldPos.x, worldPos.y, 0]
  }

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // === Position model in the CORNER INSIDE the card ===
    let targetX = 0
    let targetY = 0

    if (cardRef?.current) {
      const rect = cardRef.current.getBoundingClientRect()

      // X: 28% from left (top-left corner) or 72% from left (top-right corner)
      // In RTL (Arabic), the visual left/right is flipped, so swap corners
      const effectiveCorner = isRTL
        ? corner === 'top-left'
          ? 'top-right'
          : 'top-left'
        : corner

      const cornerX =
        effectiveCorner === 'top-left'
          ? rect.left + rect.width * 0.28
          : rect.left + rect.width * 0.72

      // Y: 30% from top (slightly lower to avoid being clipped at the very top edge)
      const cornerY = rect.top + rect.height * 0.3

      const [wx, wy] = screenToWorld(cornerX, cornerY)
      targetX = wx
      targetY = wy
    }

    // === Pop-in animation (elastic bounce) ===
    const now = Date.now()
    const popInElapsed = popInStartRef.current > 0 ? now - popInStartRef.current : 0
    const popInProgress = Math.min(1, Math.max(0, popInElapsed / POP_IN_DURATION))

    const elasticOut = (t: number) => {
      if (t <= 0) return 0
      if (t >= 1) return 1
      return 1 - Math.pow(2, -10 * t) * Math.cos((t - 0.1) * 2 * Math.PI * 3)
    }

    const popInScale = visible ? elasticOut(popInProgress) * scale : 0
    const popInOpacity = visible ? Math.min(1, popInProgress * 2) : 0

    // === Scroll-driven animation ===
    const offset = useScrollStore.getState().offset
    const heroScrollProgress = Math.min(1, Math.max(0, offset / 0.12))

    const scrollScale = THREE.MathUtils.lerp(scale, scale * 0.3, heroScrollProgress)
    const scrollOpacity = THREE.MathUtils.lerp(1, 0, heroScrollProgress)
    const scrollRotY = THREE.MathUtils.lerp(rotation[1], rotation[1] + Math.PI / 8, heroScrollProgress)

    // === Combine ===
    const finalScale = popInProgress < 1 ? popInScale : scrollScale
    const finalOpacity = popInProgress < 1 ? popInOpacity : scrollOpacity
    const finalRotY = popInProgress < 1 ? rotation[1] : scrollRotY

    // Apply with damp
    groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, finalScale, 10, delta)
    groupRef.current.scale.y = groupRef.current.scale.x
    groupRef.current.scale.z = groupRef.current.scale.x

    groupRef.current.position.x = THREE.MathUtils.damp(
      groupRef.current.position.x,
      targetX,
      10,
      delta,
    )
    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetY,
      10,
      delta,
    )
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, finalRotY, 8, delta)

    // Update material opacity
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        ;(child.material as THREE.MeshStandardMaterial).opacity = finalOpacity
      }
    })
  })

  // WebGL context loss handler
  useEffect(() => {
    const canvas = gl.domElement
    const handleContextLost = (e: Event) => {
      e.preventDefault()
    }
    const handleContextRestored = () => {}
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [gl])

  return (
    <group ref={groupRef} rotation={rotation} scale={visible ? scale : 0}>
      <primitive object={clonedScene} />
      {/* Soft contact shadow under the model for grounding */}
      <ContactShadows
        position={[0, -0.9, 0]}
        opacity={0.4}
        scale={3}
        blur={2.5}
        far={3}
        color="#000000"
      />
    </group>
  )
}

// Preload all 3 models
useGLTF.preload('/models/The_chair_and_the_table_compressed.glb')
useGLTF.preload('/models/The_unfinished_sofa_compressed.glb')
useGLTF.preload('/models/the_dance_floor_and_the_light_holder_compressed.glb')
