import { createClient } from '@supabase/supabase-js'

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function clamp(value, max) {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

function ensureRange(value, min, max, fallback) {
  const trimmed = String(value || '').trim()
  const base = trimmed || fallback
  if (base.length < min) {
    const needed = min - base.length
    return `${base}${' '.repeat(needed)}`.trim()
  }
  return clamp(base, max)
}

function makeMetaTitle(product) {
  const category = String(product.category?.name || 'Christian Book').trim()
  const preferred = `${product.name} | ${category} - KDC Uganda`
  const fallback = `${product.name} | KDC Uganda Store`
  return ensureRange(preferred, 30, 60, fallback)
}

function makeMetaDescription(product) {
  const category = String(product.category?.name || 'Christian resources').trim()
  const short = stripHtml(product.short_description)
  const desc = stripHtml(product.description)
  const base =
    short ||
    desc ||
    `${product.name} is available at Kingdom Deliverance Centre Uganda shop with secure checkout and ministry support impact.`
  const text = `${base} Shop this ${category.toLowerCase()} resource at KDC Uganda with instant order processing and trusted support.`
  return ensureRange(text, 120, 160, `${product.name} from KDC Uganda store with secure checkout and faith-building resources for spiritual growth.`)
}

function makeShortDescription(product) {
  const short = stripHtml(product.short_description)
  if (short.length >= 40) return short
  const category = String(product.category?.name || 'resource').trim()
  return `${product.name} is a spirit-filled ${category.toLowerCase()} from Kingdom Deliverance Centre Uganda to support daily spiritual growth and practical faith.`
}

function makeLongDescription(product) {
  const current = stripHtml(product.description)
  if (current.length > 320) return String(product.description || '').trim()
  const short = makeShortDescription(product)
  const category = String(product.category?.name || 'resource').trim()
  const typeLabel = product.type === 'digital' ? 'digital download' : 'physical product'
  return [
    `<p>${short}</p>`,
    `<p>This ${typeLabel} belongs to our ${category} collection and is prepared to help you grow in faith, prayer, and biblical understanding through practical ministry teaching.</p>`,
    `<p>When you purchase from Kingdom Deliverance Centre Uganda, you directly support outreach, discipleship, and local church programs while receiving trusted ministry resources for personal and family transformation.</p>`,
    `<p>Order now from the official KDC Uganda store and continue your spiritual journey with tools that strengthen your walk with God.</p>`,
  ].join('\n')
}

function makeImageAlt(product) {
  const current = String(product.image_alt || '').trim()
  if (current) return current
  return `${product.name} cover image - Kingdom Deliverance Centre Uganda`
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
  const passed = checks.filter(Boolean).length
  return Math.round((passed / checks.length) * 100)
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, type, image_alt, short_description, description, meta_title, meta_description, seo_score, category:product_categories(name)')
    .order('name', { ascending: true })

  if (error) throw error

  let updated = 0
  let alreadyPassing = 0
  let below85 = 0

  for (const product of products || []) {
    const next = {
      meta_title: makeMetaTitle(product),
      meta_description: makeMetaDescription(product),
      image_alt: makeImageAlt(product),
      short_description: makeShortDescription(product),
      description: makeLongDescription(product),
    }
    const score = computeSeoScore(next)

    if (score >= 85 && Number(product.seo_score || 0) >= 85) {
      alreadyPassing++
      continue
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ ...next, seo_score: score })
      .eq('id', product.id)
    if (updateError) throw updateError

    updated++
    if (score < 85) below85++
  }

  const { data: postRows } = await supabase
    .from('products')
    .select('seo_score')

  const total = (postRows || []).length
  const passing = (postRows || []).filter((p) => Number(p.seo_score || 0) >= 85).length
  const avg = total > 0 ? Math.round((postRows || []).reduce((sum, p) => sum + Number(p.seo_score || 0), 0) / total) : 0

  console.log(
    JSON.stringify(
      {
        totalProducts: total,
        updated,
        alreadyPassing,
        below85AfterUpdate: below85,
        passingAtOrAbove85: passing,
        passRatePercent: total > 0 ? Math.round((passing / total) * 100) : 0,
        averageSeoScore: avg,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
