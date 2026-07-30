'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onComplete: () => void
  locale: 'ar' | 'en'
}

export function BirthdayLoadingScreen({ onComplete, locale }: Props) {
  const loadingText = locale === 'ar' ? 'جارٍ التحميل' : 'Loading'
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 2))
    }, 20)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress < 100) return
    const hideTimer = setTimeout(() => setVisible(false), 300)
    const completeTimer = setTimeout(() => onCompleteRef.current(), 800)
    return () => {
      clearTimeout(hideTimer)
      clearTimeout(completeTimer)
    }
  }, [progress])

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#020204] transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center">
        <div className="mb-8">
          <h1
            className="text-4xl md:text-6xl font-black tracking-tighter"
            style={{
              fontFamily: 'var(--font-birthday-headline), Orbitron, sans-serif',
              background: 'linear-gradient(135deg, #F5B914, #FFD147, #C9950E)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Your Birthday
          </h1>
        </div>

        <div className="w-64 mx-auto">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-[width] duration-100"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #F5B914, #FFD147, #C9950E)',
              }}
            />
          </div>
          <p
            className="text-xs text-primary-foreground/40 mt-2 tracking-widest uppercase font-mono"
            style={{ fontFamily: 'var(--font-birthday-sub), Rajdhani, sans-serif' }}
          >
            {loadingText} {progress}%
          </p>
        </div>
      </div>
    </div>
  )
}
