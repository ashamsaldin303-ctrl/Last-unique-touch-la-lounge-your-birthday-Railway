'use client'

/**
 * La Lounge light sweep — a diagonal deco-gold beam that periodically sweeps
 * across the hero. CSS-only animation (defined in globals.css as
 * `.lalounge-sweep-beam` + `@keyframes lalounge-sweep`).
 *
 * Pure decoration: `pointer-events-none`, `aria-hidden`, and disabled under
 * `prefers-reduced-motion`. Render above the hero background but below the
 * navbar / hero text.
 */
export function LaLoungeLightSweep() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="lalounge-sweep-beam" />
    </div>
  )
}
