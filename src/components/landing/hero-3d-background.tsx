'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { shouldEnable3D } from '@/lib/device-capabilities'

// ═════════════════════════════════════════════════════════════════
// PALETTE & CONFIG
// ═════════════════════════════════════════════════════════════════
const PALETTE = {
  DEEP_PLUM: 0x0d0609,
  GRID_MAIN: 0xe8d5e0,
  GRID_LIGHT: 0xf0e6eb,
  GRID_ACCENT: 0xc9a96e,
  GRID_PULSE: 0xffd1e8,
  RING_COLOR: 0xb890a0,
  VELVET_PLUM: 0x8b6f47,
  VELVET_GOLD: 0x8b6f47,
  IVORY_LACQUER: 0xf8f4ec,
  BRASS_POLISHED: 0xc9a96e,
  MYLAR_PINK: 0xe8a4c8,
  MYLAR_GOLD: 0xf0d878,
  LUT: 0x8b6f47,
  LA_LOUNGE: 0xc9a96e,
  YOUR_BIRTHDAY: 0xffd1e8,
  WARM_KEY: 0xfff0dd,
  COOL_FILL: 0xc8d8e8,
  AMBIENT_BASE: 0xe8d8e0,
  CRYSTAL_RIM: 0xff88cc,
  NEON_CYAN: 0x00ffff,
  NEON_MAGENTA: 0xff00ff,
  NEON_YELLOW: 0xffff00,
} as const

type Vec3 = [number, number, number]
type Vec2 = [number, number]

interface RevealData {
  delay: number
  duration: number
  targetScale: THREE.Vector3
  targetY: number
  startY: number
  targetRotZ: number
}

// ═════════════════════════════════════════════════════════════════
// ANIMATION HELPER (Elastic Build Effect)
// ═════════════════════════════════════════════════════════════════
function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1
}

function assignReveal(obj: THREE.Object3D, delay: number, fromY = -3): void {
  if (!obj.userData) obj.userData = {}
  obj.userData.reveal = {
    delay,
    duration: 1.5,
    targetScale: obj.scale.clone(),
    targetY: obj.position.y,
    startY: obj.position.y + fromY,
    targetRotZ: obj.rotation.z,
  } as RevealData
  obj.scale.set(0.001, 0.001, 0.001)
  obj.position.y += fromY
  obj.rotation.z += Math.PI / 6 // Start tilted
}

/**
 * Hero3DBackground — vanilla Three.js cinematic 3D background converted
 * from the original HTML demo. Renders a fixed full-viewport canvas
 * behind the hero content. The Three.js scene is created and torn down
 * inside a single useEffect (mount/unmount) lifecycle.
 */
