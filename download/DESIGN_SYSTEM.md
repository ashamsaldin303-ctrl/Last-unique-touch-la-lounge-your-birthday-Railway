# Design System — Last Unique Touch & La Lounge & Your Birthday

> **Multi-tenant luxury rental platform** — three brands under one umbrella, each with its own visual identity, sharing a unified design system.
> This document is the source of truth for designers and engineers working on the project.

---

## 1. Brand Identities

| Brand | Slug | Niche | Logo Colors (VLM-verified) |
|-------|------|-------|-----------------------------|
| **Last Unique Touch** | `LUT` | Furniture rental | Red `#E3222B` + Black `#0A0A0A` + White |
| **La Lounge** | `LA_LOUNGE` | Event planning + custom furniture | Hot pink/Magenta `#E6007E` + Light gray `#E0E0E0` |
| **Your Birthday** | `YOUR_BIRTHDAY` | Party equipment rental | Gold `#F5B914` + Purple `#4B1858` + Black |

### Brand color tokens (CSS variables in `globals.css`)

```css
/* === LUT — heritage + sharp geometry === */
:root[data-brand="lut"] {
  --primary: #E3222B;
  --accent: #A9812E;        /* brass for hairlines */
  --ring: #E3222B;
  --background: #FAF6EF;    /* warm ivory (not pure white) */
  --foreground: #0A0A0A;
  --card: #FFFFFF;
  --gold: #E3222B;          /* legacy alias follows primary */
  --lut: #E3222B;
}

/* === La Lounge — art deco events (naturally dark) === */
:root[data-brand="lalounge"] {
  --primary: #E6007E;       /* magenta */
  --accent: #C9A24B;        /* deco gold */
  --ring: #E6007E;
  --background: #150912;    /* charcoal */
  --foreground: #FAF6EF;
  --card: #1F0E1A;
  --gold: #E6007E;
  --lut: #E6007E;
}

/* === Your Birthday — explicit joy === */
:root[data-brand="birthday"] {
  --primary: #F5B914;       /* gold */
  --accent: #4B1858;        /* deep purple */
  --ring: #F5B914;
  --background: #FFFFFF;
  --foreground: #4B1858;
  --card: #FFFFFF;
  --border: #F5C6D9;        /* light pink hairline */
  --gold: #F5B914;
  --lut: #F5B914;
}
```

### Dark mode overrides (`.dark:root[data-brand="X"]`)

| Brand | Dark BG | Dark FG | Dark Card | Dark Border |
|-------|---------|---------|-----------|-------------|
| LUT | `#0A0A0A` | `#FAF6EF` | `#1A1A1A` | `#2A2A2A` |
| La Lounge | `#0A0408` (nudge only — already dark) | (unchanged) | (unchanged) | (unchanged) |
| Your Birthday | `#4B1858` | `#FAF6EF` | `#5B2568` | `#6B3578` |

---

## 2. Typography

Each brand has its own font trio (display + body + Arabic), loaded via `next/font/google` in `src/app/fonts.ts` and mapped to `--font-display` / `--font-body` / `--font-arabic` via per-brand CSS variable overrides.

### Font stacks

| Brand | Display | Body | Arabic |
|-------|---------|------|--------|
| **LUT** | Montserrat 800/900 | Inter | Cairo 400/700/900 |
| **La Lounge** | Poiret One 400 | Questrial | IBM Plex Sans Arabic 400/700 |
| **Your Birthday** | Luckiest Guy 400 | Baloo 2 | Lalezar 400 |

### Font CSS variables

```css
/* Each brand sets its own --font-display / --font-body / --font-arabic */
:root[data-brand="lut"] {
  --font-display: var(--font-lut-display);
  --font-body: var(--font-lut-body);
  --font-arabic: var(--font-lut-arabic);
}
:root[data-brand="lalounge"] {
  --font-display: var(--font-lalounge-display);
  --font-body: var(--font-lalounge-body);
  --font-arabic: var(--font-lalounge-arabic);
}
:root[data-brand="birthday"] {
  --font-display: var(--font-birthday-display);
  --font-body: var(--font-birthday-body);
  --font-arabic: var(--font-birthday-arabic);
}
```

