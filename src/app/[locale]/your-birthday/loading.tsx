/**
 * Your Birthday loading — "party celebration".
 *
 * Mini-story: make a wish — a festive bouquet of yellow / red / pink
 * balloons ascends, confetti rains in brand colors, a candle flame
 * dances with sparkler bursts, and a gift box waits to be opened.
 * Conveys the joyful, celebratory, premium party identity of the brand.
 *
 * Server Component / Suspense fallback — CSS-only, no JS.
 */
export default function Loading() {
  // 8 balloons ascending in a staggered bouquet — mixed brand hues.
  const balloons = [
    { left: '14%', delay: '0s', dur: '4.5s', scale: 0.85, hue: '#FFCC00', hi: '#FFE680' },
    { left: '26%', delay: '0.8s', dur: '5s', scale: 1, hue: '#FFB6C1', hi: '#FFE0E6' },
    { left: '38%', delay: '0.3s', dur: '4.8s', scale: 0.9, hue: '#FFD700', hi: '#FFF2A8' },
    { left: '52%', delay: '1.2s', dur: '5.2s', scale: 0.95, hue: '#E32636', hi: '#FF9CAA' },
    { left: '64%', delay: '0.6s', dur: '4.6s', scale: 0.8, hue: '#FFCC00', hi: '#FFE680' },
    { left: '76%', delay: '1.5s', dur: '5s', scale: 0.9, hue: '#FFB6C1', hi: '#FFE0E6' },
    { left: '86%', delay: '0.4s', dur: '4.8s', scale: 0.85, hue: '#FFD700', hi: '#FFF2A8' },
    { left: '20%', delay: '2s', dur: '5.4s', scale: 0.7, hue: '#E32636', hi: '#FF9CAA' },
  ]

  // 15 confetti pieces drifting down across the screen — mixed brand colors.
  const confetti = [
    { left: '6%', delay: '0s', dur: '3.2s', color: '#FFCC00', size: 6, rotate: 0 },
    { left: '14%', delay: '1.4s', dur: '3.8s', color: '#FFB6C1', size: 5, rotate: 45 },
    { left: '22%', delay: '0.7s', dur: '3.5s', color: '#FFD700', size: 7, rotate: -30 },
    { left: '32%', delay: '2.1s', dur: '4s', color: '#E32636', size: 4, rotate: 60 },
    { left: '40%', delay: '0.3s', dur: '3.3s', color: '#FFCC00', size: 6, rotate: -45 },
    { left: '48%', delay: '1.8s', dur: '3.9s', color: '#FFD700', size: 5, rotate: 20 },
    { left: '56%', delay: '1s', dur: '3.6s', color: '#E32636', size: 7, rotate: -60 },
    { left: '64%', delay: '2.4s', dur: '4.2s', color: '#FFB6C1', size: 4, rotate: 30 },
    { left: '72%', delay: '0.5s', dur: '3.4s', color: '#FFCC00', size: 6, rotate: -20 },
    { left: '80%', delay: '1.7s', dur: '3.7s', color: '#FFD700', size: 5, rotate: 90 },
    { left: '88%', delay: '0.9s', dur: '3.5s', color: '#E32636', size: 6, rotate: -75 },
    { left: '94%', delay: '2.2s', dur: '4.1s', color: '#FFB6C1', size: 4, rotate: 35 },
    { left: '36%', delay: '2.8s', dur: '3.7s', color: '#FFCC00', size: 5, rotate: 90 },
    { left: '60%', delay: '1.3s', dur: '3.6s', color: '#FFD700', size: 6, rotate: -25 },
    { left: '76%', delay: '0.2s', dur: '3.4s', color: '#E32636', size: 5, rotate: 50 },
  ]

  // 3 streamers — curving ribbons descending with a wave motion.
  const streamers = [
    { left: '20%', delay: '0s', dur: '4.4s', color: '#E32636' },
    { left: '52%', delay: '0.8s', dur: '5s', color: '#FFB6C1' },
    { left: '78%', delay: '1.6s', dur: '4.6s', color: '#FFCC00' },
  ]

  return (
    <div
      className="relative min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#020204] flex"
      role="status"
      aria-live="polite"
    >
      {/* Warm yellow radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(255,204,0,0.20) 0%, rgba(255,204,0,0.09) 30%, rgba(2,2,4,0.5) 65%, transparent 85%)',
        }}
      />

      {/* Festive starfield (tiny dots) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 12% 18%, rgba(255,214,0,0.9), transparent), radial-gradient(1px 1px at 84% 24%, rgba(255,214,0,0.7), transparent), radial-gradient(1px 1px at 28% 62%, rgba(255,214,0,0.8), transparent), radial-gradient(1px 1px at 72% 78%, rgba(255,214,0,0.6), transparent), radial-gradient(1px 1px at 50% 8%, rgba(255,214,0,0.9), transparent), radial-gradient(1.5px 1.5px at 92% 58%, rgba(255,182,193,0.6), transparent), radial-gradient(1px 1px at 8% 84%, rgba(255,214,0,0.6), transparent), radial-gradient(1px 1px at 38% 92%, rgba(255,182,193,0.7), transparent)',
          backgroundSize: '100% 100%',
        }}
      />

      {/* Confetti layer — falling from the top */}
      <div className="pointer-events-none absolute inset-0">
        {confetti.map((c, i) => (
          <span
            key={`confetti-${i}`}
            aria-hidden="true"
            className="absolute top-0 block motion-safe:[animation:confetti-fall_var(--d)_linear_infinite] will-change-transform"
            style={
              {
                left: c.left,
                width: c.size,
                height: c.size * 1.6,
                background: c.color,
                borderRadius: '1px',
                boxShadow: `0 0 6px ${c.color}66`,
                transform: `rotate(${c.rotate}deg)`,
                animationDelay: c.delay,
                ['--d' as string]: c.dur,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Streamers — curving ribbons descending with a wave motion */}
      <div className="pointer-events-none absolute inset-0">
        {streamers.map((s, i) => (
          <svg
            key={`streamer-${i}`}
            aria-hidden="true"
            viewBox="0 0 60 320"
            className="absolute top-0 h-[60%] w-12 motion-safe:[animation:streamer-wave_var(--sd)_ease-in-out_infinite] will-change-transform"
            style={
              {
                left: s.left,
                transform: 'translateX(-50%)',
                animationDelay: s.delay,
                ['--sd' as string]: s.dur,
              } as React.CSSProperties
            }
          >
            <path
              d="M30 0 Q10 60 30 120 Q50 180 30 240 Q10 280 30 320"
              stroke={s.color}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.65"
            />
          </svg>
        ))}
      </div>

      {/* Balloons ascending from the bottom */}
      <div className="pointer-events-none absolute inset-0">
        {balloons.map((b, i) => (
          <div
            key={`balloon-${i}`}
            aria-hidden="true"
            className="absolute bottom-[14%] motion-safe:[animation:float-up_var(--d)_ease-in-out_infinite] will-change-transform"
            style={
              {
                left: b.left,
                animationDelay: b.delay,
                ['--d' as string]: b.dur,
              } as React.CSSProperties
            }
          >
            <div
              className="motion-safe:[animation:balloon-bob_2.6s_ease-in-out_infinite] will-change-transform"
              style={{ transform: `scale(${b.scale})` }}
            >
              <svg
                viewBox="0 0 40 90"
                className="h-24 w-12 drop-shadow-[0_0_12px_rgba(255,204,0,0.45)]"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id={`balloon-${i}`} cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={b.hi} />
                    <stop offset="50%" stopColor={b.hue} />
                    <stop offset="100%" stopColor="#5a3a00" stopOpacity="0.7" />
                  </radialGradient>
                </defs>
                {/* Balloon body */}
                <ellipse cx="20" cy="22" rx="14" ry="18" fill={`url(#balloon-${i})`} />
                {/* Specular highlight */}
                <ellipse cx="14" cy="14" rx="3" ry="5.5" fill="#FFF6D6" opacity="0.7" />
                {/* Tie (small triangle) */}
                <path d="M17 40 L20 44 L23 40 Z" fill={b.hue} opacity="0.85" />
                {/* String — wavy */}
                <path
                  d="M20 44 Q16 50 22 56 Q16 62 20 68 Q16 74 20 82"
                  stroke="#8a6308"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Gift box at the base — waiting to be opened */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[28%] left-1/2 -translate-x-1/2 motion-safe:[animation:gift-bow-bounce_2.4s_ease-in-out_infinite] will-change-transform"
      >
        <svg viewBox="0 0 80 70" className="h-16 w-20 drop-shadow-[0_0_18px_rgba(255,204,0,0.35)]">
          <defs>
            <linearGradient id="gift-box" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E32636" />
              <stop offset="100%" stopColor="#8a1620" />
            </linearGradient>
            <linearGradient id="gift-lid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4D5F" />
              <stop offset="100%" stopColor="#C81E2E" />
            </linearGradient>
            <linearGradient id="gift-ribbon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE680" />
              <stop offset="100%" stopColor="#FFCC00" />
            </linearGradient>
          </defs>
          {/* Box body */}
          <rect x="14" y="28" width="52" height="36" rx="2" fill="url(#gift-box)" />
          {/* Vertical ribbon */}
          <rect x="36" y="28" width="8" height="36" fill="url(#gift-ribbon)" />
          {/* Lid */}
          <rect x="10" y="22" width="60" height="10" rx="2" fill="url(#gift-lid)" />
          {/* Horizontal ribbon */}
          <rect x="10" y="24" width="60" height="4" fill="url(#gift-ribbon)" />
          {/* Bow — two loops + center knot */}
          <path
            d="M40 22 Q28 8 32 18 Q36 22 40 22 Q44 22 48 18 Q52 8 40 22 Z"
            fill="url(#gift-ribbon)"
            stroke="#B8860B"
            strokeWidth="0.5"
          />
          <circle cx="40" cy="22" r="2.5" fill="#FFD700" />
        </svg>
      </div>

      {/* Central birthday candle + flickering flame */}
      <div className="relative flex flex-col items-center will-change-transform">
        {/* Flame glow halo — larger, with sparkler burst */}
        <div
          aria-hidden="true"
          className="relative mb-1 h-24 w-24 rounded-full motion-safe:[animation:flame-glow_1.4s_ease-in-out_infinite] will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(255,204,0,0.7) 0%, rgba(255,215,0,0.35) 35%, rgba(227,38,54,0.18) 60%, transparent 80%)',
          }}
        >
          {/* Sparkler radial burst — 8 rays */}
          <div
            aria-hidden="true"
            className="absolute inset-0 motion-safe:[animation:sparkler-burst_1.8s_ease-in-out_infinite] will-change-transform"
          >
            <svg viewBox="0 0 100 100" className="h-full w-full">
              {Array.from({ length: 8 }).map((_, i) => (
                <line
                  key={`ray-${i}`}
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="14"
                  stroke="#FFD700"
                  strokeWidth="0.6"
                  strokeLinecap="round"
                  opacity="0.7"
                  transform={`rotate(${i * 45} 50 50)`}
                />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <line
                  key={`ray-short-${i}`}
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="26"
                  stroke="#FFE680"
                  strokeWidth="0.4"
                  strokeLinecap="round"
                  opacity="0.5"
                  transform={`rotate(${i * 45 + 22.5} 50 50)`}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Flame — absolutely centered over the halo */}
        <div
          aria-hidden="true"
          className="absolute top-[20px] motion-safe:[animation:candle-flicker_0.6s_ease-in-out_infinite] will-change-transform"
        >
          <svg viewBox="0 0 24 44" className="h-12 w-6" aria-hidden="true">
            <defs>
              <radialGradient id="birthday-flame" cx="50%" cy="70%" r="55%">
                <stop offset="0%" stopColor="#FFF6D6" />
                <stop offset="40%" stopColor="#FFD700" />
                <stop offset="80%" stopColor="#FFCC00" />
                <stop offset="100%" stopColor="#E32636" stopOpacity="0.6" />
              </radialGradient>
            </defs>
            <path d="M12 2 Q4 14 8 26 Q12 34 16 26 Q20 14 12 2 Z" fill="url(#birthday-flame)" />
            <ellipse cx="12" cy="26" rx="3" ry="6" fill="#FFF6D6" opacity="0.9" />
          </svg>
        </div>

        {/* Wick */}
        <div aria-hidden="true" className="h-2 w-[2px] bg-[#3a2a00]" />

        {/* Candle body */}
        <div
          aria-hidden="true"
          className="h-24 w-7 rounded-sm"
          style={{
            background:
              'linear-gradient(180deg, #FFD700 0%, #FFCC00 45%, #B8860B 100%)',
            boxShadow:
              '0 0 22px rgba(255,204,0,0.6), inset -2px 0 4px rgba(0,0,0,0.25), inset 2px 0 4px rgba(255,246,214,0.45)',
          }}
        />
        {/* Drip detail */}
        <div
          aria-hidden="true"
          className="absolute top-[60px] left-1/2 h-3 w-3 -translate-x-[8px] rounded-b-full"
          style={{ background: '#FFE680' }}
        />
        <div
          aria-hidden="true"
          className="absolute top-[68px] left-1/2 h-2 w-2 translate-x-[4px] rounded-b-full"
          style={{ background: '#FFE680' }}
        />
      </div>

      {/* Brand wordmark with shimmer effect */}
      <div className="pointer-events-none absolute bottom-[12%] left-1/2 -translate-x-1/2 text-center">
        <div
          className="text-[0.62rem] font-medium uppercase tracking-[0.45em] motion-safe:[animation:wish-shimmer_3s_ease-in-out_infinite] will-change-transform"
          style={{
            background:
              'linear-gradient(90deg, #FFCC00 0%, #FFF2A8 30%, #FFD700 50%, #FFF2A8 70%, #FFCC00 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Your Birthday
        </div>
        <div
          className="mt-1.5 text-[0.55rem] uppercase tracking-[0.3em]"
          style={{ color: 'rgba(255,214,0,0.5)' }}
        >
          Make · A · Wish
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  )
}
