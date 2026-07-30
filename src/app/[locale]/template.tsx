'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

/**
 * Page transition wrapper.
 * template.tsx re-mounts on every navigation (unlike layout.tsx which
 * persists), so the motion div plays its enter animation on each route
 * change. This gives a smooth fade+slide transition between pages.
 *
 * Per fix brief: addresses "no page transitions (Score 1/10)".
 *
 * Note: `MotionConfig reducedMotion="user"` is set in layout.tsx, so users
 * with `prefers-reduced-motion: reduce` automatically get instant (no
 * animation) transitions — no extra handling needed here.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
