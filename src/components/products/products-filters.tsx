'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category } from '@prisma/client'
import type { ProductSort } from '@/lib/products'

interface ProductsFiltersProps {
  categories: Category[]
  activeCategory?: string
  search?: string
  sort: ProductSort
}

export function ProductsFilters({
  categories,
  activeCategory,
  search,
  sort,
}: ProductsFiltersProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(search ?? '')

  // Sync local search state when URL changes
  useEffect(() => {
    setSearchValue(search ?? '')
  }, [search])

  // Debounced search update
  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(window.location.search)
      if (value.trim()) {
        params.set('q', value.trim())
      } else {
        params.delete('q')
      }
      // Reset to page 1 when search changes
      params.delete('page')
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`)
    },
    [router, pathname]
  )

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (search ?? '')) {
        updateSearch(searchValue)
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const handleCategoryClick = (slug: string | undefined) => {
    const params = new URLSearchParams(window.location.search)
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    // Reset to page 1 when category changes
    params.delete('page')
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set('sort', value)
    // Reset to page 1 when sort changes
    params.delete('page')
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  // Category chips: "All" + each category
  const chips = [
    { slug: undefined, label: t('products.allCategories') },
    ...categories.map((c) => ({
      slug: c.slug,
      label: locale === 'ar' ? c.nameAr : c.nameEn,
    })),
  ]

  return (
    <div className="mb-8 space-y-4">
      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={t('products.searchPlaceholder')}
            aria-label={t('products.searchPlaceholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="ps-10 bg-card"
          />
        </div>

        {/* Sort dropdown */}
        <div className="w-full sm:w-56">
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder={t('products.sort.label')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('products.sort.newest')}</SelectItem>
              <SelectItem value="price-asc">{t('products.sort.price-asc')}</SelectItem>
              <SelectItem value="price-desc">{t('products.sort.price-desc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const isActive =
            chip.slug === undefined
              ? !activeCategory
              : activeCategory === chip.slug
          return (
            <button
              key={chip.slug ?? 'all'}
              onClick={() => handleCategoryClick(chip.slug)}
              aria-pressed={isActive}
              className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-lut text-primary-foreground'
                  : 'bg-stone-50 text-foreground hover:bg-secondary'
              }`}
>
              {chip.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
