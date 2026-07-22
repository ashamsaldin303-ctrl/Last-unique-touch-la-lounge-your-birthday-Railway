/**
 * Last Unique Touch (LUT) loading — "heritage furniture".
 *
 * A chandelier outline draws itself in gold against a warm radial glow,
 * with a shimmer sweep, gentle sway, and floating embers. Conveys the
 * premium heritage furniture-rental identity of the brand.
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
            'radial-gradient(circle at 50% 42%, rgba(139,107,61,0.18) 0%, rgba(139,107,61,0.08) 30%, transparent 65%)',
        }}
      />

      {/* Subtle baroque pattern texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(184,145,90,0.5) 0, rgba(184,145,90,0.5) 1px, transparent 1px, transparent 22px)',
        }}
      />

      {/* Stage — fixed size to prevent CLS */}
      <div className="relative flex h-72 w-72 items-center justify-center">
        {/* Floating embers — 5 gold sparks rising */}
        {[
          { left: '22%', delay: '0s', size: 4 },
          { left: '38%', delay: '1.4s', size: 3 },
          { left: '55%', delay: '0.6s', size: 5 },
          { left: '70%', delay: '2.1s', size: 3 },
          { left: '82%', delay: '1s', size: 4 },
        ].map((e, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="absolute bottom-12 rounded-full motion-safe:[animation:ember-float_4s_ease-out_infinite] will-change-transform"
            style={{
              left: e.left,
              width: e.size,
              height: e.size,
              animationDelay: e.delay,
              background: '#B8915A',
              boxShadow: '0 0 8px 1px rgba(184,145,90,0.7)',
            }}
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
                'linear-gradient(90deg, transparent, rgba(255,230,180,0.25), transparent)',
            }}
          />
        </div>

        {/* Chandelier — gentle sway on the whole SVG, stroke-draw on paths */}
        <div className="relative motion-safe:[animation:gentle-sway_5s_ease-in-out_infinite] will-change-transform">
          <svg
            viewBox="0 0 200 240"
            className="h-56 w-56 drop-shadow-[0_0_24px_rgba(184,145,90,0.35)]"
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

            {/* Arms branching outward & down */}
            <path
              d="M68 64 L60 92"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.5s]"
            />
            <path
              d="M100 70 L100 96"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.55s]"
            />
            <path
              d="M132 64 L140 92"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.6s]"
            />

            {/* Crystal teardrops at each arm tip */}
            <path
              d="M60 92 L55 102 L60 112 L65 102 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.75s]"
            />
            <path
              d="M100 96 L94 108 L100 120 L106 108 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.8s]"
            />
            <path
              d="M140 92 L135 102 L140 112 L145 102 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_0.85s]"
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
            <path
              d="M100 198 Q90 204 100 214 Q110 204 100 198 Z"
              {...strokeProps}
              className="motion-safe:[animation:draw-stroke_5s_ease-in-out_infinite_1.5s]"
            />
          </svg>
        </div>
      </div>

      {/* Brand wordmark */}
      <div className="pointer-events-none absolute bottom-[18%] left-1/2 -translate-x-1/2 text-center">
        <div
          className="text-[0.62rem] font-medium uppercase tracking-[0.45em]"
          style={{ color: 'rgba(184,145,90,0.65)' }}
        >
          Last Unique Touch
        </div>
        <div
          className="mt-1.5 text-[0.55rem] uppercase tracking-[0.3em]"
          style={{ color: 'rgba(184,145,90,0.35)' }}
        >
          Heritage · Furniture · Rental
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  )
}
