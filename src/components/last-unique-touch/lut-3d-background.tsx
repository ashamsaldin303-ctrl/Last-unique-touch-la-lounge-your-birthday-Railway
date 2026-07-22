'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { shouldEnable3D } from '@/lib/device-capabilities'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Perfectly smooth infinite golden helix curve used to build the tunnel tube.
 * Hoisted out of the effect body so the `react-hooks/unsupported-syntax`
 * ESLint rule doesn't flag an inline `class` declaration inside `useEffect`.
 */
class InfiniteHelixCurve extends THREE.Curve<THREE.Vector3> {
  radius: number
  length: number
  turns: number

  constructor(radius = 9, length = 200, turns = 40) {
    super()
    this.radius = radius
    this.length = length
    this.turns = turns
  }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const angle = t * this.turns * Math.PI * 2
    const z = -t * this.length
    return target.set(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius, z)
  }
}

/**
 * Lut3DBackground
 *
 * Converted from `upload/Last unique touch 3D background..html` into a React
 * component. Renders a full-screen, fixed, pointer-events-none WebGL canvas
 * behind the LUT landing page: an infinite golden helix tunnel filled with
 * procedurally-built luxury furniture (chair / sofa / table / lamp / sideboard),
 * glowing dust particles, cinematic ACES tone mapping + UnrealBloom, and a
 * two-phase camera (hyperspace dive → drone sway) with mouse parallax.
 *
 * Implementation notes:
 *  - The entire Three.js scene is built and torn down inside a single
 *    `useEffect([], )` so React Strict Mode (which mounts twice in dev)
 *    cannot leak WebGL contexts.
 *  - All DOM mutations target `containerRef.current` (a `<canvas>` we own)
 *    instead of `document.body` / `document.getElementById`.
 *  - `window.innerWidth` checks live inside the effect.
 *  - Cleanup cancels `requestAnimationFrame`, removes the mousemove + resize
 *    listeners, walks the scene disposing geometries / materials, and calls
 *    `renderer.dispose()` + `scene.clear()`.
 */
