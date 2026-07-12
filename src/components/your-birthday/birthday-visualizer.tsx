'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { shouldEnable3D } from '@/lib/device-capabilities'

/**
 * BirthdayVisualizer — 3D celebration scene inspired by Abu Dhabi Sound Waves festival.
 * Features: Spinning vinyls, speakers, equalizer bars, stage lights, dance floor tiles, particles.
 * Uses Three.js vanilla (not R3F) for precise control over complex scene.
 *
 * Performance: shouldEnable3D() guard + IntersectionObserver + frameloop gating + dispose.
 */

/** Minimal structural type for the post-processing composer we use. */
type Composer = {
  render: () => void
  setSize: (w: number, h: number) => void
  addPass: (...args: never[]) => void
  dispose: () => void
}

export function BirthdayVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<Composer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const animationIdRef = useRef<number>(0)
  // Items pushed here are a mix of geometries/materials (which have dispose)
  // and meshes/groups/lights (which don't). The cleanup loop uses `'dispose' in d`
  // to narrow the union before calling dispose, mirroring the runtime guard.
  const disposablesRef = useRef<Array<THREE.BufferGeometry | THREE.Material | THREE.Object3D>>([])

  // Enable 3D only on capable devices
  useEffect(() => {
    setEnabled(shouldEnable3D())
  }, [])

  // Main 3D setup — runs ONCE when enabled.
  // An IntersectionObserver inside this effect pauses/resumes the
  // requestAnimationFrame loop without tearing down the scene.
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const isMobile = window.innerWidth < 768

    // Read neon brand palette from CSS variables (single source of truth —
    // see :root[data-brand="birthday"] in globals.css). Three.js accepts
    // hex strings as ColorRepresentation, so we resolve the CSS vars once
    // at scene init and pass the resulting strings into the materials/
    // lights. Fallbacks keep the visual identical if the var is missing.
    const computedStyle = getComputedStyle(document.documentElement)
    const brandVar = (name: string, fallback: string) => {
      const v = computedStyle.getPropertyValue(name).trim()
      return v || fallback
    }
    const birthdayBg = brandVar('--c-birthday-bg', '#020204')
    const birthdayPurple = brandVar('--c-birthday-purple', '#8B5CF6')
    const birthdayPink = brandVar('--c-birthday-pink', '#EC4899')
    const birthdayCyan = brandVar('--c-birthday-cyan', '#00F3FF')
    const birthdayOrange = brandVar('--c-birthday-orange', '#F97316')

    // === SCENE ===
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(birthdayBg, 0.012)
    scene.background = new THREE.Color(birthdayBg)
    sceneRef.current = scene

    // === CAMERA ===
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 5, 35)

    // === RENDERER ===
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile, // Disable AA on mobile for performance
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // === POST PROCESSING (Bloom) — desktop only ===
    let composer: Composer | null = null
    if (!isMobile) {
      try {
        composer = new EffectComposer(renderer) as Composer
        const renderPass = new RenderPass(scene, camera)
        composer.addPass(renderPass as unknown as never)
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(container.clientWidth, container.clientHeight),
          1.8,  // strength
          0.4,  // radius
          0.7   // threshold
        )
        composer.addPass(bloomPass as unknown as never)
        composerRef.current = composer
      } catch (err) {
        console.warn('Failed to initialize UnrealBloomPass, falling back to standard renderer:', err)
        composer = null
      }
    }

    // === LIGHTING ===
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.5)
    scene.add(ambientLight)
    disposablesRef.current.push(ambientLight)

    // Colored point lights for party atmosphere
    const purpleLight = new THREE.PointLight(birthdayPurple, 120, 100)
    purpleLight.position.set(-20, 15, 10)
    scene.add(purpleLight)

    const pinkLight = new THREE.PointLight(birthdayPink, 100, 100)
    pinkLight.position.set(20, 10, 15)
    scene.add(pinkLight)

    const cyanLight = new THREE.PointLight(birthdayCyan, 80, 80)
    cyanLight.position.set(0, -5, 20)
    scene.add(cyanLight)

    const orangeLight = new THREE.PointLight(birthdayOrange, 60, 80)
    orangeLight.position.set(10, 20, -10)
    scene.add(orangeLight)
    disposablesRef.current.push(purpleLight, pinkLight, cyanLight, orangeLight)

    // === VINYL RECORDS (spinning) ===
    const vinyls: THREE.Group[] = []
    const vinylColors = [birthdayPurple, birthdayPink, birthdayCyan, birthdayOrange]
    const vinylCount = isMobile ? 2 : 4

    for (let i = 0; i < vinylCount; i++) {
      const group = new THREE.Group()
      const color = vinylColors[i % vinylColors.length]
      const size = 2 + Math.random() * 1.5

      // Disc
      const discGeo = new THREE.CylinderGeometry(size, size, 0.1, 32)
      const discMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.95, roughness: 0.1 })
      const disc = new THREE.Mesh(discGeo, discMat)
      group.add(disc)

      // Label (colored center)
      const labelGeo = new THREE.CylinderGeometry(size * 0.3, size * 0.3, 0.12, 16)
      const labelMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.3 })
      const label = new THREE.Mesh(labelGeo, labelMat)
      group.add(label)

      // Position around the scene
      const angle = (i / vinylCount) * Math.PI * 2
      const radius = 15 + Math.random() * 5
      group.position.set(Math.cos(angle) * radius, 5 + Math.random() * 10, Math.sin(angle) * radius - 10)
      group.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3
      group.rotation.z = Math.random() * Math.PI

      scene.add(group)
      vinyls.push(group)
      disposablesRef.current.push(discGeo, discMat, labelGeo, labelMat, group)
    }

    // === EQUALIZER BARS ===
    const eqBars: THREE.Mesh[] = []
    const barCount = isMobile ? 16 : 32
    const barGeo = new THREE.BoxGeometry(0.5, 1, 0.5)

    for (let i = 0; i < barCount; i++) {
      const hue = (i / barCount) * 360
      const color = new THREE.Color(`hsl(${hue}, 100%, 60%)`)
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
      const bar = new THREE.Mesh(barGeo, mat)
      const x = (i - barCount / 2) * 1.0
      bar.position.set(x, -8, -10)
      bar.scale.y = 1
      scene.add(bar)
      eqBars.push(bar)
      disposablesRef.current.push(mat, bar)
    }
    disposablesRef.current.push(barGeo)

    // === DANCE FLOOR TILES ===
    const tiles: THREE.Mesh[] = []
    const tileSize = 2.5
    const gridSize = isMobile ? 4 : 6

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const tileGeo = new THREE.PlaneGeometry(tileSize * 0.9, tileSize * 0.9)
        const hue = Math.random() * 360
        const color = new THREE.Color(`hsl(${hue}, 80%, 50%)`)
        const tileMat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.2,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        })
        const tile = new THREE.Mesh(tileGeo, tileMat)
        tile.position.set(
          (x - gridSize / 2) * tileSize,
          -12,
          (z - gridSize / 2) * tileSize - 5
        )
        tile.rotation.x = -Math.PI / 2
        scene.add(tile)
        tiles.push(tile)
        disposablesRef.current.push(tileGeo, tileMat, tile)
      }
    }

    // === PARTICLES (floating celebration) ===
    const particleCount = isMobile ? 150 : 350
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60

      const hue = Math.random()
      if (hue < 0.25) {
        particleColors[i * 3] = 0.55; particleColors[i * 3 + 1] = 0.36; particleColors[i * 3 + 2] = 0.96
      } else if (hue < 0.5) {
        particleColors[i * 3] = 0.92; particleColors[i * 3 + 1] = 0.28; particleColors[i * 3 + 2] = 0.6
      } else if (hue < 0.75) {
        particleColors[i * 3] = 0; particleColors[i * 3 + 1] = 0.95; particleColors[i * 3 + 2] = 1
      } else {
        particleColors[i * 3] = 0.98; particleColors[i * 3 + 1] = 0.45; particleColors[i * 3 + 2] = 0.09
      }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))
    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)
    disposablesRef.current.push(particleGeo, particleMat, particles)

    // === STAGE LIGHTS (cones) ===
    const stageLights: THREE.SpotLight[] = []
    const stageLightTargets: THREE.Object3D[] = []
    const lightColors = [birthdayPurple, birthdayPink, birthdayCyan, birthdayOrange]
    for (let i = 0; i < (isMobile ? 2 : 4); i++) {
      const spot = new THREE.SpotLight(lightColors[i % lightColors.length], 50, 60, 0.4, 0.5, 1)
      spot.position.set((i - (isMobile ? 0.5 : 1.5)) * 10, 20, -5)

      const targetObj = new THREE.Object3D()
      targetObj.position.set((i - (isMobile ? 0.5 : 1.5)) * 5, -10, -5)
      scene.add(targetObj)

      spot.target = targetObj
      scene.add(spot)

      stageLights.push(spot)
      stageLightTargets.push(targetObj)
      disposablesRef.current.push(spot, targetObj)
    }

    // === DYNAMIC STAGE SPEAKERS ===
    const subwoofers: THREE.Mesh[] = []
    const speakerPositions = [
      { x: -16, y: -9, z: -8 },
      { x: 16, y: -9, z: -8 },
    ]

    speakerPositions.forEach((pos) => {
      const speakerGroup = new THREE.Group()
      speakerGroup.position.set(pos.x, pos.y, pos.z)

      // Cabinet
      const cabinetGeo = new THREE.BoxGeometry(3.5, 7, 3)
      const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, metalness: 0.9, roughness: 0.2 })
      const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat)
      speakerGroup.add(cabinet)

      // Add two subwoofers inside each cabinet
      const conePositions = [-1.8, 1.8]
      conePositions.forEach((yOffset) => {
        const coneGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 32)
        const coneMat = new THREE.MeshStandardMaterial({ color: 0x1f1f24, metalness: 0.4, roughness: 0.6 })
        const cone = new THREE.Mesh(coneGeo, coneMat)
        cone.position.set(0, yOffset, 1.4)
        cone.rotation.x = Math.PI / 2
        speakerGroup.add(cone)
        subwoofers.push(cone)
        disposablesRef.current.push(coneGeo, coneMat, cone)

        // Center cap
        const capGeo = new THREE.SphereGeometry(0.4, 16, 16)
        const capMat = new THREE.MeshStandardMaterial({ color: birthdayPink, emissive: birthdayPink, emissiveIntensity: 0.5 })
        const cap = new THREE.Mesh(capGeo, capMat)
        cap.position.set(0, yOffset, 1.6)
        speakerGroup.add(cap)
        disposablesRef.current.push(capGeo, capMat, cap)
      })

      scene.add(speakerGroup)
      disposablesRef.current.push(cabinetGeo, cabinetMat, cabinet, speakerGroup)
    })

    // === FLOATING METALLIC BALLOONS ===
    const balloons: THREE.Group[] = []
    const balloonColors = [birthdayPurple, birthdayPink, birthdayCyan, birthdayOrange, 0xEF4444, 0x10B981]
    const balloonCount = isMobile ? 4 : 8

    for (let i = 0; i < balloonCount; i++) {
      const group = new THREE.Group()
      const color = balloonColors[i % balloonColors.length]

      // Balloon body (egg shape)
      const bodyGeo = new THREE.SphereGeometry(1.2, 16, 16)
      bodyGeo.scale(1, 1.3, 1)
      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.8,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.2
      })
      const body = new THREE.Mesh(bodyGeo, bodyMat)
      group.add(body)

      // Balloon tie at bottom
      const tieGeo = new THREE.ConeGeometry(0.18, 0.3, 8)
      const tie = new THREE.Mesh(tieGeo, bodyMat)
      tie.position.y = -1.6
      tie.rotation.z = Math.PI
      group.add(tie)

      // Balloon string (Wavy line)
      const stringPoints: THREE.Vector3[] = []
      for (let j = 0; j <= 8; j++) {
        stringPoints.push(new THREE.Vector3(Math.sin(j * 0.6) * 0.08, -1.6 - j * 0.5, 0))
      }
      const stringGeo = new THREE.BufferGeometry().setFromPoints(stringPoints)
      const stringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
      const line = new THREE.Line(stringGeo, stringMat)
      group.add(line)

      // Position
      const x = (Math.random() - 0.5) * 44
      const y = -10 + Math.random() * 25
      const z = -15 + Math.random() * 15
      group.position.set(x, y, z)

      scene.add(group)
      balloons.push(group)
      disposablesRef.current.push(bodyGeo, bodyMat, tieGeo, stringGeo, stringMat, group)
    }

    // === STAGE LASER BEAMS ===
    const lasers: THREE.Mesh[] = []
    const laserMatList: THREE.MeshBasicMaterial[] = []
    const laserColors = [birthdayCyan, birthdayPink]

    for (let i = 0; i < 2; i++) {
      // Stand
      const standGeo = new THREE.CylinderGeometry(0.2, 0.4, 5, 8)
      const standMat = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8 })
      const stand = new THREE.Mesh(standGeo, standMat)
      stand.position.set(i === 0 ? -18 : 18, -10, -5)
      scene.add(stand)
      disposablesRef.current.push(standGeo, standMat, stand)

      // Long glowing laser beam
      const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 80, 8)
      beamGeo.translate(0, 40, 0) // shift pivot
      const beamColor = laserColors[i % laserColors.length]
      const beamMat = new THREE.MeshBasicMaterial({
        color: beamColor,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
      })
      const beam = new THREE.Mesh(beamGeo, beamMat)
      beam.position.set(i === 0 ? -18 : 18, -7.5, -5)

      scene.add(beam)
      lasers.push(beam)
      laserMatList.push(beamMat)
      disposablesRef.current.push(beamGeo, beamMat, beam)
    }

    // === GIANT CELEBRATION RING ===
    const ringGeo = new THREE.TorusGeometry(18, 0.5, 16, 100)
    const ringMat = new THREE.MeshStandardMaterial({
      color: birthdayPurple,
      emissive: birthdayPurple,
      emissiveIntensity: 1.5,
      metalness: 0.2,
      roughness: 0.2,
    })
    const celebrationRing = new THREE.Mesh(ringGeo, ringMat)
    celebrationRing.position.set(0, 0, -22)
    scene.add(celebrationRing)
    disposablesRef.current.push(ringGeo, ringMat, celebrationRing)

    // === ANIMATION LOOP ===
    const clock = new THREE.Clock()
    const mouse = { x: 0, y: 0 }
    const targetMouse = { x: 0, y: 0 }

    // Pause/resume via IntersectionObserver WITHOUT tearing down the scene.
    // When the canvas scrolls off-screen we cancel the in-flight rAF id so the
    // browser stops scheduling frames at all (the previous implementation kept
    // the rAF loop running and merely skipped the heavy work — still woke the
    // main thread ~60×/s). When the canvas scrolls back into view we restart
    // the loop and reset the clock so animations don't jump.
    let isInView = true

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      // NOTE: getDelta() must be called BEFORE getElapsedTime() —
      // getElapsedTime() internally calls getDelta(), so calling it first
      // would make the subsequent getDelta() return ~0.
      const delta = clock.getDelta()
      const time = clock.elapsedTime

      // Smooth mouse
      mouse.x += (targetMouse.x - mouse.x) * 0.05
      mouse.y += (targetMouse.y - mouse.y) * 0.05

      // Camera subtle movement
      camera.position.x = mouse.x * 3
      camera.position.y = 5 + mouse.y * 2
      camera.lookAt(0, 0, -5)

      // Spin vinyls
      vinyls.forEach((v, i) => {
        v.rotation.z += delta * (0.6 + i * 0.2)
        v.position.y = 4 + Math.sin(time * 1.5 + i) * 2.5
      })

      // Equalizer bars (simulated audio)
      eqBars.forEach((bar, i) => {
        const height = 1 + Math.sin(time * 3.5 + i * 0.4) * 3.5 + Math.cos(time * 1.5 + i * 0.2) * 1.5
        bar.scale.y = Math.max(0.5, height)
        bar.position.y = -8 + bar.scale.y / 2
      })

      // Dance floor tiles pulse
      tiles.forEach((tile, i) => {
        const pulse = Math.sin(time * 3 + i * 0.2) * 0.5 + 0.5
        ;(tile.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15 + pulse * 0.45
      })

      // Particles drift
      particles.rotation.y = time * 0.04
      particles.rotation.x = time * 0.015

      // Pulse speakers
      const beat = 1.0 + Math.sin(time * 6.0) * 0.12
      subwoofers.forEach((sub) => {
        sub.scale.set(beat, 1, beat)
      })

      // Float balloons
      balloons.forEach((b, i) => {
        b.position.y += Math.sin(time * 0.6 + i) * 0.015
        b.position.x += Math.cos(time * 0.4 + i) * 0.008
        b.rotation.z = Math.sin(time * 0.8 + i) * 0.04
        b.rotation.y = Math.cos(time * 0.5 + i) * 0.04
      })

      // Swing laser beams
      lasers.forEach((laser, i) => {
        if (i === 0) {
          laser.rotation.z = Math.sin(time * 0.7) * 0.4 - 0.5
          laser.rotation.x = Math.cos(time * 0.4) * 0.2
        } else {
          laser.rotation.z = -Math.sin(time * 0.7) * 0.4 + 0.5
          laser.rotation.x = Math.sin(time * 0.4) * 0.2
        }
        laserMatList[i].opacity = 0.25 + Math.sin(time * 4 + i) * 0.1 + 0.1
      })

      // Rotate and color cycle celebration ring
      celebrationRing.rotation.z = time * 0.08
      const ringHue = (time * 12) % 360
      ringMat.color.setHSL(ringHue / 360, 1, 0.5)
      ringMat.emissive.setHSL(ringHue / 360, 1, 0.5)
      ringMat.emissiveIntensity = 1.2 + Math.sin(time * 5.0) * 0.5

      // Stage lights sweep
      stageLights.forEach((light, i) => {
        const target = stageLightTargets[i]
        if (target) {
          target.position.x = Math.sin(time * 0.8 + i) * 12
          target.position.z = Math.cos(time * 0.8 + i) * 8 - 5
        }
      })

      // Render
      if (composer) {
        composer.render()
      } else {
        renderer.render(scene, camera)
      }
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      const wasInView = isInView
      isInView = entry.isIntersecting
      if (isInView && !wasInView) {
        // Resumed — restart the rAF loop (was cancelled when off-screen).
        // Reset the clock so animations don't lurch forward by the time
        // the user spent scrolled away.
        clock.getDelta()
        animate()
      } else if (!isInView && wasInView) {
        // Paused — cancel the in-flight rAF so the main thread can sleep.
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = 0
      }
    }, { threshold: 0.01 })
    visibilityObserver.observe(container)

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      targetMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      targetMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove)

    animate()

    // === RESIZE HANDLER (debounced) ===
    let resizeTimer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (!containerRef.current) return
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
        if (composer) composer.setSize(w, h)
      }, 250)
    }
    window.addEventListener('resize', onResize)

    // === CLEANUP ===
    return () => {
      cancelAnimationFrame(animationIdRef.current)
      visibilityObserver.disconnect()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)

      // Dispose all resources (only geometries/materials actually have dispose —
      // meshes/groups/lights are skipped via the `'dispose' in d` narrowing).
      disposablesRef.current.forEach((d) => {
        if (d && 'dispose' in d && typeof d.dispose === 'function') d.dispose()
      })
      disposablesRef.current = []

      // Remove canvas
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      if (composerRef.current) { composerRef.current.dispose(); composerRef.current = null }
      renderer.dispose()

      // Clear refs
      rendererRef.current = null
      composerRef.current = null
      sceneRef.current = null
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}
