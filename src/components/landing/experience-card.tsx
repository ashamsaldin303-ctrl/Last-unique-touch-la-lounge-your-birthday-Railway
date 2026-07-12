'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowRight, ArrowLeft, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExperienceCardProps {
  category: string
  title: string
  actionText: string
  productImageUrl: string
  logoUrl: string
  isComingSoon?: boolean
  delay?: number
  index: string
  accentColor: 'heritage' | 'modern' | 'atelier'
  locale: 'ar' | 'en'
  onClick?: () => void
}

/**
 * Brand hex map for the three experience cards.
 * - heritage  → LUT red (#E3222B)
 * - modern    → La Lounge magenta (#E6007E)
 * - atelier   → Your Birthday gold (#F5B914)
 */
const BRAND_HEX: Record<'heritage' | 'modern' | 'atelier', string> = {
  heritage: '#E3222B',
  modern: '#E6007E',
  atelier: '#F5B914',
}

/** Convert hex (#RRGGBB) to an rgba() string with given alpha (0–1). */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function ExperienceCard({
  category,
  title,
  actionText,
  productImageUrl,
  logoUrl,
  isComingSoon = false,
  delay = 0,
  index,
  accentColor,
  locale,
  onClick,
}: ExperienceCardProps) {
  const cardIdx = Math.max(0, parseInt(index, 10) - 1)
  const cardRef = useRef<HTMLDivElement>(null)
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight
  const brandHex = BRAND_HEX[accentColor]
  const brandGlowSoft = hexToRgba(brandHex, 0.06)
  // Track scroll direction + visibility to drive the exit/enter animation.
  // 'enter' = card is in view (animate in), 'exit' = scrolled past (animate out).
  const [animState, setAnimState] = useState<'enter' | 'exit'>('enter')

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    // Determine the exit/enter direction based on scroll position:
    // - Card 'exits' (slides out) once it has scrolled UP past the viewport top
    //   (i.e., its bottom edge is above the viewport top).
    // - Card 'enters' (slides back in) when it returns into view.
    const update = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // Exit when the card's bottom is above ~15% of viewport height
      // (card has mostly scrolled out of view at the top)
      const isExiting = rect.bottom < vh * 0.15
      setAnimState(isExiting ? 'exit' : 'enter')
    }

    // Perf fix: throttle scroll handler with requestAnimationFrame so we
    // never run more than one layout read per frame. The resize listener
    // is also marked { passive: true }.
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        update()
        ticking = false
      })
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`${category} - ${title}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        'mobile-card-slide card-scroll-anim relative w-full h-[150px] sm:h-[170px] md:h-[280px] lg:h-[320px] group flex items-center',
        isComingSoon ? 'cursor-default' : 'cursor-pointer',
        `card-scroll-${animState}`,
      )}
      style={{ ['--card-idx' as string]: cardIdx } as React.CSSProperties}
    >
      {/* 1. Holo-Chamber (circular bezel — image pops out) */}
      <div
        className="holo-chamber-anim h-full aspect-square relative flex items-center justify-center select-none shrink-0 z-20"
        style={{ animationDelay: `${delay + 0.1}s` }}
      >
        {/* Orbital rings */}
        <div className="absolute inset-0 rounded-full border border-white/[0.05] group-hover:border-white/20 transition-colors duration-700 scale-95 group-hover:scale-105" />
        <div className="absolute inset-2 rounded-full border border-dashed border-white/[0.08] animate-[spin_30s_linear_infinite] group-hover:border-white/20 transition-colors" />
        <div className="absolute inset-4 rounded-full border border-double border-white/[0.03] animate-[spin_15s_linear_infinite_reverse]" />

        {/* Floating Bezel */}
        <div className="absolute inset-3 bg-gradient-to-tr from-black/95 via-[#080808] to-white/[0.04] rounded-full border border-white/[0.08] group-hover:border-white/[0.22] shadow-[inset_0_0_20px_rgba(0,0,0,0.95),0_10px_30px_rgba(0,0,0,0.6)] group-hover:shadow-[0_15px_40px_rgba(255,255,255,0.06)] transition-all duration-700 flex items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          {/* Ambient glow — uses the actual brand hex (LUT red / La Lounge magenta / Your Birthday gold) */}
          <div
            className="absolute bottom-0 right-0 w-24 h-24 rounded-full blur-xl transition-colors duration-700 group-hover:brightness-150"
            style={{ backgroundColor: brandGlowSoft }}
          />

          {/* Grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:8px_8px] opacity-50" />
          <div className="absolute w-4 h-[1px] bg-white/15" />
          <div className="absolute h-4 w-[1px] bg-white/15" />

          {/* Product Image */}
          <div
            className="holo-image-anim relative w-[85%] h-[85%] z-10 group-hover:scale-110 transition-transform duration-700"
            style={{ animationDelay: `${delay + 0.2}s` }}
          >
            <Image
              src={productImageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 150px, 280px"
              className="object-contain pointer-events-none"
              priority
            />
          </div>
        </div>
      </div>

      {/* 2. Connecting Bridge */}
      <div
        className="bridge-anim w-4 md:w-8 lg:w-10 h-[1px] bg-gradient-to-r from-white/10 via-white/30 to-white/10 relative shrink-0 z-10"
        style={{ animationDelay: `${delay + 0.25}s` }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-700 group-hover:scale-125"
          style={{
            backgroundColor: hexToRgba(brandHex, 0.6),
            boxShadow: `0 0 8px ${hexToRgba(brandHex, 0.8)}`,
          }}
        />
      </div>

      {/* 3. Info Plate */}
      <div
        className="plate-anim flex-1 h-full bg-[#050505]/60 hover:bg-[#070707]/70 backdrop-blur-lg rounded-lg md:rounded-lg lg:rounded-lg border border-white/[0.08] group-hover:border-white/[0.2] transition-all duration-700 overflow-hidden flex flex-col justify-between p-4 md:p-7 lg:p-8 relative shadow-2xl group-hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)] z-20"
        style={{ animationDelay: `${delay + 0.15}s` }}
      >
        {/* Header */}
        <div className="flex justify-between items-center w-full relative z-10">
          <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] lg:text-[11px] text-white/40 tracking-[0.2em] font-medium uppercase bg-white/[0.03] border border-white/5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full">
            <span>EXP</span>
            <span style={{ color: brandHex }}>{'//'}</span>
            <span>{index}</span>
          </div>
          {/* Brand Logo */}
          <div className="w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-md md:rounded-lg bg-black/60 border border-white/[0.08] group-hover:border-white/20 transition-all duration-700 flex items-center justify-center relative overflow-hidden shadow-inner shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent" />
            <div className="absolute inset-0.5 rounded-[10px] border border-dashed border-white/10 group-hover:border-white/30 animate-[spin_20s_linear_infinite]" />
            <Image
              src={logoUrl}
              alt={title}
              width={40}
              height={40}
              className="relative w-[60%] h-[60%] object-contain rounded-sm"
            />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-end gap-1.5 md:gap-2 transform transition-transform duration-700 group-hover:-translate-x-1.5 rtl:group-hover:translate-x-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[8px] md:text-[10px] lg:text-[11px] font-bold tracking-[0.4em] text-white/50 uppercase">{category}</span>
            <div
              className="w-1 h-1 rounded-full transition-all duration-500"
              style={{
                backgroundColor: brandHex,
                boxShadow: `0 0 8px ${hexToRgba(brandHex, 0.8)}`,
              }}
            />
          </div>
          <h2 className="text-lg md:text-2xl lg:text-3xl font-display text-white tracking-wide font-light">{title}</h2>
          <div className={cn(
            'flex items-center gap-2 text-[9px] md:text-[11px] lg:text-[12px] font-bold tracking-[0.25em] uppercase mt-0.5 transition-all duration-700',
            isComingSoon ? 'text-white/30' : 'text-white/60 group-hover:text-white',
          )}>
            <span>{actionText}</span>
            <span>{isComingSoon ? <Plus className="w-4 h-4" /> : <ArrowIcon className="w-4 h-4" />}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
