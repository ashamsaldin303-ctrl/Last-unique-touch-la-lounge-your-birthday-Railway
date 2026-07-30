/**
 * La Lounge loading — "modern events".
 *
 * Mini-story: the stage is set — twin spotlights converge from above,
 * a faceted magenta crystal rotates at center stage, sparkles erupt
 * like paparazzi flashes, and a soft pool of light pools on the floor.
 * Conveys the modern, glamorous, event-planning identity of the brand.
 *
 * Server Component / Suspense fallback — CSS-only, no JS.
 */
export default function Loading() {
  const stroke = {
    stroke: '#FF6B9D',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  }

  // 12 sparkles arranged around the crystal at varying radii/angles.
  const sparkles: {
    top: string
    left: string
    size: number
    delay: string
    points: 4 | 6
  }[] = [
    { top: '10%', left: '50%', size: 7, delay: '0s', points: 4 },
    { top: '18%', left: '74%', size: 4, delay: '0.4s', points: 6 },
    { top: '24%', left: '88%', size: 5, delay: '0.8s', points: 4 },
    { top: '50%', left: '92%', size: 6, delay: '1.2s', points: 4 },
    { top: '76%', left: '82%', size: 4, delay: '0.2s', points: 6 },
    { top: '86%', left: '62%', size: 6, delay: '0.6s', points: 4 },
    { top: '90%', left: '38%', size: 5, delay: '1s', points: 4 },
    { top: '76%', left: '18%', size: 4, delay: '1.4s', points: 6 },
    { top: '50%', left: '8%', size: 6, delay: '0.3s', points: 4 },
    { top: '24%', left: '12%', size: 5, delay: '0.7s', points: 4 },
    { top: '18%', left: '26%', size: 4, delay: '1.1s', points: 6 },
    { top: '32%', left: '78%', size: 3, delay: '1.5s', points: 4 },
  ]

  // 2 spotlight cones from the top corners — V-shaped convergence.
  const cones = [
    { left: '24%', skew: '14deg', delay: '0s', dur: '4.4s' },
    { left: '76%', skew: '-14deg', delay: '0.7s', dur: '4.8s' },
  ]

  // 8 dots arranged around the crystal — rotating orbit ring.
  const orbitDots = Array.from({ length: 8 })

  // Build a 4-point or 6-point star path based on `points`.
  const starPath = (points: 4 | 6) => {
    if (points === 4) {
      return 'M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z'
    }
    // 6-point: two interleaved triangles
    return 'M12 1 L15 9 L23 8 L17 14 L19 22 L12 18 L5 22 L7 14 L1 8 L9 9 Z'
  }

  return (
    <div
      className="relative min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#150912] flex"
      role="status"
      aria-live="polite"
    >
      {/* Deep plum → magenta radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(230,0,126,0.22) 0%, rgba(230,0,126,0.11) 28%, rgba(21,9,18,0.4) 60%, transparent 80%)',
        }}
      />

      {/* Diagonal magenta beams (event-spotlight feel) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-25deg, rgba(230,0,126,0.9) 0, rgba(230,0,126,0.9) 1px, transparent 1px, transparent 26px)',
        }}
      />

      {/* Twin spotlight cones from the top corners — V convergence */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {cones.map((c, i) => (
          <div
            key={`cone-${i}`}
            className="absolute top-0 h-[80%] motion-safe:[animation:spotlight-pulse_var(--cd)_ease-in-out_infinite] will-change-transform"
            style={
              {
                left: c.left,
                width: '40%',
                transform: `translateX(-50%) skewX(${c.skew})`,
                transformOrigin: 'top center',
                background:
                  'linear-gradient(180deg, rgba(255,107,157,0.18) 0%, rgba(230,0,126,0.08) 40%, transparent 100%)',
                filter: 'blur(8px)',
                animationDelay: c.delay,
                ['--cd' as string]: c.dur,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Stage floor — soft pool of magenta light at the bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-[80%] -translate-x-1/2 motion-safe:[animation:stage-floor-shimmer_5s_ease-in-out_infinite] will-change-transform"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(230,0,126,0.22) 0%, rgba(230,0,126,0.08) 35%, transparent 70%)',
          filter: 'blur(6px)',
        }}
      />

      {/* Stage with 3D perspective for the crystal */}
      <div className="relative h-80 w-80" style={{ perspective: '900px' }}>
        {/* Magenta ambient bloom */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:[animation:magenta-pulse_2.4s_ease-in-out_infinite] will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(230,0,126,0.5) 0%, rgba(230,0,126,0.2) 40%, transparent 75%)',
          }}
        />

        {/* Rotating orbit ring of small magenta dots around the crystal */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 motion-safe:[animation:orbit-cw_18s_linear_infinite] will-change-transform"
        >
          {orbitDots.map((_, i) => {
            const angle = (i * 360) / orbitDots.length
            return (
              <span
                key={`orbit-dot-${i}`}
                className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full motion-safe:[animation:sparkle-twinkle_2.6s_ease-in-out_infinite] will-change-transform"
                style={{
                  transform: `rotate(${angle}deg) translateY(-128px)`,
                  transformOrigin: 'center',
                  background: '#FF6B9D',
                  boxShadow: '0 0 6px 1px rgba(255,107,157,0.8)',
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            )
          })}
        </div>

        {/* Crystal — 3D rotation */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 motion-safe:[animation:crystal-rotate_6s_ease-in-out_infinite] will-change-transform"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <svg
            viewBox="0 0 200 220"
            className="h-48 w-48 drop-shadow-[0_0_28px_rgba(230,0,126,0.6)]"
          >
            <defs>
              <linearGradient id="lalounge-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.5" />
                <stop offset="55%" stopColor="#E6007E" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#7a0044" stopOpacity="0.16" />
              </linearGradient>
              <linearGradient id="lalounge-edge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFB1CD" />
                <stop offset="50%" stopColor="#E6007E" />
                <stop offset="100%" stopColor="#FF6B9D" />
              </linearGradient>
              <radialGradient id="lalounge-flash" cx="50%" cy="42%" r="35%">
                <stop offset="0%" stopColor="#FFE3EE" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FFE3EE" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Diamond body fill */}
            <path
              d="M100 18 L168 96 L100 204 L32 96 Z"
              fill="url(#lalounge-fill)"
              stroke="url(#lalounge-edge)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner light flash — pulsing focal */}
            <ellipse
              cx="100"
              cy="84"
              rx="34"
              ry="22"
              fill="url(#lalounge-flash)"
              className="motion-safe:[animation:crystal-facet-flash_2.6s_ease-in-out_infinite]"
              style={{ transformOrigin: '100px 84px' }}
            />

            {/* Internal facets — crisp magenta hairlines */}
            <path d="M100 18 L100 204" {...stroke} />
            <path d="M32 96 L168 96" {...stroke} />
            <path d="M100 18 L32 96 L100 96 Z" {...stroke} />
            <path d="M100 18 L168 96 L100 96 Z" {...stroke} />
            <path d="M32 96 L100 204 L100 96 Z" {...stroke} />
            <path d="M168 96 L100 204 L100 96 Z" {...stroke} />

            {/* Crown facets (top sparkle highlights) */}
            <path d="M64 56 L100 96 L136 56" {...stroke} />
            <path d="M48 84 L100 96 L152 84" {...stroke} />
            <path d="M100 18 L64 56 L100 96 L136 56 Z" {...stroke} />

            {/* Inner table highlight */}
            <path d="M100 96 L130 110 L100 130 L70 110 Z" {...stroke} strokeOpacity={0.6} />

            {/* Pavilion lower edge accents */}
            <path d="M52 124 L100 158 L148 124" {...stroke} strokeOpacity={0.5} />
            <path d="M70 168 L100 204 L130 168" {...stroke} strokeOpacity={0.4} />
          </svg>
        </div>

        {/* Twinkling sparkles around the crystal */}
        {sparkles.map((s, i) => (
          <svg
            key={`sparkle-${i}`}
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="absolute motion-safe:[animation:sparkle-twinkle_2.4s_ease-in-out_infinite] will-change-transform"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              transform: 'translate(-50%, -50%)',
              animationDelay: s.delay,
              filter: 'drop-shadow(0 0 4px rgba(230,0,126,0.85))',
            }}
          >
            <path
              d={starPath(s.points)}
              fill={i % 3 === 0 ? '#FFB1CD' : '#FF6B9D'}
            />
          </svg>
        ))}
      </div>

      {/* Brand wordmark with magenta-to-pink gradient text */}
      <div className="pointer-events-none absolute bottom-[16%] left-1/2 -translate-x-1/2 text-center">
        <div
          className="text-[0.62rem] font-medium uppercase tracking-[0.45em]"
          style={{
            background:
              'linear-gradient(90deg, #FF6B9D 0%, #FFB1CD 50%, #FF6B9D 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          }}
        >
          La Lounge
        </div>
        <div
          className="mt-1.5 text-[0.55rem] uppercase tracking-[0.3em]"
          style={{ color: 'rgba(255,107,157,0.45)' }}
        >
          Events · Couture · Celebrations
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  )
}
