'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { HeroCanvas } from './hero-canvas'
import { shouldEnable3D } from '@/lib/device-capabilities'

interface Hero3DSectionProps {
  cardRefs: React.RefObject<HTMLElement | null>[]
  children: ReactNode
}

export function Hero3DSection({ cardRefs, children }: Hero3DSectionProps) {
  const [modelsVisible, setModelsVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [inView, setInView] = useState(true)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEnabled(shouldEnable3D())
  }, [])

  useEffect(() => {
    if (!enabled) return
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    const t = setTimeout(() => setModelsVisible(true), isMobile ? 1000 : 1500)
    return () => clearTimeout(t)
  }, [enabled])

  useEffect(() => {
    if (!enabled || !sectionRef.current) return
    const el = sectionRef.current
    // ⚠️ Lower threshold (1%) to avoid rapid on/off toggling that caused
    // WebGL context loss glitches on scroll.
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [enabled])

  return (
    <div ref={sectionRef} className="relative w-full h-full">
      {/* 1. Cards (children) — z-10 */}
      <div className="relative z-10 w-full h-full">{children}</div>

      {/* 2. Canvas — always mounted while enabled (prevents WebGL context loss).
          Visibility is gated by `modelsVisible` (pop-in) + `inView` controls
          the frameloop inside HeroCanvas via the `visible` prop. */}
      {enabled && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          aria-hidden="true"
          style={{ visibility: inView ? 'visible' : 'hidden' }}
        >
          <HeroCanvas modelsVisible={modelsVisible && inView} cardRefs={cardRefs} />
        </div>
      )}
    </div>
  )
}
