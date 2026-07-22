'use client'

import { useEffect, useState, useRef } from 'react'
import { useLocale } from 'next-intl'

export function LaLoungeLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const locale = useLocale()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(100, prev + 2))
    }, 25)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress < 100) return
    const t1 = setTimeout(() => setVisible(false), 300)
    const t2 = setTimeout(() => onCompleteRef.current(), 800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [progress])

  const t = locale === 'ar' ? {
    loading: 'جارٍ التحميل',
    brand: 'La Lounge',
  } : {
    loading: 'Loading',
    brand: 'La Lounge',
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#fafafa] transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center">
        {/* Animated logo */}
        <div className="mb-8">
          <h1
            className="text-5xl md:text-7xl font-display font-light tracking-widest"
            style={{
              background: 'linear-gradient(135deg, #7e22ce, #ec4899, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t.brand}
          </h1>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-[width] duration-100"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7e22ce, #ec4899, #c084fc)',
              }}
            />
          </div>
          <p className="text-xs text-primary mt-2 tracking-widest uppercase font-mono">
            {t.loading} {progress}%
          </p>
        </div>
      </div>
    </div>
  )
}
