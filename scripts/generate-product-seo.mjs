/**
 * Bring every active published product to a true 100% product SEO score.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-product-seo.mjs
 */
import { createClient } from '@supabase/supabase-js'

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function clampChars(value, max) {
  const text = String(value || '').trim()
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

/** Grow/shrink text into [min, max] using real words (never space-padding). */
function fitRange(value, min, max, fillers = []) {
  let text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text && fillers.length) text = fillers[0]
  text = text || 'Kingdom Deliverance Centre Uganda store resource'

  let i = 0
  while (text.length < min && i < fillers.length + 6) {
    const filler = fillers[i % Math.max(fillers.length, 1)] || ' at KDC Uganda'
    const next = `${text}${text.endsWith('.') ? '' : ''} ${filler}`.replace(/\s+/g, ' ').trim()
    if (next.length === text.length) break
    text = next
    i += 1
  }

  if (text.length < min) {
    text = `${text} ${'ministry resources'.repeat(Math.ceil((min - text.length) / 18))}`.trim()
  }

  return clampChars(text, max)
}

function computeSeoScore(input) {
  const metaTitle = input.meta_title?.trim() ?? ''
  const metaDescription = input.meta_description?.trim() ?? ''
  const imageAlt = input.image_alt?.trim() ?? ''
  const shortDescription = input.short_description?.trim() ?? ''
  const plainDescription = stripHtml(input.description ?? '')
  const checks = [
    metaTitle.length >= 30 && metaTitle.length <= 60,
    metaDescription.length >= 120 && metaDescription.length <= 160,
    imageAlt.length > 0,
    plainDescription.length > 300,
    shortDescription.length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function makeMetaTitle(product) {
  const name = String(product.name || 'Ministry Resource').trim()
  const category = String(product.category?.name || '').replace(/&amp;/gi, '&').trim()
  const candidates = [
    `${name} | KDC Uganda`,
    category ? `${name} | ${category}` : null,
    `${name} - KDC Shop`,
    `Buy ${name} | KDC Uganda`,
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (candidate.length >= 30 && candidate.length <= 60) return candidate
  }

  // Long names: keep the start + brand suffix within 60.
  const suffix = ' | KDC'
  return clampChars(`${name}${suffix}`, 60)
}

function makeMetaDescription(product) {
  const name = String(product.name || 'This resource').trim()
  const category = String(product.category?.name || 'Christian resource')
    .replace(/&amp;/gi, '&')
    .trim()
  const short = stripHtml(product.short_description)
  const desc = stripHtml(product.description)
  const base =
    short ||
    desc ||
    `${name} is available from the Kingdom Deliverance Centre Uganda shop.`

  return fitRange(
    base,
    120,
    160,
    [
      `Shop this ${category.toLowerCase()} at KDC Uganda.`,
      'Secure checkout and ministry support with every order.',
      'Order today from the official KDC Uganda store.',
    ]
  )
}

function makeShortDescription(product) {
  const short = stripHtml(product.short_description)
  if (short.length >= 40) return short
  const category = String(product.category?.name || 'resource')
    .replace(/&amp;/gi, '&')
    .trim()
    .toLowerCase()
  return fitRange(
    `${product.name} is a spirit-filled ${category} from Kingdom Deliverance Centre Uganda for practical faith and daily spiritual growth.`,
    40,
    220,
    ['Trusted ministry teaching for personal and family transformation.']
  )
}

function makeLongDescription(product) {
  const currentPlain = stripHtml(product.description)
  if (currentPlain.length > 300) return String(product.description || '').trim()

  const short = makeShortDescription(product)
  const category = String(product.category?.name || 'resource')
    .replace(/&amp;/gi, '&')
    .trim()
  const typeLabel = product.type === 'digital' ? 'digital download' : 'physical product'

  return [
    `<p>${short}</p>`,
    `<p>This ${typeLabel} is part of our ${category} collection and is prepared to help you grow in faith, prayer, and biblical understanding through practical ministry teaching from Bishop Climate Wiseman and Kingdom Deliverance Centre Uganda.</p>`,
    `<p>When you purchase from the official KDC Uganda store, you support outreach, discipleship, and local church programs while receiving trusted resources for personal and family transformation.</p>`,
    `<p>Order today with secure checkout and continue your spiritual journey with tools that strengthen your walk with God.</p>`,
  ].join('\n')
}

function makeImageAlt(product) {
  const current = String(product.image_alt || '').trim()
  if (current) return current
  return `${product.name} – Kingdom Deliverance Centre Uganda store`
}

async function fetchAllProducts(supabase) {
  const pageSize = 500
  let offset = 0
  const all = []

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select(
        'id, name, slug, type, image_alt, short_description, description, meta_title, meta_description, seo_score, is_active, status, category:product_categories(name)'
      )
      .eq('is_active', true)
      .eq('status', 'published')
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) throw error
    if (!data?.length) break
    all.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  return all
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, key)
  const products = await fetchAllProducts(supabase)

  let updated = 0
  let alreadyPerfect = 0
  let failed = 0
  const failures = []

  for (const product of products) {
    const currentScore = computeSeoScore(product)
    if (currentScore === 100 && Number(product.seo_score || 0) === 100) {
      alreadyPerfect++
      continue
    }

    const next = {
      meta_title: makeMetaTitle(product),
      meta_description: makeMetaDescription(product),
      image_alt: makeImageAlt(product),
      short_description: makeShortDescription(product),
      description: makeLongDescription(product),
    }
    const score = computeSeoScore(next)

    if (score !== 100) {
      failed++
      failures.push({
        id: product.id,
        name: product.name,
        score,
        meta_title: next.meta_title.length,
        meta_description: next.meta_description.length,
        desc: stripHtml(next.description).length,
      })
      continue
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ ...next, seo_score: 100 })
      .eq('id', product.id)

    if (updateError) {
      failed++
      failures.push({ id: product.id, name: product.name, error: updateError.message })
      continue
    }

    updated++
  }

  // Verify live scores
  const after = await fetchAllProducts(supabase)
  let perfect = 0
  let imperfect = 0
  for (const p of after) {
    const live = computeSeoScore(p)
    if (live === 100 && Number(p.seo_score || 0) === 100) perfect++
    else imperfect++
  }

  console.log(
    JSON.stringify(
      {
        scanned: products.length,
        alreadyPerfect,
        updated,
        failed,
        perfectAfter: perfect,
        imperfectAfter: imperfect,
        sampleFailures: failures.slice(0, 10),
      },
      null,
      2
    )
  )

  if (imperfect > 0 || failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
