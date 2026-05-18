'use client'

import { useCurrency } from '@/lib/currency-context'

interface ProductPriceProps {
  displayPrice: number
  regularPrice?: number
  hasDiscount?: boolean
  /** compact mode: just show the price inline, no savings line */
  compact?: boolean
}

export function ProductPrice({
  displayPrice,
  regularPrice,
  hasDiscount,
  compact = false,
}: ProductPriceProps) {
  const { formatPrice, currency, rate } = useCurrency()

  const isFree = displayPrice === 0

  if (compact) {
    return (
      <span suppressHydrationWarning>
        {isFree ? 'Free' : formatPrice(displayPrice)}
      </span>
    )
  }

  const savingsUsd = hasDiscount && regularPrice ? regularPrice - displayPrice : 0
  const savingsPct = hasDiscount && regularPrice
    ? Math.round((1 - displayPrice / regularPrice) * 100)
    : 0

  return (
    <div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-2xl font-black text-gray-900" suppressHydrationWarning>
          {isFree ? 'Free' : formatPrice(displayPrice)}
        </span>
        {hasDiscount && regularPrice && (
          <span className="text-lg text-gray-400 line-through" suppressHydrationWarning>
            {formatPrice(regularPrice)}
          </span>
        )}
      </div>
      {hasDiscount && savingsUsd > 0 && (
        <p className="text-sm text-green-600 font-semibold mt-1" suppressHydrationWarning>
          You save: {formatPrice(savingsUsd)} ({savingsPct}%)
        </p>
      )}
    </div>
  )
}
