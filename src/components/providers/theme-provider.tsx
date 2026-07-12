'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

/**
 * Thin wrapper around `next-themes`'s `ThemeProvider` so the rest of the app
 * can stay agnostic of the underlying theme library. Activated in Phase 5:
 * we ship `attribute="class"` (so `.dark` lands on `<html>` next to
 * `data-brand`), `defaultTheme="light"`, `enableSystem={false}` (the brand
 * pages have their own per-tenant palette — we don't want the OS preference
 * to override the explicit default), and `disableTransitionOnChange` so
 * toggling doesn't trigger Tailwind's `transition-colors` cascade.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
