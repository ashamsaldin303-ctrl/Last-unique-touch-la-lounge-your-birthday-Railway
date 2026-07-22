'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface RevealTextProps {
  children: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

export function RevealText({
  children,
  className = '',
  as: Tag = 'p',
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'start 0.4'],
  })

  const words = children.split(' ')

  return (
    <Tag
      ref={ref as React.RefObject<HTMLHeadingElement>}
      className={className}
    >
      {words.map((word, i) => {
        const start = i / words.length
        const end = start + 1 / words.length
        return <Word key={i} progress={scrollYProgress} range={[start, end]}>{word}</Word>
      })}
    </Tag>
  )
}

function Word({
  children,
  progress,
  range,
}: {
  children: string
  progress: ReturnType<typeof useScroll>['scrollYProgress']
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [0, 1])
  const y = useTransform(progress, range, [20, 0])
  return (
    <span className="inline-block overflow-hidden" style={{ marginInlineEnd: '0.25em' }}>
      <motion.span
        style={{ opacity, y }}
        className="inline-block"
      >
        {children}
      </motion.span>
    </span>
  )
}
