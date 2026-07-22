/**
 * Your Birthday loading — "party celebration".
 *
 * Yellow balloons drift upward, confetti rains down, and a central
 * candle flame flickers with a warm halo glow. Conveys the joyful,
 * celebratory, premium party identity of the brand.
 *
 * Server Component / Suspense fallback — CSS-only, no JS.
 */
export default function Loading() {
  // 5 balloons ascending in a staggered bouquet.
  const balloons = [
    { left: '24%', delay: '0s', dur: '4.5s', scale: 0.85, hue: '#F5B914' },
    { left: '38%', delay: '0.8s', dur: '5s', scale: 1, hue: '#FFD147' },
    { left: '52%', delay: '0.3s', dur: '4.8s', scale: 0.9, hue: '#F5B914' },
    { left: '66%', delay: '1.2s', dur: '5.2s', scale: 0.95, hue: '#FFD147' },
    { left: '78%', delay: '0.6s', dur: '4.6s', scale: 0.8, hue: '#F5B914' },
  ]

  // 10 confetti pieces drifting down across the screen.
  const confetti = [
    { left: '8%', delay: '0s', dur: '3.2s', color: '#F5B914', size: 6, rotate: 0 },
    { left: '16%', delay: '1.4s', dur: '3.8s', color: '#FFD147', size: 5, rotate: 45 },
    { left: '28%', delay: '0.7s', dur: '3.5s', color: '#F5B914', size: 7, rotate: -30 },
    { left: '42%', delay: '2.1s', dur: '4s', color: '#FFD147', size: 4, rotate: 60 },
    { left: '54%', delay: '0.3s', dur: '3.3s', color: '#F5B914', size: 6, rotate: -45 },
    { left: '64%', delay: '1.8s', dur: '3.9s', color: '#FFD147', size: 5, rotate: 20 },
    { left: '76%', delay: '1s', dur: '3.6s', color: '#F5B914', size: 7, rotate: -60 },
    { left: '88%', delay: '2.4s', dur: '4.2s', color: '#FFD147', size: 4, rotate: 30 },
    { left: '34%', delay: '2.8s', dur: '3.7s', color: '#F5B914', size: 5, rotate: 90 },
    { left: '70%', delay: '0.5s', dur: '3.4s', color: '#FFD147', size: 6, rotate: -20 },
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
            'radial-gradient(circle at 50% 42%, rgba(245,185,20,0.18) 0%, rgba(245,185,20,0.08) 30%, rgba(2,2,4,0.5) 65%, transparent 85%)',
        }}
      />

      {/* Festive starfield (tiny dots) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 12% 18%, rgba(255,209,71,0.9), transparent), radial-gradient(1px 1px at 84% 24%, rgba(255,209,71,0.7), transparent), radial-gradient(1px 1px at 28% 62%, rgba(255,209,71,0.8), transparent), radial-gradient(1px 1px at 72% 78%, rgba(255,209,71,0.6), transparent), radial-gradient(1px 1px at 50% 12%, rgba(255,209,71,0.9), transparent), radial-gradient(1px 1px at 92% 58%, rgba(255,209,71,0.5), transparent)',
          backgroundSize: '100% 100%',
        }}
      />

      {/* Confetti layer — falling from the top */}
      <div className="pointer-events-none absolute inset-0">
        {confetti.map((c, i) => (
          <span
            key={i}
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

      {/* Balloons ascending from the bottom */}
      <div className="pointer-events-none absolute inset-0">
        {balloons.map((b, i) => (
          <div
            key={i}
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
                className="h-24 w-12 drop-shadow-[0_0_12px_rgba(245,185,20,0.45)]"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id={`balloon-${i}`} cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FFEB8E" />
                    <stop offset="50%" stopColor={b.hue} />
                    <stop offset="100%" stopColor="#A87A0A" />
                  </radialGradient>
                </defs>
                {/* Balloon body */}
                <ellipse cx="20" cy="22" rx="14" ry="18" fill={`url(#balloon-${i})`} />
                {/* Specular highlight */}
                <ellipse cx="14" cy="14" rx="3" ry="5.5" fill="#FFF6D6" opacity="0.7" />
                {/* Tie (small triangle) */}
                <path d="M17 40 L20 44 L23 40 Z" fill="#A87A0A" />
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

      {/* Central birthday candle + flickering flame */}
      <div className="relative flex flex-col items-center will-change-transform">
        {/* Flame glow halo */}
        <div
          aria-hidden="true"
          className="mb-1 h-20 w-20 rounded-full motion-safe:[animation:flame-glow_1.4s_ease-in-out_infinite] will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(255,209,71,0.65) 0%, rgba(245,185,20,0.3) 40%, transparent 75%)',
          }}
        />
        {/* Flame — absolutely centered over the halo */}
        <div
          aria-hidden="true"
          className="absolute top-[18px] motion-safe:[animation:candle-flicker_0.6s_ease-in-out_infinite] will-change-transform"
        >
          <svg viewBox="0 0 24 44" className="h-12 w-6" aria-hidden="true">
            <defs>
              <radialGradient id="birthday-flame" cx="50%" cy="70%" r="55%">
                <stop offset="0%" stopColor="#FFF6D6" />
                <stop offset="40%" stopColor="#FFD147" />
                <stop offset="80%" stopColor="#F5B914" />
                <stop offset="100%" stopColor="#E08800" stopOpacity="0.4" />
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
            background: 'linear-gradient(180deg, #FFD147 0%, #F5B914 45%, #B8860B 100%)',
            boxShadow:
              '0 0 18px rgba(245,185,20,0.5), inset -2px 0 4px rgba(0,0,0,0.25), inset 2px 0 4px rgba(255,246,214,0.4)',
          }}
        />
        {/* Drip detail */}
        <div
          aria-hidden="true"
          className="absolute top-[60px] left-1/2 h-3 w-3 -translate-x-[8px] rounded-b-full"
          style={{ background: '#FFEB8E' }}
        />
        <div
          aria-hidden="true"
          className="absolute top-[68px] left-1/2 h-2 w-2 translate-x-[4px] rounded-b-full"
          style={{ background: '#FFEB8E' }}
        />
      </div>

      {/* Brand wordmark */}
      <div className="pointer-events-none absolute bottom-[12%] left-1/2 -translate-x-1/2 text-center">
        <div
          className="text-[0.62rem] font-medium uppercase tracking-[0.45em]"
          style={{ color: 'rgba(255,209,71,0.85)' }}
        >
          Your Birthday
        </div>
        <div
          className="mt-1.5 text-[0.55rem] uppercase tracking-[0.3em]"
          style={{ color: 'rgba(255,209,71,0.45)' }}
        >
          Make · A · Wish
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  )
}
