/**
 * Last Unique Touch (LUT) loading — "heritage furniture".
 *
 * Mini-story: heritage awakens — sunlight streams through stained-glass
 * angles, gold strokes draw a tiered chandelier, embers rise from the
 * crystals, and an arabesque sigil glows beneath. Conveys the premium
 * heritage furniture-rental identity of the brand.
 *
 * Server Component / Suspense fallback — CSS-only, no JS.
 */
export default function Loading() {
  // Shared path props so every stroke draws itself via the same keyframe.
  const strokeProps = {
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1,
    stroke: '#B8915A',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  }

  // 8 embers — varied sizes, positions, delays, hues.
  const embers = [
    { left: '14%', delay: '0s', size: 4, dur: '4s', hue: '#B8915A' },
    { left: '26%', delay: '1.4s', size: 3, dur: '4.6s', hue: '#D4B07A' },
    { left: '38%', delay: '0.6s', size: 5, dur: '5s', hue: '#B8915A' },
    { left: '48%', delay: '2.1s', size: 3, dur: '3.8s', hue: '#E0BC85' },
    { left: '58%', delay: '1s', size: 4, dur: '4.4s', hue: '#B8915A' },
    { left: '68%', delay: '0.3s', size: 5, dur: '4.8s', hue: '#D4B07A' },
    { left: '78%', delay: '1.8s', size: 3, dur: '4.2s', hue: '#B8915A' },
    { left: '88%', delay: '0.9s', size: 4, dur: '5s', hue: '#E0BC85' },
  ]

  // 3 angled light beams from the top — like sunlight through stained glass.
  const beams = [
    { left: '30%', delay: '0s', dur: '5.5s', opacity: 0.32 },
    { left: '50%', delay: '1.8s', dur: '6.2s', opacity: 0.45 },
    { left: '70%', delay: '0.9s', dur: '5.8s', opacity: 0.32 },
  ]

  return (
    <div
      className="relative min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#07060a] flex"
      role="status"
      aria-live="polite"
    >
      {/* Warm gold radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(139,107,61,0.20) 0%, rgba(139,107,61,0.09) 30%, transparent 65%)',
        }}
      />

      {/* Subtle baroque pattern texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(184,145,90,0.5) 0, rgba(184,145,90,0.5) 1px, transparent 1px, transparent 22px)',
        }}
      />

      {/* 3 angled light beams from the top — sunlight through stained glass */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {beams.map((b, i) => (
          <div
            key={`beam-${i}`}
            className="absolute top-0 h-[70%] motion-safe:[animation:light-beam-flicker_var(--bd)_ease-in-out_infinite] will-change-transform"
            style={
              {
                left: b.left,
                width: '2px',
                transform: 'translateX(-50%) skewX(-12deg)',
                transformOrigin: 'top center',
                background:
                  'linear-gradient(180deg, rgba(230,200,140,0.6) 0%, rgba(184,145,90,0.25) 50%, transparent 100%)',
                filter: 'blur(0.5px)',
                opacity: b.opacity,
                animationDelay: b.delay,
                ['--bd' as string]: b.dur,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Ornamental arch frame — subtle gold outline around the chandelier */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 motion-safe:[animation:arch-shimmer_7s_ease-in-out_infinite] will-change-transform"
        style={{ opacity: 0.4 }}
      >
        <svg viewBox="0 0 200 280" className="h-full w-full">
          <path
            d="M20 270 L20 140 Q20 20 100 20 Q180 20 180 140 L180 270"
            stroke="rgba(184,145,90,0.4)"
            strokeWidth="0.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M30 270 L30 140 Q30 30 100 30 Q170 30 170 140 L170 270"
            stroke="rgba(184,145,90,0.25)"
            strokeWidth="0.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Keystone ornament at top of arch */}
          <path
            d="M100 14 L92 26 L100 36 L108 26 Z"
            stroke="rgba(184,145,90,0.55)"
            strokeWidth="0.7"
            fill="none"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Stage — fixed size to prevent CLS */}
      <div className="relative flex h-72 w-72 items-center justify-center">
        {/* Floating embers — 8 gold sparks rising */}
        {embers.map((e, i) => (
          <span
            key={`ember-${i}`}
            aria-hidden="true"
            className="absolute bottom-12 rounded-full motion-safe:[animation:ember-float_var(--ed)_ease-out_infinite] will-change-transform"
            style={
              {
                left: e.left,
                width: e.size,
                height: e.size,
                animationDelay: e.delay,
                background: e.hue,
                boxShadow: `0 0 8px 1px ${e.hue}cc, 0 0 16px 4px ${e.hue}66`,
                ['--ed' as string]: e.dur,
              } as React.CSSProperties
            }
          />
        ))}

        {/* Shimmer sweep layer behind the chandelier */}
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden rounded-full opacity-60"
        >
          <div
            className="absolute inset-y-0 -left-1/2 w-1/2 motion-safe:[animation:shimmer-sweep_4.5s_ease-in-out_infinite] will-change-transform"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,230,180,0.28), transparent)',
            }}
          />
        </div>

        {/* Chandelier — gentle sway on the whole SVG, stroke-draw on paths */}
        <div className="relative motion-safe:[animation:gentle-sway_5s_ease-in-out_infinite] will-change-transform">
          <svg
            viewBox="0 0 200 240"
            className="h-56 w-56 drop-shadow-[0_0_24px_rgba(184,145,90,0.4)]"
            aria-hidden="true"
          >
            {/* Ceiling mount + chain */}
            <path
              d="M100 8 L100 32"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite]"
            />
            {/* Crown plate */}
            <path
              d="M68 36 Q100 26 132 36"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.15s]"
            />
            <path
              d="M68 36 Q100 48 132 36"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.25s]"
            />

            {/* Upper ring (body of chandelier) */}
            <path
              d="M58 62 Q100 78 142 62"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.35s]"
            />

            {/* Arms branching outward & down — 5 arms for tiered feel */}
            <path
              d="M68 64 L58 92"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.5s]"
            />
            <path
              d="M84 68 L80 96"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.55s]"
            />
            <path
              d="M100 70 L100 96"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.6s]"
            />
            <path
              d="M116 68 L120 96"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.65s]"
            />
            <path
              d="M132 64 L142 92"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.7s]"
            />

            {/* Crystal teardrops at each arm tip */}
            <path
              d="M58 92 L53 102 L58 112 L63 102 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.75s]"
            />
            <path
              d="M80 96 L75 108 L80 120 L85 108 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.8s]"
            />
            <path
              d="M100 96 L94 108 L100 120 L106 108 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.85s]"
            />
            <path
              d="M120 96 L115 108 L120 120 L125 108 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.9s]"
            />
            <path
              d="M142 92 L137 102 L142 112 L147 102 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.95s]"
            />

            {/* Lower bowl / basin */}
            <path
              d="M52 124 Q100 142 148 124"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_1s]"
            />
            <path
              d="M52 124 Q100 110 148 124"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_1.05s]"
            />

            {/* Center pendant chain + bobèche */}
            <path
              d="M100 138 L100 168"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_1.2s]"
            />
            <path
              d="M100 168 Q88 174 100 184 Q112 174 100 168 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_1.3s]"
            />
            <path
              d="M100 184 L100 198"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_1.4s]"
            />
            {/* Final ornamental finial */}
            <path
              d="M100 198 Q90 204 100 214 Q110 204 100 198 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_1.5s]"
            />
          </svg>
        </div>

        {/* Central pendant glow — the focal crystal catching light */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[78%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:[animation:pendant-glow_2.2s_ease-in-out_infinite] will-change-transform"
          style={{
            background: '#FFE8B0',
            boxShadow:
              '0 0 12px 2px rgba(255,232,176,0.9), 0 0 28px 6px rgba(184,145,90,0.6)',
          }}
        />
      </div>

      {/* Arabesque sigil below chandelier — heritage mark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[26%] left-1/2 h-10 w-20 -translate-x-1/2 motion-safe:[animation:ornament-glow_3s_ease-in-out_infinite] will-change-transform"
        style={{ opacity: 0.7 }}
      >
        <svg viewBox="0 0 100 40" className="h-full w-full">
          <path
            d="M50 4 Q60 14 70 4 Q80 14 90 4 M50 4 Q40 14 30 4 Q20 14 10 4"
            stroke="#B8915A"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 12 Q58 20 50 28 Q42 20 50 12 Z"
            stroke="#D4B07A"
            strokeWidth="0.8"
            fill="none"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="20" r="1.5" fill="#D4B07A" />
        </svg>
      </div>

      {/* Brand wordmark */}
      <div className="pointer-events-none absolute bottom-[18%] left-1/2 -translate-x-1/2 text-center">
        <div
          className="text-[0.62rem] font-medium uppercase tracking-[0.45em]"
          style={{ color: 'rgba(184,145,90,0.7)' }}
        >
          Last Unique Touch
        </div>
        <div
          className="mt-1.5 text-[0.55rem] uppercase tracking-[0.3em]"
          style={{ color: 'rgba(184,145,90,0.4)' }}
        >
          Heritage · Furniture · Rental
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  )
}
