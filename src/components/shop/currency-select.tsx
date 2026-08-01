'use client'

import { useCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CURRENCY_LABELS: Record<string, string> = {
  UGX: 'UGX — Uganda Shilling',
  KES: 'KES — Kenya Shilling',
  TZS: 'TZS — Tanzania Shilling',
  RWF: 'RWF — Rwanda Franc',
  NGN: 'NGN — Nigerian Naira',
  GHS: 'GHS — Ghana Cedi',
  ZAR: 'ZAR — South African Rand',
  GBP: 'GBP — British Pound',
  EUR: 'EUR — Euro',
  USD: 'USD — US Dollar',
}

interface CurrencySelectProps {
  className?: string
  compact?: boolean
}

export function CurrencySelect({ className, compact = false }: CurrencySelectProps) {
  const { currency, setCurrency } = useCurrency()

  return (
    <Select value={currency} onValueChange={(value) => setCurrency(value ?? currency)}>
      <SelectTrigger className={className} aria-label="Display currency">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((code) => (
          <SelectItem key={code} value={code}>
            {compact ? code : (CURRENCY_LABELS[code] ?? code)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
