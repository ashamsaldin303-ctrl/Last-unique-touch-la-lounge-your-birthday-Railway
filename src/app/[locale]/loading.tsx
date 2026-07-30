/**
 * Main Page loading — "brand blend".
 *
 * Mini-story: three brand souls — Gold heritage (LUT), Magenta modernity
 * (La Lounge), Golden joy (Your Birthday) — orbit a unified bloom, leaving
 * ghost-trails as they converge. A cosmic prelude to curation.
 *
 * Server Component / Suspense fallback — CSS-only animations, no JS.
 */
export default function Loading() {
  // 8-petal mandala strokes (gold / magenta / yellow rings).
  const petals = Array.from({ length: 8 })

  return (
    <div
      className="relative min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#060607] flex"
      role="status"
      aria-live="polite"
    >
      {/* Ambient layered radial glow — blends the 3 brand hues */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(184,145,90,0.12) 0%, rgba(230,0,126,0.08) 30%, rgba(255,204,0,0.07) 55%, transparent 75%)',
        }}
      />

      {/* Faint constellation backdrop — cosmic depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 84% 24%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 28% 62%, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 72% 78%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 50% 8%, rgba(255,255,255,0.9), transparent), radial-gradient(1.5px 1.5px at 92% 58%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 8% 84%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 40% 92%, rgba(255,255,255,0.7), transparent)',
          backgroundSize: '100% 100%',
        }}
      />

      {/* Hairline grid — premium texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Vignette for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Vertical light beam descending from top — cosmic prelude */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[55%] w-px -translate-x-1/2 motion-safe:[animation:beam-descend_4.5s_ease-in-out_infinite] will-change-transform"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(184,145,90,0.25) 50%, transparent 100%)',
        }}
      />

      {/* Outer breathing ring — slow inhale/exhale frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:[animation:breath-ring_6s_ease-in-out_infinite] will-change-transform"
        style={{
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow:
            'inset 0 0 80px rgba(184,145,90,0.06), 0 0 100px rgba(230,0,126,0.04)',
        }}
      />

      {/* 8-petal mandala rotating slowly behind the orbits */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 motion-safe:[animation:mandala-spin_28s_linear_infinite] will-change-transform"
        style={{ opacity: 0.22 }}
      >
        <svg viewBox="0 0 200 200" className="h-full w-full">
          {petals.map((_, i) => (
            <path
              key={`petal-${i}`}
              d="M100 100 L100 18 Q116 56 100 100 Z"
              stroke="rgba(184,145,90,0.55)"
              strokeWidth="0.5"
              fill="none"
              transform={`rotate(${i * 45} 100 100)`}
            />
          ))}
          <circle cx="100" cy="100" r="58" stroke="rgba(230,0,126,0.35)" strokeWidth="0.5" fill="none" />
          <circle cx="100" cy="100" r="78" stroke="rgba(255,204,0,0.3)" strokeWidth="0.5" fill="none" />
          <circle cx="100" cy="100" r="92" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" fill="none" strokeDasharray="2 4" />
        </svg>
      </div>

      {/* Orbit stage — fixed dimensions to prevent CLS */}
      <div className="relative h-72 w-72 will-change-transform">
        {/* Outer ring — Yellow (Your Birthday) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 motion-safe:[animation:orbit-cw_9s_linear_infinite]"
        >
          <div className="absolute inset-0 rounded-full border border-white/[0.05]" />
          {/* Primary dot */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <span
              className="block h-3 w-3 rounded-full will-change-transform motion-safe:[animation:dot-twinkle_2.4s_ease-in-out_infinite]"
              style={{
                background: '#FFCC00',
                boxShadow:
                  '0 0 14px 2px rgba(255,204,0,0.8), 0 0 36px 8px rgba(255,204,0,0.4)',
              }}
            />
          </div>
          {/* Ghost-trail dot — opposite phase, smaller, dimmer */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2">
            <span
              className="block h-1.5 w-1.5 rounded-full will-change-transform motion-safe:[animation:dot-twinkle_2.4s_ease-in-out_infinite_1.2s]"
              style={{
                background: '#FFCC00',
                opacity: 0.45,
                boxShadow: '0 0 10px 1px rgba(255,204,0,0.5)',
              }}
            />
          </div>
        </div>

        {/* Middle ring — Magenta (La Lounge) — counter-rotating */}
        <div
          aria-hidden="true"
          className="absolute inset-10 motion-safe:[animation:orbit-ccw_6.5s_linear_infinite]"
        >
          <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <span
              className="block h-3.5 w-3.5 rounded-full will-change-transform motion-safe:[animation:dot-twinkle_2.2s_ease-in-out_infinite_0.4s]"
              style={{
                background: '#E6007E',
                boxShadow:
                  '0 0 14px 2px rgba(230,0,126,0.85), 0 0 36px 8px rgba(230,0,126,0.45)',
              }}
            />
          </div>
          <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2">
            <span
              className="block h-2 w-2 rounded-full will-change-transform motion-safe:[animation:dot-twinkle_2.2s_ease-in-out_infinite_1.5s]"
              style={{
                background: '#E6007E',
                opacity: 0.5,
                boxShadow: '0 0 12px 1px rgba(230,0,126,0.6)',
              }}
            />
          </div>
        </div>

        {/* Inner ring — Gold (LUT) */}
        <div
          aria-hidden="true"
          className="absolute inset-20 motion-safe:[animation:orbit-cw_4.2s_linear_infinite]"
        >
          <div className="absolute inset-0 rounded-full border border-white/[0.08]" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <span
              className="block h-4 w-4 rounded-full will-change-transform motion-safe:[animation:dot-twinkle_2s_ease-in-out_infinite_0.8s]"
              style={{
                background: '#B8915A',
                boxShadow:
                  '0 0 14px 2px rgba(184,145,90,0.9), 0 0 36px 8px rgba(139,107,61,0.5)',
              }}
            />
          </div>
          <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2">
            <span
              className="block h-2 w-2 rounded-full will-change-transform motion-safe:[animation:dot-twinkle_2s_ease-in-out_infinite_1.8s]"
              style={{
                background: '#B8915A',
                opacity: 0.55,
                boxShadow: '0 0 12px 1px rgba(184,145,90,0.65)',
              }}
            />
          </div>
        </div>

        {/* Rotating 6-point star burst behind the core bloom */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 motion-safe:[animation:star-burst-rotate_14s_linear_infinite] will-change-transform"
          style={{ opacity: 0.5 }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d="M50 4 L58 42 L96 50 L58 58 L50 96 L42 58 L4 50 L42 42 Z"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.6"
              fill="none"
            />
            <path
              d="M50 18 L55 45 L82 50 L55 55 L50 82 L45 55 L18 50 L45 45 Z"
              stroke="rgba(184,145,90,0.5)"
              strokeWidth="0.5"
              fill="none"
            />
          </svg>
        </div>

        {/* Core bloom — converging energy */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:[animation:core-bloom_2.6s_ease-in-out_infinite] will-change-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(184,145,90,0.55) 30%, rgba(230,0,126,0.3) 65%, transparent 80%)',
          }}
        />

        {/* Center pinpoint */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white motion-safe:[animation:pulse-glow_2s_ease-in-out_infinite] will-change-transform"
        />
      </div>

      {/* Brand trio labels — small chips below the orbit stage */}
      <div className="pointer-events-none absolute bottom-[26%] left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 text-[0.5rem] font-medium uppercase tracking-[0.32em]">
          <span style={{ color: 'rgba(184,145,90,0.6)' }}>LUT</span>
          <span
            aria-hidden="true"
            className="inline-block h-1 w-1 rounded-full motion-safe:[animation:dot-twinkle_2s_ease-in-out_infinite]"
            style={{ background: 'rgba(255,255,255,0.35)' }}
          />
          <span style={{ color: 'rgba(230,0,126,0.7)' }}>La Lounge</span>
          <span
            aria-hidden="true"
            className="inline-block h-1 w-1 rounded-full motion-safe:[animation:dot-twinkle_2s_ease-in-out_infinite_0.6s]"
            style={{ background: 'rgba(255,255,255,0.35)' }}
          />
          <span style={{ color: 'rgba(255,204,0,0.7)' }}>Your Birthday</span>
        </div>
      </div>

      {/* Wordmark */}
      <div className="pointer-events-none absolute bottom-[16%] left-1/2 -translate-x-1/2 text-center">
        <div className="text-[0.62rem] font-medium uppercase tracking-[0.45em] text-primary-foreground/35">
          Curated · Celebrated · Cherished
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  )
}
