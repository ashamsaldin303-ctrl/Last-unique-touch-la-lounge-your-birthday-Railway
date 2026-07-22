'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface ParallaxImageProps {
  children: ReactNode
  className?: string
  offset?: number
}

export function ParallaxImage({
  children,
  className = '',
  offset = 100,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [-offset / 2, offset / 2])
  // Scale stays at/above 1.15 to prevent edge gaps when the inner div is
  // translated vertically by `y` (the absolute inset-0 layer must always
  // overflow the parent).
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.25, 1.15, 1.25])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y, scale }} className="absolute inset-0 w-full h-full">
        {children}
      </motion.div>
    </div>
  )
}
