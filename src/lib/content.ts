import fs from 'fs/promises'
import path from 'path'

/**
 * Simple in-memory cache for content files.
 * Keyed by absolute file path; values are the raw file contents.
 * Markdown content rarely changes in production, so we cache aggressively
 * to avoid hitting the filesystem on every request. The cache survives
 * for the lifetime of the server process (cleared on restart / redeploy
 * by Next.js).
 */
const cache = new Map<string, string>()

/**
 * Read a markdown content file for the given locale and page name.
 * Falls back to Arabic if the requested locale file doesn't exist.
 */
export async function getContent(
  locale: string,
  page: 'about' | 'terms' | 'privacy' | 'refund'
): Promise<string> {
  const basePath = path.join(process.cwd(), 'content')
  const localeDir = locale === 'en' ? 'en' : 'ar'
  const filePath = path.join(basePath, localeDir, `${page}.md`)

  // Check in-memory cache first
  const cached = cache.get(filePath)
  if (cached !== undefined) {
    return cached
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    cache.set(filePath, content)
    return content
  } catch {
    // Fallback to Arabic
    const fallbackPath = path.join(basePath, 'ar', `${page}.md`)
    const fallbackCached = cache.get(fallbackPath)
    if (fallbackCached !== undefined) {
      return fallbackCached
    }
    try {
      const fallbackContent = await fs.readFile(fallbackPath, 'utf-8')
      cache.set(fallbackPath, fallbackContent)
      return fallbackContent
    } catch {
      // Neither the requested locale nor the Arabic fallback exists.
      // v29-fix-F7 Fix #4: localize the fallback message so an Arabic
      // visitor whose content file is missing sees Arabic, not English.
      // (This runs server-side outside the NextIntlClientProvider, so we
      // branch on the `locale` argument directly rather than calling
      // useTranslations / getTranslations.)
      const heading = locale === 'ar' ? 'المحتوى غير متوفر' : 'Content not available'
      return `# ${page}\n\n${heading}`
    }
  }
}
