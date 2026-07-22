/**
 * Main Page loading — "brand blend".
 *
 * Premium dark stage where the 3 brand colours orbit and converge,
 * symbolising LUT (gold), La Lounge (magenta) and Your Birthday (yellow)
 * coming together on the main page.
 *
 * Server Component / Suspense fallback — CSS-only animations, no JS.
 */
export default function Loading() {
  return (
    <div
      className="relative min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#060607] flex"
      role="status"
      aria-live="polite"
    >
      {/* Ambient layered radial glow — blends the 3 brand hues */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(184,145,90,0.10) 0%, rgba(230,0,126,0.07) 30%, rgba(245,185,20,0.06) 55%, transparent 75%)',
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

      {/* Orbit stage — fixed dimensions to prevent CLS */}
      <div className="relative h-72 w-72 will-change-transform">
        {/* Outer ring — Yellow (Your Birthday) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 motion-safe:[animation:orbit-cw_9s_linear_infinite]"
        >
          <div className="absolute inset-0 rounded-full border border-white/[0.05]" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <span
              className="block h-3 w-3 rounded-full will-change-transform"
              style={{
                background: '#F5B914',
                boxShadow: '0 0 14px 2px rgba(245,185,20,0.75), 0 0 36px 8px rgba(245,185,20,0.35)',
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
              className="block h-3.5 w-3.5 rounded-full will-change-transform"
              style={{
                background: '#E6007E',
                boxShadow: '0 0 14px 2px rgba(230,0,126,0.8), 0 0 36px 8px rgba(230,0,126,0.4)',
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
              className="block h-4 w-4 rounded-full will-change-transform"
              style={{
                background: '#B8915A',
                boxShadow: '0 0 14px 2px rgba(184,145,90,0.85), 0 0 36px 8px rgba(139,107,61,0.45)',
              }}
            />
          </div>
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
