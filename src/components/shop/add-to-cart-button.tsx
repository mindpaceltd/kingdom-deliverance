'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  product: any
  className?: string
}

export function AddToCartButton({ product, className }: AddToCartButtonProps) {
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
    <Button 
      onClick={handleAdd}
      className={cn(
        "gap-2 transition-all duration-300 shadow-xl shadow-primary/20",
        added ? "bg-green-600 hover:bg-green-700" : "",
        className
      )}
    >
      {added ? (
        <>
          <Check className="w-5 h-5" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
