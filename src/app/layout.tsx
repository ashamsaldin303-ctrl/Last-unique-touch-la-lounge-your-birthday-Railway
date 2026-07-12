import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Last Unique Touch',
  // v28-g2-F2 Fix 2: locale-neutral English description for the root
  // layout. The [locale]/layout.tsx generateMetadata() overrides this with
  // the locale-specific brand tagline for actual pages, but this fallback
  // surfaces for crawlers reading the root and for any route that doesn't
  // run the locale layout. Arabic-only here would mislead non-Arabic
  // crawlers; English is the lingua franca of the web.
  description: 'Luxury furniture and event equipment rental platform in Kuwait',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // This is a pass-through — the [locale] layout handles html/body
  return children
}
