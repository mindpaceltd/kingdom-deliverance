'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { togglePaymentGateway } from '@/lib/actions/settings-shop'
import { toast } from 'sonner'

interface PaymentGatewayToggleProps {
  id: string
  isActive: boolean
}

export function PaymentGatewayToggle({ id, isActive }: PaymentGatewayToggleProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleToggle() {
    setLoading(true)
    const result = await togglePaymentGateway(id, !isActive)
    setLoading(false)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void handleToggle()}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
        isActive
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {loading ? '…' : isActive ? 'Active' : 'Inactive'}
    </button>
  )
}
