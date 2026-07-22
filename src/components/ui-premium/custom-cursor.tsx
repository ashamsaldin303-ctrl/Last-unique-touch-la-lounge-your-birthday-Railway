'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const [isPointer, setIsPointer] = useState(false)

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springConfig = { damping: 25, stiffness: 400 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  useEffect(() => {
    // Only enable on devices with fine pointer (mouse)
    if (window.matchMedia('(pointer: coarse)').matches) return

    // Hide native cursor while the custom cursor overlay is active
    document.body.classList.add('custom-cursor-active')

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 8)
      cursorY.set(e.clientY - 8)
      setIsVisible(true)

      if (!(e.target instanceof HTMLElement)) return
      const target = e.target
      const isInteractive =
        target.closest('a, button, [role="button"], input, textarea, select, .cursor-pointer') !== null
      setIsPointer(isInteractive)
    }

    const hideCursor = () => setIsVisible(false)

    window.addEventListener('mousemove', moveCursor)
    document.addEventListener('mouseleave', hideCursor)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      document.removeEventListener('mouseleave', hideCursor)
      document.body.classList.remove('custom-cursor-active')
    }
  }, [cursorX, cursorY])

  if (!isVisible) return null

  return (
    <>
      {/* Main dot */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[10000] hidden md:block"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      >
        <motion.div
          className="rounded-full"
          animate={{
            width: isPointer ? 40 : 8,
            height: isPointer ? 40 : 8,
            backgroundColor: isPointer
              ? 'rgba(230, 33, 41, 0.2)'
              : 'rgba(230, 33, 41, 0.8)',
            border: isPointer ? '1px solid rgba(230, 33, 41, 0.6)' : 'none',
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            marginLeft: isPointer ? -16 : 0,
            marginTop: isPointer ? -16 : 0,
          }}
        />
      </motion.div>
    </>
  )
}
