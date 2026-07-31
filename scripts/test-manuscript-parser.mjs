// Smoke-test the manuscript parser against real sermon files.
// Usage: node scripts/test-manuscript-parser.mjs "/path/to/folder"
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

const files = fs
  .readdirSync(dir)
  .filter((f) => /\.(docx|pdf|txt)$/i.test(f))
  .sort()

console.log(`Found ${files.length} files\n`)

for (const file of files) {
  const buffer = fs.readFileSync(path.join(dir, file))
  const extracted = await extractManuscriptText(buffer, file)
  if ('error' in extracted) {
    console.log(`✗ ${file}\n   ERROR: ${extracted.error}\n`)
    continue
  }
  const p = parseManuscript(extracted.text, file)
  console.log(`✓ ${file}`)
  console.log(`   title      : ${p.title}`)
  console.log(`   theme      : ${p.theme ?? '—'}`)
  console.log(`   scripture  : ${p.mainScripture ?? '—'}`)
  console.log(`   date       : ${p.detectedDate ?? '—'}`)
  console.log(`   words      : ${p.wordCount} (~${p.estimatedMinutes} min)`)
  console.log(`   summary    : ${p.summary.slice(0, 160)}`)
  console.log(`   html head  : ${p.html.slice(0, 120).replace(/\n/g, ' ')}`)
  console.log()
}
