interface PageHeaderProps {
  title: string
  subtitle?: string
  lastUpdated?: string
}

export function PageHeader({ title, subtitle, lastUpdated }: PageHeaderProps) {
  return (
    // `pt-32` clears the fixed navbar (h-16 + extra room for the page
    // header block).
    <div className="bg-stone-50 pt-32 pb-12 border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mb-2">{lastUpdated}</p>
        )}
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl">
            {subtitle}
          </p>
        )}
        <div className="h-1 bg-gold mt-6" style={{ width: '60px' }} />
      </div>
    </div>
  )
}

interface LegalPageWrapperProps {
  title: string
  subtitle?: string
  lastUpdated?: string
  children: React.ReactNode
}

export function LegalPageWrapper({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalPageWrapperProps) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} lastUpdated={lastUpdated} />
      {/* FIX-1A / C4: was <main className="min-h-[100dvh] ...">. The
          [locale]/layout.tsx already provides the centralised
          <main id="main-content"> landmark — nesting another <main> here
          created a duplicate landmark and broke the skip-to-content link.
          Switched to a plain <div>. */}
      <div className="min-h-[100dvh] bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            {children}
          </div>
        </div>
      </div>
      {/* FIX-1A: <Footer /> is now rendered by the [locale]/layout.tsx. */}
    </>
  )
}