### Typography utility classes

- `font-display` → `font-family: var(--font-display)` — for headings
- `font-body` → `font-family: var(--font-body)` — for body text
- `font-arabic` → `font-family: var(--font-arabic)` — for Arabic text (auto-applied via `dir="rtl"`)
- `.eyebrow` → small uppercase tracked label: `font-family: var(--font-body); font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; font-size: 0.625rem;`

---

## 3. Spacing Scale

8px-based scale exposed as named tokens. Tailwind's default `p-2`/`p-4`/`p-6`/`p-8`/`p-12`/`p-16` utilities map to these values.

| Token | Value | Tailwind utility |
|-------|-------|------------------|
| `--space-1` | 8px | `p-2` |
| `--space-2` | 16px | `p-4` |
| `--space-3` | 24px | `p-6` |
| `--space-4` | 32px | `p-8` |
| `--space-5` | 48px | `p-12` |
| `--space-6` | 64px | `p-16` |

---

## 4. Border Radius Scale

| Token | Value | Tailwind utility | Use case |
|-------|-------|------------------|----------|
| `--radius-sm` | 6px | `rounded-sm` | Small buttons, badges |
| `--radius-md` | 12px | `rounded-md` | Cards, inputs |
| `--radius-lg` | 24px | `rounded-lg` | Large sections, modals |
| `--radius-full` | 9999px | `rounded-full` | Pills, avatars, circles |

All `rounded-lg`/`rounded-xl`/`rounded-2xl` literals in `src/` have been normalized to `rounded-md` or `rounded-lg` per the scale.

---

## 5. Motion Scale

| Token | Value | Use case |
|-------|-------|----------|
| `--motion-fast` | 150ms | Hover states, micro-interactions |
| `--motion-base` | 200ms | Default transitions |
| `--motion-slow` | 300ms | Section transitions, modal open |
| `--ease-luxury` | `cubic-bezier(0.22, 1, 0.36, 1)` | Luxury easing for all premium transitions |

### Utility classes
- `.ease-luxury` → `transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);`

### Signature animations (one per page)
- **Home** — holo-chamber cards (CSS keyframes: `holo-chamber-burst`, `mobile-card-from-right`, `mobile-card-from-left`)
- **LUT** — 3D furniture tunnel (Three.js, lazy-loaded via `next/dynamic`)
- **La Lounge** — Light sweep (`@keyframes lalounge-sweep` — gold beam every 6s)
- **Birthday** — Text scramble (existing `text-scramble.tsx`)

### `prefers-reduced-motion`
All custom animations are disabled under `@media (prefers-reduced-motion: reduce)`. 3D backgrounds are skipped entirely via `shouldEnable3D()` from `@/lib/device-capabilities`.

---

## 6. Component Patterns

### Cards
```tsx
<div className="rounded-md bg-card border border-border/50 p-6 shadow-luxury hover:shadow-luxury-lg transition-shadow duration-300">
  <span className="eyebrow text-accent">Category</span>
  <h3 className="font-display text-xl font-bold text-foreground">Title</h3>
  <p className="text-sm text-muted-foreground line-clamp-2">Description</p>
</div>
```

### Eyebrow + heading
```tsx
<div className="flex items-center gap-2 mb-2">
  <span className="h-px w-6 bg-accent/50" />
  <span className="eyebrow text-accent">Eyebrow Label</span>
</div>
<h2 className="font-display text-3xl font-bold">Section Title</h2>
```

### Glass card (frosted surface)
```tsx
<div className="glass-card rounded-md p-6">
  {/* content */}
</div>
```
Per-brand overrides:
- LUT: `rgba(255, 255, 255, 0.7)` + `backdrop-filter: blur(12px)`
- La Lounge: `rgba(21, 9, 18, 0.7)` + gold border
- Birthday: `rgba(255, 255, 255, 0.85)` + pink border

### Luxury input
```tsx
<input className="luxury-input rounded-md border border-border bg-background px-4 py-3" />
```
On focus: `border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);`

