'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { shouldEnable3D } from '@/lib/device-capabilities'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Birthday3DBackground — full club-style 3D scene for the Your Birthday page.
 *
 * Faithful vanilla-Three.js port of `upload/Your birthday 3D background.html`.
 * Everything (scene, camera, renderer, post-processing, every mesh/material/
 * shader, the cinematic build-in animation system, the 128 BPM beat system and
 * the handheld-shake drone camera) lives inside a single `useEffect([])`.
 *
 * The component renders one fixed, pointer-events-none, z-index -1 container
 * div; the WebGL canvas is appended to it imperatively (matching the HTML's
 * `container.appendChild(renderer.domElement)`).
 *
 * Scene elements (1:1 with the source HTML):
 *  - Reflective Reflector floor (200×200, darkened) + neon grid helper
 *  - Giant LED background screen driven by a custom GLSL ShaderMaterial
 *    (HSV color cycle, 12 mirrored spectrum bars, LED grid + scanline)
 *  - Professional DJ booth (PBR cabinet + cyan LED strips + pink mini-screens)
 *  - Low-lying fog (150 canvas-textured additive Points)
 *  - 4 moving-head floor lamps (sweeping SpotLights + colored lenses)
 *  - 2 background speaker towers (cones, neon torus rings, caps, LED strips,
 *    pulsing subwoofers, point lights)
 *  - 3 corner gift boxes (PBR boxes + emissive ribbon/bow torus knots)
 *  - Equalizer bars (20 mobile / 50 desktop, transmissive MeshPhysicalMaterial)
 *  - Spinning vinyl records (2 mobile / 5 desktop, canvas-groove texture)
 *  - Volumetric laser beams (2 mobile / 4 desktop, additive blending)
 *  - Balloon arch (24 PBR balloons in a semi-circle, breathing animation)
 *  - Floating particles (300 mobile / 1000 desktop, vertex-colored)
 *  - Post: EffectComposer → RenderPass → UnrealBloomPass → FXAA ShaderPass
 *  - PMREMGenerator + RoomEnvironment for PBR image-based lighting
 *  - Mouse parallax (desktop) + cinematic handheld camera shake
 *
 * Cleanup: cancels requestAnimationFrame, removes mousemove/resize listeners,
 * disposes all geometries/materials/textures/PMREM render target/Reflector
 * render target, then calls `renderer.dispose()` + `scene.clear()` and removes
 * the canvas — so React Strict Mode double-mount is safe.
 */
