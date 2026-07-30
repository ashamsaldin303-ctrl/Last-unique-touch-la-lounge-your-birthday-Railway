'use client'
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getDeviceTier, isReducedMotion, type DeviceTier } from '@/lib/device-capabilities'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Birthday3DBackground — "Enchanted Celebration" (v2, detail-enriched).
 *
 * Original Three.js celebration scene in the 4 brand colors
 * (gold #FFCC00 + purple #4A235A + pink #FFB6C1 + red #E32636).
 *
 * v2 detail pass — every element refined for realism & precision:
 *  - Cake: gold cake board + frosting normal/rough canvas texture + piped
 *    beadwork (InstancedMesh of small spheres, multiple rows) + varied-length
 *    drip icing + sugar-rose decorations + gold pillars between tiers +
 *    teardrop candle flames with additive glow-halo sprites.
 *  - Balloons: string tails + knotted bases + stronger specular highlights.
 *  - Gifts: canvas wrapping-paper patterns (polka/stripes) + multi-loop bows
 *    (3 torus knots) + name tags.
 *  - Backdrop: deeper sinusoidal curtain folds + top valance/swag + richer
 *    sheen.
 *  - Confetti: varied shapes (rect / star / heart / circle) via a sprite
 *    atlas, with rotation + size variation.
 *  - Floor: scattered petal InstancedMesh + a larger faint gold radial
 *    concentric-ring pattern under the cake.
 *  - Lighting: a soft volumetric spotlight cone on the cake + a rim back
 *    light for separation.
 *
 * Depth layers (back → front):
 *  FAR  — fog + velvet cyclorama (curtain folds + valance) + 3 light shafts
 *  MID  — grand 3-tier cake (centerpiece) + 7 orbiting gifts + 3 flowing silk
 *         ribbon streamers (migrating wave) + spinning vinyl record with
 *         tonearm + floating 3D music notes + 2 speaker towers (back corners)
 *         + 2 light stands/tripods (sides) + overhead balloon garland
 *  NEAR — floating lanterns + multi-shape confetti + sparkles + bokeh +
 *         wish-sparkles (from candles) + floating hearts
 *  FLOOR— reflective Reflector + gold rings + scattered petals
 *
 * Motion: ~70 BPM heartbeat pulse. Cinematic build-in.
 *
 * SCROLL-REACTIVE CINEMATIC JOURNEY — scrolling drives a damped "dive into
 * the celebration": the camera dollies toward + rises above the cake (with a
 * subtle orbit for parallax), the cake rotates to reveal its back, balloons
 * release upward, lanterns accelerate, confetti densifies + swirls, and
 * bloom + light swell toward mid-scroll (celebration peak) then settle.
 * All decor elements (gifts, vinyls, notes, ribbons) are ALWAYS VISIBLE
 * (present from entry) — scroll just adds a gentle "energy" speed-up so they
 * move a touch faster, never fly in/out. Drift/shake dampens at close-up.
 *
 * "MAKE A WISH" CLIMAX — a gaussian scroll-peak at sp≈0.75 (camera leaned-in):
 * candle flames stretch taller + flare brighter, golden wish-sparkles stream
 * upward from each candle, hearts glow, the cake spotlight warms toward gold,
 * and bloom swells. The emotional climax of the scroll.
 *
 * Mobile perf: tier scaling (low skips 3D; mid renders EVERY frame at 60fps
 * with reduced counts for buttery smoothness; high full @ 60fps).
 * InstancedMesh for repeated decor (beadwork, petals). Pauses rAF when tab
 * hidden. Full disposal on unmount (Strict Mode safe).
 */

type RenderConfig = {
  pixelRatio: number
  giftCount: number
  balloonCount: number
  lanternCount: number
  ribbonCount: number
  ribbonSegments: number
  noteCount: number
  showVinyl: boolean
  confettiCount: number
  sparkleCount: number
  bokehCount: number
  candleCount: number
  petalCount: number
  beadRows: number // beadwork rows per tier
  wishSparkleCount: number // golden sparkles rising from each candle
  heartCount: number // floating 3D heart sprites
  frameSkip: number
  bloomStrength: number
  bloomRadius: number
  exposure: number
}

const TIER_CONFIG: Record<DeviceTier, RenderConfig> = {
  low: {
    pixelRatio: 1.0, giftCount: 0, balloonCount: 0, lanternCount: 0,
    ribbonCount: 0, ribbonSegments: 0, noteCount: 0, showVinyl: false, confettiCount: 0, sparkleCount: 0, bokehCount: 0,
    candleCount: 0, petalCount: 0, beadRows: 0, wishSparkleCount: 0, heartCount: 0, frameSkip: 2,
    bloomStrength: 0.1, bloomRadius: 0.4, exposure: 0.95,
  },
  // mid (mobile): pixelRatio 2.0 for full quality (lag fixed via render optimization), but TRIMMED element counts
  // + frameSkip 2 (30fps render) to avoid lag. The scene stays crisp but
  // lighter — fewer balloons/confetti/petals/sparkles so the GPU isn't
  // overwhelmed on a 390px phone.
  mid: {
    pixelRatio: 2.0, giftCount: 3, balloonCount: 10, lanternCount: 3,
    ribbonCount: 2, ribbonSegments: 90, noteCount: 3, showVinyl: true,
    confettiCount: 60, sparkleCount: 5, bokehCount: 3,
    candleCount: 5, petalCount: 8, beadRows: 1, wishSparkleCount: 20, heartCount: 2, frameSkip: 2,
    bloomStrength: 0.12, bloomRadius: 0.45, exposure: 0.87,
  },
  high: {
    pixelRatio: 2.0, giftCount: 5, balloonCount: 30, lanternCount: 10,
    ribbonCount: 3, ribbonSegments: 200, noteCount: 5, showVinyl: true, confettiCount: 300, sparkleCount: 18, bokehCount: 10,
    candleCount: 7, petalCount: 40, beadRows: 2, wishSparkleCount: 70, heartCount: 5, frameSkip: 1,
    bloomStrength: 0.16, bloomRadius: 0.55, exposure: 0.86,
  },
}

// ---- Reusable canvas-texture generators ----

function makeFrostingTexture(): THREE.CanvasTexture {
  // Subtle frosting surface: cream base + fine noise bumps for roughness/normal feel.
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const cx = c.getContext('2d')!
  cx.fillStyle = '#FDF6E3'
  cx.fillRect(0, 0, 256, 256)
  // fine grain noise
  const img = cx.getImageData(0, 0, 256, 256)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 22
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n))
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n))
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n))
  }
  cx.putImageData(img, 0, 0)
  // a few subtle swirl strokes
  cx.globalAlpha = 0.12
  for (let i = 0; i < 6; i++) {
    cx.strokeStyle = i % 2 ? '#FFE7A0' : '#FFFFFF'
    cx.lineWidth = 2
    cx.beginPath()
    const x = Math.random() * 256, y = Math.random() * 256
    cx.arc(x, y, 10 + Math.random() * 20, 0, Math.PI * 2)
    cx.stroke()
  }
  cx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

function makeWrappingTexture(kind: 'polka' | 'stripes' | 'damask', base: string, accent: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const cx = c.getContext('2d')!
  cx.fillStyle = base
  cx.fillRect(0, 0, 128, 128)
  if (kind === 'polka') {
    cx.fillStyle = accent
    for (let y = 8; y < 128; y += 22) {
      for (let x = 8; x < 128; x += 22) {
        cx.beginPath()
        cx.arc(x + ((y / 22) % 2) * 11, y, 5, 0, Math.PI * 2)
        cx.fill()
      }
    }
  } else if (kind === 'stripes') {
    cx.fillStyle = accent
    for (let i = 0; i < 128; i += 16) cx.fillRect(i, 0, 8, 128)
  } else {
    // damask — simple diamond lattice
    cx.strokeStyle = accent
    cx.lineWidth = 2
    for (let i = -128; i < 256; i += 24) {
      cx.beginPath(); cx.moveTo(i, 0); cx.lineTo(i + 128, 128); cx.stroke()
      cx.beginPath(); cx.moveTo(i + 128, 0); cx.lineTo(i, 128); cx.stroke()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

function makeConfettiAtlas(): THREE.CanvasTexture {
  // 2x2 atlas: rect, star, heart, circle
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const cx = c.getContext('2d')!
  cx.clearRect(0, 0, 128, 128)
  // cell 0 (0,0,64,64) = rectangle (white block)
  cx.fillStyle = '#fff'
  cx.fillRect(20, 26, 24, 12)
  // cell 1 (64,0,64,64) = star
  cx.fillStyle = '#fff'
  cx.translate(96, 32)
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 16 : 7
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r, y = Math.sin(a) * r
    if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y)
  }
  cx.closePath(); cx.fill()
  cx.setTransform(1, 0, 0, 1, 0, 0)
  // cell 2 (0,64,64,64) = heart
  cx.fillStyle = '#fff'
  cx.translate(32, 96)
  cx.beginPath()
  cx.moveTo(0, 6)
  cx.bezierCurveTo(0, -4, -16, -4, -16, 6)
  cx.bezierCurveTo(-16, 14, 0, 20, 0, 24)
  cx.bezierCurveTo(0, 20, 16, 14, 16, 6)
  cx.bezierCurveTo(16, -4, 0, -4, 0, 6)
  cx.fill()
  cx.setTransform(1, 0, 0, 1, 0, 0)
  // cell 3 (64,64,64,64) = circle
  cx.beginPath()
  cx.arc(96, 96, 12, 0, Math.PI * 2)
  cx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

// Soft golden radial sprite texture for wish-sparkles.
function makeSparkleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 64; c.height = 64
  const cx = c.getContext('2d')!
  const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,210,1)')
  g.addColorStop(0.25, 'rgba(255,220,120,0.7)')
  g.addColorStop(1, 'rgba(255,200,90,0)')
  cx.fillStyle = g; cx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

// Heart-shaped sprite texture for floating hearts.
function makeHeartTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 128
  const cx = c.getContext('2d')!
  cx.translate(64, 70)
  cx.fillStyle = '#fff'
  cx.beginPath()
  cx.moveTo(0, 12)
  cx.bezierCurveTo(0, -8, -36, -8, -36, 14)
  cx.bezierCurveTo(-36, 32, 0, 44, 0, 50)
  cx.bezierCurveTo(0, 44, 36, 32, 36, 14)
  cx.bezierCurveTo(36, -8, 0, -8, 0, 12)
  cx.fill()
  return new THREE.CanvasTexture(c)
}

