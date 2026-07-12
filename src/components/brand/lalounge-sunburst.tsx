import { cn } from '@/lib/utils'

/**
 * La Lounge art-deco signature — a sunburst / rays motif.
 *
 * Rendered as decorative SVG using `currentColor` (default `text-deco-gold/30`)
 * so it picks up the La Lounge deco-gold accent (`--color-deco-gold: #C9A24B`).
 *
 * 24 rays emanate from a central point, framed by two concentric circles —
 * the geometric rhythm of 1920s art deco.
 */
export function LaLoungeSunburst({ className }: { className?: string }) {
  return (
    <svg
      className={cn('text-deco-gold/30', className)}
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180
        const x2 = 200 + Math.cos(angle) * 300
        const y2 = 100 + Math.sin(angle) * 300
        return (
          <line
            key={i}
            x1="200"
            y1="100"
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="0.5"
          />
        )
      })}
      <circle cx="200" cy="100" r="20" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <circle cx="200" cy="100" r="14" stroke="currentColor" strokeWidth="0.5" fill="none" />
    </svg>
  )
}
