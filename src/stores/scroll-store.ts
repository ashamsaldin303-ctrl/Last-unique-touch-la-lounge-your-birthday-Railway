'use client'

import { create } from 'zustand'

interface ScrollState {
  /** Normalized hero scroll offset: 0 = hero fully visible, 1 = hero fully scrolled past */
  offset: number
  /** Whether the hero section is currently in the viewport */
  isHeroVisible: boolean
  setOffset: (v: number) => void
  setHeroVisible: (v: boolean) => void
}

export const useScrollStore = create<ScrollState>((set) => ({
  offset: 0,
  isHeroVisible: true,
  setOffset: (v) => set({ offset: v }),
  setHeroVisible: (v) => set({ isHeroVisible: v }),
}))

/**
 * Initialize a RAF loop that tracks the hero section's scroll offset.
 * Call once on the client (inside a useEffect). Returns a cleanup fn.
 *
 * The offset is computed from the hero element's bounding rect: when the
 * hero top is at viewport top, offset = 0; when the hero bottom reaches
 * viewport top, offset = 1.
 */
export function initScrollTracking(heroEl: HTMLElement | null): () => void {
  if (!heroEl || typeof window === 'undefined') return () => {}

  let rafId = 0
  let heroVisible = true
  let lastOffset = -1

  const update = () => {
    const rect = heroEl.getBoundingClientRect()
    const vh = window.innerHeight || 1
    // offset goes 0 → 1 as the hero scrolls out of view
    const scrolled = Math.max(0, -rect.top)
    const total = rect.height || vh
    const offset = Math.min(1, Math.max(0, scrolled / total))

    const visible = rect.bottom > 0 && rect.top < vh
    if (visible !== heroVisible) {
      heroVisible = visible
      useScrollStore.getState().setHeroVisible(visible)
    }

    // Only call setOffset when the value actually changes
    if (offset !== lastOffset) {
      lastOffset = offset
      useScrollStore.getState().setOffset(offset)
    }

    // Stop the RAF loop once the hero is no longer visible — the scroll
    // listener below will restart it if the hero comes back into view.
    if (!heroVisible) {
      rafId = 0
      return
    }
    rafId = requestAnimationFrame(update)
  }

  const onScroll = () => {
    if (!rafId) {
      rafId = requestAnimationFrame(update)
    }
  }

  rafId = requestAnimationFrame(update)
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    window.removeEventListener('scroll', onScroll)
  }
}
