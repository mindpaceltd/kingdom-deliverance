'use client'

import React from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  product: any
  className?: string
  iconClassName?: string
  label?: string
}

export function AddToCartButton({ product, className, iconClassName, label = 'Add to Cart' }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [added, setAdded] = React.useState(false)

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price_usd,
      quantity: 1,
      image: product.image_url,
      type: product.type
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAdd}
      className={cn(
        'flex items-center justify-center gap-2 font-bold transition-all duration-300',
        added ? 'bg-green-600 hover:bg-green-700 text-white' : '',
        className
      )}
    >
      {added ? (
        <>
          <Check className={cn('w-4 h-4', iconClassName)} />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart className={cn('w-4 h-4', iconClassName)} />
          {label}
        </>
      )}
    </button>
  )
}
