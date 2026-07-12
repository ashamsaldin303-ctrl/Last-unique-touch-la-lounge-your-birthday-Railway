import { cn } from '@/lib/utils'

type Variant = 'divider' | 'corner' | 'bg'

/**
 * LUT brand signature ornament — arabesque-inspired SVG decoration.
 *
 * Three variants:
 *  - `divider` — horizontal hairline with a central arabesque motif, used between sections.
 *  - `corner` — small corner ornament, used at card corners.
 *  - `bg` — large faint background pattern at ~4% opacity, used in the hero.
 *
 * All variants inherit `currentColor` (set via `text-brass/40` etc.) so they
 * pick up the LUT brass accent (`--color-brass: #A9812E`) without hardcoded fills.
 */
export function LutArabesque({ variant, className }: { variant: Variant; className?: string }) {
  if (variant === 'divider') {
    return (
      <svg
        className={cn('text-brass/40', className)}
        viewBox="0 0 240 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <line x1="0" y1="12" x2="90" y2="12" stroke="currentColor" strokeWidth="0.5" />
        <line x1="150" y1="12" x2="240" y2="12" stroke="currentColor" strokeWidth="0.5" />
        <g transform="translate(120, 12)">
          <circle r="6" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <circle r="3" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <path
            d="M-12,0 Q-6,-6 0,0 Q6,6 12,0 Q6,-6 0,0 Q-6,6 -12,0"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
          />
        </g>
      </svg>
    )
  }

  if (variant === 'corner') {
    return (
      <svg
        className={cn('text-brass/30', className)}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M0,0 L40,0 L40,1 L1,1 L1,40 L0,40 Z" fill="currentColor" />
        <path
          d="M5,5 Q15,5 15,15 Q5,15 5,5"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
        />
        <circle cx="10" cy="10" r="1" fill="currentColor" />
      </svg>
    )
  }

  // variant === 'bg'
  // Phase 5 motion cleanup: reduced from 0.04 → 0.02 so the arabesque is
  // barely-there behind the 3D furniture tunnel (which is the LUT signature
  // motion). The divider + corner variants keep their original opacity.
  return (
    <svg
      className={cn('text-brass/[0.02]', className)}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="arabesque-pattern"
          x="0"
          y="0"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M50,0 Q75,25 50,50 Q25,75 50,100 Q25,75 0,50 Q25,25 50,0"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
          />
          <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <circle cx="50" cy="50" r="4" stroke="currentColor" strokeWidth="0.5" fill="none" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#arabesque-pattern)" />
    </svg>
  )
}