export default function Lut3DBackground() {
  const containerRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = containerRef.current
    if (!canvas) return

    // v41-g2-F1 Fix #1: gate the heavy 3D scene on device capability.
    // Skips entirely on prefers-reduced-motion / no WebGL / < 2 cores /
    // < 2 GB so low-end devices get the static gradient fallback instead.
    // (Threshold values live in src/lib/device-capabilities.ts as
    // MIN_CORES_FOR_3D / MIN_MEMORY_GB_FOR_3D — see Task 2b fix.)
    if (!shouldEnable3D()) return

    // ============================================
    // CONSTANTS & PALETTE
    // ============================================
    const TUNNEL_LENGTH = 120
    const HELIX_GEOMETRY_LENGTH = 200 // Optimized length for fog
    const HELIX_WRAP_LENGTH = 5 // Mathematically perfect pitch
    const BASE_SPEED = 3.5
    const PALETTE = [
      '#f5f5dc',
      '#1b263b',
      '#6f4e37',
      '#0d0d0d',
      '#ffffff',
      '#8b6f47',
      '#4a148c',
      '#d4af37',
    ]

    const itemCount = 30

    // ============================================
    // SCENE SETUP
    // ============================================
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#050505')
    // Reduced fog density to reveal more furniture
    scene.fog = new THREE.FogExp2(0x050505, 0.015)

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )
    camera.position.set(5, 5, 15)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

    // ============================================
    // POST PROCESSING
    // ============================================
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.25,
      0.5,
      0.95, // High threshold so only gold glows, furniture stays sharp
    )
    composer.addPass(bloomPass)
    composer.addPass(new OutputPass())

    // ============================================
    // LUXURY LIGHTING (Enhanced for Furniture Visibility)
    // ============================================
    scene.add(new THREE.AmbientLight(0xffffff, 0.4)) // Brighter ambient

    const keyLight = new THREE.DirectionalLight(0xffd700, 3.0)
    keyLight.position.set(5, 5, 5)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0xfb5607, 2.0)
    rimLight.position.set(-5, -2, -10)
    scene.add(rimLight)

    const goldLight = new THREE.PointLight(0xd4af37, 5, 50)
    goldLight.position.set(0, 0, 5)
    scene.add(goldLight)

    // Camera Flashlight to illuminate furniture directly in front
    const camLight = new THREE.PointLight(0xffffff, 3.0, 30)
    scene.add(camLight)

    // ============================================
    // PERFECTLY SMOOTH INFINITE GOLDEN HELIX
    // ============================================
    const helixCurve = new InfiniteHelixCurve(9, HELIX_GEOMETRY_LENGTH, 40)
    // MASSIVELY increased tubular segments (4000) for perfect circular smoothness
    const helixGeo = new THREE.TubeGeometry(helixCurve, 4000, 0.15, 16, false)
    const helixMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xd4af37,
      emissiveIntensity: 0,
      metalness: 1,
      roughness: 0.2,
      envMapIntensity: 2.0,
      transparent: true,
      opacity: 0,
    })
    const helix = new THREE.Mesh(helixGeo, helixMat)
    scene.add(helix)

    // ============================================
    // FURNITURE BUILDERS (High PBR)
    // ============================================
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 1,
      roughness: 0.1,
      envMapIntensity: 2.0,
    })

    function createChair(color: string): THREE.Group {
      const group = new THREE.Group()
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        roughness: 0.3,
        metalness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5,
      })
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1, 0.15, 1), mat)
      group.add(seat)
      const back = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.15), mat)
      back.position.set(0, 0.6, -0.45)
      group.add(back)
      ;[-0.4, 0.4].forEach((x) =>
        [-0.4, 0.4].forEach((z) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 1, 16), goldMat)
          leg.position.set(x, -0.5, z)
          group.add(leg)
        }),
      )
      return group
    }

    function createSofa(color: string): THREE.Group {
      const group = new THREE.Group()
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        roughness: 0.6,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1.5,
      })
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 1.2), mat)
      group.add(base)
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 0.3), mat)
      back.position.set(0, 0.6, -0.45)
      group.add(back)
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 1.0), mat)
      armL.position.set(-1.25, 0.4, 0.1)
      group.add(armL)
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 1.0), mat)
      armR.position.set(1.25, 0.4, 0.1)
      group.add(armR)
      ;[-1.2, 1.2].forEach((x) =>
        [-0.4, 0.4].forEach((z) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.2, 16), goldMat)
          leg.position.set(x, -0.3, z)
          group.add(leg)
        }),
      )
      return group
    }

    function createTable(color: string): THREE.Group {
      const group = new THREE.Group()
      const topColor = color === '#0d0d0d' ? new THREE.Color(0x222222) : new THREE.Color(0xffffff)
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.1, 48),
        new THREE.MeshPhysicalMaterial({
          color: topColor,
          roughness: 0.05,
          metalness: 0.5,
          clearcoat: 1,
          clearcoatRoughness: 0.02,
          envMapIntensity: 2.0,
        }),
      )
      top.position.y = 0.8
      group.add(top)
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.8, 24), goldMat)
      stem.position.y = 0.4
      group.add(stem)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 48), goldMat)
      base.position.y = 0.05
      group.add(base)
      return group
    }

    function createLamp(color: string): THREE.Group {
      const group = new THREE.Group()
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 24), goldMat)
      group.add(base)
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 12), goldMat)
      stem.position.y = 1.2
      group.add(stem)
      const shadeMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transmission: 0.2,
      })
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.6, 24, 1, true), shadeMat)
      shade.position.y = 2.2
      group.add(shade)
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffeba1 }),
      )
      bulb.position.y = 2.2
      group.add(bulb)
      return group
    }

    function createSideboard(color: string): THREE.Group {
      const group = new THREE.Group()
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        roughness: 0.3,
        metalness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5,
      })
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 0.8), mat)
      body.position.y = 0.6
      group.add(body)
      const topMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.6,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.0,
      })
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.05, 0.85), topMat)
      top.position.y = 1.12
      group.add(top)
      ;[0, -0.8, 0.8].forEach((x) => {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.9, 0.02), goldMat)
        handle.position.set(x, 0.6, 0.41)
        group.add(handle)
      })
      ;[-1.1, 1.1].forEach((x) =>
        [-0.3, 0.3].forEach((z) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.1, 12), goldMat)
          leg.position.set(x, 0.05, z)
          group.add(leg)
        }),
      )
      return group
    }

    // ============================================
    // TUNNEL ITEMS INITIALIZATION
    // ============================================
    const tunnelItems: THREE.Group[] = []
    const creators = [createChair, createSofa, createTable, createLamp, createSideboard]

    function easeOutElastic(x: number): number {
      const c4 = (2 * Math.PI) / 3
      return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1
    }

    for (let i = 0; i < itemCount; i++) {
      const type = Math.floor(Math.random() * 5)
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      const mesh = creators[type](color)

      const angle = Math.random() * Math.PI * 2
      const innerRadius = 5.5
      const radius = innerRadius + Math.random() * 6
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const z = -(Math.random() * TUNNEL_LENGTH)
      const scale = 0.4 + Math.random() * 0.6

      mesh.position.set(x, y, z)
      mesh.scale.set(0.001, 0.001, 0.001)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)

      mesh.userData = {
        baseY: y,
        phaseX: x,
        rotSpeedX: (Math.random() - 0.5) * 0.2,
        rotSpeedY: (Math.random() - 0.5) * 0.3,
        rotSpeedZ: (Math.random() - 0.5) * 0.2,
        targetScale: scale,
        buildDelay: 0.2 + Math.random() * 1.0,
        isBuilt: false,
      }

      scene.add(mesh)
      tunnelItems.push(mesh)
    }

    // ============================================
    // GLOWING DUST PARTICLES
    // ============================================
    const pCount = 600
    const pGeo = new THREE.BufferGeometry()
    const pPos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 30
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 25
      pPos[i * 3 + 2] = -Math.random() * TUNNEL_LENGTH
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))

    const pCanvas = document.createElement('canvas')
    pCanvas.width = 32
    pCanvas.height = 32
    const pCtx = pCanvas.getContext('2d')
    let pTex: THREE.CanvasTexture | null = null
    let pMat: THREE.PointsMaterial | null = null
    let particles: THREE.Points | null = null
    if (pCtx) {
      const pGradient = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16)
      pGradient.addColorStop(0, 'rgba(255,255,255,1)')
      pGradient.addColorStop(0.2, 'rgba(255,235,161,0.8)')
      pGradient.addColorStop(1, 'rgba(255,235,161,0)')
      pCtx.fillStyle = pGradient
      pCtx.fillRect(0, 0, 32, 32)
      pTex = new THREE.CanvasTexture(pCanvas)
      pMat = new THREE.PointsMaterial({
        size: 0.2,
        map: pTex,
        color: 0xffd700,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      particles = new THREE.Points(pGeo, pMat)
      scene.add(particles)
    }

    // ============================================
    // INTERACTION & CAMERA VARIABLES
    // ============================================
    const mouse = { x: 0, y: 0 }
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove)

    const clock = new THREE.Clock()
    let camPos_x = 5,
      camPos_y = 5,
      camPos_z = 15
    let camLook_x = 0,
      camLook_y = 0,
      camLook_z = -30
    let camRoll = 0
    const introDuration = 2.5

    function damp(current: number, target: number, lambda: number, dt: number) {
      return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))
    }

    // ============================================
    // CINEMATIC ANIMATION LOOP (Fixed Double Intro)
    // ============================================
    let animationFrameId = 0

    function animate() {
      animationFrameId = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.1)
      const t = clock.getElapsedTime()
      const introP = Math.min(t / introDuration, 1.0)
      const introEase = 1 - Math.pow(1 - introP, 3)

      // Dynamic Speed: Starts fast, decelerates to normal
      const currentSpeed = BASE_SPEED * (1.0 + (1.0 - introEase) * 3.0)

      // 1. Infinite Golden Helix Update
      helix.position.z += currentSpeed * delta
      if (helix.position.z >= HELIX_WRAP_LENGTH) helix.position.z -= HELIX_WRAP_LENGTH

      helix.material.opacity = introEase
      helix.material.emissiveIntensity = introEase * 0.8
      helix.rotation.z += delta * 0.2

      // 2. Move Tunnel Items & Build Animation
      for (let i = 0; i < tunnelItems.length; i++) {
        const mesh = tunnelItems[i]
        const ud = mesh.userData

        if (!ud.isBuilt) {
          const p = (t - ud.buildDelay) / 1.2
          if (p > 0) {
            if (p >= 1) {
              mesh.scale.setScalar(ud.targetScale)
              ud.isBuilt = true
            } else {
              mesh.scale.setScalar(ud.targetScale * easeOutElastic(p))
            }
          }
        }

        mesh.position.z += currentSpeed * delta
        mesh.position.y = ud.baseY + Math.sin(t * 1.5 + ud.phaseX) * 0.3
        mesh.rotation.x += ud.rotSpeedX * delta
        mesh.rotation.y += ud.rotSpeedY * delta
        mesh.rotation.z += ud.rotSpeedZ * delta
        if (mesh.position.z > 5) mesh.position.z -= TUNNEL_LENGTH
      }

      // 3. Move Particles
      if (particles) {
        const posArr = pGeo.attributes.position.array as Float32Array
        for (let i = 0; i < pCount; i++) {
          posArr[i * 3 + 2] += currentSpeed * 2 * delta
          posArr[i * 3] += Math.sin(t * 1.5 + i) * 0.005
          posArr[i * 3 + 1] += Math.cos(t * 1.2 + i) * 0.005
          if (posArr[i * 3 + 2] > 5) posArr[i * 3 + 2] -= TUNNEL_LENGTH
        }
        pGeo.attributes.position.needsUpdate = true
      }

      // 4. Dynamic Lighting
      goldLight.intensity = 5 + Math.sin(t * 1.5) * 1.5

      // 5. CINEMATIC CAMERA (Seamless Handoff)
      if (introP < 1.0) {
        // Phase 1: Hyperspace Dive
        const x = THREE.MathUtils.lerp(5, 0, introEase)
        const y = THREE.MathUtils.lerp(5, 0, introEase)
        const z = THREE.MathUtils.lerp(15, 0, introEase)
        camera.position.set(x, y, z)

        // Sync state variables to prevent the "double intro" snap bug
        camPos_x = x
        camPos_y = y
        camPos_z = z

        camera.fov = THREE.MathUtils.lerp(75, 50, introEase)
        camera.updateProjectionMatrix()

        camera.lookAt(0, 0, -30)
        camLook_x = 0
        camLook_y = 0
        camLook_z = -30

        camera.rotation.z = Math.sin(introP * Math.PI) * 0.15
        camRoll = camera.rotation.z
      } else {
        // Phase 2: Drone Sway (Seamless continuation)
        const targetX = Math.sin(t * 0.15) * 1.5 + mouse.x * 1.5
        const targetY = Math.cos(t * 0.1) * 1.0 + mouse.y * 1.0
        const targetZ = Math.sin(t * 0.05) * 0.5

        camPos_x = damp(camPos_x, targetX, 2.0, delta)
        camPos_y = damp(camPos_y, targetY, 2.0, delta)
        camPos_z = damp(camPos_z, targetZ, 1.5, delta)
        camera.position.set(camPos_x, camPos_y, camPos_z)

        const lookTargetX = Math.sin(t * 0.08) * 3 + mouse.x * 5
        const lookTargetY = Math.cos(t * 0.06) * 2 + mouse.y * 3
        camLook_x = damp(camLook_x, lookTargetX, 1.0, delta)
        camLook_y = damp(camLook_y, lookTargetY, 1.0, delta)
        camera.fov = 50
        camera.updateProjectionMatrix()
        camera.lookAt(camLook_x, camLook_y, camLook_z)

        const targetRoll = Math.sin(t * 0.15) * 0.03 + mouse.x * 0.02
        camRoll = damp(camRoll, targetRoll, 3.0, delta)
        camera.rotation.z = camRoll
      }

      // Update Camera Flashlight to follow camera and point forward
      camLight.position.copy(camera.position)
      // Light targets slightly forward to illuminate upcoming furniture
      camLight.position.z -= 5

      composer.render()
    }

    // ============================================
    // RESIZE HANDLER
    // ============================================
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    animate()

    // ============================================
    // CLEANUP
    // ============================================
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)

      // Dispose all geometries / materials used by tunnel items + helix.
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) {
          mesh.geometry.dispose()
        }
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose())
        } else if (material) {
          material.dispose()
        }
      })

      // Dispose particle resources.
      pGeo.dispose()
      pMat?.dispose()
      pTex?.dispose()

      // Dispose the bloom pass render targets and the composer.
      composer.dispose()
      bloomPass.dispose()
      pmremGenerator.dispose()

      renderer.dispose()
      scene.clear()
    }
  }, [])

  return (
    <canvas
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  )
}
