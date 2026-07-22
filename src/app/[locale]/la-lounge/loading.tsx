/**
 * La Lounge loading — "modern events".
 *
 * A faceted magenta crystal rotates in 3D, surrounded by twinkling
 * sparkles against a deep plum glow. Conveys the modern, glamorous,
 * event-planning identity of the brand.
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

  // 8 sparkles arranged around the crystal at varying radii/angles.
  const sparkles = [
    { top: '14%', left: '50%', size: 6, delay: '0s' },
    { top: '24%', left: '78%', size: 4, delay: '0.4s' },
    { top: '50%', left: '88%', size: 5, delay: '0.8s' },
    { top: '76%', left: '76%', size: 3, delay: '1.2s' },
    { top: '86%', left: '50%', size: 6, delay: '0.2s' },
    { top: '76%', left: '24%', size: 4, delay: '0.6s' },
    { top: '50%', left: '12%', size: 5, delay: '1s' },
    { top: '24%', left: '22%', size: 3, delay: '1.4s' },
  ]

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
            'radial-gradient(circle at 50% 45%, rgba(230,0,126,0.20) 0%, rgba(230,0,126,0.10) 28%, rgba(21,9,18,0.4) 60%, transparent 80%)',
        }}
      />

      {/* Diagonal magenta beams (event-spotlight feel) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-25deg, rgba(230,0,126,0.9) 0, rgba(230,0,126,0.9) 1px, transparent 1px, transparent 26px)',
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
              'radial-gradient(circle, rgba(230,0,126,0.45) 0%, rgba(230,0,126,0.18) 40%, transparent 75%)',
          }}
        />

        {/* Crystal — 3D rotation */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 motion-safe:[animation:crystal-rotate_6s_ease-in-out_infinite] will-change-transform"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <svg
            viewBox="0 0 200 220"
            className="h-48 w-48 drop-shadow-[0_0_28px_rgba(230,0,126,0.55)]"
          >
            <defs>
              <linearGradient id="lalounge-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.45" />
                <stop offset="55%" stopColor="#E6007E" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#7a0044" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="lalounge-edge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFB1CD" />
                <stop offset="50%" stopColor="#E6007E" />
                <stop offset="100%" stopColor="#FF6B9D" />
              </linearGradient>
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
          </svg>
        </div>

        {/* Twinkling sparkles around the crystal */}
        {sparkles.map((s, i) => (
          <svg
            key={i}
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
              filter: 'drop-shadow(0 0 4px rgba(230,0,126,0.8))',
            }}
          >
            <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#FF6B9D" />
          </svg>
        ))}
      </div>

      {/* Brand wordmark */}
      <div className="pointer-events-none absolute bottom-[16%] left-1/2 -translate-x-1/2 text-center">
        <div
          className="text-[0.62rem] font-medium uppercase tracking-[0.45em]"
          style={{ color: 'rgba(255,107,157,0.75)' }}
        >
          La Lounge
        </div>
        <div
          className="mt-1.5 text-[0.55rem] uppercase tracking-[0.3em]"
          style={{ color: 'rgba(255,107,157,0.4)' }}
        >
          Events · Couture · Celebrations
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  )
}
