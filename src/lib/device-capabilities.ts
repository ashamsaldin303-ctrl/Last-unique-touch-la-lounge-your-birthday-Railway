'use client'

/**
 * Detects whether the current device/browser can comfortably run the 3D hero.
 * Returns false for: reduced-motion preference, no WebGL, very low-end devices.
 */

/**
 * Minimum CPU cores required to enable the 3D scene.
 * The hero scene is optimized (draw calls reduced ~52% via geometry merging
 * and instancing), so 2-core devices can run it comfortably. We gate only on
 * truly incapable hardware (< 2 cores).
 */
const MIN_CORES_FOR_3D = 2

/**
 * Minimum device memory (GB, exposed as `navigator.deviceMemory`) required to
 * enable the 3D scene. The scene fits comfortably in ~512 MB of GPU/CPU
 * memory after optimization, so we gate only on devices below 2 GB.
 */
const MIN_MEMORY_GB_FOR_3D = 2

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
  // The 3D scene is now optimized (draw calls reduced 52% via geometry
  // merging + instancing). 2-core / 2-GB devices can run it comfortably, so
  // we gate ONLY on truly incapable hardware (< MIN_CORES_FOR_3D cores or
  // < MIN_MEMORY_GB_FOR_3D GB).
  //
  // Task 2b fix: a previous revision (commit 6a540be / "v23-fix-F3") had
  // accidentally raised the threshold to `< 4`, which silently disabled the
  // 3D background on 2- to 3-core preview browsers and mid-range mobile
  // devices — contradicting the documented intent above. The "v24-fix-F4"
  // note claimed to have restored `< 2` but the code still read `< 4`. We
  // now use the named constants below so the threshold is unambiguous and
  // matches the documented behavior.
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mem = nav.deviceMemory ?? 4
  const cores = nav.hardwareConcurrency ?? 4
  if (mem < MIN_MEMORY_GB_FOR_3D || cores < MIN_CORES_FOR_3D) return false

  return true
}
