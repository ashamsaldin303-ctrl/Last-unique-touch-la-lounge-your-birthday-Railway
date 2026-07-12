'use client'

/**
 * Detects whether the current device/browser can comfortably run the 3D hero.
 * Returns false for: reduced-motion preference, no WebGL, very low-end devices.
 */
export function shouldEnable3D(): boolean {
  if (typeof window === 'undefined') return false

  // Respect reduced-motion preference
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false
  }

  // Require WebGL
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    // Release the context so we don't leak GPU resources just by probing
    const loseExt = gl.getExtension('WEBGL_lose_context')
    loseExt?.loseContext()
  } catch {
    return false
  }

  // Low memory / cores → skip 3D.
  // v20: lowered from 4→2 cores/mem because the scene is now optimized
  // (draw calls reduced 52% via geometry merging + instancing). 2-core
  // devices can run it comfortably. Only gate on truly incapable hardware
  // (< 2 cores or < 2 GB).
  // v24-fix-F4: restored from < 4 back to < 2 — commit 6a540be (v23-fix-F3)
  // had accidentally reverted this, which disabled the 3D background in the
  // 2-core preview browser (and on mid-range mobile devices) and prevented
  // verification of the static-background / scroll-glitch fix in this task.
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mem = nav.deviceMemory ?? 4
  const cores = nav.hardwareConcurrency ?? 4
  if (mem < 2 || cores < 2) return false

  return true
}
