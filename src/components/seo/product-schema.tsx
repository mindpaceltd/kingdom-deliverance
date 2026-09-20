export interface ProductSchemaProps {
  product: {
    name: string
    description?: string | null
    slug: string
    price?: number | null
    compare_at_price?: number | null
    currency?: string
    image_url?: string | null
    sku?: string | null
    stock_quantity?: number | null
    is_active?: boolean
  }
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const pageUrl = `https://kdcuganda.org/shop/${product.slug}`
  const inStock = product.is_active !== false && (product.stock_quantity == null || product.stock_quantity > 0)

  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Shop ${product.name} at Kingdom Deliverance Centre Uganda.`,
    ...(product.image_url ? { image: [product.image_url] } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: {
      '@type': 'Brand',
      name: 'Kingdom Deliverance Centre Uganda',
    },
    offers: {
      '@type': 'Offer',
      price: product.price ?? 0,
      priceCurrency: product.currency || 'UGX',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: pageUrl,
      seller: {
        '@type': 'Organization',
        name: 'Kingdom Deliverance Centre Uganda',
        url: 'https://kdcuganda.org',
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
    />
  )
}
