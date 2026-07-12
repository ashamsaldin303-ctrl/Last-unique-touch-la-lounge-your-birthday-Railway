export function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-md overflow-hidden bg-card border border-border"
        >
          {/* Image skeleton */}
          <div className="aspect-square bg-muted animate-pulse" />

          {/* Info skeleton */}
          <div className="p-4 space-y-2">
            <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