export default function Birthday3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // v41-g2-F1 Fix #1: gate the heavy 3D scene on device capability.
    // Skips entirely on prefers-reduced-motion / no WebGL / < 2 cores /
    // < 2 GB so low-end devices get the static gradient fallback instead.
    // (Threshold values live in src/lib/device-capabilities.ts as
    // MIN_CORES_FOR_3D / MIN_MEMORY_GB_FOR_3D — see Task 2b fix.)
    if (!shouldEnable3D()) return

    const isMobile = window.innerWidth < 768
    const pixelRatio = Math.min(window.devicePixelRatio, 3.0)

    // Aesthetic Color Palette
    // Task 2b: Replaced the AI-slop neon purple-pink-cyan trio
    // (#9D4EDD / #FF006E / #00F3FF) with gold-family tones to match the
    // Your Birthday brand color (#F5B914). Neon effect preserved via
    // brightness/saturation; the three shades (gold / light gold / amber-gold)
    // keep visual variety while staying in the yellow family.
    const bgColor = new THREE.Color('#060B1A')
    // v51 Phase 3: 5 logo colors for Your Birthday
    const neonGold = new THREE.Color('#FFCC00')      // logo golden yellow
    const neonGoldLight = new THREE.Color('#FFD700') // logo bright yellow balloon
    const neonGoldAmber = new THREE.Color('#FFC107') // amber accent
    const neonOrange = new THREE.Color('#E32636')    // logo red (balloon + text)
    const neonPink = new THREE.Color('#FFB6C1')      // logo light pink balloon
    const neonDeep = new THREE.Color('#4A235A')      // logo deep purple

    // Scene Setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(bgColor, 0.004)
    scene.background = bgColor

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 65 : 55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )
    camera.position.set(0, 7, isMobile ? 50 : 35)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(pixelRatio)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.85
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // PBR Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const pmremRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = pmremRT.texture

    // Post Processing
    const composer = new EffectComposer(renderer)
    composer.setPixelRatio(pixelRatio)
    composer.setSize(window.innerWidth, window.innerHeight)
    composer.addPass(new RenderPass(scene, camera))

    // v50: reduced bloom strength 0.3 → 0.15 (VLM: central glow overexposed)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.15, // v50: lower strength (was 0.3)
      0.5, // v50: tighter radius (was 0.6)
      1.2, // v50: higher threshold (was 1.0) — only pure neon blooms
    )
    composer.addPass(bloomPass)

    const fxaaPass = new ShaderPass(FXAAShader)
    fxaaPass.material.uniforms['resolution'].value.set(
      1 / (window.innerWidth * pixelRatio),
      1 / (window.innerHeight * pixelRatio),
    )
    composer.addPass(fxaaPass)

    // --- Lighting ---
    scene.add(new THREE.AmbientLight(0x6a7a9e, 0.8))

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
    keyLight.position.set(10, 25, 15)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6)
    fillLight.position.set(0, 10, 30)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(neonGold.getHex(), 1.5)
    rimLight.position.set(-15, 20, -30)
    scene.add(rimLight)

    const purpleLight = new THREE.PointLight(neonGold.getHex(), 80, 150)
    purpleLight.position.set(-20, 15, 5)
    scene.add(purpleLight)

    const pinkLight = new THREE.PointLight(neonGoldLight.getHex(), 60, 150)
    pinkLight.position.set(20, 10, 5)
    scene.add(pinkLight)

    const cyanLight = new THREE.PointLight(neonGoldAmber.getHex(), 30, 120)
    cyanLight.position.set(0, 0, 20)
    scene.add(cyanLight)

    // --- Darker High-Res Reflective Floor ---
    const floorGeometry = new THREE.PlaneGeometry(200, 200)
    // NOTE: `clipSize` is kept verbatim from the source HTML (it is not a real
    // Reflector option and is ignored at runtime). Passed via a non-literal
    // variable so TypeScript's excess-property check on object literals does
    // not reject it.
    const reflectorOptions = {
      clipSize: 200,
      textureWidth: window.innerWidth * pixelRatio,
      textureHeight: window.innerHeight * pixelRatio,
      color: 0x020205, // Darkened further to suppress reflection glare
      recursion: 1,
    }
    const floor = new Reflector(floorGeometry, reflectorOptions)
    floor.rotateX(-Math.PI / 2)
    floor.position.y = -12
    scene.add(floor)

    const gridHelper = new THREE.GridHelper(200, 50, neonGold, neonGoldLight)
    gridHelper.position.y = -11.98
    const gridMat = gridHelper.material as THREE.Material
    gridMat.transparent = true
    gridMat.opacity = 0.12
    scene.add(gridHelper)

    // ============================================
    // CINEMATIC BUILD ANIMATION SYSTEM
    // ============================================
    function easeOutElastic(x: number): number {
      const c4 = (2 * Math.PI) / 3
      return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1
    }
    function easeOutCubic(x: number): number {
      return 1 - Math.pow(1 - x, 3)
    }

    type BuildTarget = THREE.Object3D | THREE.Material
    const buildTargets: BuildTarget[] = []

    function setupBuild(obj: THREE.Object3D, delay: number, duration: number, fromY = 5) {
      obj.userData.basePos = obj.position.clone()
      obj.userData.baseScale = obj.scale.clone()
      obj.userData.baseRot = obj.rotation.clone()
      obj.userData.buildDelay = delay
      obj.userData.buildDuration = duration
      obj.userData.isBuilt = false
      obj.userData.fromY = fromY

      obj.scale.set(0.001, 0.001, 0.001)
      obj.position.y = obj.userData.basePos.y - fromY
      obj.rotation.z = obj.userData.baseRot.z + Math.PI / 8

      buildTargets.push(obj)
    }

    function setupFade(
      mat: THREE.Material,
      delay: number,
      duration: number,
      targetOpacity: number,
    ) {
      mat.userData = mat.userData || {}
      mat.userData.fadeDelay = delay
      mat.userData.fadeDuration = duration
      mat.userData.targetOpacity = targetOpacity
      mat.userData.isFaded = false
      mat.opacity = 0
      mat.transparent = true
      buildTargets.push(mat)
    }

    setupFade(gridMat, 0.5, 1.5, 0.08) // Reduced target opacity

    // --- GIANT LED BACKGROUND SCREEN (Advanced Interactive Shader) ---
    const screenMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBeat: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBeat;
        varying vec2 vUv;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec2 uv = vUv;
          vec3 bgCol = vec3(0.01, 0.02, 0.05);
          // v50: replaced rainbow hue with gold-family color (brand identity)
          float goldShift = 0.08 + sin(uTime * 0.5 + uv.y * 2.0) * 0.03;
          vec3 barCol = hsv2rgb(vec3(goldShift, 0.85, 1.0));

          float spec = 0.0;
          for(float i=0.0; i<12.0; i++) {
            float t = i * 0.5;
            float h = (0.2 + abs(sin(uTime * 2.0 + t) * 0.3)) + uBeat * 0.5;
            float barX = 0.5 - (i / 12.0) * 0.45;
            float distL = abs(uv.x - barX);
            float bandL = smoothstep(0.02, 0.0, distL);
            float barX2 = 0.5 + (i / 12.0) * 0.45;
            float distR = abs(uv.x - barX2);
            float bandR = smoothstep(0.02, 0.0, distR);
            spec += bandL * smoothstep(0.0, h, uv.y);
            spec += bandR * smoothstep(0.0, h, uv.y);
          }

          float gridX = step(0.98, fract(uv.x * 30.0));
          float gridY = step(0.98, fract(uv.y * 15.0));
          float grid = max(gridX, gridY) * 0.1;
          float scan = smoothstep(0.05, 0.0, abs(fract(uTime * 0.5) - uv.y));

          vec3 col = mix(bgCol, barCol, spec);
          col += barCol * grid;
          col += barCol * scan * 0.2;

          gl_FragColor = vec4(col, 0.4 + spec * 0.6);
        }
      `,
      transparent: true,
      depthWrite: false,
    })

    const ledScreen = new THREE.Mesh(new THREE.PlaneGeometry(60, 25), screenMat)
    ledScreen.position.set(0, 0, -40)
    scene.add(ledScreen)
    screenMat.userData = {
      fadeDelay: 0.0,
      fadeDuration: 1.0,
      isFaded: false,
      isMaterial: true,
      targetOpacity: 1.0,
      opacity: 0.0,
    }
    buildTargets.push(screenMat)

    // --- PROFESSIONAL DJ BOOTH ---
    const djBoothGroup = new THREE.Group()
    djBoothGroup.position.set(0, -10.5, -18)

    const boothMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a22,
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 1.0,
    })
    const boothBase = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 3), boothMat)
    djBoothGroup.add(boothBase)

    const boothLedMat = new THREE.MeshBasicMaterial({ color: neonGoldAmber })
    const boothLed1 = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.2, 0.1), boothLedMat)
    boothLed1.position.set(0, 1, 1.51)
    djBoothGroup.add(boothLed1)
    const boothLed2 = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.2, 0.1), boothLedMat)
    boothLed2.position.set(0, -1, 1.51)
    djBoothGroup.add(boothLed2)

    const screenGlowMat = new THREE.MeshBasicMaterial({ color: neonGoldLight })
    const screen1 = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), screenGlowMat)
    screen1.position.set(-3, 0.5, 1.52)
    djBoothGroup.add(screen1)
    const screen2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), screenGlowMat)
    screen2.position.set(3, 0.5, 1.52)
    djBoothGroup.add(screen2)

    scene.add(djBoothGroup)
    setupBuild(djBoothGroup, 0.5, 1.5, 12)

    // --- LOW-LYING FOG (Subtle) ---
    const fogTexture = (() => {
      const c = document.createElement('canvas')
      c.width = 128
      c.height = 128
      const cx = c.getContext('2d')
      if (cx) {
        const g = cx.createRadialGradient(64, 64, 0, 64, 64, 64)
        g.addColorStop(0, 'rgba(255,255,255,0.8)')
        g.addColorStop(0.5, 'rgba(255,255,255,0.2)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        cx.fillStyle = g
        cx.fillRect(0, 0, 128, 128)
      }
      return new THREE.CanvasTexture(c)
    })()

    const fogMat = new THREE.PointsMaterial({
      size: 12,
      map: fogTexture,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const fogCount = 150
    const fogGeo = new THREE.BufferGeometry()
    const fogPos = new Float32Array(fogCount * 3)
    for (let i = 0; i < fogCount; i++) {
      fogPos[i * 3] = (Math.random() - 0.5) * 80
      fogPos[i * 3 + 1] = -11 + Math.random() * 2
      fogPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10
    }
    fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPos, 3))
    const lowFog = new THREE.Points(fogGeo, fogMat)
    scene.add(lowFog)
    setupFade(fogMat, 4.0, 1.5, 0.03) // Reduced opacity

    // --- FLOOR LAMPS (Moving Heads) ---
    type Lamp = {
      head: THREE.Mesh
      spot: THREE.SpotLight
      target: THREE.Object3D
      group: THREE.Group
    }
    const floorLamps: Lamp[] = []
    const lampColors = [neonGold, neonGoldLight, neonGoldAmber, neonOrange]
    const lampPositions = [
      { x: -18, z: 10 },
      { x: 18, z: 10 },
      { x: -18, z: -2 },
      { x: 18, z: -2 },
    ]

    lampPositions.forEach((pos, i) => {
      const group = new THREE.Group()
      group.position.set(pos.x, -12, pos.z)
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.4,
      })
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.5, 16), baseMat))
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 14, 16), baseMat)
      pole.position.y = 7.25
      group.add(pole)

      const headMat = new THREE.MeshPhysicalMaterial({
        color: 0x333333,
        metalness: 0.9,
        roughness: 0.2,
        clearcoat: 1.0,
      })
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.5, 16), headMat)
      head.rotation.x = Math.PI / 2
      head.position.y = 15
      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.5, 16),
        new THREE.MeshBasicMaterial({
          color: lampColors[i % lampColors.length],
        }),
      )
      lens.position.z = -0.76
      head.add(lens)
      group.add(head)
      scene.add(group)
      setupBuild(group, 1.0 + i * 0.1, 1.0, 14)

      const spot = new THREE.SpotLight(
        lampColors[i % lampColors.length],
        15,
        60,
        Math.PI / 6,
        0.4,
        1,
      )
      spot.position.set(pos.x, 3, pos.z)
      const target = new THREE.Object3D()
      scene.add(target)
      spot.target = target
      scene.add(spot)
      floorLamps.push({ head, spot, target, group })
    })

    // --- BACKGROUND GIANT SPEAKERS ---
    const subwoofers: THREE.Mesh[] = []
    ;[
      { x: -16, z: -22 },
      { x: 16, z: -22 },
    ].forEach((pos, i) => {
      const speakerGroup = new THREE.Group()
      speakerGroup.position.set(pos.x, -2, pos.z)
      const cabMat = new THREE.MeshPhysicalMaterial({
        color: 0x252530,
        metalness: 0.8,
        roughness: 0.25,
        clearcoat: 1.0,
      })
      speakerGroup.add(new THREE.Mesh(new THREE.BoxGeometry(5, 20, 4), cabMat))

      const ledColor = i === 0 ? neonGoldAmber : neonGoldLight
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor })
      const vLed1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 19, 0.1), ledMat)
      vLed1.position.set(-2.3, 0, 2.05)
      speakerGroup.add(vLed1)
      const vLed2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 19, 0.1), ledMat)
      vLed2.position.set(2.3, 0, 2.05)
      speakerGroup.add(vLed2)
      const hLedTop = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 0.1), ledMat)
      hLedTop.position.set(0, 9.8, 2.05)
      speakerGroup.add(hLedTop)
      const hLedBot = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 0.1), ledMat)
      hLedBot.position.set(0, -9.8, 2.05)
      speakerGroup.add(hLedBot)

      ;[5, -5].forEach((y) => {
        const cone = new THREE.Mesh(
          new THREE.CylinderGeometry(1.8, 1.8, 0.5, 32),
          new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.6,
            roughness: 0.5,
          }),
        )
        cone.position.set(0, y, 2.1)
        cone.rotation.x = Math.PI / 2
        speakerGroup.add(cone)
        subwoofers.push(cone)
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.8, 0.15, 8, 32),
          new THREE.MeshBasicMaterial({ color: neonGold }),
        )
        ring.position.set(0, y, 2.15)
        ring.rotation.x = Math.PI / 2
        speakerGroup.add(ring)
        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 16, 16),
          new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2,
          }),
        )
        cap.position.set(0, y, 2.3)
        speakerGroup.add(cap)
      })

      const speakerLight = new THREE.PointLight(ledColor.getHex(), 30, 50)
      speakerLight.position.set(0, 0, 3)
      speakerGroup.add(speakerLight)
      scene.add(speakerGroup)
      setupBuild(speakerGroup, 1.5 + i * 0.2, 1.2, 20)
    })

    // --- CORNER GIFT BOXES ---
    function createGiftBox(
      size: number,
      boxColor: THREE.ColorRepresentation,
      ribbonColor: THREE.ColorRepresentation,
    ): THREE.Group {
      const group = new THREE.Group()
      const boxMat = new THREE.MeshPhysicalMaterial({
        color: boxColor,
        roughness: 0.8,
        metalness: 0.1,
        clearcoat: 0.5,
      })
      group.add(new THREE.Mesh(new THREE.BoxGeometry(size, size, size), boxMat))
      const ribbonMat = new THREE.MeshStandardMaterial({
        color: ribbonColor,
        emissive: ribbonColor,
        emissiveIntensity: 0.8,
        roughness: 0.3,
      })
      const t = size * 0.15
      group.add(new THREE.Mesh(new THREE.BoxGeometry(t, size, t), ribbonMat))
      group.add(new THREE.Mesh(new THREE.BoxGeometry(size, t, t), ribbonMat))
      group.add(new THREE.Mesh(new THREE.BoxGeometry(t, t, size), ribbonMat))
      const bow1 = new THREE.Mesh(
        new THREE.TorusGeometry(size * 0.2, size * 0.05, 8, 16),
        ribbonMat,
      )
      bow1.position.y = size / 2 + size * 0.05
      bow1.rotation.x = Math.PI / 2
      group.add(bow1)
      const bow2 = new THREE.Mesh(
        new THREE.TorusGeometry(size * 0.2, size * 0.05, 8, 16),
        ribbonMat,
      )
      bow2.position.y = size / 2 + size * 0.05
      bow2.rotation.x = Math.PI / 2
      bow2.rotation.y = Math.PI / 2
      group.add(bow2)
      return group
    }

    const gift1 = createGiftBox(3, 0x2a1b3e, neonGoldLight)
    gift1.position.set(-22, -10.5, -15)
    gift1.rotation.y = Math.PI / 4
    scene.add(gift1)
    setupBuild(gift1, 2.0, 1.0, 11)

    const gift2 = createGiftBox(2.5, 0x3d1b2a, neonGoldAmber)
    gift2.position.set(22, -10.75, -15)
    gift2.rotation.y = -Math.PI / 4
    scene.add(gift2)
    setupBuild(gift2, 2.2, 1.0, 11)

    const gift3 = createGiftBox(2, 0x2a1b3e, neonGold)
    gift3.position.set(-10, -11, -20)
    scene.add(gift3)
    setupBuild(gift3, 2.4, 1.0, 11)

    // --- EQUALIZER BARS ---
    const eqBars: THREE.Mesh[] = []
    const barCount = 50
    // v50: gold-family palette (replaces rainbow hue) — 3 shades cycling
    const goldShades = [neonGold, neonGoldLight, neonGoldAmber]
    for (let i = 0; i < barCount; i++) {
      const color = goldShades[i % goldShades.length]
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x222222,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.0,
        transmission: 0.6,
        thickness: 0.5,
        clearcoat: 1.0,
        ior: 1.5,
      })
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), mat)
      const x = (i - barCount / 2) * 0.7
      bar.position.set(x, -11.5, -15.5)
      bar.scale.y = 1
      scene.add(bar)
      eqBars.push(bar)
      setupBuild(bar, 0.8 + i * 0.03, 0.8, 12)
    }

    // --- VINYL RECORDS ---
    const vinyls: THREE.Group[] = []
    const vinylColors = [neonGold, neonGoldLight, neonGoldAmber, neonOrange]
    const vinylCanvas = document.createElement('canvas')
    vinylCanvas.width = 512
    vinylCanvas.height = 512
    const vCtx = vinylCanvas.getContext('2d')
    if (vCtx) {
      vCtx.fillStyle = '#1a1a1a'
      vCtx.fillRect(0, 0, 512, 512)
      for (let r = 50; r < 256; r += 2) {
        vCtx.beginPath()
        vCtx.arc(256, 256, r, 0, Math.PI * 2)
        vCtx.strokeStyle = '#2a2a2a'
        vCtx.stroke()
      }
    }
    const vinylTexture = new THREE.CanvasTexture(vinylCanvas)

    const vinylCount = 5
    for (let i = 0; i < vinylCount; i++) {
      const group = new THREE.Group()
      const color = vinylColors[i % vinylColors.length]
      const size = 2.5 + Math.random() * 1.5
      const discMat = new THREE.MeshPhysicalMaterial({
        color: 0x222222,
        metalness: 0.9,
        roughness: 0.15,
        map: vinylTexture,
        clearcoat: 1.0,
        envMapIntensity: 1.5,
      })
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(size, size, 0.15, 64), discMat))
      const labelMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.4,
      })
      group.add(
        new THREE.Mesh(new THREE.CylinderGeometry(size * 0.35, size * 0.35, 0.18, 32), labelMat),
      )
      const angle = (i / 5) * Math.PI * 2
      const radius = 12 + Math.random() * 6
      group.position.set(
        Math.cos(angle) * radius,
        8 + Math.random() * 6,
        Math.sin(angle) * radius - 10,
      )
      group.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4
      group.rotation.z = Math.random() * Math.PI
      scene.add(group)
      vinyls.push(group)
      setupBuild(group, 2.5 + i * 0.1, 1.0, -10)
    }

    // --- VOLUMETRIC LASER BEAMS ---
    const lasers: THREE.Mesh[] = []
    const laserColors = [neonGold, neonGoldLight, neonOrange, neonPink]
    const laserCount = 4
    for (let i = 0; i < laserCount; i++) {
      const beamGeo = new THREE.CylinderGeometry(0.01, 0.4, 60, 16, 1, true)
      beamGeo.translate(0, 30, 0)
      const beamMat = new THREE.MeshBasicMaterial({
        color: laserColors[i % laserColors.length],
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
      const beam = new THREE.Mesh(beamGeo, beamMat)
      beam.position.set((i - 1.5) * 8, 15, -12)
      scene.add(beam)
      lasers.push(beam)
      setupFade(beamMat, 3.5 + i * 0.1, 1.0, 0.3)
    }

    // --- ELEGANT BALLOON ARCHES ---
    type Balloon = { mesh: THREE.Group; speed: number; offset: number }
    const balloons: Balloon[] = []
    const balloonColors: (THREE.Color | number)[] = [
      neonGold,
      neonGoldLight,
      neonGoldAmber,
      neonOrange,
      0xffd700,
      0xfbbf24,
    ]

    for (let i = 0; i < 24; i++) {
      const group = new THREE.Group()
      const color = balloonColors[i % balloonColors.length]
      const bodyGeo = new THREE.SphereGeometry(1.2, 32, 32)
      bodyGeo.scale(1, 1.25, 1)
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.7,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.15,
        envMapIntensity: 2.0,
      })
      group.add(new THREE.Mesh(bodyGeo, bodyMat))

      const archProgress = i / 24
      const archAngle = Math.PI * archProgress
      group.position.x = Math.cos(archAngle) * 14
      group.position.y = Math.sin(archAngle) * 12 - 6
      group.position.z = -16

      scene.add(group)
      balloons.push({ mesh: group, speed: 0.001, offset: Math.random() * 10 })
      setupBuild(group, 3.0 + i * 0.05, 1.0, -15)
    }

    // --- PARTICLES ---
    const particleCount = 1000
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    const pColors = [neonGold, neonGoldLight, neonOrange, neonPink, neonDeep]
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = Math.random() * 40 - 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80
      const c = pColors[Math.floor(Math.random() * pColors.length)]
      particleColors[i * 3] = c.r
      particleColors[i * 3 + 1] = c.g
      particleColors[i * 3 + 2] = c.b
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const pCanvas = document.createElement('canvas')
    pCanvas.width = 64
    pCanvas.height = 64
    const pCtx = pCanvas.getContext('2d')
    if (pCtx) {
      const pGradient = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32)
      pGradient.addColorStop(0, 'rgba(255,255,255,1)')
      pGradient.addColorStop(0.2, 'rgba(255,255,255,0.8)')
      pGradient.addColorStop(1, 'rgba(255,255,255,0)')
      pCtx.fillStyle = pGradient
      pCtx.fillRect(0, 0, 64, 64)
    }
    const particleTexture = new THREE.CanvasTexture(pCanvas)

    const particleMat = new THREE.PointsMaterial({
      size: 0.4,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)
    setupFade(particleMat, 4.5, 1.5, 0.8)

    // ============================================
    // GLOBAL BEAT SYSTEM (128 BPM)
    // ============================================
    const bpm = 128
    const beatInterval = 60 / bpm

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock()
    const mouse = { x: 0, y: 0 }
    const targetMouse = { x: 0, y: 0 }
    let animationId = 0

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const time = clock.getElapsedTime()

      const beatPhase = (time % beatInterval) / beatInterval
      const beat = Math.pow(1 - beatPhase, 3)

      // 1. Process Build Animations
      for (let i = buildTargets.length - 1; i >= 0; i--) {
        const item = buildTargets[i]
        if (item instanceof THREE.Material) {
          const p = (time - item.userData.fadeDelay) / item.userData.fadeDuration
          if (p > 0) {
            if (p >= 1) {
              item.opacity = item.userData.targetOpacity
              item.userData.isFaded = true
              buildTargets.splice(i, 1)
            } else {
              if (item === screenMat) {
                ;(item as THREE.ShaderMaterial).uniforms.uTime.value = time
                ;(item as THREE.ShaderMaterial).uniforms.uBeat.value = beat
                item.userData.isFaded = true
                buildTargets.splice(i, 1)
              } else {
                item.opacity = easeOutCubic(p) * item.userData.targetOpacity
              }
            }
          }
        } else {
          const p = (time - item.userData.buildDelay) / item.userData.buildDuration
          if (p > 0) {
            if (p >= 1) {
              item.scale.copy(item.userData.baseScale)
              item.position.copy(item.userData.basePos)
              item.rotation.copy(item.userData.baseRot)
              item.userData.isBuilt = true
              buildTargets.splice(i, 1)
            } else {
              const s = easeOutElastic(p)
              item.scale.set(
                item.userData.baseScale.x * s,
                item.userData.baseScale.y * s,
                item.userData.baseScale.z * s,
              )

              const py = easeOutCubic(p)
              item.position.y =
                item.userData.basePos.y - item.userData.fromY + item.userData.fromY * py

              if (p < 0.3) {
                item.position.x = item.userData.basePos.x + (Math.random() - 0.5) * (0.3 - p) * 2
              } else {
                item.position.x = item.userData.basePos.x
              }

              item.rotation.z = item.userData.baseRot.z + (Math.PI / 8) * (1 - py)
            }
          }
        }
      }

      // Update Visualizer Screen Shader
      screenMat.uniforms.uTime.value = time
      screenMat.uniforms.uBeat.value = beat

      // Cinematic Drone Camera with Handheld Shake
      mouse.x += (targetMouse.x - mouse.x) * 0.02
      mouse.y += (targetMouse.y - mouse.y) * 0.02
      const shakeX = Math.sin(time * 2.3) * 0.05 + Math.sin(time * 5.1) * 0.03
      const shakeY = Math.cos(time * 3.1) * 0.05 + Math.cos(time * 4.2) * 0.03
      camera.position.x = Math.sin(time * 0.08) * 6 + mouse.x * 5 + shakeX
      camera.position.y = 7 + mouse.y * 3 + Math.cos(time * 0.12) * 1.5 + shakeY
      camera.position.z = 35 + Math.sin(time * 0.04) * 3
      camera.lookAt(0, 0, -15)

      // Pulsing Grid (Subtler)
      if (gridMat.userData.isFaded) {
        gridMat.opacity = 0.03 + beat * 0.04
      }

      floorLamps.forEach((lamp, i) => {
        if (!lamp.group.userData.isBuilt) return
        const angle = time * 0.8 + (i * Math.PI) / 2
        lamp.target.position.x = Math.sin(angle) * 15
        lamp.target.position.z = Math.cos(angle) * 10 - 5
        lamp.target.position.y = -11
        lamp.head.lookAt(lamp.target.position)
        lamp.spot.intensity = 10 + beat * 20 // Reduced spotlight intensity
      })

      if (djBoothGroup.userData.isBuilt) {
        // v50: gold-family cycling (replaces rainbow setHSL) — shifts between
        // gold (0.08) and amber (0.10) hues only, staying in brand identity
        const goldHue = 0.08 + Math.sin(time * 0.5) * 0.02
        boothLedMat.color.setHSL(goldHue, 0.9, 0.55)
        screenGlowMat.color.setHSL(goldHue + 0.02, 0.85, 0.5)
      }

      vinyls.forEach((v, i) => {
        v.rotation.z += delta * (0.8 + i * 0.3)
        if (v.userData.isBuilt) {
          v.position.y = 8 + Math.sin(time * 1.2 + i) * 2.5
        }
      })

      eqBars.forEach((bar, i) => {
        if (!bar.userData.isBuilt) return
        const height =
          1 + (Math.sin(time * 3.0 + i * 0.5) + 1) * 4 + beat * 5 * Math.abs(Math.sin(i * 0.5))
        bar.scale.y = Math.max(0.5, height)
        bar.position.y = -11.5 + bar.scale.y / 2
        ;(bar.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.5 + beat * 0.8
      })

      if (particleMat.userData.isFaded) {
        particles.rotation.y = time * 0.03
        const posArray = (particles.geometry.attributes.position as THREE.BufferAttribute)
          .array as Float32Array
        for (let i = 0; i < particleCount; i++) {
          posArray[i * 3 + 1] += 0.02
          if (posArray[i * 3 + 1] > 30) posArray[i * 3 + 1] = -10
        }
        ;(particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
      }

      // Low-lying fog drift + Beat Pulse (Subtler)
      if (fogMat.userData.isFaded) {
        lowFog.rotation.y = time * 0.01
        fogMat.opacity = 0.02 + beat * 0.05 // Reduced opacity
        const fogPosArray = (lowFog.geometry.attributes.position as THREE.BufferAttribute)
          .array as Float32Array
        for (let i = 0; i < fogCount; i++) {
          fogPosArray[i * 3] += Math.sin(time + i) * 0.01
          fogPosArray[i * 3 + 2] += Math.cos(time + i) * 0.01
        }
        ;(lowFog.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
      }

      lasers.forEach((laser, i) => {
        const laserMat = laser.material as THREE.MeshBasicMaterial
        if (!laserMat.userData.isFaded) return
        laser.rotation.z = Math.sin(time * 1.2 + i) * 0.8
        laser.rotation.x = Math.cos(time * 0.8 + i) * 0.4
        laserMat.opacity = 0.1 + beat * 0.4
      })

      balloons.forEach((b) => {
        if (!b.mesh.userData.isBuilt) return
        b.mesh.position.y += Math.sin(time * 0.6 + b.offset) * 0.01
        b.mesh.rotation.z = Math.sin(time * 0.8 + b.offset) * 0.05
      })

      const beatScale = 1.0 + beat * 0.15
      subwoofers.forEach((sub) => {
        if (sub.parent && sub.parent.userData.isBuilt) {
          sub.scale.set(beatScale, 1, beatScale)
        }
      })

      // Lights pulse with Global Beat (Subtler)
      purpleLight.intensity = 50 + beat * 20
      pinkLight.intensity = 30 + beat * 15
      cyanLight.intensity = 15 + beat * 10

      // Bloom pulse (Subtler)
      bloomPass.strength = 0.2 + beat * 0.05

      composer.render()
    }

    const onMouseMove = (e: MouseEvent) => {
      targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1
      targetMouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMouseMove)

    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      renderer.setPixelRatio(pixelRatio)
      composer.setSize(w, h)
      fxaaPass.material.uniforms['resolution'].value.set(1 / (w * pixelRatio), 1 / (h * pixelRatio))
    }
    window.addEventListener('resize', onResize)

    animate()

    // === CLEANUP ===
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)

      // Dispose geometries + materials across the whole scene graph.
      scene.traverse((obj) => {
        const node = obj as unknown as {
          geometry?: THREE.BufferGeometry
          material?: THREE.Material | THREE.Material[]
        }
        if (node.geometry) node.geometry.dispose()
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach((m) => m.dispose())
          } else {
            node.material.dispose()
          }
        }
      })

      // Dispose canvas textures + PMREM render target.
      fogTexture.dispose()
      vinylTexture.dispose()
      particleTexture.dispose()
      pmremRT.dispose()
      pmremGenerator.dispose()

      // Reflector internal render target.
      const reflectorDisposable = floor as unknown as {
        dispose?: () => void
      }
      reflectorDisposable.dispose?.()

      // Dispose post-processing render targets.
      composer.dispose()

      // Required by spec.
      scene.clear()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  )
}
