/** Matches checklist in `product-form.tsx` (5 items → 0–100%). */
export function computeProductSeoScore(input: {
  meta_title?: string | null
  meta_description?: string | null
  image_alt?: string | null
  description?: string | null
  short_description?: string | null
}): number {
  const metaTitle = input.meta_title?.trim() ?? ''
  const metaDescription = input.meta_description?.trim() ?? ''
  const imageAlt = input.image_alt?.trim() ?? ''
  const shortDescription = input.short_description?.trim() ?? ''
  const plainDescription = (input.description ?? '').replace(/<[^>]*>?/gm, '').trim()

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
