/**
 * Dev probe: parses every manuscript in a folder and reports the fields the
 * importer would store, plus the SEO score they would receive.
 * Usage: npx tsx scripts/probe-sermon-parse.mts "/path/to/Sermons"
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { extractManuscriptText, parseManuscript } from '../src/lib/sermons/manuscript'
import { buildSermonSeo } from '../src/lib/sermons/sermon-seo'
import { computeSeoScore } from '../src/lib/seo-scorer'

const dir = process.argv[2]
if (!dir) throw new Error('Pass the sermons folder path')

const PLACEHOLDER_THUMB = 'https://kdcuganda.org/og-default.jpg'

const files = (await readdir(dir)).filter((f) => /\.(docx|pdf|txt|md)$/i.test(f))

// Mirror the UI de-dupe: .docx wins over a same-named .pdf.
const stems = new Map<string, string>()
for (const f of files.sort()) {
  const stem = f.replace(/\.[^.]+$/, '').toLowerCase()
  const current = stems.get(stem)
  if (!current || (/\.docx$/i.test(f) && !/\.docx$/i.test(current))) stems.set(stem, f)
}

console.log(`${files.length} files -> ${stems.size} unique sermons\n`)

let min = 100
const scores: number[] = []

for (const filename of Array.from(stems.values()).sort()) {
  const buffer = await readFile(join(dir, filename))
  const extracted = await extractManuscriptText(buffer, filename)
  if ('error' in extracted) {
    console.log(`FAIL  ${filename}: ${extracted.error}\n`)
    continue
  }

  const parsed = parseManuscript(extracted.text, filename)
  const seo = buildSermonSeo({
    title: parsed.title,
    summary: parsed.summary,
    html: parsed.html,
    mainScripture: parsed.mainScripture,
    preacher: 'Bishop Climate Wiseman',
  })

  const { score, checks } = computeSeoScore({
    focusKeyword: seo.focusKeyword,
    seoTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    content: seo.content,
    slug: seo.slugBase,
    featuredImage: PLACEHOLDER_THUMB,
  })

  const failed = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name)

  scores.push(score)
  min = Math.min(min, score)

  console.log(`FILE      ${filename}`)
  console.log(`title     ${parsed.title}`)
  console.log(`slug      ${seo.slugBase}`)
  console.log(`keyword   ${seo.focusKeyword}`)
  console.log(`metaTitle [${seo.metaTitle.length}] ${seo.metaTitle}`)
  console.log(`metaDesc  [${seo.metaDescription.length}] ${seo.metaDescription}`)
  console.log(`scripture ${parsed.mainScripture ?? '-'}  date ${parsed.detectedDate ?? '-'}  words ${parsed.wordCount}`)
  console.log(`intro     ${seo.content.slice(0, 150).replace(/\n/g, ' ')}`)
  console.log(`SEO       ${score}/100  failing: ${failed.join(', ') || 'none'}`)
  console.log()
}

const avg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1))
console.log(`SUMMARY   ${scores.length} sermons · min ${min} · avg ${avg} · below 85: ${scores.filter((s) => s < 85).length}`)