### Brand signature components
| Component | File | Use |
|-----------|------|-----|
| `LutArabesque` | `src/components/brand/lut-arabesque.tsx` | `divider` / `corner` / `bg` variants |
| `LaLoungeSunburst` | `src/components/brand/lalounge-sunburst.tsx` | Decorative sunburst (24 rays) |
| `LaLoungeLightSweep` | `src/components/brand/lalounge-light-sweep.tsx` | Animated gold beam overlay |
| `BirthdayCircularFrame` | `src/components/brand/birthday-circular-frame.tsx` | Circular image frame (sm/md/lg) |

---

## 7. Shadows

```css
.shadow-luxury {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
}
.shadow-luxury-lg {
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.08);
}
```

---

## 8. Accessibility

- **WCAG AA contrast** ≥ 4.5:1 for all body text. Decorative text (eyebrows, dividers) may go lower.
- **Touch targets** ≥ 44×44px (`min-w-[44px] min-h-[44px]` on all interactive elements).
- **`prefers-reduced-motion`** respected by all custom animations.
- **`aria-hidden="true"`** on all decorative SVGs.
- **Semantic HTML**: `main`, `header`, `nav`, `footer`, `section`, `article`.
- **RTL aware**: locale-aware arrows (`ArrowLeft` for AR, `ArrowRight` for EN), `start`/`end` instead of `left`/`right`, `ps`/`pe` instead of `pl`/`pr`.
- **Hydration-safe theme toggle** via `mounted` state guard.

---

## 9. Multi-tenant Architecture

- **Single database** + `Brand` enum (`LUT` | `LA_LOUNGE` | `YOUR_BIRTHDAY`)
- **`data-brand` attribute** on `<html>` set by `BrandThemeSetter` based on `usePathname()`
- **CSS variable cascade**: `--primary`, `--accent`, `--gold`, `--lut` etc. all flip per brand
- **Legacy aliases** (`--gold`, `--lut`) follow `--primary` so existing `text-gold` / `bg-lut` utilities work without code changes
- **Tailwind utility cascade**: `--color-gold`, `--color-brand`, `--color-lut` exposed in `@theme inline` so Tailwind generates `text-gold` / `bg-brand` / `bg-lut` utilities that resolve to the active brand's color

---

## 10. File Structure

```
src/
├── app/
│   ├── globals.css          # Design tokens + per-brand overrides + utility classes
│   ├── fonts.ts             # 3 brand font sets (LUT / La Lounge / Birthday)
│   └── [locale]/
│       ├── layout.tsx       # ThemeProvider + 9 font variables on <html>
│       └── page.tsx         # Home (holo-chamber cards)
├── components/
│   ├── brand/               # Brand signature components
│   │   ├── lut-arabesque.tsx
│   │   ├── lalounge-sunburst.tsx
│   │   ├── lalounge-light-sweep.tsx
│   │   └── birthday-circular-frame.tsx
│   ├── layout/
│   │   ├── navbar.tsx       # Brand-aware wordmark + theme toggle + lang switcher
│   │   └── footer.tsx       # Brand-aware footer
│   ├── landing/
│   │   ├── hero.tsx
│   │   ├── experience-card.tsx  # Holo-chamber cards with brand hexes
│   │   └── product-card.tsx     # Premium product card
│   ├── product/
│   │   └── product-info.tsx     # DayPicker + glass-card price summary
│   ├── cart/cart-view.tsx
│   ├── checkout/checkout-view.tsx
│   ├── contact/contact-view.tsx
│   ├── providers/
│   │   ├── theme-provider.tsx   # next-themes wrapper
│   │   └── brand-theme-setter.tsx
│   ├── last-unique-touch/last-unique-touch-view.tsx
│   ├── la-lounge/la-lounge-view.tsx
│   └── your-birthday/
│       ├── your-birthday-view.tsx
│       └── features-view.tsx
└── lib/
    ├── contact-info.ts      # Phone/WhatsApp source of truth
    └── products.ts          # calculateRentalTotal (server-matched formula)
```
