'use client'

import { useState } from 'react'

interface QuantitySelectorProps {
  min?: number
  max?: number
  onChange?: (qty: number) => void
}

export function QuantitySelector({ min = 1, max = 99, onChange }: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(1)

  const decrement = () => {
    setQuantity((prev) => {
      const next = Math.max(min, prev - 1)
      onChange?.(next)
      return next
    })
  }

  const increment = () => {
    setQuantity((prev) => {
      const next = Math.min(max, prev + 1)
      onChange?.(next)
      return next
    })
  }

  return (
    <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={decrement}
        className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-bold text-lg border-r border-gray-300 transition-colors"
      >
        −
      </button>
      <span className="px-5 py-2 text-sm font-bold text-gray-900 min-w-[40px] text-center">
        {quantity}
      </span>
      <button
        onClick={increment}
        className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-bold text-lg border-l border-gray-300 transition-colors"
      >
        +
      </button>
    </div>
  )
}