export default function Hero3DBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // v41-g2-F1 Fix #1: gate the heavy 3D scene on device capability. Skips
    // entirely on prefers-reduced-motion / no WebGL / < 2 cores / < 2 GB so
    // low-end devices get the static gradient fallback instead. (Threshold
    // values live in src/lib/device-capabilities.ts as MIN_CORES_FOR_3D /
    // MIN_MEMORY_GB_FOR_3D — see Task 2b fix.)
    if (!shouldEnable3D()) return

    // Cleanup-tracking variables (assigned inside try block)
    let frameId: number | null = null
    let renderer: THREE.WebGLRenderer | null = null
    let scene: THREE.Scene | null = null
    let onMouseMove: ((e: MouseEvent) => void) | null = null
    let onResize: (() => void) | null = null

    try {
      const isMobile = window.innerWidth < 768

      // ═════════════════════════════════════════════════════════════════
      // CORE SETUP
      // ═════════════════════════════════════════════════════════════════
      scene = new THREE.Scene()
      scene.background = new THREE.Color(PALETTE.DEEP_PLUM)

      const camera = new THREE.PerspectiveCamera(
        isMobile ? 55 : 38,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
      )
      camera.position.set(0, 70, isMobile ? 55 : 50) // Start high for intro

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0))
      renderer.shadowMap.enabled = false
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      // v50: reduced exposure 1.2 → 0.85 to dim the busy 3D scene per VLM analysis
      renderer.toneMappingExposure = 0.85
      container.appendChild(renderer.domElement)

      // ═════════════════════════════════════════════════════════════════
      // DYNAMIC GLOWING FLOOR
      // ═════════════════════════════════════════════════════════════════
      const floorUniforms = { uTime: { value: 0 } }
      const floorVertexShader = `
        varying vec3 vWorldPos;
        void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `
      const floorFragmentShader = `
        uniform float uTime;
        varying vec3 vWorldPos;

        void main() {
            float z = vWorldPos.z;
            float x = vWorldPos.x;

            vec3 gold = vec3(1.0, 0.84, 0.0);
            vec3 pink = vec3(1.0, 0.0, 0.5);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            vec3 black = vec3(0.01, 0.01, 0.02);

            vec3 color = black;

            float mix1 = sin(x * 0.1 + uTime * 0.5) * 0.5 + 0.5;
            float mix2 = sin(x * 0.08 - uTime * 0.7) * 0.5 + 0.5;
            vec3 botColor = mix(pink, cyan, mix1);
            botColor = mix(botColor, yellow, mix2);

            float botMask = smoothstep(0.0, 40.0, z);
            color = mix(color, botColor, botMask * 0.8);

            float topMask = smoothstep(0.0, -40.0, z);
            color = mix(color, gold, topMask * 0.8);

            float pulse = sin(z * 0.1 - uTime * 2.0) * 0.1 + 0.9;
            color *= pulse;

            gl_FragColor = vec4(color, 1.0);
        }
      `

      const glowingFloorMat = new THREE.ShaderMaterial({
        uniforms: floorUniforms,
        vertexShader: floorVertexShader,
        fragmentShader: floorFragmentShader,
        side: THREE.DoubleSide,
      })

      const glowingFloor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), glowingFloorMat)
      glowingFloor.rotation.x = -Math.PI / 2
      glowingFloor.position.y = -0.06
      scene.add(glowingFloor)

      // ═════════════════════════════════════════════════════════════════
      // LIGHTING
      // ═════════════════════════════════════════════════════════════════
      scene.add(new THREE.AmbientLight(PALETTE.AMBIENT_BASE, 0.4))
      scene.add(new THREE.HemisphereLight(PALETTE.AMBIENT_BASE, PALETTE.DEEP_PLUM, 0.6))

      const keyLight = new THREE.DirectionalLight(PALETTE.WARM_KEY, 1.5)
      keyLight.position.set(10, 40, 10)
      keyLight.castShadow = true
      keyLight.shadow.mapSize.set(2048, 2048)
      keyLight.shadow.camera.near = 1
      keyLight.shadow.camera.far = 150
      keyLight.shadow.camera.left = -50
      keyLight.shadow.camera.right = 50
      keyLight.shadow.camera.top = 50
      keyLight.shadow.camera.bottom = -50
      keyLight.shadow.bias = -0.0005
      scene.add(keyLight)

      const rimLight = new THREE.DirectionalLight(PALETTE.COOL_FILL, 0.8)
      rimLight.position.set(-20, 25, -15)
      scene.add(rimLight)

      const backLight = new THREE.DirectionalLight(PALETTE.CRYSTAL_RIM, 0.6)
      backLight.position.set(0, 15, -30)
      scene.add(backLight)

      const sectionZs = { lut: -14, lalounge: 0, birthday: 14 }

      const spotLUT = new THREE.SpotLight(PALETTE.BRASS_POLISHED, 60, 50, 0.7, 0.8, 2)
      spotLUT.position.set(0, 16, sectionZs.lut)
      scene.add(spotLUT)
      const spotBirth = new THREE.SpotLight(PALETTE.YOUR_BIRTHDAY, 50, 40, 0.7, 0.8, 2)
      spotBirth.position.set(0, 16, sectionZs.birthday)
      scene.add(spotBirth)

      scene.add(
        new THREE.PointLight(PALETTE.BRASS_POLISHED, 15, 30, 2)
          .translateY(6)
          .translateZ(sectionZs.lut) as THREE.PointLight,
      )
      scene.add(
        new THREE.PointLight(PALETTE.YOUR_BIRTHDAY, 10, 25, 2)
          .translateY(6)
          .translateZ(sectionZs.birthday) as THREE.PointLight,
      )

      // ═════════════════════════════════════════════════════════════════
      // MATERIALS
      // ═════════════════════════════════════════════════════════════════
      function createVelvetMat(color: number): THREE.MeshPhysicalMaterial {
        return new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.8,
          metalness: 0,
          sheen: 1.0,
          sheenRoughness: 0.2,
          sheenColor: new THREE.Color(color).multiplyScalar(1.5),
        })
      }

      const brassMat = new THREE.MeshStandardMaterial({
        color: PALETTE.BRASS_POLISHED,
        metalness: 1.0,
        roughness: 0.15,
      })
      const ivoryMat = new THREE.MeshStandardMaterial({
        color: PALETTE.IVORY_LACQUER,
        roughness: 0.1,
        metalness: 0.5,
      })
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 1.0,
        thickness: 1.0,
        roughness: 0.01,
        ior: 1.5,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.25,
      })
      const woodMat = new THREE.MeshStandardMaterial({
        color: PALETTE.VELVET_GOLD,
        roughness: 0.4,
        metalness: 0.3,
      })
      const blackLacquerMat = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.1,
        metalness: 0.5,
      })

      function createMylarMat(color: number): THREE.MeshStandardMaterial {
        return new THREE.MeshStandardMaterial({ color, roughness: 0.1, metalness: 0.6 })
      }

      const darkMetalMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        metalness: 1.0,
        roughness: 0.2,
      })

      // ═════════════════════════════════════════════════════════════════
      // FURNITURE COMPONENTS
      // ═════════════════════════════════════════════════════════════════
      function createChair(pos: Vec3, color: number, rot: Vec3 = [0, 0, 0]): THREE.Group {
        const group = new THREE.Group()
        const mat = createVelvetMat(color)
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), mat)
        seat.position.y = 0.5
        seat.castShadow = true
        seat.receiveShadow = true
        group.add(seat)
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.15), mat)
        back.position.set(0, 1.1, -0.5)
        back.castShadow = true
        group.add(back)
        ;(
          [
            [-0.5, -0.5],
            [0.5, -0.5],
            [-0.5, 0.5],
            [0.5, 0.5],
          ] as Vec2[]
        ).forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 1, 16), brassMat)
          leg.position.set(x, 0, z)
          leg.castShadow = true
          group.add(leg)
        })
        group.position.set(...pos)
        group.rotation.set(...rot)
        return group
      }

      function createTable(pos: Vec3, isGlass = false): THREE.Group {
        const group = new THREE.Group()
        const topMat = isGlass ? glassMat : ivoryMat
        const top = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 64), topMat)
        top.position.y = 1
        top.castShadow = true
        top.receiveShadow = true
        group.add(top)
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1, 32), woodMat)
        stem.position.y = 0.5
        stem.castShadow = true
        group.add(stem)
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 64), woodMat)
        base.position.y = 0.06
        base.castShadow = true
        base.receiveShadow = true
        group.add(base)
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.03, 16, 96), brassMat)
        ring.position.y = 1.07
        ring.rotation.x = Math.PI / 2
        group.add(ring)
        group.position.set(...pos)
        return group
      }

      function createSofa(pos: Vec3, color: number): THREE.Group {
        const group = new THREE.Group()
        const mat = createVelvetMat(color)
        const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 1.3), mat)
        base.position.y = 0.4
        base.castShadow = true
        base.receiveShadow = true
        group.add(base)
        const back = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 0.25), mat)
        back.position.set(0, 1.1, -0.5)
        back.castShadow = true
        group.add(back)
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 1.3), mat)
        armL.position.set(-1.6, 0.65, 0)
        armL.castShadow = true
        group.add(armL)
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 1.3), mat)
        armR.position.set(1.6, 0.65, 0)
        armR.castShadow = true
        group.add(armR)
        const pillow1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.4, 0.4),
          createVelvetMat(PALETTE.YOUR_BIRTHDAY),
        )
        pillow1.position.set(-1, 0.9, 0.2)
        pillow1.rotation.z = 0.1
        pillow1.castShadow = true
        group.add(pillow1)
        const pillow2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.4, 0.4),
          createVelvetMat(PALETTE.LA_LOUNGE),
        )
        pillow2.position.set(1, 0.9, 0.2)
        pillow2.rotation.z = -0.1
        pillow2.castShadow = true
        group.add(pillow2)
        group.position.set(...pos)
        return group
      }

      function createLamp(pos: Vec3): THREE.Group {
        const group = new THREE.Group()
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.2, 32), brassMat)
        base.position.y = 0.1
        base.castShadow = true
        group.add(base)
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.8, 16), brassMat)
        stem.position.y = 1.5
        group.add(stem)
        const shadeMat = new THREE.MeshStandardMaterial({
          color: PALETTE.IVORY_LACQUER,
          roughness: 0.6,
          emissive: 0xffe4b5,
          emissiveIntensity: 1.0,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        })
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 32, 1, true), shadeMat)
        shade.position.y = 2.9
        group.add(shade)
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xfff8e7 }),
        )
        bulb.position.y = 2.7
        group.add(bulb)
        const pl = new THREE.PointLight(0xffe4b5, 2.0, 8, 2)
        pl.position.y = 2.7
        group.add(pl)
        group.position.set(...pos)
        return group
      }

      function createCoffeeTableTray(): THREE.Group {
        const group = new THREE.Group()
        const trayMat = new THREE.MeshStandardMaterial({
          color: PALETTE.BRASS_POLISHED,
          metalness: 1,
          roughness: 0.2,
        })
        const tray = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.8), trayMat)
        tray.position.y = 1.1
        tray.castShadow = true
        group.add(tray)
        const book1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.1, 0.6),
          new THREE.MeshStandardMaterial({ color: PALETTE.LUT, roughness: 0.7 }),
        )
        book1.position.set(-0.3, 1.18, 0)
        book1.rotation.y = 0.2
        book1.castShadow = true
        group.add(book1)
        const book2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.08, 0.6),
          new THREE.MeshStandardMaterial({ color: PALETTE.LA_LOUNGE, roughness: 0.7 }),
        )
        book2.position.set(-0.35, 1.26, 0.05)
        book2.rotation.y = 0.3
        book2.castShadow = true
        group.add(book2)
        const vase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.1, 0.4, 16),
          new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.1,
            transmission: 0.5,
            transparent: true,
            opacity: 0.5,
          }),
        )
        vase.position.set(0.3, 1.32, 0)
        group.add(vase)
        for (let i = 0; i < 3; i++) {
          const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshStandardMaterial({
              color: PALETTE.YOUR_BIRTHDAY,
              emissive: PALETTE.YOUR_BIRTHDAY,
              emissiveIntensity: 0.2,
            }),
          )
          flower.position.set(
            0.3 + (Math.random() - 0.5) * 0.1,
            1.55 + (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.1,
          )
          group.add(flower)
        }
        return group
      }

      function createPlant(): THREE.Group {
        const group = new THREE.Group()
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.6, 16), brassMat)
        pot.position.y = 0.3
        pot.castShadow = true
        group.add(pot)
        const soil = new THREE.Mesh(
          new THREE.CylinderGeometry(0.48, 0.48, 0.05, 16),
          new THREE.MeshStandardMaterial({ color: 0x111111 }),
        )
        soil.position.y = 0.58
        group.add(soil)
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d4a2d, roughness: 0.8 })
        const leafMat = new THREE.MeshStandardMaterial({
          color: 0x4a8a4a,
          roughness: 0.8,
          side: THREE.DoubleSide,
        })
        for (let i = 0; i < 5; i++) {
          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.05, 1.5 + Math.random() * 0.5, 8),
            stemMat,
          )
          stem.position.y = 1.2
          stem.rotation.z = (Math.random() - 0.5) * 0.5
          stem.rotation.x = (Math.random() - 0.5) * 0.5
          group.add(stem)
          for (let j = 0; j < 3; j++) {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), leafMat)
            leaf.scale.set(1, 0.1, 0.6)
            leaf.position.y = 1.8 + Math.random() * 0.3
            leaf.position.x = Math.cos(i) * 0.5
            leaf.position.z = Math.sin(i) * 0.5
            leaf.rotation.set(Math.random(), Math.random(), Math.random())
            group.add(leaf)
          }
        }
        return group
      }

      function createLutFurniture(z: number, scale: number): THREE.Group {
        const group = new THREE.Group()
        const rug = new THREE.Mesh(
          new THREE.PlaneGeometry(18, 16),
          new THREE.MeshStandardMaterial({
            color: 0x2d1818,
            roughness: 0.95,
            side: THREE.DoubleSide,
          }),
        )
        rug.position.set(0, 0.01, 0)
        rug.rotation.x = -Math.PI / 2
        rug.receiveShadow = true
        assignReveal(rug, 0.2, -1)
        group.add(rug)

        const rugBorder = new THREE.Mesh(
          new THREE.RingGeometry(8.8, 9.0, 96),
          new THREE.MeshBasicMaterial({
            color: PALETTE.BRASS_POLISHED,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
          }),
        )
        rugBorder.rotation.x = -Math.PI / 2
        rugBorder.position.y = 0.02
        assignReveal(rugBorder, 0.3, -1)
        group.add(rugBorder)

        const sofa = createSofa([0, 0, -5], PALETTE.LUT)
        assignReveal(sofa, 0.5, -3)
        group.add(sofa)

        const coffeeTable = createTable([0, 0, -1], true)
        assignReveal(coffeeTable, 0.7, -3)
        group.add(coffeeTable)

        const tray = createCoffeeTableTray()
        assignReveal(tray, 0.9, -3)
        group.add(tray)

        const chair1 = createChair([-3, 0, 2], PALETTE.LUT, [0, (Math.PI * 25) / 180, 0])
        assignReveal(chair1, 1.1, -3)
        group.add(chair1)
        const chair2 = createChair([3, 0, 2], PALETTE.LUT, [0, -(Math.PI * 25) / 180, 0])
        assignReveal(chair2, 1.2, -3)
        group.add(chair2)
        const chair3 = createChair([-5.5, 0, -1], PALETTE.IVORY_LACQUER, [0, Math.PI / 2, 0])
        assignReveal(chair3, 1.3, -3)
        group.add(chair3)
        const chair4 = createChair([5.5, 0, -1], PALETTE.IVORY_LACQUER, [0, -Math.PI / 2, 0])
        assignReveal(chair4, 1.4, -3)
        group.add(chair4)

        const sideTable1 = createTable([-5.5, 0, -3])
        assignReveal(sideTable1, 1.5, -3)
        group.add(sideTable1)

        const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6, 32), brassMat)
        bucket.position.set(-5.5, 1.35, -3)
        bucket.castShadow = true
        assignReveal(bucket, 1.6, -3)
        group.add(bucket)

        let iceDelay = 1.7
        for (let i = 0; i < 8; i++) {
          const ice = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), glassMat)
          ice.position.set(
            -5.5 + (Math.random() - 0.5) * 0.4,
            1.6 + (Math.random() - 0.5) * 0.1,
            -3 + (Math.random() - 0.5) * 0.4,
          )
          ice.rotation.set(Math.random(), Math.random(), Math.random())
          assignReveal(ice, iceDelay, -3)
          group.add(ice)
          iceDelay += 0.05
        }

        const sideTable2 = createTable([5.5, 0, -3])
        assignReveal(sideTable2, 1.8, -3)
        group.add(sideTable2)

        const lamp = createLamp([5.5, 0, -3])
        assignReveal(lamp, 1.9, -3)
        group.add(lamp)

        const plant = createPlant()
        plant.position.set(7, 0, 2)
        assignReveal(plant, 2.1, -3)
        group.add(plant)

        group.position.set(0, 0, z)
        group.scale.setScalar(scale)
        return group
      }

      // ═════════════════════════════════════════════════════════════════
      // LIGHTING STANDS & PARTY ELEMENTS
      // ═════════════════════════════════════════════════════════════════
      function createLightingStand(pos: Vec3, lightColor: number): THREE.Group {
        const group = new THREE.Group()
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), darkMetalMat)
          leg.position.set(Math.cos(angle) * 0.5, 1.25, Math.sin(angle) * 0.5)
          leg.rotation.z = Math.cos(angle) * 0.2
          leg.rotation.x = -Math.sin(angle) * 0.2
          leg.castShadow = true
          group.add(leg)
        }
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.5, 16), darkMetalMat)
        pole.position.y = 4.25
        pole.castShadow = true
        group.add(pole)
        const fixtureGroup = new THREE.Group()
        fixtureGroup.position.y = 6.0
        const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.6, 32), darkMetalMat)
        fixture.castShadow = true
        fixtureGroup.add(fixture)
        const bulbMat = new THREE.MeshBasicMaterial({ color: lightColor })
        const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), bulbMat)
        bulb.position.y = -0.31
        bulb.rotation.x = -Math.PI / 2
        fixtureGroup.add(bulb)
        const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), darkMetalMat)
        yoke.position.y = 0.4
        fixtureGroup.add(yoke)
        const beamMat = new THREE.ShaderMaterial({
          uniforms: { uColor: { value: new THREE.Color(lightColor) } },
          vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `uniform vec3 uColor; varying vec2 vUv; void main() { float alpha = pow(1.0 - vUv.y, 2.5) * 0.3; gl_FragColor = vec4(uColor, alpha); }`,
          transparent: true,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
        const beam = new THREE.Mesh(new THREE.ConeGeometry(2.5, 6, 32, 1, true), beamMat)
        beam.position.y = -3.0
        fixtureGroup.add(beam)
        fixtureGroup.rotation.x = Math.PI / 4
        group.add(fixtureGroup)
        const pl = new THREE.PointLight(lightColor, 1.5, 10, 2)
        pl.position.y = 5.5
        group.add(pl)
        group.position.set(...pos)
        return group
      }

      function createNeonHeart(pos: Vec3): THREE.Group {
        const group = new THREE.Group()
        const shape = new THREE.Shape()
        const x = 0,
          y = 0
        shape.moveTo(x + 0.5, y + 0.5)
        shape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y)
        shape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7)
        shape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9)
        shape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7)
        shape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y)
        shape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5)
        const heartGeo = new THREE.ExtrudeGeometry(shape, {
          depth: 0.1,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.1,
          bevelThickness: 0.1,
        })
        const heartMat = new THREE.MeshStandardMaterial({
          color: PALETTE.NEON_MAGENTA,
          emissive: PALETTE.NEON_MAGENTA,
          emissiveIntensity: 2.0,
        })
        const heart = new THREE.Mesh(heartGeo, heartMat)
        heart.scale.set(0.6, -0.6, 0.6)
        heart.position.set(0, 1.5, 0)
        heart.userData.isHeart = true
        group.add(heart)
        const pl = new THREE.PointLight(PALETTE.NEON_MAGENTA, 2.0, 10, 2)
        pl.position.set(0, 1.5, 1)
        group.add(pl)
        group.position.set(...pos)
        return group
      }

      function createLEDDanceFloor(pos: Vec3): THREE.Group {
        const group = new THREE.Group()
        const colors = [PALETTE.NEON_CYAN, PALETTE.NEON_MAGENTA, PALETTE.NEON_YELLOW, 0x000000]
        const size = 4
        const tiles: THREE.Mesh[] = []
        for (let i = -size / 2; i < size / 2; i++) {
          for (let j = -size / 2; j < size / 2; j++) {
            const tileGeo = new THREE.BoxGeometry(0.9, 0.1, 0.9)
            const c = colors[Math.floor(Math.random() * colors.length)]
            const tileMat = new THREE.MeshStandardMaterial({
              color: 0x111111,
              emissive: c,
              emissiveIntensity: c === 0x000000 ? 0 : 0.8,
              metalness: 0.5,
              roughness: 0.2,
            })
            const tile = new THREE.Mesh(tileGeo, tileMat)
            tile.position.set(i + 0.5, 0.05, j + 0.5)
            tile.userData = { baseColor: c, isTile: true }
            group.add(tile)
            tiles.push(tile)
          }
        }
        group.userData = { tiles }
        group.position.set(...pos)
        return group
      }

      function createPartySpeaker(pos: Vec3, ringColor: number): THREE.Group {
        const group = new THREE.Group()
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), darkMetalMat)
          leg.position.set(Math.cos(angle) * 0.5, 1.25, Math.sin(angle) * 0.5)
          leg.rotation.z = Math.cos(angle) * 0.2
          leg.rotation.x = -Math.sin(angle) * 0.2
          leg.castShadow = true
          group.add(leg)
        }
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 12), darkMetalMat)
        pole.position.y = 2.5
        group.add(pole)
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.8), blackLacquerMat)
        box.position.y = 4.5
        box.castShadow = true
        group.add(box)
        const sub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.05, 32),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }),
        )
        sub.rotation.x = Math.PI / 2
        sub.position.set(0, 4.3, 0.41)
        group.add(sub)
        const tweet = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }),
        )
        tweet.rotation.x = Math.PI / 2
        tweet.position.set(0, 5.1, 0.41)
        group.add(tweet)
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.35, 0.02, 8, 32),
          new THREE.MeshBasicMaterial({ color: ringColor }),
        )
        ring.position.set(0, 4.3, 0.42)
        group.add(ring)
        group.position.set(...pos)
        return group
      }

      function createDJBooth(pos: Vec3): THREE.Group {
        const group = new THREE.Group()
        const tableGeo = new THREE.BoxGeometry(3.5, 1.2, 1.2)
        const table = new THREE.Mesh(tableGeo, blackLacquerMat)
        table.position.y = 0.6
        table.castShadow = true
        group.add(table)
        const ledStrip = new THREE.Mesh(
          new THREE.BoxGeometry(3.4, 0.08, 0.02),
          new THREE.MeshBasicMaterial({ color: PALETTE.NEON_YELLOW }),
        )
        ledStrip.position.set(0, 0.8, 0.61)
        group.add(ledStrip)
        const platter1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.05, 32),
          darkMetalMat,
        )
        platter1.position.set(-1.0, 1.25, 0)
        group.add(platter1)
        const platter2 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.05, 32),
          darkMetalMat,
        )
        platter2.position.set(1.0, 1.25, 0)
        group.add(platter2)
        const mixer = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.6), darkMetalMat)
        mixer.position.set(0, 1.26, 0)
        group.add(mixer)
        for (let i = -1; i <= 1; i++) {
          const knob1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16), brassMat)
          knob1.position.set(i * 0.2, 1.32, -0.1)
          group.add(knob1)
          const knob2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16), brassMat)
          knob2.position.set(i * 0.2, 1.32, 0.1)
          group.add(knob2)
        }

        // NEW: Glowing Laptop Screen
        const laptopScreenMat = new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: PALETTE.NEON_CYAN,
          emissiveIntensity: 0.8,
        })
        const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.01), laptopScreenMat)
        laptopScreen.position.set(0, 1.45, 0.2)
        laptopScreen.rotation.x = -Math.PI / 6
        group.add(laptopScreen)

        // Headphones
        const hpBand = new THREE.Mesh(
          new THREE.TorusGeometry(0.35, 0.03, 8, 16, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }),
        )
        hpBand.position.set(1.4, 1.2, 0.3)
        hpBand.rotation.set(Math.PI / 2, 0, -Math.PI / 2)
        group.add(hpBand)
        const hpCup = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }),
        )
        hpCup.position.set(1.4, 1.2, 0.45)
        hpCup.rotation.x = Math.PI / 2
        group.add(hpCup)

        group.position.set(...pos)
        return group
      }

      function createMicStand(pos: Vec3): THREE.Group {
        const group = new THREE.Group()
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8), brassMat)
        pole.position.y = 1.25
        group.add(pole)
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.1, 16), brassMat)
        base.position.y = 0.05
        base.castShadow = true
        group.add(base)
        const mic = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.12, 0.35, 16),
          new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 }),
        )
        mic.position.y = 2.7
        group.add(mic)
        const grille = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 16, 16),
          new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 1,
            roughness: 0.3,
            wireframe: true,
          }),
        )
        grille.position.y = 2.95
        group.add(grille)
        group.position.set(...pos)
        return group
      }

      function createBalloon(pos: Vec3, color: number): THREE.Group {
        const group = new THREE.Group()
        const mat = createMylarMat(color)
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), mat)
        body.scale.y = 1.15
        body.castShadow = true
        group.add(body)
        const knot = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 16), mat)
        knot.position.y = -0.85
        group.add(knot)
        const string = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 1, 8),
          new THREE.MeshBasicMaterial({ color: PALETTE.IVORY_LACQUER }),
        )
        string.position.y = -1.4
        group.add(string)
        group.position.set(...pos)
        group.userData = { baseY: pos[1], baseX: pos[0], baseZ: pos[2] }
        return group
      }

      function createPartyHat(pos: Vec3, color: number): THREE.Group {
        const group = new THREE.Group()
        group.position.set(...pos)
        const hat = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 16), createVelvetMat(color))
        hat.position.y = 0.35
        hat.castShadow = true
        group.add(hat)
        const pom = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), brassMat)
        pom.position.y = 0.75
        group.add(pom)
        return group
      }

      function createChampagneFlute(pos: Vec3): THREE.Group {
        const group = new THREE.Group()
        group.position.set(...pos)
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 0.4, 16), glassMat)
        bowl.position.y = 0.2
        group.add(bowl)
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 8), glassMat)
        stem.position.y = -0.1
        group.add(stem)
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), glassMat)
        base.position.y = -0.26
        group.add(base)
        const liquid = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.07, 0.25, 16),
          new THREE.MeshStandardMaterial({ color: 0xffd700, transparent: true, opacity: 0.8 }),
        )
        liquid.position.y = 0.25
        group.add(liquid)
        return group
      }

      function createBalloonArch(): THREE.Group {
        const group = new THREE.Group()
        const archColors = [
          PALETTE.NEON_MAGENTA,
          PALETTE.NEON_CYAN,
          PALETTE.NEON_YELLOW,
          PALETTE.YOUR_BIRTHDAY,
          PALETTE.MYLAR_GOLD,
        ]
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-4, 0, 0),
          new THREE.Vector3(-3, 3, 0),
          new THREE.Vector3(0, 4.5, 0),
          new THREE.Vector3(3, 3, 0),
          new THREE.Vector3(4, 0, 0),
        ])
        const points = curve.getPoints(30)
        points.forEach((p, i) => {
          const c = archColors[i % archColors.length]
          const b = createBalloon([p.x, p.y, p.z], c)
          b.scale.setScalar(0.8)
          group.add(b)
        })
        return group
      }

      function createBunting(p1: THREE.Vector3, p2: THREE.Vector3): THREE.Group {
        const group = new THREE.Group()
        const colors = [
          PALETTE.NEON_MAGENTA,
          PALETTE.NEON_CYAN,
          PALETTE.NEON_YELLOW,
          PALETTE.MYLAR_GOLD,
          0x00ff00,
        ]
        const points: THREE.Vector3[] = []
        const segments = 10
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const x = THREE.MathUtils.lerp(p1.x, p2.x, t)
          const y = THREE.MathUtils.lerp(p1.y, p2.y, t) - Math.sin(t * Math.PI) * 1.0
          const z = THREE.MathUtils.lerp(p1.z, p2.z, t)
          points.push(new THREE.Vector3(x, y, z))
        }
        const curve = new THREE.CatmullRomCurve3(points)
        const line = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 20, 0.02, 8, false),
          new THREE.MeshStandardMaterial({ color: 0xffffff }),
        )
        group.add(line)
        for (let i = 0; i < segments; i++) {
          const flagGeo = new THREE.ConeGeometry(0.2, 0.4, 4)
          const flagMat = new THREE.MeshStandardMaterial({
            color: colors[i % colors.length],
            emissive: colors[i % colors.length],
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide,
          })
          const flag = new THREE.Mesh(flagGeo, flagMat)
          flag.position.copy(points[i])
          flag.position.y -= 0.2
          flag.rotation.x = Math.PI
          flag.rotation.z = Math.random() * 0.2 - 0.1
          group.add(flag)
        }
        return group
      }

      function createCake(pos: Vec3): THREE.Group {
        const group = new THREE.Group()
        group.position.set(...pos)
        group.scale.setScalar(1.2)
        const bottom = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.6, 64), ivoryMat)
        bottom.position.y = 0.3
        bottom.castShadow = true
        group.add(bottom)
        const middle = new THREE.Mesh(
          new THREE.CylinderGeometry(1, 1, 0.5, 64),
          new THREE.MeshStandardMaterial({ color: PALETTE.YOUR_BIRTHDAY, roughness: 0.2 }),
        )
        middle.position.y = 0.8
        middle.castShadow = true
        group.add(middle)
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.4, 64), ivoryMat)
        top.position.y = 1.2
        top.castShadow = true
        group.add(top)
        const frosting1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 12, 64), ivoryMat)
        frosting1.position.y = 0.6
        frosting1.rotation.x = Math.PI / 2
        group.add(frosting1)
        const frosting2 = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.06, 12, 64), ivoryMat)
        frosting2.position.y = 1.05
        frosting2.rotation.x = Math.PI / 2
        group.add(frosting2)
        const frosting3 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 12, 64), ivoryMat)
        frosting3.position.y = 1.4
        frosting3.rotation.x = Math.PI / 2
        group.add(frosting3)
        const ring1 = new THREE.Mesh(
          new THREE.TorusGeometry(1.2, 0.03, 16, 96),
          new THREE.MeshStandardMaterial({
            color: PALETTE.BRASS_POLISHED,
            metalness: 1.0,
            roughness: 0.05,
          }),
        )
        ring1.position.y = 0.55
        ring1.rotation.x = Math.PI / 2
        group.add(ring1)

        // Glowing Number 1 Topper
        const topperMat = new THREE.MeshStandardMaterial({
          color: PALETTE.NEON_YELLOW,
          emissive: PALETTE.NEON_YELLOW,
          emissiveIntensity: 2.0,
        })
        const topper1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), topperMat)
        topper1.position.set(0, 2.1, 0)
        group.add(topper1)
        const topperBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), topperMat)
        topperBase.position.set(0, 1.85, 0)
        group.add(topperBase)

        const flames: THREE.MeshStandardMaterial[] = []
        ;[-0.3, 0, 0.3].forEach((x, i) => {
          const candle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16),
            new THREE.MeshStandardMaterial({
              color: i === 1 ? PALETTE.LUT : PALETTE.LA_LOUNGE,
              roughness: 0.3,
            }),
          )
          candle.position.set(x, 1.65, 0)
          candle.castShadow = true
          group.add(candle)
          const flameMat = new THREE.MeshStandardMaterial({
            color: PALETTE.YOUR_BIRTHDAY,
            emissive: PALETTE.YOUR_BIRTHDAY,
            emissiveIntensity: 2.0,
          })
          const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 12), flameMat)
          flame.position.set(x, 1.9, 0)
          group.add(flame)
          flames.push(flameMat)
          const pl = new THREE.PointLight(0xffd580, 1.0, 4, 2)
          pl.position.set(x, 1.9, 0)
          group.add(pl)
        })
        group.userData = { flames }
        return group
      }

      function createGift(pos: Vec3, color: number): THREE.Group {
        const group = new THREE.Group()
        group.position.set(...pos)
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1, 0.8, 1),
          new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 }),
        )
        box.position.y = 0.4
        box.castShadow = true
        group.add(box)
        const lid = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.1), ivoryMat)
        lid.position.y = 0.85
        lid.castShadow = true
        group.add(lid)
        const rv = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 1.01), brassMat)
        rv.position.y = 0.4
        group.add(rv)
        const rh = new THREE.Mesh(new THREE.BoxGeometry(1.01, 0.8, 0.15), brassMat)
        rh.position.y = 0.4
        group.add(rh)
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 16, 32), brassMat)
        bow.position.y = 1.0
        group.add(bow)
        return group
      }

      function createBirthdayParty(z: number, scale: number): THREE.Group {
        const group = new THREE.Group()

        const danceFloor = createLEDDanceFloor([0, 0, 2])
        assignReveal(danceFloor, 1.0, -3)
        group.add(danceFloor)

        let balloonDelay = 1.5
        const bal1 = createBalloon([-5, 0.5, 0], PALETTE.NEON_MAGENTA)
        assignReveal(bal1, balloonDelay, 5)
        group.add(bal1)
        balloonDelay += 0.1
        const bal2 = createBalloon([-3, 1, 1], PALETTE.NEON_CYAN)
        assignReveal(bal2, balloonDelay, 5)
        group.add(bal2)
        balloonDelay += 0.1
        const bal3 = createBalloon([-1, 0.8, -1], PALETTE.NEON_YELLOW)
        assignReveal(bal3, balloonDelay, 5)
        group.add(bal3)
        balloonDelay += 0.1
        const bal4 = createBalloon([1, 1.2, 0], PALETTE.YOUR_BIRTHDAY)
        assignReveal(bal4, balloonDelay, 5)
        group.add(bal4)
        balloonDelay += 0.1
        const bal5 = createBalloon([3, 0.6, 1], PALETTE.NEON_CYAN)
        assignReveal(bal5, balloonDelay, 5)
        group.add(bal5)
        balloonDelay += 0.1
        const bal6 = createBalloon([5, 1, -1], PALETTE.NEON_MAGENTA)
        assignReveal(bal6, balloonDelay, 5)
        group.add(bal6)
        balloonDelay += 0.1

        const arch = createBalloonArch()
        assignReveal(arch, 2.5, 5)
        group.add(arch)

        const heart = createNeonHeart([0, 1.5, -1.5])
        assignReveal(heart, 2.0, 5)
        group.add(heart)

        const djBooth = createDJBooth([0, 0, -1])
        assignReveal(djBooth, 1.2, -3)
        group.add(djBooth)

        const speaker1 = createPartySpeaker([-6.5, 0, -1], PALETTE.NEON_MAGENTA)
        assignReveal(speaker1, 1.3, -3)
        group.add(speaker1)
        const speaker2 = createPartySpeaker([6.5, 0, -1], PALETTE.NEON_CYAN)
        assignReveal(speaker2, 1.4, -3)
        group.add(speaker2)
        const speaker3 = createPartySpeaker([0, 0, -5], PALETTE.NEON_YELLOW)
        assignReveal(speaker3, 1.5, -3)
        group.add(speaker3)

        const mic = createMicStand([3, 0, 2.5])
        assignReveal(mic, 1.8, -3)
        group.add(mic)

        const cake = createCake([0, 0.1, 2])
        assignReveal(cake, 1.2, -3)
        group.add(cake)

        const gift1 = createGift([-4, 0, 3.5], PALETTE.NEON_CYAN)
        gift1.add(createPartyHat([0, 0.95, 0], PALETTE.NEON_MAGENTA))
        assignReveal(gift1, 2.0, -3)
        group.add(gift1)
        const gift2 = createGift([4, 0, 3.5], PALETTE.NEON_MAGENTA)
        gift2.add(createPartyHat([0, 0.95, 0], PALETTE.NEON_CYAN))
        assignReveal(gift2, 2.1, -3)
        group.add(gift2)
        const gift3 = createGift([0, 0, 4.5], PALETTE.NEON_YELLOW)
        gift3.add(createPartyHat([0, 0.95, 0], PALETTE.YOUR_BIRTHDAY))
        assignReveal(gift3, 2.2, -3)
        group.add(gift3)

        const stand1 = createLightingStand([-5, 0, 5], PALETTE.NEON_CYAN)
        assignReveal(stand1, 2.3, -3)
        group.add(stand1)
        const stand2 = createLightingStand([5, 0, 5], PALETTE.NEON_MAGENTA)
        assignReveal(stand2, 2.4, -3)
        group.add(stand2)
        const stand3 = createLightingStand([0, 0, 6.5], PALETTE.NEON_YELLOW)
        assignReveal(stand3, 2.5, -3)
        group.add(stand3)

        const bunting1 = createBunting(new THREE.Vector3(-5, 6, 5), new THREE.Vector3(5, 6, 5))
        assignReveal(bunting1, 2.8, 5)
        group.add(bunting1)
        const bunting2 = createBunting(new THREE.Vector3(-5, 6, 5), new THREE.Vector3(0, 6, 6.5))
        assignReveal(bunting2, 2.9, 5)
        group.add(bunting2)
        const bunting3 = createBunting(new THREE.Vector3(5, 6, 5), new THREE.Vector3(0, 6, 6.5))
        assignReveal(bunting3, 3.0, 5)
        group.add(bunting3)

        const champTable = createTable([0, 0, 7.5])
        champTable.scale.setScalar(0.7)
        assignReveal(champTable, 3.2, -3)
        group.add(champTable)
        const flute1 = createChampagneFlute([-0.3, 1, 7.5])
        assignReveal(flute1, 3.3, -3)
        group.add(flute1)
        const flute2 = createChampagneFlute([0.3, 1, 7.5])
        assignReveal(flute2, 3.3, -3)
        group.add(flute2)

        const pts: THREE.Vector3[] = []
        for (let i = 0; i <= 30; i++) {
          const t = i / 30
          pts.push(
            new THREE.Vector3(
              -7 + t * 14,
              4.5 + Math.sin(t * Math.PI) * 2.0 + Math.sin(t * Math.PI * 3) * 0.3,
              -1 + Math.sin(t * Math.PI * 2) * 0.5,
            ),
          )
        }
        const curve = new THREE.CatmullRomCurve3(pts)
        const banner = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 80, 0.04, 16, false),
          new THREE.MeshStandardMaterial({ color: PALETTE.YOUR_BIRTHDAY, roughness: 0.3 }),
        )
        assignReveal(banner, 3.5, 5)
        group.add(banner)

        // Confetti with One-Time Burst + Smooth Float Transition
        const pCount = 150
        const posArr = new Float32Array(pCount * 3)
        const baseArr = new Float32Array(pCount * 3)
        const velArr = new Float32Array(pCount * 3)
        const colArr = new Float32Array(pCount * 3)
        const palette = [
          new THREE.Color(PALETTE.YOUR_BIRTHDAY),
          new THREE.Color(PALETTE.LA_LOUNGE),
          new THREE.Color(PALETTE.BRASS_POLISHED),
          new THREE.Color(PALETTE.MYLAR_PINK),
          new THREE.Color(PALETTE.NEON_CYAN),
          new THREE.Color(PALETTE.NEON_MAGENTA),
          new THREE.Color(PALETTE.NEON_YELLOW),
        ]
        for (let i = 0; i < pCount; i++) {
          posArr[i * 3] = 0
          posArr[i * 3 + 1] = 4
          posArr[i * 3 + 2] = 0 // Start at center top
          baseArr[i * 3] = (Math.random() - 0.5) * 24
          baseArr[i * 3 + 1] = Math.random() * 6
          baseArr[i * 3 + 2] = (Math.random() - 0.5) * 6 // Smooth float target
          velArr[i * 3] = (Math.random() - 0.5) * 0.4
          velArr[i * 3 + 1] = 0.2 + Math.random() * 0.2
          velArr[i * 3 + 2] = (Math.random() - 0.5) * 0.4
          const c = palette[Math.floor(Math.random() * palette.length)]
          colArr[i * 3] = c.r
          colArr[i * 3 + 1] = c.g
          colArr[i * 3 + 2] = c.b
        }
        const confGeo = new THREE.BufferGeometry()
        confGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
        confGeo.setAttribute('base', new THREE.BufferAttribute(baseArr, 3))
        confGeo.setAttribute('velocity', new THREE.BufferAttribute(velArr, 3))
        confGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3))
        const confetti = new THREE.Points(
          confGeo,
          new THREE.PointsMaterial({
            size: 0.3,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
          }),
        )
        confetti.userData.isConfetti = true
        confetti.userData.burstDelay = 4.0
        group.add(confetti)

        group.position.set(0, 0, z)
        group.scale.setScalar(scale)
        return group
      }

      // ═════════════════════════════════════════════════════════════════
      // CIRCULAR CENTER BLUEPRINT SCENE
      // ═════════════════════════════════════════════════════════════════
      function createCenterBlueprints(): THREE.Group {
        const group = new THREE.Group()
        const bpMatBold = new THREE.LineBasicMaterial({
          color: PALETTE.LA_LOUNGE,
          transparent: true,
          opacity: 0.9,
        })
        const bpMatMain = new THREE.LineBasicMaterial({
          color: PALETTE.RING_COLOR,
          transparent: true,
          opacity: 0.7,
        })
        const bpMatSub = new THREE.LineBasicMaterial({
          color: PALETTE.GRID_ACCENT,
          transparent: true,
          opacity: 0.5,
        })

        const holoMat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(PALETTE.GRID_PULSE) },
          },
          vertexShader: `varying vec2 vUv; varying vec3 vNormal; varying vec3 vViewPosition; void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vNormal = normalize(normalMatrix * normal); vViewPosition = -mvPosition.xyz; gl_Position = projectionMatrix * mvPosition; }`,
          fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv; varying vec3 vNormal; varying vec3 vViewPosition; void main() { vec3 normal = normalize(vNormal); vec3 viewDir = normalize(vViewPosition); float fresnel = pow(1.0 - dot(normal, viewDir), 2.0); float scanline = sin(vUv.y * 150.0 + uTime * 15.0) * 0.15 + 0.85; float flicker = sin(uTime * 40.0) * 0.05 + 0.95; float alpha = (fresnel * 0.8 + 0.2) * scanline * flicker; gl_FragColor = vec4(uColor * fresnel * 1.0, alpha * 0.4); }`,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })

        const ringGeo = new THREE.TorusGeometry(6, 0.1, 4, 64)
        const ceilingRing = new THREE.LineSegments(new THREE.EdgesGeometry(ringGeo), bpMatBold)
        ceilingRing.rotation.x = Math.PI / 2
        ceilingRing.position.y = 7
        assignReveal(ceilingRing, 0.0, 5)
        group.add(ceilingRing)

        let beamDelay = 0.2
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          const beamGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 7, 0),
            new THREE.Vector3(Math.cos(angle) * 6, 7, Math.sin(angle) * 6),
          ])
          const beam = new THREE.Line(beamGeo, bpMatSub)
          assignReveal(beam, beamDelay, 5)
          group.add(beam)
          beamDelay += 0.05
        }

        let bistroDelay = 0.4
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2
          const bulbGeo = new THREE.SphereGeometry(0.1, 4, 4)
          const bulb = new THREE.LineSegments(new THREE.EdgesGeometry(bulbGeo), bpMatSub)
          bulb.position.set(Math.cos(angle) * 5.5, 6.5, Math.sin(angle) * 5.5)
          assignReveal(bulb, bistroDelay, 5)
          group.add(bulb)
          bistroDelay += 0.02
        }

        const discoGeo = new THREE.IcosahedronGeometry(0.8, 1)
        const discoBall = new THREE.LineSegments(new THREE.EdgesGeometry(discoGeo), bpMatBold)
        discoBall.position.set(0, 5.5, 0)
        assignReveal(discoBall, 0.6, 5)
        group.add(discoBall)
        const discoWire = new THREE.Mesh(discoGeo, holoMat)
        discoWire.position.copy(discoBall.position)
        assignReveal(discoWire, 0.6, 5)
        group.add(discoWire)

        let canDelay = 0.7
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          const canGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8)
          const can = new THREE.LineSegments(new THREE.EdgesGeometry(canGeo), bpMatMain)
          can.position.set(Math.cos(angle) * 5.5, 6.8, Math.sin(angle) * 5.5)
          can.lookAt(0, 0, 0)
          can.rotateX(Math.PI / 2)
          assignReveal(can, canDelay, 5)
          group.add(can)
          canDelay += 0.05

          // Volumetric Beam Removed As Requested
        }

        let pillarDelay = 0.5
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          const pillarGeo = new THREE.CylinderGeometry(0.15, 0.15, 7, 8)
          const pillar = new THREE.LineSegments(new THREE.EdgesGeometry(pillarGeo), bpMatMain)
          pillar.position.set(Math.cos(angle) * 6, 3.5, Math.sin(angle) * 6)
          assignReveal(pillar, pillarDelay, -5)
          group.add(pillar)
          pillarDelay += 0.05
        }

        const floor1Geo = new THREE.CylinderGeometry(3.5, 3.5, 0.1, 64)
        const floor1 = new THREE.LineSegments(new THREE.EdgesGeometry(floor1Geo), bpMatMain)
        floor1.position.set(0, 0.05, 0)
        assignReveal(floor1, 0.9, -1)
        group.add(floor1)
        const floor1Fill = new THREE.Mesh(floor1Geo, holoMat)
        floor1Fill.position.copy(floor1.position)
        assignReveal(floor1Fill, 0.9, -1)
        group.add(floor1Fill)

        const floor2Geo = new THREE.CylinderGeometry(2.5, 2.5, 0.1, 64)
        const floor2 = new THREE.LineSegments(new THREE.EdgesGeometry(floor2Geo), bpMatBold)
        floor2.position.set(0, 0.15, 0)
        assignReveal(floor2, 1.0, -1)
        group.add(floor2)

        const floor3Geo = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 64)
        const floor3 = new THREE.LineSegments(new THREE.EdgesGeometry(floor3Geo), bpMatSub)
        floor3.position.set(0, 0.25, 0)
        assignReveal(floor3, 1.1, -1)
        group.add(floor3)

        // NEW: Glowing Dance Floor Emblem
        const emblemGeo = new THREE.RingGeometry(0.8, 1.0, 5)
        const emblemMat = new THREE.MeshBasicMaterial({
          color: PALETTE.NEON_CYAN,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        })
        const emblem = new THREE.Mesh(emblemGeo, emblemMat)
        emblem.position.set(0, 0.31, 0)
        emblem.rotation.x = -Math.PI / 2
        emblem.userData.isEmblem = true
        assignReveal(emblem, 1.2, -1)
        group.add(emblem)

        const tableGeo = new THREE.TorusGeometry(4.5, 0.1, 2, 64)
        const table = new THREE.LineSegments(new THREE.EdgesGeometry(tableGeo), bpMatBold)
        table.position.set(0, 1, 0)
        table.rotation.x = Math.PI / 2
        assignReveal(table, 1.2, -3)
        group.add(table)

        let plateDelay = 1.4
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          const px = Math.cos(angle) * 4.5
          const pz = Math.sin(angle) * 4.5
          const plateGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.02, 16)
          const plate = new THREE.LineSegments(new THREE.EdgesGeometry(plateGeo), bpMatSub)
          plate.position.set(px, 1.11, pz)
          assignReveal(plate, plateDelay, -3)
          group.add(plate)
          const glassBaseGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 8)
          const glassBase = new THREE.LineSegments(new THREE.EdgesGeometry(glassBaseGeo), bpMatMain)
          glassBase.position.set(px, 1.12, pz)
          assignReveal(glassBase, plateDelay, -3)
          group.add(glassBase)
          const glassStemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4)
          const glassStem = new THREE.LineSegments(new THREE.EdgesGeometry(glassStemGeo), bpMatMain)
          glassStem.position.set(px, 1.21, pz)
          assignReveal(glassStem, plateDelay, -3)
          group.add(glassStem)
          const glassBowlGeo = new THREE.SphereGeometry(0.1, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2)
          const glassBowl = new THREE.LineSegments(new THREE.EdgesGeometry(glassBowlGeo), bpMatMain)
          glassBowl.position.set(px, 1.3, pz)
          assignReveal(glassBowl, plateDelay, -3)
          group.add(glassBowl)
          plateDelay += 0.05
        }

        const centerBaseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.2, 16)
        const centerBase = new THREE.LineSegments(new THREE.EdgesGeometry(centerBaseGeo), bpMatBold)
        centerBase.position.set(0, 1.1, 0)
        assignReveal(centerBase, 1.6, -3)
        group.add(centerBase)
        const centerMidGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.4, 16)
        const centerMid = new THREE.LineSegments(new THREE.EdgesGeometry(centerMidGeo), bpMatMain)
        centerMid.position.set(0, 1.4, 0)
        assignReveal(centerMid, 1.7, -3)
        group.add(centerMid)
        const centerTopGeo = new THREE.ConeGeometry(0.5, 0.6, 8)
        const centerTop = new THREE.LineSegments(new THREE.EdgesGeometry(centerTopGeo), bpMatSub)
        centerTop.position.set(0, 1.9, 0)
        assignReveal(centerTop, 1.8, -3)
        group.add(centerTop)

        let chairDelay = 2.0
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          const chairGroup = new THREE.Group()
          const seat = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(0.6, 0.08, 0.6)),
            bpMatMain,
          )
          seat.position.y = 0.5
          chairGroup.add(seat)
          const back = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(0.6, 0.6, 0.08)),
            bpMatMain,
          )
          back.position.set(0, 0.8, -0.3)
          chairGroup.add(back)
          chairGroup.position.set(Math.cos(angle) * 5.2, 0, Math.sin(angle) * 5.2)
          chairGroup.lookAt(0, 0.8, 0)
          assignReveal(chairGroup, chairDelay, -3)
          group.add(chairGroup)
          chairDelay += 0.05
        }

        const djBaseGeo = new THREE.CylinderGeometry(0.8, 1, 1.2, 32)
        const djBase = new THREE.LineSegments(new THREE.EdgesGeometry(djBaseGeo), bpMatBold)
        djBase.position.set(0, 0.6, 0)
        assignReveal(djBase, 2.2, -3)
        group.add(djBase)
        const djMidGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.4, 32)
        const djMid = new THREE.LineSegments(new THREE.EdgesGeometry(djMidGeo), bpMatMain)
        djMid.position.set(0, 1.4, 0)
        assignReveal(djMid, 2.3, -3)
        group.add(djMid)
        const djTopGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.1, 32)
        const djTop = new THREE.LineSegments(new THREE.EdgesGeometry(djTopGeo), bpMatSub)
        djTop.position.set(0, 1.65, 0)
        assignReveal(djTop, 2.4, -3)
        group.add(djTop)
        const djPlatter1Geo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16)
        const djPlatter1 = new THREE.LineSegments(new THREE.EdgesGeometry(djPlatter1Geo), bpMatBold)
        djPlatter1.position.set(-0.2, 1.71, 0)
        assignReveal(djPlatter1, 2.5, -3)
        group.add(djPlatter1)
        const djPlatter2Geo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16)
        const djPlatter2 = new THREE.LineSegments(new THREE.EdgesGeometry(djPlatter2Geo), bpMatBold)
        djPlatter2.position.set(0.2, 1.71, 0)
        assignReveal(djPlatter2, 2.5, -3)
        group.add(djPlatter2)
        const djLapGeo = new THREE.BoxGeometry(0.3, 0.02, 0.2)
        const djLap = new THREE.LineSegments(new THREE.EdgesGeometry(djLapGeo), bpMatMain)
        djLap.position.set(0, 1.71, 0.2)
        assignReveal(djLap, 2.5, -3)
        group.add(djLap)

        const buffetTableGeo = new THREE.BoxGeometry(3, 0.1, 1)
        const buffetTable = new THREE.LineSegments(
          new THREE.EdgesGeometry(buffetTableGeo),
          bpMatBold,
        )
        buffetTable.position.set(-4, 1, 4)
        assignReveal(buffetTable, 3.0, -3)
        group.add(buffetTable)
        ;(
          [
            [-1.4, -0.4],
            [1.4, -0.4],
            [-1.4, 0.4],
            [1.4, 0.4],
          ] as Vec2[]
        ).forEach(([x, z]) => {
          const legGeo = new THREE.BoxGeometry(0.1, 1, 0.1)
          const leg = new THREE.LineSegments(new THREE.EdgesGeometry(legGeo), bpMatSub)
          leg.position.set(-4 + x, 0.5, 4 + z)
          assignReveal(leg, 3.1, -3)
          group.add(leg)
        })
        for (let i = 0; i < 3; i++) {
          const dishBaseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8)
          const dishBase = new THREE.LineSegments(new THREE.EdgesGeometry(dishBaseGeo), bpMatMain)
          dishBase.position.set(-4.5 + i * 0.5, 1.08, 4)
          assignReveal(dishBase, 3.3, -3)
          group.add(dishBase)
          const dishDomeGeo = new THREE.SphereGeometry(0.25, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2)
          const dishDome = new THREE.LineSegments(new THREE.EdgesGeometry(dishDomeGeo), bpMatBold)
          dishDome.position.set(-4.5 + i * 0.5, 1.13, 4)
          assignReveal(dishDome, 3.3, -3)
          group.add(dishDome)
        }

        const giftTableGeo = new THREE.BoxGeometry(1.5, 0.1, 1)
        const giftTable = new THREE.LineSegments(new THREE.EdgesGeometry(giftTableGeo), bpMatBold)
        giftTable.position.set(4, 1, 4)
        assignReveal(giftTable, 3.5, -3)
        group.add(giftTable)
        ;(
          [
            [-0.7, -0.4],
            [0.7, -0.4],
            [-0.7, 0.4],
            [0.7, 0.4],
          ] as Vec2[]
        ).forEach(([x, z]) => {
          const legGeo = new THREE.BoxGeometry(0.1, 1, 0.1)
          const leg = new THREE.LineSegments(new THREE.EdgesGeometry(legGeo), bpMatSub)
          leg.position.set(4 + x, 0.5, 4 + z)
          assignReveal(leg, 3.6, -3)
          group.add(leg)
        })
        const giftBox1Geo = new THREE.BoxGeometry(0.5, 0.4, 0.5)
        const giftBox1 = new THREE.LineSegments(new THREE.EdgesGeometry(giftBox1Geo), bpMatMain)
        giftBox1.position.set(3.8, 1.3, 4)
        assignReveal(giftBox1, 3.8, -3)
        group.add(giftBox1)
        const giftBox2Geo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
        const giftBox2 = new THREE.LineSegments(new THREE.EdgesGeometry(giftBox2Geo), bpMatSub)
        giftBox2.position.set(4.3, 1.25, 4.1)
        assignReveal(giftBox2, 3.9, -3)
        group.add(giftBox2)

        group.userData.holoMat = holoMat
        group.position.set(0, 0.05, 0)
        return group
      }

      // ═════════════════════════════════════════════════════════════════
      // SCENE ASSEMBLY
      // ═════════════════════════════════════════════════════════════════
      scene.add(createLutFurniture(sectionZs.lut, 1.0))
      scene.add(createBirthdayParty(sectionZs.birthday, 1.0))

      const centerBlueprints = createCenterBlueprints()
      scene.add(centerBlueprints)

      // Background Orbiting Rings Removed as requested

      const archGroup = new THREE.Group()
      const matBold = new THREE.LineBasicMaterial({
        color: PALETTE.LA_LOUNGE,
        transparent: true,
        opacity: 0.6,
      })
      const matMain = new THREE.LineBasicMaterial({
        color: PALETTE.RING_COLOR,
        transparent: true,
        opacity: 0.5,
      })
      const matSub = new THREE.LineBasicMaterial({
        color: PALETTE.GRID_ACCENT,
        transparent: true,
        opacity: 0.4,
      })

      const platforms = [
        { w: 14, h: 0.3, d: 7, x: 0, y: 0.15, z: -18 },
        { w: 10, h: 0.3, d: 5, x: -18, y: 0.15, z: 12 },
        { w: 8, h: 0.3, d: 4, x: 18, y: 0.15, z: 8 },
      ]
      platforms.forEach((p) => {
        const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(p.w, p.h, p.d))
        const line = new THREE.LineSegments(geo, matMain)
        line.position.set(p.x, p.y, p.z)
        archGroup.add(line)
      })

      const pillars: Vec2[] = [
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
        const h = 6 + ((((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1) * 4
        const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.4, h, 0.4))
        const line = new THREE.LineSegments(geo, i < 4 ? matBold : matSub)
        line.position.set(x, h / 2, z)
        archGroup.add(line)
      })

      const trusses = [
        { w: 44, h: 0.25, d: 0.25, x: 0, y: 7, z: -18 },
        { w: 44, h: 0.25, d: 0.25, x: 0, y: 9, z: 18 },
        { w: 0.25, h: 0.25, d: 36, x: -22, y: 5, z: 0 },
        { w: 0.25, h: 0.25, d: 36, x: 22, y: 5, z: 0 },
      ]
      trusses.forEach((t) => {
        const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(t.w, t.h, t.d))
        const line = new THREE.LineSegments(geo, matBold)
        line.position.set(t.x, t.y, t.z)
        archGroup.add(line)
      })

      const tables: Vec2[] = [
        [-10, -6],
        [10, -6],
        [0, 16],
        [-16, 0],
        [16, 0],
      ]
      tables.forEach(([x, z]) => {
        const geo = new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.2, 1.2, 0.25, 24))
        const line = new THREE.LineSegments(geo, matSub)
        line.position.set(x, 0.125, z)
        archGroup.add(line)
      })

      scene.add(archGroup)

      const spineMat = new THREE.MeshBasicMaterial({
        color: PALETTE.BRASS_POLISHED,
        transparent: true,
        opacity: 0.5,
      })
      const goldSpine = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 70, 12), spineMat)
      goldSpine.rotation.x = Math.PI / 2
      scene.add(goldSpine)

      const moteCount = 200
      const motesPos = new Float32Array(moteCount * 3)
      const motesBase = new Float32Array(moteCount * 3)
      const motesSpeed = new Float32Array(moteCount)
      for (let i = 0; i < moteCount; i++) {
        motesPos[i * 3] = (Math.random() - 0.5) * 80
        motesPos[i * 3 + 1] = (Math.random() - 0.5) * 50
        motesPos[i * 3 + 2] = (Math.random() - 0.5) * 40
        motesBase[i * 3] = motesPos[i * 3]
        motesBase[i * 3 + 1] = motesPos[i * 3 + 1]
        motesBase[i * 3 + 2] = motesPos[i * 3 + 2]
        motesSpeed[i] = 0.5 + Math.random() * 1.5
      }
      const motesGeo = new THREE.BufferGeometry()
      motesGeo.setAttribute('position', new THREE.BufferAttribute(motesPos, 3))
      const dustMotes = new THREE.Points(
        motesGeo,
        new THREE.PointsMaterial({
          color: PALETTE.BRASS_POLISHED,
          size: 0.1,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      )
      scene.add(dustMotes)

      // SHADER GRID
      const gridVertexShader = `varying vec2 vUv; varying vec3 vWorldPos; void main() { vUv = uv; vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
      const gridFragmentShader = `uniform float uTime; uniform vec3 uColorMain; uniform vec3 uColorAccent; uniform vec3 uColorLight; uniform vec3 uColorPulse; uniform float uFadeStart; uniform float uFadeEnd; varying vec2 vUv; varying vec3 vWorldPos; float gridLine(vec2 coord, float width) { vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord); float line = min(grid.x, grid.y); return 1.0 - min(line, 1.0); } void main() { float dist = length(vWorldPos.xz); float fade = 1.0 - smoothstep(uFadeStart, uFadeEnd, dist); float fine = gridLine(vUv * 60.0, 1.0) * 0.1; float major = gridLine(vUv * 12.0, 1.0) * 0.35; float accent = gridLine(vUv * 6.0, 1.0) * 0.5; float pulse = sin(dist * 0.15 - uTime * 0.8) * 0.5 + 0.5; float ring = smoothstep(0.02, 0.0, abs(fract(dist * 0.08 - uTime * 0.12) - 0.5) * 2.0) * pulse * 0.3; float flow = smoothstep(0.02, 0.0, abs(fract(vUv.y * 40.0 + uTime * 0.05) - 0.5) * 2.0) * 0.05; vec3 color = mix(uColorLight, uColorMain, fine + major); color = mix(color, uColorAccent, accent); color = mix(color, uColorPulse, ring); color += uColorAccent * flow; float alpha = (fine + major * 0.6 + accent * 0.4 + ring + flow) * fade; gl_FragColor = vec4(color, alpha * 0.8); }`
      const gridUniforms = {
        uTime: { value: 0 },
        uColorMain: { value: new THREE.Color(PALETTE.GRID_MAIN) },
        uColorAccent: { value: new THREE.Color(PALETTE.GRID_ACCENT) },
        uColorLight: { value: new THREE.Color(PALETTE.GRID_LIGHT) },
        uColorPulse: { value: new THREE.Color(PALETTE.GRID_PULSE) },
        uFadeStart: { value: 30.0 },
        uFadeEnd: { value: 100.0 },
      }
      const gridMaterial = new THREE.ShaderMaterial({
        uniforms: gridUniforms,
        vertexShader: gridVertexShader,
        fragmentShader: gridFragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), gridMaterial)
      gridMesh.rotation.x = -Math.PI / 2
      gridMesh.position.y = -0.04
      scene.add(gridMesh)

      const shadowMat = new THREE.ShadowMaterial({ opacity: 0.4 })
      const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), shadowMat)
      shadowFloor.rotation.x = -Math.PI / 2
      shadowFloor.receiveShadow = true
      scene.add(shadowFloor)

      // ═════════════════════════════════════════════════════════════════
      // ANIMATION LOOP
      // ═════════════════════════════════════════════════════════════════
      const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }
      onMouseMove = (e: MouseEvent) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1
      }
      window.addEventListener('mousemove', onMouseMove)

      onResize = () => {
        if (!renderer) return // guard for TS — renderer is assigned in try-block above
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', onResize)

      const clock = new THREE.Clock()
      const camDist = isMobile ? 45 : 52
      const pitch = Math.PI / 3
      const height = camDist * Math.sin(pitch)
      const depth = camDist * Math.cos(pitch)

      let sceneStartTime = 0

      const animate = () => {
        frameId = requestAnimationFrame(animate)
        // Guard for TS: scene and renderer are assigned in the outer try-block;
        // they are non-null at runtime by the time animate() runs, but TS can't
        // see that across the closure boundary. Bail out (and let the next rAF
        // tick retry) if they somehow aren't set yet.
        if (!scene || !renderer) return
        const t = clock.getElapsedTime()
        if (sceneStartTime === 0) sceneStartTime = t
        const localT = t - sceneStartTime

        // Update Shaders
        floorUniforms.uTime.value = t
        gridUniforms.uTime.value = t
        if (centerBlueprints.userData.holoMat) {
          ;(centerBlueprints.userData.holoMat as THREE.ShaderMaterial).uniforms.uTime.value = t
        }

        // Camera Intro Sweep (Smoother)
        const camIntroProgress = Math.min(localT / 5.0, 1.0) // Slower intro (5s)
        const camEase = 1 - Math.pow(1 - camIntroProgress, 4) // Qua

        mouse.x += (mouse.targetX - mouse.x) * 0.03
        mouse.y += (mouse.targetY - mouse.y) * 0.03
        const noiseX = Math.sin(t * 0.1) * 1.5
        const noiseY = Math.cos(t * 0.15) * 0.5

        const pX = mouse.x * (isMobile ? 2 : 4) + noiseX
        const pY = mouse.y * (isMobile ? 1 : 2) + noiseY

        const targetY = height + pY * 0.3
        const startY = height + 25
        camera.position.y = startY + (targetY - startY) * camEase

        const targetZ = depth + pY * 0.5
        const startZ = depth + 24
        camera.position.z = startZ + (targetZ - startZ) * camEase

        camera.position.x = pX
        camera.lookAt(pX * 0.3, pY * 0.1, 0)

        spineMat.opacity = 0.4 + Math.sin(t * 0.5) * 0.1

        dustMotes.rotation.y = t * 0.008
        const posAttr = dustMotes.geometry.attributes.position as THREE.BufferAttribute
        const posArrMotes = posAttr.array as Float32Array
        for (let i = 0; i < moteCount; i++) {
          posArrMotes[i * 3 + 1] =
            motesBase[i * 3 + 1] + Math.sin(t * motesSpeed[i] * 0.2 + i) * 0.5
        }
        posAttr.needsUpdate = true

        centerBlueprints.rotation.y = Math.sin(t * 0.1) * 0.3 + t * 0.05

        // Scene Updates & Reveal Animations
        scene.traverse((obj: THREE.Object3D) => {
          if (obj.userData && obj.userData.reveal) {
            const r = obj.userData.reveal as RevealData
            const elapsed = localT - r.delay
            if (elapsed < 0) return

            const progress = Math.min(elapsed / r.duration, 1.0)
            const scaleProgress = easeOutElastic(progress)
            const s = 0.001 + (r.targetScale.x - 0.001) * scaleProgress
            obj.scale.set(s, s, s)

            const posProgress = 1 - Math.pow(1 - progress, 3)
            obj.position.y = r.startY + (r.targetY - r.startY) * posProgress

            const rotProgress = 1 - Math.pow(1 - progress, 3)
            obj.rotation.z = r.targetRotZ + (Math.PI / 6) * (1 - rotProgress)

            if (progress >= 1.0) {
              obj.scale.copy(r.targetScale)
              obj.position.y = r.targetY
              obj.rotation.z = r.targetRotZ
              delete obj.userData.reveal
            }
          }

          // Beat pulse for Neon Heart
          if (obj.userData && obj.userData.isHeart) {
            const beat = Math.sin(t * 6.0) * 0.5 + 0.5
            ;((obj as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity =
              1.5 + beat * 0.5
          }

          // NEW: Emblem Pulse
          if (obj.userData && obj.userData.isEmblem) {
            const beat = Math.sin(t * 4.0) * 0.5 + 0.5
            ;((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.3 + beat * 0.3
            obj.rotation.z = t * 0.5
          }

          // Confetti Physics (Burst then Smooth Float)
          if (obj.userData && obj.userData.isConfetti) {
            if (localT > obj.userData.burstDelay) {
              const confMat = (obj as THREE.Points).material as THREE.PointsMaterial
              confMat.opacity = Math.min(confMat.opacity + 0.05, 0.8)
              const burstTime = localT - obj.userData.burstDelay
              const confPoints = obj as THREE.Points
              const confGeo = confPoints.geometry
              const pos = confGeo.attributes.position.array as Float32Array
              // `velocity` and `base` are custom BufferAttributes we attach to
              // the confetti geometry (not part of THREE's stock attributes).
              // Cast via a typed shape so we avoid `any` while still indexing
              // the dynamic attribute names.
              const customAttrs = confGeo.attributes as unknown as {
                velocity: THREE.BufferAttribute
                base: THREE.BufferAttribute
              }
              const vel = customAttrs.velocity.array as Float32Array
              const base = customAttrs.base.array as Float32Array

              for (let i = 0; i < pos.length; i += 3) {
                if (burstTime < 1.5) {
                  // Physics burst
                  pos[i] += vel[i]
                  pos[i + 1] += vel[i + 1]
                  vel[i + 1] -= 0.002 // Gravity
                  pos[i + 2] += vel[i + 2]
                } else {
                  // Smooth lerp to base + sine float
                  const targetX = base[i] + Math.sin(t * 0.5 + i) * 1.0
                  const targetY = base[i + 1] + Math.cos(t * 0.4 + i) * 0.5
                  const targetZ = base[i + 2] + Math.sin(t * 0.6 + i) * 1.0

                  pos[i] += (targetX - pos[i]) * 0.02
                  pos[i + 1] += (targetY - pos[i + 1]) * 0.02
                  pos[i + 2] += (targetZ - pos[i + 2]) * 0.02
                }
              }
              ;(confGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true
            }
          }

          if (obj.userData && obj.userData.baseY !== undefined) {
            obj.position.y =
              obj.userData.baseY +
              Math.sin(t * 0.35 + obj.userData.baseX * 0.8) * 0.12 +
              Math.sin(t * 0.6 + obj.userData.baseZ) * 0.05
            obj.rotation.z = Math.sin(t * 0.2 + obj.userData.baseZ) * 0.04
            obj.rotation.x = Math.sin(t * 0.15 + obj.userData.baseX) * 0.03
          }
          if (obj.userData && obj.userData.flames) {
            const flames = obj.userData.flames as THREE.MeshStandardMaterial[]
            flames.forEach((mat, i) => {
              const offset = i * 0.9
              mat.emissiveIntensity =
                1.5 +
                Math.sin(t * 9 + offset) * 0.2 +
                Math.sin(t * 14 + offset * 1.3) * 0.15 +
                Math.sin(t * 21 + offset * 0.7) * 0.05
            })
          }
          if (obj.userData && obj.userData.isTile) {
            if (Math.random() > 0.95) {
              ;((obj as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity =
                Math.random() * 1.5
            }
          }
        })

        renderer.render(scene, camera)
      }

      animate()
    } catch (error) {
      console.error('Hero3DBackground initialization error:', error)
    }

    // ═════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═════════════════════════════════════════════════════════════════
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove)
      if (onResize) window.removeEventListener('resize', onResize)
      // v41-g2-F1 Fix #2: traverse the scene graph to dispose geometries /
      // materials before tearing down the renderer. scene.clear() only
      // detaches objects — it does NOT free GPU buffers, so without this
      // loop the WebGL context leaks memory on every route change / Strict
      // Mode double-mount.
      if (scene) {
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose()
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose())
            } else {
              obj.material?.dispose()
            }
          }
        })
      }
      if (renderer) {
        renderer.dispose()
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
      }
      if (scene) scene.clear()
    }
  }, [])

  return (
    <div
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
      }}
    />
  )
}
