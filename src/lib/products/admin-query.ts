export const PRODUCTS_ADMIN_PAGE_SIZE = 20

export const PRODUCTS_ADMIN_SELECT = `
  id,
  name,
  slug,
  type,
  status,
  image_url,
  image_alt,
  short_description,
  description,
  meta_title,
  meta_description,
  seo_score,
  views,
  price_usd,
  sale_price_usd,
  regular_price_usd,
  created_at,
  category:product_categories(name)
` as const

export type ProductsAdminStats = {
  total: number
  published: number
  drafts: number
}

export type ProductsAdminPageResult = {
  data: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
