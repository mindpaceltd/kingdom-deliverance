'use client'

import { useCart } from '@/lib/cart-context'
import { useEffect } from 'react'

export function ClearCartOnMount() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
