// Smoke-test heuristic SEO for imported sermons.
// Usage: node scripts/test-sermon-import-seo.mjs "/path/to/folder"
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
if (!dir) {
  console.error('Pass a folder path')
  process.exit(1)
}

const { extractManuscriptText, parseManuscript } = await import(
  '../src/lib/sermons/manuscript.ts'
)
const { buildImportSeoFields } = await import('../src/lib/sermons/import-seo.ts')
const { generateSlug } = await import('../src/lib/utils.ts')

const files = fs
  .readdirSync(dir)
  .filter((f) => /\.docx$/i.test(f))
  .sort()

console.log(`Testing SEO for ${files.length} .docx files\n`)

for (const file of files) {
  const buffer = fs.readFileSync(path.join(dir, file))
  const extracted = await extractManuscriptText(buffer, file)
  if ('error' in extracted) continue
  const parsed = parseManuscript(extracted.text, file)
  const slug = generateSlug(parsed.title)
  const seo = buildImportSeoFields({
    title: parsed.title,
    slug,
    description: parsed.summary,
    contentHtml: parsed.html,
    preacher: 'Bishop Climate Wiseman',
    scripture: parsed.mainScripture,
  })

  console.log(`✓ ${file}`)
  console.log(`   title       : ${parsed.title}`)
  console.log(`   meta_title  : ${seo.meta_title} (${seo.meta_title.length})`)
  console.log(`   meta_desc   : ${seo.meta_description} (${seo.meta_description.length})`)
  console.log(`   keyword     : ${seo.focus_keyword}`)
  console.log(`   seo_score   : ${seo.seo_score}/100`)
  console.log()
}
