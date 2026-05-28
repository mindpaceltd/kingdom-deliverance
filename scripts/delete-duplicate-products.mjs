import { createClient } from '@supabase/supabase-js'

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/^copy of\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreProduct(p) {
  const slug = String(p.slug || '').toLowerCase()
  const fileUrl = String(p.file_url || '').toLowerCase()
  let score = 0
  if (!slug.includes('copy-of')) score += 4
  if (!slug.includes('-copy')) score += 2
  if (fileUrl.includes('r2.dev')) score += 5
  else if (fileUrl.startsWith('http')) score += 2
  if (p.price > 0) score += 1
  return score
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, file_url, regular_price_usd, created_at')

  if (error) throw error

  const groups = new Map()
  for (const row of data || []) {
    const key = normalizeName(row.name)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({
      ...row,
      price: Number(row.regular_price_usd || 0),
      createdAt: new Date(row.created_at || 0).getTime(),
    })
  }

  const toDelete = []
  const keepers = []

  for (const [key, rows] of groups.entries()) {
    if (rows.length <= 1) continue
    rows.sort((a, b) => {
      const sa = scoreProduct(a)
      const sb = scoreProduct(b)
      if (sb !== sa) return sb - sa
      return a.createdAt - b.createdAt
    })
    const keeper = rows[0]
    keepers.push({ key, keeper: { id: keeper.id, slug: keeper.slug, name: keeper.name } })
    for (const row of rows.slice(1)) {
      toDelete.push(row.id)
    }
  }

  if (!toDelete.length) {
    console.log(JSON.stringify({ deleted: 0, duplicateGroups: 0 }, null, 2))
    return
  }

  const chunk = (arr, size) => {
    const out = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }

  for (const ids of chunk(toDelete, 200)) {
    await supabase.from('product_gallery').delete().in('product_id', ids)
    await supabase.from('product_variants').delete().in('product_id', ids)
    const { error: delError } = await supabase.from('products').delete().in('id', ids)
    if (delError) throw delError
  }

  console.log(
    JSON.stringify(
      {
        duplicateGroups: keepers.length,
        deleted: toDelete.length,
        kept: keepers.length,
      },
      null,
      2
    )
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
