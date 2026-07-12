#!/usr/bin/env bun
/**
 * Design Rules Checker — verifies rules from DESIGN_RULES.md
 * Run: bun scripts/check-design-rules.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const errors: string[] = []

function walkDir(dir: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'ui') continue
      results.push(...walkDir(fullPath))
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      results.push(fullPath)
    }
  }
  return results
}

const files = walkDir('src')

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8')

  // 1. No <img> — use next/image (skip if eslint-disable is present)
  if (/<img\s/.test(content) && !content.includes('eslint-disable-next-line @next/next/no-img-element')) {
    errors.push(`❌ ${file}: Use next/image instead of <img>`)
  }

  // 2. No hardcoded currency (skip JSON-LD structured data and API routes)
  if (/['"]KWD['"]/.test(content) && !file.includes('test') && !file.includes('messages') && !file.includes('json-ld') && !content.includes('priceCurrency') && !file.includes('api/')) {
    errors.push(`❌ ${file}: Use t("common.currency") instead of hardcoded "KWD"`)
  }

  // 3. No <a href> for internal links (should use Link) — skip target="_blank"
  const hasInternalLink = /<a\s+href=['"]\/(?!tel:|mailto:|https?:)/.test(content)
  const hasTargetBlank = /target=['"]_blank['"]/.test(content)
  if (hasInternalLink && !hasTargetBlank) {
    errors.push(`❌ ${file}: Use Link from @/i18n/routing instead of <a href> for internal links`)
  }

  // 4. Dead ternaries (same value in both branches)
  const deadTernaries = content.match(/\?\s*['"]([^'"]+)['"]\s*:\s*['"]\1['"]/g)
  if (deadTernaries) {
    errors.push(`❌ ${file}: Dead ternary — same value in both branches: ${deadTernaries.join(', ')}`)
  }

  // 5. left/right CSS properties (should use logical properties)
  if (/\bml-|\bmr-|\bpl-|\bpr-/.test(content) && !file.includes('test')) {
    errors.push(`⚠️ ${file}: Use logical properties (ms-, me-, ps-, pe-) instead of ml-/mr-/pl-/pr-`)
  }
}

if (errors.length > 0) {
  console.error('\n🚨 Design Rules Violations:\n')
  errors.forEach(e => console.error(e))
  console.error(`\n❌ ${errors.length} violation(s) found. Read DESIGN_RULES.md.`)
  process.exit(1)
} else {
  console.log('✅ All design rules passed!')
}
