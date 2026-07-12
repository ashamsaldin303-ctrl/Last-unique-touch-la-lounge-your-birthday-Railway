'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Minimal client-only ErrorBoundary.
 *
 * Used to wrap `next/dynamic` 3D imports (R3F / Three.js canvases) so that a
 * runtime WebGL error or component crash inside the canvas degrades gracefully
 * to the supplied `fallback` (or nothing) instead of tearing down the whole
 * page. Without this, a single thrown error in `<PurpleWaves3D />` etc. would
 * blank the entire brand landing page.
 *
 * Note: Next.js App Router's `error.tsx` only catches errors in Server
 * Components / route segments — it does NOT catch errors thrown inside a
 * client component subtree. We need a real React ErrorBoundary class for that.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // Log so the error is still visible in dev / production monitoring,
    // without bubbling it up to React and unmounting the page.
    console.error('[ErrorBoundary] caught error:', error)
  }

  render() {
    return this.state.hasError
      ? (this.props.fallback ?? null)
      : this.props.children
  }
}
