/**
 * Dev probe: compares the two sermon SEO builders on real manuscripts, scoring
 * each the way the admin editor does (against the stored HTML content).
 * Usage: npx tsx scripts/probe-sermon-compare.mts "/path/to/Sermons"
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { extractManuscriptText, parseManuscript } from '../src/lib/sermons/manuscript'
import { buildSermonSeo } from '../src/lib/sermons/sermon-seo'
import { buildImportSeoFields } from '../src/lib/sermons/import-seo'
import { computeSeoScore } from '../src/lib/seo-scorer'
import { generateSlug } from '../src/lib/utils'

const dir = process.argv[2]
if (!dir) throw new Error('Pass the sermons folder path')

const THUMB = 'https://kdcuganda.org/og-default.jpg'

const files = (await readdir(dir)).filter((f) => /\.(docx|pdf|txt|md)$/i.test(f))
const stems = new Map<string, string>()
for (const f of files.sort()) {
  const stem = f.replace(/\.[^.]+$/, '').toLowerCase()
  const cur = stems.get(stem)
  if (!cur || (/\.docx$/i.test(f) && !/\.docx$/i.test(cur))) stems.set(stem, f)
}

const mine: number[] = []
const theirs: number[] = []

for (const filename of Array.from(stems.values()).sort()) {
  const buffer = await readFile(join(dir, filename))
  const extracted = await extractManuscriptText(buffer, filename)
  if ('error' in extracted) continue
  const parsed = parseManuscript(extracted.text, filename)

  const a = buildSermonSeo({
    title: parsed.title,
    summary: parsed.summary,
    html: parsed.html,
    mainScripture: parsed.mainScripture,
    preacher: 'Bishop Climate Wiseman',
  })
  const aScore = computeSeoScore({
    focusKeyword: a.focusKeyword,
    seoTitle: a.metaTitle,
    metaDescription: a.metaDescription,
    content: a.content,
    slug: a.slugBase,
    featuredImage: THUMB,
  })

  // The other builder scores against plain text but the importer stores HTML,
  // so re-score it the way the admin editor will.
  const slug = generateSlug(parsed.title)
  const b = buildImportSeoFields({
    title: parsed.title,
    slug,
    description: parsed.summary,
    contentHtml: parsed.html,
    preacher: 'Bishop Climate Wiseman',
    scripture: parsed.mainScripture,
  })
  const bScore = computeSeoScore({
    focusKeyword: b.focus_keyword,
    seoTitle: b.meta_title,
    metaDescription: b.meta_description,
    content: parsed.html,
    slug,
    featuredImage: THUMB,
  })

  mine.push(aScore.score)
  theirs.push(bScore.score)

  const bFail = Object.entries(bScore.checks).filter(([, ok]) => !ok).map(([n]) => n)

  console.log(`### ${parsed.title}`)
  console.log(`  A(sermon-seo)  ${aScore.score}  kw="${a.focusKeyword}"`)
  console.log(`     title [${a.metaTitle.length}] ${a.metaTitle}`)
  console.log(`     desc  [${a.metaDescription.length}] ${a.metaDescription.slice(0, 110)}`)
  console.log(`  B(import-seo)  ${bScore.score}  (self-reported ${b.seo_score})  kw="${b.focus_keyword}"`)
  console.log(`     title [${b.meta_title.length}] ${b.meta_title}`)
  console.log(`     desc  [${b.meta_description.length}] ${b.meta_description.slice(0, 110)}`)
  console.log(`     failing: ${bFail.join(', ') || 'none'}`)
  console.log()
}

const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / (xs.length || 1))
console.log(`A sermon-seo : min ${Math.min(...mine)} avg ${avg(mine)} below85 ${mine.filter((s) => s < 85).length}`)
console.log(`B import-seo : min ${Math.min(...theirs)} avg ${avg(theirs)} below85 ${theirs.filter((s) => s < 85).length}`)
