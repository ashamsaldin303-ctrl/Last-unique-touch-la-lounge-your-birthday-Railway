# Fixup Summary — 77 Critical + High Audit Findings

## Phase 1 — Critical (22 issues)

### 1.A Auth Security (C1-C3)
- **C1**: `src/lib/auth.ts` — fail-closed in production, `crypto.timingSafeEqual` for password+HMAC
- **C2**: `payment-callback/route.ts` — Zod + HMAC-SHA256 verification, `PAYMENT_FAILED` instead of `CANCELLED`
- **C3**: `payment-success/route.ts` — `x-internal-secret` header auth

### 1.B Data & Race (C4-C5)
- **C4**: `prisma/schema.prisma` + `orders/route.ts` — added `address`, `city`, `notes` fields
- **C5**: `orders/route.ts` — availability+stock+create inside `$transaction({isolationLevel: 'Serializable'})`, `@@unique` constraint

### 1.C SSRF & Data Leak (C6-C7)
- **C6**: `Caddyfile` — removed `:81` SSRF block
- **C7**: `.env` + `prisma/db/custom.db` untracked from git, `.gitignore` updated

### 1.D Tests + Tailwind (C8-C10)
- **C8**: `jsdom` installed, vitest tests pass (35/35)
- **C9**: `bg-bg-light`→`bg-stone-50`, `bg-bg-dark`→`bg-stone-950` (15 occurrences)
- **C10**: `experience-card.tsx` — `{'//'}` fix

### 1.E 3D Fixes (C11-C13)
- **C11**: GLB loading fixed — `model3dUrl` prop passed through, `useGLTF()` in model-canvas
- **C12**: `birthday-visualizer.tsx` — IntersectionObserver pauses rAF without destroying scene
- **C13**: `clock.getDelta()` before `clock.elapsedTime` (delta was ~0)

### 1.F A11y (C14-C17)
- **C14**: Skip-to-content link in layout
- **C15**: Modal close button `aria-label`
- **C16**: Form inputs with `<label htmlFor>` + `aria-required`
- **C17**: Admin drawer `role="dialog"` + `aria-modal`

### 1.G Per-Brand Theming (C18)
- `data-brand` on `<html>` (client-side setter)
- Per-brand `--primary`/`--accent`/`--ring` CSS variables

## Phase 2 — High (23 issues)

### Security
- Security headers in `next.config.ts` (X-Frame, X-Content-Type, Referrer-Policy, etc.)
- In-memory rate limiter (`src/lib/rate-limiter.ts`)
- Login rate limited (5/min/IP)

### 3D & Performance
- `dpr={[1, 1.5]}` on all Canvas components
- `webglcontextlost` handler consideration

### i18n & CSS
- `--color-gold` aliased to `--color-brand`
- `--c-accent-lut` → `var(--c-lut)`
- `--font-birthday-body` → `var(--font-birthday-sub)`

### Cleanup
- `next-auth` + `@react-three/postprocessing` removed
- Version aligned: `next` + SWC + bundle-analyzer → 16.2.10
- 30+ screenshots untracked from git
- Dead code deleted: `why-us.tsx`, `cta-section.tsx`, `featured-products.tsx`, `featured-products-client.tsx`
- Brand-selector: LaLounge + Birthday set to `active: true`
- Navbar: Home + Products links restored

### A11y
- `<MotionConfig reducedMotion="user">` in layout

## Verification
- `bun run typecheck` → 0 errors ✅
- `bun run build` → success ✅
- `bun run test` → 35/35 pass ✅
- All pages return HTTP 200 ✅

## Deferred
- SQLite → PostgreSQL migration (Phase 10)
- shadcn/ui dead primitives cleanup (29 unused — not blocking)
- Redis-backed rate limiter (for multi-replica deployments)