function Birthday3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (isReducedMotion()) return
    const tier = getDeviceTier()
    if (tier === 'low') return

    const cfg = TIER_CONFIG[tier]
    const isMobile = tier !== 'high'
    // Mobile layout governor: on a 390px viewport the scene is too wide for
    // edge decor (speakers at ±19, light stands at ±22, balloon garland
    // ±22) to be visible. Scale the LATERAL (x) layout DOWN hard on mobile
    // (0.42) so all edge decor pulls well inside the narrow frame.
    const SX = isMobile ? 0.42 : 1.0   // lateral scale for decor positions

    // ---- Brand palette ----
    const bgColor = new THREE.Color('#0a0414')
    const gold = new THREE.Color('#FFCC00')
    const goldLight = new THREE.Color('#FFD700')
    const goldDeep = new THREE.Color('#D4A017')
    const amber = new THREE.Color('#FFC107')
    const red = new THREE.Color('#E32636')
    const pink = new THREE.Color('#FFB6C1')
    const pinkDeep = new THREE.Color('#FF5C8A')
    const purple = new THREE.Color('#4A235A')
    const purpleLight = new THREE.Color('#7B2CBF')
    const cream = new THREE.Color('#FDF6E3')

    // ---- Scene ----
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(bgColor, 0.018)
    scene.background = bgColor

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 62 : 50,
      window.innerWidth / window.innerHeight,
      0.1, 300,
    )
    camera.position.set(0, 6, isMobile ? 13 : 20)

    const renderer = new THREE.WebGLRenderer({
      antialias: true, alpha: true, powerPreference: 'high-performance',
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(cfg.pixelRatio)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = cfg.exposure
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const pmremRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = pmremRT.texture

    // ---- Post ----
    const composer = new EffectComposer(renderer)
    composer.setPixelRatio(cfg.pixelRatio)
    composer.setSize(window.innerWidth, window.innerHeight)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      cfg.bloomStrength, cfg.bloomRadius, 0.85,
    )
    composer.addPass(bloomPass)
    const fxaaPass = new ShaderPass(FXAAShader)
    fxaaPass.material.uniforms['resolution'].value.set(
      1 / (window.innerWidth * cfg.pixelRatio),
      1 / (window.innerHeight * cfg.pixelRatio),
    )
    composer.addPass(fxaaPass)

    // ---- Lighting (kept restrained so the scene reads elegant, not cluttered) ----
    scene.add(new THREE.AmbientLight(0x8a7ab0, isMobile ? 0.35 : 0.5))
    const keyLight = new THREE.DirectionalLight(0xfff0d0, isMobile ? 0.6 : 0.9)
    keyLight.position.set(6, 18, 12)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xffd9ec, isMobile ? 0.25 : 0.4)
    fillLight.position.set(-10, 8, 14)
    scene.add(fillLight)
    const rimGold = new THREE.DirectionalLight(gold.getHex(), isMobile ? 0.45 : 0.7)
    rimGold.position.set(-12, 14, -16)
    scene.add(rimGold)
    // rim back light for cake separation
    const rimBack = new THREE.DirectionalLight(pinkDeep.getHex(), isMobile ? 0.3 : 0.5)
    rimBack.position.set(0, 10, -22)
    scene.add(rimBack)
    // dedicated cake spotlight (top-down, soft) — kept dim so the cake base
    // doesn't bloom out into a blinding glow.
    const cakeSpot = new THREE.SpotLight(0xfff4d6, isMobile ? 0.5 : 1.4, 30, Math.PI / 7, 0.7, 1.4)
    cakeSpot.position.set(0, 16, 2)
    const cakeSpotTarget = new THREE.Object3D()
    cakeSpotTarget.position.set(0, 2, -2)
    scene.add(cakeSpotTarget)
    cakeSpot.target = cakeSpotTarget
    scene.add(cakeSpot)

    const purplePoint = new THREE.PointLight(purpleLight.getHex(), isMobile ? 22 : 40, 60)
    purplePoint.position.set(-14, 10, 4)
    scene.add(purplePoint)
    const pinkPoint = new THREE.PointLight(pinkDeep.getHex(), isMobile ? 18 : 35, 60)
    pinkPoint.position.set(14, 8, 4)
    scene.add(pinkPoint)

    // ---- Build system ----
    // Heartbeat pulse (~70 BPM) — defined early so music elements can use it.
    const bpm = 70
    const beatInterval = 60 / bpm
    function easeOutElastic(x: number): number {
      const c4 = (2 * Math.PI) / 3
      return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1
    }
    function easeOutCubic(x: number): number { return 1 - Math.pow(1 - x, 3) }
    type BuildTarget = THREE.Object3D | THREE.Material
    const buildTargets: BuildTarget[] = []
    function setupBuild(obj: THREE.Object3D, delay: number, duration: number, fromY = 4) {
      obj.userData.basePos = obj.position.clone()
      obj.userData.baseScale = obj.scale.clone()
      obj.userData.baseRot = obj.rotation.clone()
      obj.userData.buildDelay = delay
      obj.userData.buildDuration = duration
      obj.userData.isBuilt = false
      obj.userData.fromY = fromY
      obj.scale.set(0.001, 0.001, 0.001)
      obj.position.y = obj.userData.basePos.y - fromY
      buildTargets.push(obj)
    }
    function setupFade(mat: THREE.Material, delay: number, duration: number, targetOpacity: number) {
      mat.userData = mat.userData || {}
      mat.userData.fadeDelay = delay
      mat.userData.fadeDuration = duration
      mat.userData.targetOpacity = targetOpacity
      mat.userData.isFaded = false
      mat.opacity = 0
      mat.transparent = true
      buildTargets.push(mat)
    }

    // shared textures
    const frostingTex = makeFrostingTexture()
    const confettiAtlas = makeConfettiAtlas()
    const wrappingTextures = [
      makeWrappingTexture('polka', '#2a1b3e', goldLight.getHexString()),
      makeWrappingTexture('stripes', '#3d1b2a', pinkDeep.getHexString()),
      makeWrappingTexture('damask', '#1b2a3e', gold.getHexString()),
      makeWrappingTexture('polka', '#3e2a1b', red.getHexString()),
      makeWrappingTexture('stripes', '#2a3e1b', goldLight.getHexString()),
      makeWrappingTexture('damask', '#3a1a2e', pink.getHexString()),
      makeWrappingTexture('polka', '#1a2a3a', purpleLight.getHexString()),
    ]

    // ============================================
    // FAR: VELVET CYCLORAMA (deeper curtain folds + valance)
    // ============================================
    const velvetTex = (() => {
      const c = document.createElement('canvas')
      c.width = 256
      c.height = 256
      const cx = c.getContext('2d')!
      cx.fillStyle = '#1a0a2a'
      cx.fillRect(0, 0, 256, 256)
      // deeper, wider velvet pleats
      for (let i = 0; i < 256; i += 2) {
        const v = Math.sin(i * 0.06) * 0.5 + 0.5
        const shade = Math.floor(15 + v * 40)
        cx.fillStyle = `rgb(${shade * 0.55}, ${shade * 0.28}, ${shade})`
        cx.fillRect(i, 0, 2, 256)
      }
      const g = cx.createRadialGradient(128, 110, 30, 128, 128, 170)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, 'rgba(0,0,0,0.65)')
      cx.fillStyle = g
      cx.fillRect(0, 0, 256, 256)
      return new THREE.CanvasTexture(c)
    })()
    velvetTex.wrapS = velvetTex.wrapT = THREE.RepeatWrapping
    velvetTex.repeat.set(5, 1)

    // higher-resolution cyclorama with sinusoidal curtain folds
    const backdropGeo = new THREE.PlaneGeometry(150, 72, 64, 1)
    const bp = backdropGeo.attributes.position
    for (let i = 0; i < bp.count; i++) {
      const x = bp.getX(i)
      const t = x / 75
      // sinusoidal folds (curtain) + cyclorama bend
      const fold = Math.sin(x * 0.35) * 1.2
      bp.setZ(i, -Math.abs(t * t) * 32 + fold)
      // subtle vertical ripple
      bp.setY(i, bp.getY(i) + Math.sin(x * 0.2) * 0.4)
    }
    bp.needsUpdate = true
    backdropGeo.computeVertexNormals()

    const backdropMat = new THREE.MeshPhysicalMaterial({
      map: velvetTex,
      color: purple,
      roughness: 0.82, metalness: 0.0, clearcoat: 0.18,
      sheen: 1.0, sheenColor: purpleLight, side: THREE.DoubleSide,
    })
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat)
    backdrop.position.set(0, 12, -34)
    scene.add(backdrop)
    setupFade(backdropMat, 0.0, 1.5, 1.0)

    // NEW: top valance/swag (a curved tube draped along the top)
    const swagPts: THREE.Vector3[] = []
    for (let i = 0; i <= 16; i++) {
      const t = i / 16
      const x = -30 + t * 60
      const y = 20 - Math.sin(t * Math.PI) * 3 + Math.sin(t * Math.PI * 4) * 0.6
      swagPts.push(new THREE.Vector3(x, y, -30))
    }
    const swagCurve = new THREE.CatmullRomCurve3(swagPts)
    const swagGeo = new THREE.TubeGeometry(swagCurve, 64, 0.8, 12, false)
    const swag = new THREE.Mesh(swagGeo, new THREE.MeshPhysicalMaterial({
      map: velvetTex, color: purpleLight, roughness: 0.8, sheen: 1.0, sheenColor: pink,
    }))
    scene.add(swag)

    // ============================================
    // FAR: LIGHT SHAFTS
    // ============================================
    const shaftTex = (() => {
      const c = document.createElement('canvas')
      c.width = 64; c.height = 256
      const cx = c.getContext('2d')!
      const g = cx.createLinearGradient(0, 0, 0, 256)
      g.addColorStop(0, 'rgba(255,255,255,0.85)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      cx.fillStyle = g; cx.fillRect(0, 0, 64, 256)
      return new THREE.CanvasTexture(c)
    })()
    const shaftColors = [gold, pink, goldLight]
    const shafts: THREE.Mesh[] = []
    for (let i = 0; i < 3; i++) {
      const shaftMat = new THREE.MeshBasicMaterial({
        map: shaftTex, color: shaftColors[i], transparent: true, opacity: 0.18,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      })
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(8, 40), shaftMat)
      shaft.position.set((i - 1) * 10, 22, -20)
      shaft.rotation.z = (i - 1) * 0.25
      shaft.rotation.x = -0.15
      scene.add(shaft)
      shafts.push(shaft)
      setupFade(shaftMat, 1.0 + i * 0.2, 1.2, 0.18)
    }

    // ============================================
    // FLOOR: reflective (desktop) / matte (mobile) + concentric gold rings.
    // On mobile the Reflector is replaced by a simple dark matte plane — the
    // reflective floor was creating a blinding circular glare under the cake
    // (reflection + bloom washout) that dominated the narrow frame.
    // ============================================
    const floorGeo = new THREE.PlaneGeometry(120, 120)
    let floor: THREE.Mesh | Reflector
    let floorReflector: Reflector | null = null
    if (isMobile) {
      floor = new THREE.Mesh(
        floorGeo,
        new THREE.MeshStandardMaterial({ color: 0x05030c, metalness: 0.2, roughness: 0.85 }),
      )
    } else {
      floorReflector = new Reflector(floorGeo, {
        textureWidth: window.innerWidth * cfg.pixelRatio,
        textureHeight: window.innerHeight * cfg.pixelRatio,
        color: 0x05020c, recursion: 1,
      } as ConstructorParameters<typeof Reflector>[1])
      floor = floorReflector
    }
    floor.rotateX(-Math.PI / 2)
    floor.position.y = -2
    scene.add(floor)

    // concentric gold rings under the cake (softened — subtle static halo)
    const ringMat1 = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const ringMat2 = new THREE.MeshBasicMaterial({ color: pink, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const ringMat3 = new THREE.MeshBasicMaterial({ color: goldLight, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const floorRing1 = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.55, 64), ringMat1)
    floorRing1.rotation.x = -Math.PI / 2; floorRing1.position.y = -1.98
    scene.add(floorRing1); setupFade(ringMat1, 0.8, 1.5, 0.18)
    const floorRing2 = new THREE.Mesh(new THREE.RingGeometry(5.6, 5.8, 64), ringMat2)
    floorRing2.rotation.x = -Math.PI / 2; floorRing2.position.y = -1.98
    scene.add(floorRing2); setupFade(ringMat2, 1.0, 1.5, 0.10)
    const floorRing3 = new THREE.Mesh(new THREE.RingGeometry(7.2, 7.3, 64), ringMat3)
    floorRing3.rotation.x = -Math.PI / 2; floorRing3.position.y = -1.98
    scene.add(floorRing3); setupFade(ringMat3, 1.2, 1.5, 0.06)

    // NEW: scattered petals (InstancedMesh) — small flattened spheres in brand colors
    let petalMesh: THREE.InstancedMesh | null = null
    if (cfg.petalCount > 0) {
      const petalGeo = new THREE.SphereGeometry(0.22, 8, 6)
      petalGeo.scale(1, 0.25, 1.4) // petal shape
      const petalMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.4, metalness: 0.0, clearcoat: 0.6,
        vertexColors: false,
      })
      petalMesh = new THREE.InstancedMesh(petalGeo, petalMat, cfg.petalCount)
      const dummy = new THREE.Object3D()
      const petalPalette = [pinkDeep, red, gold, pink, purpleLight]
      const colorAttr = new Float32Array(cfg.petalCount * 3)
      for (let i = 0; i < cfg.petalCount; i++) {
        const a = Math.random() * Math.PI * 2
        const r = 4.8 + Math.random() * 12
        dummy.position.set(Math.cos(a) * r, -1.92, Math.sin(a) * r)
        dummy.rotation.set(Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4)
        const s = 0.8 + Math.random() * 0.7
        dummy.scale.set(s, s, s)
        dummy.updateMatrix()
        petalMesh.setMatrixAt(i, dummy.matrix)
        const c = petalPalette[Math.floor(Math.random() * petalPalette.length)]
        colorAttr[i * 3] = c.r; colorAttr[i * 3 + 1] = c.g; colorAttr[i * 3 + 2] = c.b
      }
      petalMesh.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3)
      petalMesh.instanceMatrix.needsUpdate = true
      scene.add(petalMesh)
    }

    // ============================================
    // MID: GRAND 3-TIER CAKE (detail-enriched)
    // ============================================
    const candleFlames: { light: THREE.PointLight; mat: THREE.MeshStandardMaterial; halo: THREE.Sprite; flame: THREE.Mesh; base: number }[] = []

    // beadwork helper — InstancedMesh of tiny spheres along a tier rim
    function addBeadwork(parent: THREE.Group, radius: number, y: number, rows: number, color: THREE.Color) {
      const perRow = Math.max(24, Math.floor(radius * 16))
      const total = perRow * rows
      const beadGeo = new THREE.SphereGeometry(0.12, 8, 8)
      const beadMat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 0.9, metalness: 0.1 })
      const inst = new THREE.InstancedMesh(beadGeo, beadMat, total)
      const dummy = new THREE.Object3D()
      let idx = 0
      for (let row = 0; row < rows; row++) {
        const rr = radius + 0.02 + row * 0.26
        const yy = y + row * 0.08
        for (let i = 0; i < perRow; i++) {
          const a = (i / perRow) * Math.PI * 2 + row * 0.1
          dummy.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr)
          dummy.scale.setScalar(1)
          dummy.updateMatrix()
          inst.setMatrixAt(idx++, dummy.matrix)
        }
      }
      inst.instanceMatrix.needsUpdate = true
      parent.add(inst)
    }

    // sugar rose helper — a small spiral of petals
    function makeSugarRose(color: THREE.Color): THREE.Group {
      const g = new THREE.Group()
      const petalGeo = new THREE.SphereGeometry(0.22, 8, 6)
      petalGeo.scale(1, 0.35, 1)
      const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.8, sheen: 0.8, sheenColor: color })
      const layers = [0.18, 0.28, 0.38]
      layers.forEach((r, li) => {
        const count = 4 + li * 2
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + li
          const p = new THREE.Mesh(petalGeo, mat)
          p.position.set(Math.cos(a) * r, li * 0.06, Math.sin(a) * r)
          p.rotation.y = a
          p.rotation.x = -0.3 - li * 0.1
          g.add(p)
        }
      })
      // center bud
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat))
      return g
    }

    function createCake(): THREE.Group {
      const cake = new THREE.Group()

      // --- NEW: gold cake board (cardboard base disc) ---
      const boardMat = new THREE.MeshPhysicalMaterial({
        color: gold, metalness: 0.4, roughness: 0.45, clearcoat: 0.4,
      })
      const board = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.18, 48), boardMat)
      board.position.y = -0.09
      cake.add(board)
      // board rim highlight
      const boardRim = new THREE.Mesh(
        new THREE.TorusGeometry(3.6, 0.06, 12, 64),
        new THREE.MeshStandardMaterial({ color: goldLight, emissive: goldLight, emissiveIntensity: 0.1, metalness: 0.8, roughness: 0.2 }),
      )
      boardRim.rotation.x = Math.PI / 2; boardRim.position.y = 0.0
      cake.add(boardRim)

      // --- stand ---
      const standMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1420, metalness: 0.85, roughness: 0.25, clearcoat: 1.0 })
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.3, 0.4, 48), standMat)
      stand.position.y = 0.29
      cake.add(stand)

      // --- tier 1 (bottom): cream frosting with texture ---
      frostingTex.repeat.set(3, 1)
      const tier1Mat = new THREE.MeshPhysicalMaterial({
        map: frostingTex, color: cream, roughness: 0.42, metalness: 0.0, clearcoat: 0.7, clearcoatRoughness: 0.25,
      })
      const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.8, 48), tier1Mat)
      tier1.position.y = 1.39
      cake.add(tier1)
      // gold drip icing — varied-length drips around the top rim
      const dripMat1 = new THREE.MeshStandardMaterial({ color: gold, emissive: gold, emissiveIntensity: 0.15, metalness: 0.6, roughness: 0.3 })
      const dripCount1 = 24
      for (let i = 0; i < dripCount1; i++) {
        const a = (i / dripCount1) * Math.PI * 2
        const len = 0.25 + Math.random() * 0.55 // varied drip length
        const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, len, 4, 8), dripMat1)
        drip.position.set(Math.cos(a) * 2.4, 0.5 - len / 2, Math.sin(a) * 2.4)
        drip.rotation.z = Math.cos(a) * 0.1
        drip.rotation.x = Math.sin(a) * 0.1
        cake.add(drip)
      }
      // beadwork at tier 1 base
      if (cfg.beadRows > 0) addBeadwork(cake, 2.4, 0.55, cfg.beadRows, pinkDeep)
      // sugar roses at tier 1 base (3 of them)
      const roseColors1 = [red, pinkDeep, pink]
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.5
        const rose = makeSugarRose(roseColors1[i])
        rose.position.set(Math.cos(a) * 2.55, 0.7, Math.sin(a) * 2.55)
        rose.scale.setScalar(0.9)
        cake.add(rose)
      }

      // --- NEW: gold pillars between tier 1 and 2 ---
      const pillarMat = new THREE.MeshStandardMaterial({ color: gold, emissive: gold, emissiveIntensity: 0.1, metalness: 0.85, roughness: 0.25 })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.6, 12), pillarMat)
        pillar.position.set(Math.cos(a) * 1.8, 2.7, Math.sin(a) * 1.8)
        cake.add(pillar)
      }

      // --- tier 2 (middle): pink ---
      const tier2 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.7, 1.7, 1.3, 48),
        new THREE.MeshPhysicalMaterial({ map: frostingTex, color: pinkDeep, roughness: 0.45, metalness: 0.0, clearcoat: 0.7 }),
      )
      tier2.position.y = 3.65
      cake.add(tier2)
      // gold drip
      const dripMat2 = new THREE.MeshStandardMaterial({ color: goldLight, emissive: goldLight, emissiveIntensity: 0.15, metalness: 0.6, roughness: 0.3 })
      const dripCount2 = 20
      for (let i = 0; i < dripCount2; i++) {
        const a = (i / dripCount2) * Math.PI * 2
        const len = 0.2 + Math.random() * 0.4
        const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, len, 4, 8), dripMat2)
        drip.position.set(Math.cos(a) * 1.7, 3.0 - len / 2, Math.sin(a) * 1.7)
        cake.add(drip)
      }
      if (cfg.beadRows > 0) addBeadwork(cake, 1.7, 3.0, cfg.beadRows, gold)
      // sugar roses at tier 2 base
      const roseColors2 = [purpleLight, pink, gold]
      for (let i = 0; i < 2; i++) {
        const a = (i / 2) * Math.PI * 2 + 1
        const rose = makeSugarRose(roseColors2[i])
        rose.position.set(Math.cos(a) * 1.85, 3.2, Math.sin(a) * 1.85)
        rose.scale.setScalar(0.7)
        cake.add(rose)
      }

      // --- NEW: gold pillars between tier 2 and 3 ---
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 12), pillarMat)
        pillar.position.set(Math.cos(a) * 1.2, 4.85, Math.sin(a) * 1.2)
        cake.add(pillar)
      }

      // --- tier 3 (top): purple ---
      const tier3 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 1.0, 48),
        new THREE.MeshPhysicalMaterial({ map: frostingTex, color: purpleLight, roughness: 0.45, metalness: 0.0, clearcoat: 0.7 }),
      )
      tier3.position.y = 5.6
      cake.add(tier3)
      // red drip
      const dripMat3 = new THREE.MeshStandardMaterial({ color: red, emissive: red, emissiveIntensity: 0.15, metalness: 0.6, roughness: 0.3 })
      const dripCount3 = 14
      for (let i = 0; i < dripCount3; i++) {
        const a = (i / dripCount3) * Math.PI * 2
        const len = 0.15 + Math.random() * 0.3
        const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, len, 4, 8), dripMat3)
        drip.position.set(Math.cos(a) * 1.0, 5.1 - len / 2, Math.sin(a) * 1.0)
        cake.add(drip)
      }
      if (cfg.beadRows > 0) addBeadwork(cake, 1.0, 5.1, cfg.beadRows, pink)

      // --- candles on top (teardrop flames + glow halos) ---
      const candleCount = cfg.candleCount
      // shared halo sprite texture
      const haloTex = (() => {
        const c = document.createElement('canvas')
        c.width = 64; c.height = 64
        const cx = c.getContext('2d')!
        const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32)
        g.addColorStop(0, 'rgba(255,240,180,0.9)')
        g.addColorStop(0.4, 'rgba(255,200,90,0.4)')
        g.addColorStop(1, 'rgba(255,200,90,0)')
        cx.fillStyle = g; cx.fillRect(0, 0, 64, 64)
        return new THREE.CanvasTexture(c)
      })()
      for (let i = 0; i < candleCount; i++) {
        const a = (i / candleCount) * Math.PI * 2
        const r = 0.85
        const cx = Math.cos(a) * r
        const cz = Math.sin(a) * r
        // candle stick (tapered slightly)
        const stickMat = new THREE.MeshPhysicalMaterial({
          color: i % 2 ? cream : pink, roughness: 0.5, clearcoat: 0.4,
        })
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 1.0, 12), stickMat)
        stick.position.set(cx, 6.7, cz)
        cake.add(stick)
        // wick
        const wick = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6),
          new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
        )
        wick.position.set(cx, 7.24, cz)
        cake.add(wick)
        // teardrop flame (scaled sphere = teardrop)
        const flameMat = new THREE.MeshStandardMaterial({
          color: amber, emissive: gold, emissiveIntensity: 1.8, roughness: 0.35,
        })
        const flameGeo = new THREE.SphereGeometry(0.16, 12, 12)
        flameGeo.scale(1, 1.7, 1) // teardrop / elongated
        const flame = new THREE.Mesh(flameGeo, flameMat)
        flame.position.set(cx, 7.42, cz)
        cake.add(flame)
        // glow halo sprite (kept subtle to avoid glow overload)
        const haloMat = new THREE.SpriteMaterial({
          map: haloTex, color: gold, transparent: true, opacity: 0.5,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
        const halo = new THREE.Sprite(haloMat)
        halo.scale.set(1.1, 1.1, 1)
        halo.position.set(cx, 7.42, cz)
        cake.add(halo)
        // flickering point light
        const flameLight = new THREE.PointLight(gold.getHex(), 1.3, 10, 2)
        flameLight.position.set(cx, 7.49, cz)
        cake.add(flameLight)
        candleFlames.push({ light: flameLight, mat: flameMat, halo, flame, base: 1.3 })
      }

      // --- gold star topper ---
      const starShape = new THREE.Shape()
      const spikes = 5, outer = 0.5, inner = 0.22
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
        const x = Math.cos(a) * r, y = Math.sin(a) * r
        if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y)
      }
      starShape.closePath()
      const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 })
      const star = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: gold, emissive: gold, emissiveIntensity: 0.3, metalness: 0.85, roughness: 0.2 }))
      star.position.set(0, 7.9, 0)
      cake.add(star)
      cake.userData.star = star

      return cake
    }

    const cake = createCake()
    cake.position.set(0, -2, -2)
    scene.add(cake)
    setupBuild(cake, 0.4, 1.6, 6)

    // NEW: volumetric spotlight cone on the cake (additive)
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff4d6, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    })
    const coneGeo = new THREE.ConeGeometry(4.5, 16, 32, 1, true)
    coneGeo.translate(0, -8, 0)
    const lightCone = new THREE.Mesh(coneGeo, coneMat)
    lightCone.position.set(0, 16, 0)
    scene.add(lightCone)
    setupFade(coneMat, 1.2, 1.5, 0.04)

    // ============================================
    // MID: ORBITING GIFT BOXES (realistic wrapping + elegant bows)
    // ============================================
    type Gift = { group: THREE.Group; radius: number; speed: number; height: number; phase: number; tilt: number }
    const gifts: Gift[] = []
    // Brighter, brand-colored box bases (not dark/black) so gifts read as
    // wrapped presents, not black cubes.
    const giftRibbons = [goldLight, amber, pinkDeep, red, gold, purpleLight, pink]
    const giftBoxBaseColors = [0x7b2cbf, 0xe63946, 0xff5c8a, 0xd4a017, 0x4a235a, 0xffb6c1, 0xffd54a]
    for (let i = 0; i < cfg.giftCount; i++) {
      const g = new THREE.Group()
      const size = 1.1 + Math.random() * 0.8
      // box with wrapping paper texture + bright brand color
      const wrapTex = wrappingTextures[i % wrappingTextures.length]
      wrapTex.repeat.set(1, 1)
      const boxColor = new THREE.Color(giftBoxBaseColors[i % giftBoxBaseColors.length])
      const boxMat = new THREE.MeshPhysicalMaterial({
        map: wrapTex, color: boxColor,
        roughness: 0.5, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.2,
      })
      // Slightly rounded box (use a slightly beveled look via clearcoat)
      g.add(new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.8, size), boxMat))
      // Lid (slightly larger, thinner, on top — like a real gift box lid)
      const lidMat = boxMat.clone()
      lidMat.color = boxColor.clone().multiplyScalar(1.15)
      const lid = new THREE.Mesh(new THREE.BoxGeometry(size * 1.05, size * 0.15, size * 1.05), lidMat)
      lid.position.y = size * 0.4 + size * 0.075
      g.add(lid)
      // Ribbon — vertical + horizontal bands around the lid
      const ribbonColor = giftRibbons[i % giftRibbons.length]
      const ribbonMat = new THREE.MeshStandardMaterial({
        color: ribbonColor, emissive: ribbonColor, emissiveIntensity: 0.4, roughness: 0.25, metalness: 0.4,
      })
      const t = size * 0.12
      // vertical band (front-back)
      g.add(new THREE.Mesh(new THREE.BoxGeometry(t, size * 0.95, size * 1.02), ribbonMat))
      // horizontal band (left-right)
      g.add(new THREE.Mesh(new THREE.BoxGeometry(size * 1.02, size * 0.95, t), ribbonMat))
      // Elegant bow: 2 loop torus + 2 tail strips + center knot
      const bowGroup = new THREE.Group()
      bowGroup.position.y = size * 0.4 + size * 0.15
      // 2 loops (left + right)
      const loopL = new THREE.Mesh(new THREE.TorusGeometry(size * 0.18, size * 0.05, 8, 20), ribbonMat)
      loopL.rotation.x = Math.PI / 2
      loopL.rotation.y = -0.3
      loopL.position.x = -size * 0.12
      bowGroup.add(loopL)
      const loopR = loopL.clone()
      loopR.rotation.y = 0.3
      loopR.position.x = size * 0.12
      bowGroup.add(loopR)
      // 2 ribbon tails (hanging down from the bow)
      const tailMat = ribbonMat.clone()
      const tailL = new THREE.Mesh(new THREE.BoxGeometry(size * 0.06, size * 0.25, size * 0.02), tailMat)
      tailL.position.set(-size * 0.06, -size * 0.12, size * 0.08)
      tailL.rotation.z = 0.15
      bowGroup.add(tailL)
      const tailR = tailL.clone()
      tailR.position.x = size * 0.06
      tailR.rotation.z = -0.15
      bowGroup.add(tailR)
      // center knot
      bowGroup.add(new THREE.Mesh(new THREE.SphereGeometry(size * 0.09, 12, 10), ribbonMat))
      g.add(bowGroup)
      scene.add(g)
      // orbit radius: keep gifts OUTSIDE the cake (cake radius ~4.5). On
      // mobile use a milder lateral scale (0.62) so gifts don't collapse
      // inside the cake; desktop uses full radius.
      const giftRadius = (8 + Math.random() * 5) * (isMobile ? 0.62 : 1.0)
      gifts.push({
        group: g, radius: giftRadius, speed: 0.025 + Math.random() * 0.02,
        height: 3 + Math.random() * 4, phase: Math.random() * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.6,
      })
      setupBuild(g, 1.2 + i * 0.15, 1.0, 5)
    }

    // ============================================
    // MID: FLOWING SILK RIBBON STREAMERS (flat ribbon shape, not round tube)
    // Each ribbon is a FLAT strip (like real silk fabric) that drapes from
    // the top and flows. Built as a custom BufferGeometry: a strip of
    // vertices along a CatmullRom curve with a fixed WIDTH (flat, not
    // circular). Control points migrate (traveling-wave) so the silk
    // genuinely flows. 25 control points for silk-smooth curvature.
    // ============================================
    const RIBBON_SEGMENTS = cfg.ribbonSegments
    const RIBBON_WIDTH = 0.5     // wider flat ribbon strip (clearly flat, not tube)
    const RIBBON_POINTS = 25
    type Ribbon = {
      mesh: THREE.Mesh
      curve: THREE.CatmullRomCurve3
      phase: number
      speed: number
      ampY: number
      ampX: number
      anchorX: number
      topY: number
      dropDepth: number
      baseZ: number
    }

    // Build a flat ribbon BufferGeometry from a curve: a strip of triangles
    // with the given width, lying flat (like a ribbon/fabric strip).
    function buildFlatRibbon(curve: THREE.CatmullRomCurve3, segments: number, width: number): THREE.BufferGeometry {
      const points = curve.getPoints(segments)
      const positions: number[] = []
      const indices: number[] = []
      const halfW = width / 2
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        // left edge + right edge of the ribbon strip
        positions.push(p.x - halfW, p.y, p.z)  // left vertex
        positions.push(p.x + halfW, p.y, p.z)  // right vertex
      }
      for (let i = 0; i < points.length - 1; i++) {
        const li = i * 2
        const ri = i * 2 + 1
        const li2 = (i + 1) * 2
        const ri2 = (i + 1) * 2 + 1
        // two triangles per segment
        indices.push(li, li2, ri)
        indices.push(ri, li2, ri2)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geo.setIndex(indices)
      geo.computeVertexNormals()
      return geo
    }

    const ribbons: Ribbon[] = []
    const ribbonColors = [gold, pinkDeep, purpleLight, goldLight]
    const ribbonHalf = 18 * SX
    for (let i = 0; i < cfg.ribbonCount; i++) {
      const color = ribbonColors[i % ribbonColors.length]
      const evenT = cfg.ribbonCount === 1 ? 0.5 : i / (cfg.ribbonCount - 1)
      const anchorX = -ribbonHalf + evenT * (ribbonHalf * 2)
      const topY = 18 - (i % 2) * 2
      const initPts: THREE.Vector3[] = []
      for (let j = 0; j <= RIBBON_POINTS; j++) {
        const t = j / RIBBON_POINTS
        initPts.push(new THREE.Vector3(anchorX, topY - t * 14, -6))
      }
      const curve = new THREE.CatmullRomCurve3(initPts)
      const ribbonGeo = buildFlatRibbon(curve, RIBBON_SEGMENTS, RIBBON_WIDTH)
      const ribbonMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false,
      })
      const mesh = new THREE.Mesh(ribbonGeo, ribbonMat)
      scene.add(mesh)
      ribbons.push({
        mesh, curve,
        phase: i * 1.1,
        speed: 0.7 + i * 0.15,
        ampY: 1.4 + i * 0.2,
        ampX: 2.8 + i * 0.4,
        anchorX,
        topY,
        dropDepth: 14 + (i % 2) * 2,
        baseZ: -6,
      })
      setupBuild(mesh, 2.0 + i * 0.2, 1.0, 0)
    }

    // ============================================
    // MID: MUSIC ELEMENTS — spinning vinyls + floating 3D notes + sound-wave ring
    // Distributed across the FULL stage width (not bunched on one side):
    // two vinyls (left + right), notes spread evenly, wave rings centered.
    // (elegant, brand-colored — NOT a nightclub turntable)
    // ============================================
    // --- reusable vinyl builder ---
    function buildVinyl(labelColor: THREE.Color): THREE.Group {
      const v = new THREE.Group()
      const vinylTex = (() => {
        const c = document.createElement('canvas')
        c.width = 256; c.height = 256
        const cx = c.getContext('2d')!
        cx.fillStyle = '#0a0a0a'; cx.fillRect(0, 0, 256, 256)
        for (let r = 40; r < 128; r += 1.5) {
          cx.beginPath(); cx.arc(128, 128, r, 0, Math.PI * 2)
          cx.strokeStyle = `rgba(60,60,60,${0.25 + Math.random() * 0.35})`; cx.lineWidth = 0.8; cx.stroke()
        }
        return new THREE.CanvasTexture(c)
      })()
      const discMat = new THREE.MeshPhysicalMaterial({
        map: vinylTex, color: 0x111111, metalness: 0.9, roughness: 0.15,
        clearcoat: 1.0, envMapIntensity: 1.5,
      })
      v.add(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.12, 64), discMat))
      const labelMat = new THREE.MeshStandardMaterial({
        color: labelColor, emissive: labelColor, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.3,
      })
      v.add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.14, 32), labelMat))
      v.add(new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.16, 16),
        new THREE.MeshStandardMaterial({ color: 0x000000 }),
      ))
      const tonearmMat = new THREE.MeshPhysicalMaterial({ color: 0xc8c8d0, metalness: 0.95, roughness: 0.2, clearcoat: 1.0 })
      const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16), tonearmMat)
      pivot.position.set(2.5, 0.4, 0); v.add(pivot)
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 12), tonearmMat)
      arm.rotation.z = Math.PI / 2.6; arm.position.set(1.4, 0.55, 0.2); v.add(arm)
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.35), tonearmMat)
      head.position.set(0.1, 0.3, 0.55); v.add(head)
      return v
    }

    // --- two vinyls: left + right, mirrored ---
    const vinyls: THREE.Group[] = []
    if (cfg.showVinyl) {
      const vLeft = buildVinyl(gold)
      vLeft.position.set(-14, 5, -5)
      vLeft.rotation.x = -Math.PI / 8
      vLeft.rotation.z = 0.3
      scene.add(vLeft)
      setupBuild(vLeft, 2.6, 1.2, 5)
      vinyls.push(vLeft)

      const vRight = buildVinyl(pinkDeep)
      vRight.position.set(14, 5, -5)
      vRight.rotation.x = -Math.PI / 8
      vRight.rotation.z = -0.3 // mirror
      // mirror the tonearm to the other side for symmetry
      vRight.scale.x = -1
      scene.add(vRight)
      setupBuild(vRight, 2.7, 1.2, 5)
      vinyls.push(vRight)
    }

    // --- floating 3D music notes, spread EVENLY across the full stage width ---
    // Each note is a flat plane with a canvas-drawn music note (eighth note
    // or quarter note) — reads clearly as a musical symbol from any angle.
    type Note = { mesh: THREE.Group; basePos: THREE.Vector3; offset: number; spin: number }
    const notes: Note[] = []
    if (cfg.noteCount > 0) {
      // Generate a canvas texture with a music note symbol
      const noteTex = (() => {
        const c = document.createElement('canvas')
        c.width = 128; c.height = 128
        const cx = c.getContext('2d')!
        cx.clearRect(0, 0, 128, 128)
        cx.fillStyle = '#fff'
        // note head (filled ellipse)
        cx.beginPath()
        cx.ellipse(40, 90, 22, 16, -0.3, 0, Math.PI * 2)
        cx.fill()
        // stem (vertical bar)
        cx.fillRect(60, 30, 5, 62)
        // flag (curved strip from top of stem)
        cx.beginPath()
        cx.moveTo(65, 30)
        cx.quadraticCurveTo(95, 45, 85, 70)
        cx.quadraticCurveTo(80, 55, 65, 50)
        cx.fill()
        return new THREE.CanvasTexture(c)
      })()
      const noteMat = new THREE.MeshBasicMaterial({
        map: noteTex, transparent: true, side: THREE.DoubleSide, depthWrite: false,
      })
      const notePalette = [gold, goldLight, pinkDeep, red, purpleLight]
      const stageHalf = 18 * SX
      for (let i = 0; i < cfg.noteCount; i++) {
        const g = new THREE.Group()
        const color = notePalette[i % notePalette.length]
        // Clone the material and tint it with the brand color
        const mat = noteMat.clone()
        mat.color = color
        // Flat plane with the note texture
        const notePlane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), mat)
        g.add(notePlane)
        // EVEN spread: map i across [-stageHalf, +stageHalf], plus small jitter;
        // keep notes in a tighter mid-height band (4-11) so they stay visible.
        const evenT = cfg.noteCount === 1 ? 0.5 : i / (cfg.noteCount - 1)
        const basePos = new THREE.Vector3(
          -stageHalf + evenT * (stageHalf * 2) + (Math.random() - 0.5) * 3,
          4 + Math.random() * 7,
          -2 + (Math.random() - 0.5) * 10,
        )
        g.position.copy(basePos)
        const noteScale = 0.9 + Math.random() * 0.5
        g.scale.setScalar(noteScale)
        g.userData.noteScale = noteScale
        scene.add(g)
        notes.push({ mesh: g, basePos: basePos.clone(), offset: Math.random() * Math.PI * 2, spin: 0.1 + Math.random() * 0.15 })
        setupBuild(g, 3.0 + i * 0.2, 1.0, 4)
      }
    }

    // ============================================
    // MID: SPEAKER TOWERS + LIGHT STANDS (realistic party fixtures)
    // Tapered PA-tower cabinets with horn tweeters + woofer cones + brand
    // LED accents. Tripod light stands with yoke-mounted moving heads.
    // ============================================
    type SpeakerTower = { group: THREE.Group; woofers: THREE.Mesh[]; ledMat: THREE.MeshBasicMaterial; basePos: THREE.Vector3 }
    const speakerTowers: SpeakerTower[] = []
    const speakerPositions = [
      { x: -5.5, z: -9 },
      { x: 5.5, z: -9 },
    ]
    speakerPositions.forEach((pos, i) => {
      const sg = new THREE.Group()
      // cabinet material — dark wood/composite with clearcoat
      const cabMat = new THREE.MeshPhysicalMaterial({ color: 0x2a1f2e, metalness: 0.3, roughness: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.2 })
      // grille material — perforated metal look (dark mesh)
      const grilleMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 })
      const cabH = 11
      const cabW = 2.0, cabD = 1.6
      // tapered cabinet (narrower at top) — use 2 boxes: bottom wider, top narrower
      const cabBottom = new THREE.Mesh(new THREE.BoxGeometry(cabW, cabH * 0.6, cabD), cabMat)
      cabBottom.position.set(0, cabH * 0.3 - 2, 0)
      sg.add(cabBottom)
      const cabTop = new THREE.Mesh(new THREE.BoxGeometry(cabW * 0.85, cabH * 0.4, cabD * 0.9), cabMat)
      cabTop.position.set(0, cabH * 0.8 - 2, 0)
      sg.add(cabTop)
      // front grille panel (slightly recessed)
      const grille = new THREE.Mesh(new THREE.BoxGeometry(cabW * 0.85, cabH * 0.85, 0.05), grilleMat)
      grille.position.set(0, cabH / 2 - 2, cabD / 2 + 0.02)
      sg.add(grille)
      // vertical LED strips on both sides (brand color)
      const ledColor = i === 0 ? gold : pinkDeep
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor })
      const ledStripL = new THREE.Mesh(new THREE.BoxGeometry(0.18, cabH - 1.5, 0.08), ledMat)
      ledStripL.position.set(-cabW / 2 - 0.02, cabH / 2 - 2, cabD / 2 - 0.2)
      sg.add(ledStripL)
      const ledStripR = ledStripL.clone()
      ledStripR.position.x = cabW / 2 + 0.02
      sg.add(ledStripR)
      // point light for subtle glow
      const towerLight = new THREE.PointLight(ledColor.getHex(), 4, 14, 2)
      towerLight.position.set(0, cabH / 2 - 2, 1.0)
      sg.add(towerLight)
      // top cap (handles)
      const capMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, metalness: 0.7, roughness: 0.35 })
      const topCap = new THREE.Mesh(new THREE.BoxGeometry(cabW * 0.9, 0.25, cabD * 0.85), capMat)
      topCap.position.set(0, cabH - 2, 0)
      sg.add(topCap)
      // 2 carry handles on sides
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.5, roughness: 0.5 })
      ;[-1, 1].forEach((side) => {
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 6, 12, Math.PI), handleMat)
        handle.rotation.y = Math.PI / 2
        handle.position.set(side * (cabW / 2 + 0.02), cabH * 0.7 - 2, 0)
        sg.add(handle)
      })
      // woofer cones (front, 2) — realistic with cone + surround + dust cap
      const wooferMat = new THREE.MeshStandardMaterial({ color: 0x080808, metalness: 0.3, roughness: 0.7 })
      const surroundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.2, roughness: 0.8 })
      const ringMat = new THREE.MeshStandardMaterial({ color: goldDeep, metalness: 0.85, roughness: 0.3 })
      const capInnerMat = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.5, roughness: 0.5 })
      const woofers: THREE.Mesh[] = []
      ;[2.0, 5.2].forEach((wy) => {
        // surround (rubber ring)
        const surround = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.1, 8, 24), surroundMat)
        surround.position.set(0, wy - 2, cabD / 2 + 0.06)
        sg.add(surround)
        // cone (recessed)
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.3, 24), wooferMat)
        cone.rotation.x = Math.PI / 2
        cone.position.set(0, wy - 2, cabD / 2 + 0.02)
        sg.add(cone)
        // gold ring bezel
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 6, 24), ringMat)
        ring.position.set(0, wy - 2, cabD / 2 + 0.07)
        sg.add(ring)
        // dust cap (dome)
        const dustCap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), capInnerMat)
        dustCap.rotation.x = -Math.PI / 2
        dustCap.position.set(0, wy - 2, cabD / 2 + 0.08)
        sg.add(dustCap)
        woofers.push(cone)
      })
      // horn tweeter (top, small flared cone)
      const tweeter = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.6, roughness: 0.3 }))
      tweeter.rotation.x = Math.PI / 2
      tweeter.position.set(0, cabH * 0.45 - 2, cabD / 2 + 0.15)
      sg.add(tweeter)
      sg.position.set(pos.x, -2, pos.z)
      scene.add(sg)
      setupBuild(sg, 1.8, 1.2, 8)
      speakerTowers.push({ group: sg, woofers, ledMat, basePos: sg.position.clone() })
    })

    // --- light stands (tripod + yoke-mounted moving head) on the sides ---
    type LightStand = { group: THREE.Group; head: THREE.Mesh; basePos: THREE.Vector3; lensColor: THREE.Color }
    const lightStands: LightStand[] = []
    const standPositions = [
      { x: -5, z: -7 },
      { x: 5, z: -7 },
    ]
    const standLensColors = [gold, pinkDeep]
    const standMetalMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.9, roughness: 0.25 })
    standPositions.forEach((pos, i) => {
      const lg = new THREE.Group()
      // tripod base (3 angled legs + central hub)
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12), standMetalMat)
      hub.position.y = -0.6
      lg.add(hub)
      for (let l = 0; l < 3; l++) {
        const la = (l / 3) * Math.PI * 2
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.0, 8), standMetalMat)
        leg.position.set(Math.cos(la) * 0.65, -1.3, Math.sin(la) * 0.65)
        leg.rotation.z = Math.cos(la) * 0.28
        leg.rotation.x = Math.sin(la) * 0.28
        lg.add(leg)
        // rubber foot
        const foot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 }))
        foot.position.set(Math.cos(la) * 0.85, -2.1, Math.sin(la) * 0.85)
        lg.add(foot)
      }
      // center pole (2 sections for realism)
      const poleLower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3, 12), standMetalMat)
      poleLower.position.y = 1.0
      lg.add(poleLower)
      const poleJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.15, 12), standMetalMat)
      poleJoint.position.y = 2.6
      lg.add(poleJoint)
      const poleUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 12), standMetalMat)
      poleUpper.position.y = 3.9
      lg.add(poleUpper)
      // yoke (U-bracket holding the head)
      const yokeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a20, metalness: 0.85, roughness: 0.3 })
      const yokeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), yokeMat)
      yokeL.position.set(-0.35, 5.4, 0)
      lg.add(yokeL)
      const yokeR = yokeL.clone()
      yokeR.position.x = 0.35
      lg.add(yokeR)
      // head (the moving-head fixture — rounded box)
      const headMat = new THREE.MeshPhysicalMaterial({ color: 0x15151c, metalness: 0.8, roughness: 0.3, clearcoat: 0.8 })
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.65), headMat)
      head.position.y = 5.4
      lg.add(head)
      // lens housing (cylinder recessed in front of head)
      const lensColor = standLensColors[i]
      const lensHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.15, 16), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.6, roughness: 0.4 }))
      lensHousing.rotation.x = Math.PI / 2
      lensHousing.position.set(0, 5.4, 0.38)
      lg.add(lensHousing)
      // lens (brand-colored, emissive)
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), new THREE.MeshStandardMaterial({ color: lensColor, emissive: lensColor, emissiveIntensity: 0.9 }))
      lens.position.set(0, 5.4, 0.46)
      lg.add(lens)
      // top vent slots (decorative)
      const ventMat = new THREE.MeshStandardMaterial({ color: 0x080810, metalness: 0.4, roughness: 0.6 })
      for (let v = 0; v < 3; v++) {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.01), ventMat)
        vent.position.set(0, 5.7 + v * 0.06, 0.33)
        lg.add(vent)
      }
      lg.position.set(pos.x, -2, pos.z)
      scene.add(lg)
      setupBuild(lg, 2.0, 1.0, 6)
      lightStands.push({ group: lg, head, basePos: lg.position.clone(), lensColor })
    })

    // ============================================
    // MID: SOUND-WAVE VISUALIZER (on the floor, behind the cake, between speakers)
    // A row of vertical frequency bars standing on the floor behind the cake,
    // between the two speaker towers. STATIC position (no scroll movement).
    // Only the bar heights animate (pulse with the beat). Brand-colored.
    // ============================================
    const soundWaveBars: THREE.Mesh[] = []
    const soundWaveMat = new THREE.MeshStandardMaterial({
      color: gold, emissive: gold, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.25,
    })
    const soundWaveMatAlt = new THREE.MeshStandardMaterial({
      color: pinkDeep, emissive: pinkDeep, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.25,
    })
    const BAR_COUNT = isMobile ? 12 : 20
    const BAR_SPACING = 0.5
    const BAR_WIDTH = 0.18
    const BAR_TOTAL_WIDTH = BAR_COUNT * BAR_SPACING
    // Position: on the FLOOR (y=0), BEHIND the cake (z=-6, cake is at z=-2),
    // centered between the two speakers (both at x=±5.5, z=-9).
    const WAVE_Y = 0       // floor level
    const WAVE_Z = -6      // behind the cake
    for (let i = 0; i < BAR_COUNT; i++) {
      const mat = i % 2 === 0 ? soundWaveMat : soundWaveMatAlt
      const bar = new THREE.Mesh(new THREE.BoxGeometry(BAR_WIDTH, 1, BAR_WIDTH), mat)
      bar.position.set(
        -BAR_TOTAL_WIDTH / 2 + i * BAR_SPACING + BAR_SPACING / 2,
        WAVE_Y,
        WAVE_Z,
      )
      bar.userData.idx = i
      bar.userData.baseY = WAVE_Y
      scene.add(bar)
      soundWaveBars.push(bar)
      // No setupBuild — bars are STATIC, no entrance animation, no scroll movement.
    }
    // a faint connecting line on the floor under the bars
    const waveBaseMat = new THREE.MeshBasicMaterial({ color: goldDeep, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
    const waveBase = new THREE.Mesh(new THREE.PlaneGeometry(BAR_TOTAL_WIDTH + 0.5, 0.3), waveBaseMat)
    waveBase.rotation.x = -Math.PI / 2
    waveBase.position.set(0, 0.02, WAVE_Z)
    scene.add(waveBase)

    // ============================================
    // MID: BALLOON GARLAND (strings + knots + stronger specular)
    // ============================================
    type Balloon = { mesh: THREE.Group; offset: number; baseY: number; baseScale: number }
    const balloons: Balloon[] = []
    const balloonColors = [gold, goldLight, amber, pink, pinkDeep, red, purpleLight]
    if (cfg.balloonCount > 0) {
      const garlandPts: THREE.Vector3[] = []
      for (let j = 0; j <= 12; j++) {
        const t = j / 12
        garlandPts.push(new THREE.Vector3(
          (-22 + t * 44) * SX,
          14 - Math.sin(t * Math.PI) * 6 + Math.sin(t * Math.PI * 3) * 1.5,
          -14,
        ))
      }
      const garlandCurve = new THREE.CatmullRomCurve3(garlandPts)
      const knotGeo = new THREE.ConeGeometry(0.12, 0.3, 8)
      const stringGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4)
      const stringMat = new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.5 })
      for (let i = 0; i < cfg.balloonCount; i++) {
        const t = i / (cfg.balloonCount - 1)
        const center = garlandCurve.getPoint(t)
        const side = new THREE.Vector3((Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.8)
        const color = balloonColors[i % balloonColors.length]
        const balloonGroup = new THREE.Group()
        const bodyGeo = new THREE.SphereGeometry(0.95 + Math.random() * 0.35, 28, 24)
        bodyGeo.scale(1, 1.25, 1)
        const bodyMat = new THREE.MeshPhysicalMaterial({
          color, metalness: 0.55, roughness: 0.08, clearcoat: 1.0, clearcoatRoughness: 0.08,
          emissive: color, emissiveIntensity: 0.2, envMapIntensity: 2.5,
        })
        const body = new THREE.Mesh(bodyGeo, bodyMat)
        balloonGroup.add(body)
        // NEW: knot at the bottom
        const knot = new THREE.Mesh(knotGeo, new THREE.MeshPhysicalMaterial({ color, metalness: 0.4, roughness: 0.2, clearcoat: 0.8 }))
        knot.position.y = -1.25
        knot.rotation.x = Math.PI
        balloonGroup.add(knot)
        // NEW: string tail
        const str = new THREE.Mesh(stringGeo, stringMat)
        str.position.y = -2.0
        balloonGroup.add(str)
        // NEW: strong specular highlight (small white sphere)
        const spec = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }),
        )
        spec.position.set(-0.35, 0.35, 0.55)
        balloonGroup.add(spec)

        balloonGroup.position.copy(center).add(side)
        scene.add(balloonGroup)
        const bs = 1
        balloons.push({ mesh: balloonGroup, offset: Math.random() * Math.PI * 2, baseY: balloonGroup.position.y, baseScale: bs })
        setupBuild(balloonGroup, 2.5 + (i / cfg.balloonCount) * 1.2, 0.8, -8)
      }
    }

    // ============================================
    // NEAR: FLOATING LANTERNS
    // ============================================
    type Lantern = { mesh: THREE.Mesh; light: THREE.PointLight; speed: number; baseY: number }
    const lanterns: Lantern[] = []
    const lanternGeo = new THREE.IcosahedronGeometry(0.32, 1)
    for (let i = 0; i < cfg.lanternCount; i++) {
      const color = [gold, amber, pink][i % 3]
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 1.9, roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0,
      })
      const mesh = new THREE.Mesh(lanternGeo, mat)
      mesh.position.set((Math.random() - 0.5) * 30, -1 + Math.random() * 18, (Math.random() - 0.5) * 14 - 4)
      mesh.userData.baseY = mesh.position.y
      scene.add(mesh)
      const light = new THREE.PointLight(color.getHex(), 1.5, 8, 2)
      mesh.add(light)
      lanterns.push({ mesh, light, speed: 0.3 + Math.random() * 0.4, baseY: mesh.userData.baseY })
      setupFade(mat, 3.0 + i * 0.15, 1.2, 0.95)
    }

    // ============================================
    // NEAR: MULTI-SHAPE CONFETTI (sprite atlas)
    // ============================================
    let confetti: THREE.Points | null = null
    let confettiMat: THREE.PointsMaterial | null = null
    if (cfg.confettiCount > 0) {
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(cfg.confettiCount * 3)
      const col = new Float32Array(cfg.confettiCount * 3)
      const uv = new Float32Array(cfg.confettiCount * 2)
      const vel: number[] = []
      const palette = [gold, goldLight, pink, pinkDeep, red, purpleLight, cream]
      for (let i = 0; i < cfg.confettiCount; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 50
        pos[i * 3 + 1] = Math.random() * 30
        pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4
        const c = palette[Math.floor(Math.random() * palette.length)]
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
        // pick one of 4 atlas cells (0..1 in 0.5 steps)
        const cell = Math.floor(Math.random() * 4)
        uv[i * 2] = (cell % 2) * 0.5
        uv[i * 2 + 1] = Math.floor(cell / 2) * 0.5
        vel.push(0.04 + Math.random() * 0.06)
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      confettiMat = new THREE.PointsMaterial({
        size: 0.45, map: confettiAtlas, vertexColors: true, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        alphaTest: 0.02,
      })
      confetti = new THREE.Points(geo, confettiMat)
      confetti.userData.vel = vel
      scene.add(confetti)
      setupFade(confettiMat, 3.5, 1.5, 0.85)
    }

    // ============================================
    // NEAR: TWINKLING SPARKLES
    // ============================================
    const sparkles: THREE.Mesh[] = []
    for (let i = 0; i < cfg.sparkleCount; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }),
      )
      s.position.set((Math.random() - 0.5) * 44, Math.random() * 22 - 2, (Math.random() - 0.5) * 30 - 6)
      s.userData.phase = Math.random() * Math.PI * 2
      s.userData.speed = 1.5 + Math.random() * 2
      scene.add(s)
      sparkles.push(s)
    }

    // ============================================
    // NEAR: BOKEH DEPTH SPRITES
    // ============================================
    const bokehTex = (() => {
      const c = document.createElement('canvas')
      c.width = 128; c.height = 128
      const cx = c.getContext('2d')!
      const g = cx.createRadialGradient(64, 64, 0, 64, 64, 64)
      g.addColorStop(0, 'rgba(255,255,255,0.7)')
      g.addColorStop(0.4, 'rgba(255,255,255,0.25)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      cx.fillStyle = g; cx.fillRect(0, 0, 128, 128)
      return new THREE.CanvasTexture(c)
    })()
    const bokehSprites: THREE.Sprite[] = []
    const bokehColors = [gold, pink, purpleLight, red]
    for (let i = 0; i < cfg.bokehCount; i++) {
      const mat = new THREE.SpriteMaterial({
        map: bokehTex, color: bokehColors[i % bokehColors.length],
        transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const sprite = new THREE.Sprite(mat)
      const s = 2.5 + Math.random() * 3
      sprite.scale.set(s, s, 1)
      sprite.position.set((Math.random() - 0.5) * 40, Math.random() * 18, -10 - Math.random() * 16)
      sprite.userData.driftX = (Math.random() - 0.5) * 0.2
      sprite.userData.driftY = (Math.random() - 0.5) * 0.2
      scene.add(sprite)
      bokehSprites.push(sprite)
      setupFade(mat, 2.5 + i * 0.1, 1.5, 0.2)
    }

    // ============================================
    // NEAR: WISH-SPARKLES — golden sparkles rising from each candle flame.
    // The emotional "magic" of the cake. Always gently rising, but flares
    // dramatically during the scroll-driven "Make a Wish" climax.
    // ============================================
    const sparkleTex = makeSparkleTexture()
    let wishSparkles: THREE.Points | null = null
    let wishSparkleMat: THREE.PointsMaterial | null = null
    // per-sparkle: candle index, age (0..1), lifetime, sway phase, rise speed
    let wishData: { candleIdx: number; age: number; life: number; sway: number; rise: number }[] = []
    if (cfg.wishSparkleCount > 0 && candleFlames.length > 0) {
      const wsGeo = new THREE.BufferGeometry()
      const wsPos = new Float32Array(cfg.wishSparkleCount * 3)
      const wsCol = new Float32Array(cfg.wishSparkleCount * 3)
      wishData = []
      for (let i = 0; i < cfg.wishSparkleCount; i++) {
        // initial position far above (will be reset on first frame)
        wsPos[i * 3] = 0; wsPos[i * 3 + 1] = 100; wsPos[i * 3 + 2] = 0
        wsCol[i * 3] = 1; wsCol[i * 3 + 1] = 0.9; wsCol[i * 3 + 2] = 0.4
        wishData.push({
          candleIdx: Math.floor(Math.random() * candleFlames.length),
          age: Math.random(), life: 1.2 + Math.random() * 1.6,
          sway: Math.random() * Math.PI * 2, rise: 1.2 + Math.random() * 1.0,
        })
      }
      wsGeo.setAttribute('position', new THREE.BufferAttribute(wsPos, 3))
      wsGeo.setAttribute('color', new THREE.BufferAttribute(wsCol, 3))
      wishSparkleMat = new THREE.PointsMaterial({
        size: 0.35, map: sparkleTex, vertexColors: true, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, alphaTest: 0.02,
      })
      wishSparkles = new THREE.Points(wsGeo, wishSparkleMat)
      scene.add(wishSparkles)
      setupFade(wishSparkleMat, 4.0, 1.5, 0.9)
    }

    // ============================================
    // NEAR: FLOATING HEARTS — romantic heart sprites drifting up like lanterns
    // ============================================
    const heartTex = makeHeartTexture()
    const heartSprites: THREE.Sprite[] = []
    const heartColors = [pinkDeep, red, pink, gold]
    for (let i = 0; i < cfg.heartCount; i++) {
      const color = heartColors[i % heartColors.length]
      const mat = new THREE.SpriteMaterial({
        map: heartTex, color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const sprite = new THREE.Sprite(mat)
      const s = 0.5 + Math.random() * 0.5
      sprite.scale.set(s, s, 1)
      sprite.position.set((Math.random() - 0.5) * 30, -2 + Math.random() * 20, (Math.random() - 0.5) * 14 - 4)
      sprite.userData.speed = 0.25 + Math.random() * 0.35
      sprite.userData.sway = Math.random() * Math.PI * 2
      sprite.userData.spin = (Math.random() - 0.5) * 0.5
      sprite.userData.baseY = sprite.position.y
      scene.add(sprite)
      heartSprites.push(sprite)
      setupFade(mat, 3.2 + i * 0.15, 1.4, 0.75)
    }

    // ============================================
    // HEARTBEAT PULSE (~70 BPM) — beatInterval defined above with the build system
    // ============================================

    // ---- Animation loop ----
    const clock = new THREE.Clock()
    const mouse = { x: 0, y: 0 }
    const targetMouse = { x: 0, y: 0 }
    let animationId = 0
    let frameCount = 0

    // ---- Intro cinematic (v58: improved entry animation) ----
    // The camera starts further back + higher, then dollies forward + descends
    // to the hero position over ~2.8s. Bloom + exposure start elevated for a
    // "reveal" flare, then settle. Creates a cinematic "arriving at the party"
    // feeling instead of the scene just being there.
    const INTRO_DURATION = 2.8 // seconds
    let introTime = 0
    function easeInOutCubic(x: number): number {
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
    }

    // ---- Scroll-progress (drives the cinematic scroll-reactive animation) ----
    // targetScroll: raw 0..1 from window scroll. scrollProgress: damped lerp
    // toward target so the camera glides instead of snapping on each wheel
    // tick / touch swipe. Updated each frame in the animate loop.
    let targetScroll = 0
    let scrollProgress = 0
    const updateScrollTarget = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      targetScroll = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    updateScrollTarget()
    window.addEventListener('scroll', updateScrollTarget, { passive: true })
    window.addEventListener('resize', updateScrollTarget)

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      frameCount++
      if (cfg.frameSkip > 1 && frameCount % cfg.frameSkip !== 0) return
      const delta = Math.min(0.05, clock.getDelta())
      const time = clock.getElapsedTime()

      // ---- v58: Intro cinematic progress ----
      // 0 at start → 1 after INTRO_DURATION. Eased for smooth acceleration/deceleration.
      introTime += delta
      const introRaw = Math.min(1, introTime / INTRO_DURATION)
      const intro = easeInOutCubic(introRaw)
      // Intro "flare" — strong at start, settles to 0. Used for bloom + exposure boost.
      const introFlare = Math.pow(1 - introRaw, 2)

      const beatPhase = (time % beatInterval) / beatInterval
      const beat = Math.pow(1 - beatPhase, 4)

      // build animations
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
              item.opacity = easeOutCubic(p) * item.userData.targetOpacity
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
              item.scale.set(item.userData.baseScale.x * s, item.userData.baseScale.y * s, item.userData.baseScale.z * s)
              const py = easeOutCubic(p)
              item.position.y = item.userData.basePos.y - item.userData.fromY + item.userData.fromY * py
            }
          }
        }
      }

      // ---- damp scroll progress (glide instead of snap) ----
      // Frame-rate-independent damping: at 60fps, 0.08 ≈ converges in ~0.4s.
      scrollProgress += (targetScroll - scrollProgress) * 0.06
      const sp = scrollProgress

      // "Make a Wish" climax — a gaussian bump peaking at sp=0.75 (0 at top,
      // 1 mid-late, 0 at bottom). This is the emotional peak where the camera
      // has leaned into the cake and the candle flames flare up.
      const wish = Math.exp(-Math.pow((sp - 0.75) * 3.2, 2))
      // general "intensity" swell — peaks at sp=0.5 (mid celebration)
      const swell = Math.sin(sp * Math.PI)

      // ---- camera: cinematic scroll journey + ambient drift + v58 intro ----
      // Scroll 0 (hero): far front-on, eye-level. Scroll 1 (footer): closer,
      // higher, looking down at the cake top — a "diving into the celebration".
      // A gentle orbit on X adds parallax depth. The ambient drift + shake
      // dampens as we approach (sp↑) so the close-up is steadier for detail.
      //
      // v58: During intro (first ~2.8s), camera starts from a dramatic angle
      // (further back, higher, slightly offset) and dollies forward + descends
      // to the hero position. Ambient drift is suppressed during intro so the
      // dolly reads cleanly.
      mouse.x += (targetMouse.x - mouse.x) * 0.025
      mouse.y += (targetMouse.y - mouse.y) * 0.025
      const shakeX = Math.sin(time * 1.3) * 0.03
      const shakeY = Math.cos(time * 1.7) * 0.03
      const driftDamp = (1 - sp * 0.55) * intro   // drift suppressed during intro
      const baseX = Math.sin(sp * Math.PI * 0.45) * 2.2  // subtle orbit
      const baseY = 6 + sp * 3          // 6 → 9 (rise)
      const camStartZ = isMobile ? 13 : 20
      const baseZ = camStartZ - sp * (isMobile ? 4 : 8)   // dolly in (mobile: 13→9, desktop: 20→12)

      // v58: Intro camera — starts further back (z+8), higher (y+4), offset x-3
      // then lerps to the hero position. Post-intro, intro=1 so these are 0.
      const introOffsetX = (1 - intro) * -3     // sweep from left
      const introOffsetY = (1 - intro) * 4      // descend from above
      const introOffsetZ = (1 - intro) * (isMobile ? 5 : 8)  // dolly forward from far

      camera.position.x = baseX + introOffsetX + (Math.sin(time * 0.05) * 2.5 + mouse.x * 3 + shakeX) * driftDamp
      camera.position.y = baseY + introOffsetY + (mouse.y * 1.5 + Math.cos(time * 0.07) * 0.6 + shakeY) * driftDamp
      camera.position.z = baseZ + introOffsetZ + Math.sin(time * 0.03) * 1.2 * intro
      camera.lookAt(0, 2.5 + sp * 1.4, -2)   // gaze rises slightly as we climb

      // v58: Intro bloom + exposure flare — starts elevated, settles to normal
      bloomPass.strength = cfg.bloomStrength + introFlare * 0.15
      renderer.toneMappingExposure = cfg.exposure + introFlare * 0.12

      // cake rotate + star spin + scroll-driven reveal
      // As you scroll, the cake rotates an extra ~72° to reveal its back
      // decorations, and rises slightly to "meet" the descending camera.
      if (cake.userData.isBuilt) {
        cake.rotation.y = time * 0.12 + sp * Math.PI * 0.4
        cake.position.y = -2 + sp * 0.6
        const star = cake.userData.star as THREE.Mesh
        if (star) {
          star.rotation.y = time * 1.2
          star.rotation.z = Math.sin(time * 0.8) * 0.15
        }
      }

      // candle flames flicker + halo pulse + "Make a Wish" flare
      // During the wish climax, flames grow taller & brighter & halos swell.
      // On scroll zoom-in (sp↑), REDUCE the glow so the close-up isn't
      // washed out — candle emissive + halos + light fade as camera leans in.
      const scrollGlowFade = 1 - sp * 0.6   // glow weakens to 40% at full scroll
      for (let i = 0; i < candleFlames.length; i++) {
        const f = candleFlames[i]
        const flick = 0.8 + Math.sin(time * 12 + i * 1.7) * 0.15 + beat * 0.4
        f.light.intensity = f.base * flick * scrollGlowFade * (1 + wish * 1.8)
        f.mat.emissiveIntensity = (1.8 + flick * 1.0 + wish * 2.0) * scrollGlowFade
        // flame stretches taller during the wish (lean-in to blow candles)
        f.flame.scale.set(1 + wish * 0.3, 1 + wish * 1.1, 1 + wish * 0.3)
        const hs = (1.1 + beat * 0.3 + flick * 0.12 + wish * 0.7) * scrollGlowFade
        f.halo.scale.set(hs, hs, 1)
        ;(f.halo.material as THREE.SpriteMaterial).opacity = (0.5 + beat * 0.15 + wish * 0.2) * scrollGlowFade
      }

      // orbiting gifts — always present (visible from entry). Scroll adds a
      // gentle "energy" speed-up so they orbit a touch faster as you scroll,
      // but they stay in place (no fly-in/fly-out).
      for (let i = 0; i < gifts.length; i++) {
        const g = gifts[i]
        if (!g.group.userData.isBuilt) continue
        // subtle radius contract with scroll (gentle gather, not a fly-in)
        const rad = g.radius * (1 - sp * 0.05)
        // VERY slow orbit; scroll adds only a tiny energy boost
        const a = time * (g.speed + sp * 0.008) + g.phase   // v62: slowed sp boost
        g.group.position.x = Math.cos(a) * rad
        g.group.position.z = Math.sin(a) * rad - 2
        g.group.position.y = g.height + Math.sin(time * 0.5 + i) * 0.4
        g.group.rotation.y = a + Math.PI / 2
        g.group.rotation.z = g.tilt + Math.sin(time * 0.4 + i) * 0.1
      }

      // speaker towers — woofer pulse (beat) + LED strip shimmer.
      // Subtle: woofers scale gently on the beat, LED color stays steady.
      const wooferPulse = 1 + beat * 0.08
      for (let i = 0; i < speakerTowers.length; i++) {
        const st = speakerTowers[i]
        if (!st.group.userData.isBuilt) continue
        for (const w of st.woofers) w.scale.set(wooferPulse, 1, wooferPulse)
      }

      // light stands — head sweeps slowly (gentle pan) + lens always glowing.
      // A calm automated moving-head feel, not aggressive.
      for (let i = 0; i < lightStands.length; i++) {
        const ls = lightStands[i]
        if (!ls.group.userData.isBuilt) continue
        // slow pan sweep (±0.5 rad over ~6s)
        ls.head.rotation.y = Math.sin(time * 0.25 + i * Math.PI) * 0.5
        // gentle tilt
        ls.head.rotation.z = Math.sin(time * 0.18 + i) * 0.15
      }

      // sound-wave visualizer — STATIC bars on the floor behind the cake.
      // Only bar HEIGHTS animate (pulse with beat + per-bar sine). Position
      // never changes — bars stay fixed on the floor between the speakers.
      for (let i = 0; i < soundWaveBars.length; i++) {
        const bar = soundWaveBars[i]
        const idx = bar.userData.idx as number
        const total = soundWaveBars.length
        // center bars are taller (bass frequencies), edges shorter (treble)
        const centerWeight = 1 - Math.abs(idx - total / 2) / (total / 2)
        // per-bar sine wave at different frequency — looks like an EQ
        const barWave = (Math.sin(time * 3 + idx * 0.6) * 0.5 + 0.5) * (0.5 + centerWeight * 0.5)
        const height = 0.4 + barWave * 3.0 + beat * 1.5 * centerWeight
        bar.scale.y = height
        // bars grow UPWARD from the floor (anchor at bottom)
        bar.position.y = height / 2
        // emissive intensity pulses with the bar height
        const mat = bar.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.5 + barWave * 0.8 + beat * 0.4
      }
      // base platform subtle pulse
      waveBaseMat.opacity = 0.15 + beat * 0.1

      // ribbons — cascading silk: always fully draped. VERY smooth motion
      // using low-frequency traveling waves + gentle sway that grows toward
      // the free end. 25 control points + centripetal CatmullRom for
      // buttery-smooth curvature with no kinks.
      for (let r = 0; r < ribbons.length; r++) {
        const ribbon = ribbons[r]
        if (!ribbon.mesh.userData.isBuilt) continue
        const flowPhase = time * ribbon.speed + ribbon.phase
        // gentle scroll energy (max +25%)
        const energy = 1 + swell * 0.25
        const pts: THREE.Vector3[] = []
        for (let j = 0; j <= RIBBON_POINTS; j++) {
          const t = j / RIBBON_POINTS
          // primary vertical ripple — LOW frequency for silk-like gentleness
          const waveY = Math.sin(t * Math.PI * 2.5 - flowPhase * 1.2) * ribbon.ampY * 0.4 * energy
          // secondary ultra-soft vertical drift
          const waveY2 = Math.sin(t * Math.PI * 1.2 - flowPhase * 0.5) * ribbon.ampY * 0.2 * energy
          const y = ribbon.topY - t * ribbon.dropDepth + waveY + waveY2
          // horizontal sway — grows toward the free end (bottom flutters more)
          const swayScale = 0.2 + t * 0.8
          // primary sway — LOW frequency
          const swayX = Math.sin(t * Math.PI * 1.8 - flowPhase * 0.9) * ribbon.ampX * swayScale * energy
          // secondary sway — ultra-soft cross-wave
          const swayX2 = Math.cos(t * Math.PI * 0.9 - flowPhase * 0.4) * ribbon.ampX * 0.25 * swayScale * energy
          // depth flutter — very gentle
          const flutterZ = Math.sin(t * Math.PI * 2.0 - flowPhase * 0.5 + r) * (ribbon.ampX * 0.3) * swayScale * energy
          pts.push(new THREE.Vector3(
            ribbon.anchorX + swayX + swayX2,
            y,
            ribbon.baseZ + flutterZ,
          ))
        }
        ribbon.curve.points = pts
        const newGeo = buildFlatRibbon(ribbon.curve, RIBBON_SEGMENTS, RIBBON_WIDTH)
        ribbon.mesh.geometry.dispose()
        ribbon.mesh.geometry = newGeo
        // Flat ribbon uses MeshBasicMaterial — no emissive to adjust, but
        // we can vary opacity slightly with the swell for a subtle shimmer.
        const rm = ribbon.mesh.material as THREE.MeshBasicMaterial
        rm.opacity = 0.8 + swell * 0.15
      }

      // vinyls — always present (visible from entry). Slow base spin with a
      // gentle scroll energy boost (playing slightly louder as you scroll).
      for (let i = 0; i < vinyls.length; i++) {
        const v = vinyls[i]
        if (!v.userData.isBuilt) continue
        const dir = i === 1 ? -1 : 1
        // slow base spin + gentle scroll boost
        v.rotation.y = time * (0.25 + i * 0.08 + sp * 0.05) * dir
        const baseZ = i === 1 ? -0.3 : 0.3
        v.rotation.z = baseZ + Math.sin(time * 0.4 + i) * 0.05
        v.rotation.x = -Math.PI / 8
      }

      // floating music notes — always present (visible from entry). VERY slow
      // rotation + gentle sway/drift, with a light scroll energy boost.
      for (let i = 0; i < notes.length; i++) {
        const n = notes[i]
        if (!n.mesh.userData.isBuilt) continue
        // very slow base spin + tiny scroll boost
        n.mesh.rotation.y = time * (n.spin + sp * 0.01) + n.offset
        n.mesh.rotation.z = Math.sin(time * 0.5 + n.offset) * 0.2
        n.mesh.position.x = n.basePos.x + Math.sin(time * 0.2 + n.offset) * 0.8
        n.mesh.position.y = n.basePos.y + Math.sin(time * 0.35 + n.offset) * 0.7 + sp * 0.3
        n.mesh.position.z = n.basePos.z + Math.cos(time * 0.25 + n.offset) * 0.6
        // restore the per-note base scale (visible throughout)
        n.mesh.scale.setScalar(n.mesh.userData.noteScale as number)
      }

      // balloons breathe + bob + scroll-release (rise as you scroll)
      const breathe = 1 + beat * 0.04
      const releaseY = sp * 1.5   // v62: slowed from 4 → 1.5 (was too fast)
      for (let i = 0; i < balloons.length; i++) {
        const b = balloons[i]
        if (!b.mesh.userData.isBuilt) continue
        b.mesh.position.y = b.baseY + Math.sin(time * 0.5 + b.offset) * 0.4 + releaseY
        b.mesh.position.x += Math.sin(time * 0.3 + b.offset) * 0.003
        b.mesh.scale.setScalar(b.baseScale * breathe)
        b.mesh.rotation.z = Math.sin(time * 0.4 + b.offset) * 0.05
      }

      // lanterns drift up (faster as you scroll — celebration lifts)
      const lanternBoost = 1 + sp * 0.3   // v62: slowed from 0.8 → 0.3
      for (let i = 0; i < lanterns.length; i++) {
        const l = lanterns[i]
        if (!(l.mesh.material as THREE.Material).userData.isFaded) continue
        l.mesh.position.y += l.speed * lanternBoost * delta
        l.mesh.position.x += Math.sin(time * 0.5 + i) * 0.01
        if (l.mesh.position.y > 18) {
          l.mesh.position.y = -2
          l.mesh.position.x = (Math.random() - 0.5) * 30
        }
        l.light.intensity = 1.2 + beat * 0.6 + sp * 0.2
      }

      // confetti fall (denser/faster mid-scroll) + horizontal swirl
      if (confetti && confettiMat && confettiMat.userData.isFaded) {
        const arr = (confetti.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array
        const vel = confetti.userData.vel as number[]
        const fallBoost = 1 + sp * 0.2   // v62: slowed from 0.6 → 0.2
        // swirl strength grows with scroll (gentle vortex)
        const swirl = swell * 0.012
        for (let i = 0; i < cfg.confettiCount; i++) {
          arr[i * 3 + 1] -= vel[i] * fallBoost * delta * 10
          arr[i * 3] += Math.sin(time + i) * 0.005 + swirl * Math.cos(i * 0.7)
          arr[i * 3 + 2] += Math.cos(time + i) * 0.004 + swirl * Math.sin(i * 0.7)
          if (arr[i * 3 + 1] < -3) {
            arr[i * 3 + 1] = 28
            arr[i * 3] = (Math.random() - 0.5) * 50
            arr[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4
          }
        }
        ;(confetti.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
      }

      // sparkles twinkle
      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i]
        const m = s.material as THREE.MeshBasicMaterial
        m.opacity = 0.3 + Math.abs(Math.sin(time * s.userData.speed + s.userData.phase)) * 0.7
      }

      // bokeh drift
      for (let i = 0; i < bokehSprites.length; i++) {
        const sp = bokehSprites[i]
        sp.position.x += sp.userData.driftX * delta
        sp.position.y += sp.userData.driftY * delta
        if (sp.position.x > 24) sp.position.x = -24
        if (sp.position.x < -24) sp.position.x = 24
        if (sp.position.y > 18) sp.position.y = -2
        if (sp.position.y < -2) sp.position.y = 18
      }

      // shafts sway
      for (let i = 0; i < shafts.length; i++) {
        shafts[i].rotation.z = (i - 1) * 0.25 + Math.sin(time * 0.4 + i) * 0.05
        ;(shafts[i].material as THREE.MeshBasicMaterial).opacity = 0.14 + beat * 0.06
      }

      // light cone pulse + scroll swell (brighter as you dive in)
      ;(lightCone.material as THREE.MeshBasicMaterial).opacity = 0.06 + beat * 0.04 + sp * 0.05 + wish * 0.06

      // ---- wish-sparkles: emit from each candle flame, rise & fade ----
      // Intensifies dramatically during the "Make a Wish" climax.
      if (wishSparkles && wishSparkleMat && wishSparkleMat.userData.isFaded) {
        const arr = (wishSparkles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array
        const tmp = new THREE.Vector3()
        const riseBoost = 1 + wish * 1.5
        for (let i = 0; i < cfg.wishSparkleCount; i++) {
          const d = wishData[i]
          d.age += delta / d.life
          if (d.age >= 1) {
            // respawn at a random candle
            d.age = 0
            d.candleIdx = Math.floor(Math.random() * candleFlames.length)
            d.life = 1.2 + Math.random() * 1.6
            d.rise = 1.2 + Math.random() * 1.0
            d.sway = Math.random() * Math.PI * 2
          }
          const f = candleFlames[d.candleIdx]
          // world position of the flame (cake rotates, so recompute each frame)
          f.light.getWorldPosition(tmp)
          const t = d.age
          arr[i * 3] = tmp.x + Math.sin(time * 3 + d.sway) * 0.4 * t
          arr[i * 3 + 1] = tmp.y + t * d.rise * riseBoost
          arr[i * 3 + 2] = tmp.z + Math.cos(time * 2.5 + d.sway) * 0.4 * t
        }
        ;(wishSparkles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
        wishSparkleMat.opacity = 0.5 + wish * 0.5
        wishSparkleMat.size = 0.35 + wish * 0.25
      }

      // ---- floating hearts: drift up + sway + spin ----
      for (let i = 0; i < heartSprites.length; i++) {
        const h = heartSprites[i]
        if (!(h.material as THREE.Material).userData.isFaded) continue
        h.position.y += h.userData.speed * delta * (1 + sp * 0.5)
        h.position.x += Math.sin(time * 0.6 + h.userData.sway) * 0.008
        h.material.rotation += h.userData.spin * delta
        if (h.position.y > 18) {
          h.position.y = -2
          h.position.x = (Math.random() - 0.5) * 30
        }
        ;(h.material as THREE.SpriteMaterial).opacity = 0.6 + wish * 0.3 + Math.sin(time * 2 + h.userData.sway) * 0.1
      }

      // ---- ambient pulse + scroll swell + "Make a Wish" warm climax ----
      // On scroll zoom-in, the cake spotlight + bloom DIM so the close-up
      // isn't washed out. The wish peak still adds a warm boost at sp≈0.75.
      purplePoint.intensity = 32 + beat * 12 + swell * 14
      pinkPoint.intensity = 28 + beat * 10 + swell * 12
      cakeSpot.intensity = (1.4 + beat * 0.2 + wish * 1.6) * (1 - sp * 0.5)
      bloomPass.strength = (cfg.bloomStrength + beat * 0.04 + swell * 0.04 + wish * 0.08) * (1 - sp * 0.4)
      // warm tint: shift the cake spotlight toward gold during the wish
      cakeSpot.color.setRGB(1, 0.96 - wish * 0.06, 0.84 - wish * 0.12)

      composer.render()
    }

    // v64: only add mousemove on desktop — mousemove on mobile causes lag
    const onMouseMove = (e: MouseEvent) => {
      targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1
      targetMouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    if (!isMobile) {
      window.addEventListener('mousemove', onMouseMove)
    }
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      renderer.setPixelRatio(cfg.pixelRatio)
      composer.setSize(w, h)
      fxaaPass.material.uniforms['resolution'].value.set(1 / (w * cfg.pixelRatio), 1 / (h * cfg.pixelRatio))
    }
    window.addEventListener('resize', onResize)
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(animationId)
      else { clock.getDelta(); animate() }
    }
    document.addEventListener('visibilitychange', onVisibility)

    animate()

    // ---- cleanup ----
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('resize', updateScrollTarget)
      window.removeEventListener('scroll', updateScrollTarget)
      document.removeEventListener('visibilitychange', onVisibility)

      scene.traverse((obj) => {
        const node = obj as unknown as { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }
        if (node.geometry) node.geometry.dispose()
        if (node.material) {
          if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose())
          else node.material.dispose()
        }
      })

      velvetTex.dispose()
      frostingTex.dispose()
      confettiAtlas.dispose()
      wrappingTextures.forEach((t) => t.dispose())
      shaftTex.dispose()
      bokehTex.dispose()
      sparkleTex.dispose()
      heartTex.dispose()
      pmremRT.dispose()
      pmremGenerator.dispose()

      const reflectorDisposable = floorReflector as unknown as { dispose?: () => void } | null
      reflectorDisposable?.dispose?.()
      composer.dispose()
      scene.clear()
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(110% 80% at 50% 14%, #2a0f4a 0%, #1a0830 35%, #0a0316 70%, #050109 100%)',
      }}
      aria-hidden="true"
    />
  )
}

export default Birthday3DBackground
