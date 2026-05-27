'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveCreditSettings } from '@/lib/actions/credit-settings'
import type { CreditSettings } from '@/lib/credits/settings'
import { SUPPORTED_CURRENCIES } from '@/lib/currency-context'
import { Loader2, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreditSettingsPanelProps {
  initial: CreditSettings
}

export function CreditSettingsPanel({ initial }: CreditSettingsPanelProps) {
  const [pricePerCreditGbp, setPricePerCreditGbp] = useState(String(initial.pricePerCreditGbp))
  const [newUserBonus, setNewUserBonus] = useState(String(initial.newUserBonus))
  const [checkoutCurrency, setCheckoutCurrency] = useState(initial.checkoutCurrency)
  const [pending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveCreditSettings({
        pricePerCreditGbp: Number(pricePerCreditGbp),
        newUserBonus: Number(newUserBonus),
        checkoutCurrency,
      })
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Credit settings saved.')
    })
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Credit pricing</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            1 credit is priced in GBP. Checkout amounts use live exchange rates and round up to the
            nearest whole number in the payment currency.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="credit_price_gbp">Price per 1 credit (GBP)</Label>
          <Input
            id="credit_price_gbp"
            type="number"
            min={0.01}
            step={0.01}
            value={pricePerCreditGbp}
            onChange={(e) => setPricePerCreditGbp(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Usually £1 per credit.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit_new_user_bonus">New user welcome bonus (credits)</Label>
          <Input
            id="credit_new_user_bonus"
            type="number"
            min={0}
            step={1}
            value={newUserBonus}
            onChange={(e) => setNewUserBonus(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Granted once when a wallet is first created (replaces any hardcoded bonus).
          </p>
        </div>

        <div className="space-y-2">
          <Label>Pesapal checkout currency</Label>
          <Select value={checkoutCurrency} onValueChange={setCheckoutCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Amount sent to Pesapal after GBP → currency conversion (ceiling).
          </p>
        </div>
      </div>

      <Button type="button" onClick={handleSave} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save credit settings
      </Button>
    </div>
  )
}
