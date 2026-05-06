'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, MinusCircle, Loader2 } from 'lucide-react'
import { adjustUserCredits } from '@/lib/actions/credits'
import { toast } from 'sonner'

export function CreditAdjustmentDialog({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const handleAdjust = async (type: 'add' | 'subtract') => {
    const numAmount = parseInt(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      const finalAmount = type === 'add' ? numAmount : -numAmount
      const res = await adjustUserCredits(email, finalAmount, reason || `Admin ${type} adjustment`)
      
      if (res.success) {
        toast.success(`Credits ${type === 'add' ? 'added' : 'removed'} successfully`)
        setOpen(false)
        setAmount('')
        setReason('')
      } else {
        toast.error(res.error || 'Failed to adjust credits')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Credits</DialogTitle>
          <DialogDescription>
            Modify the credit balance for <strong>{email}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              placeholder="e.g. Refund, Bonus, Correction"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex flex-row gap-2 sm:justify-end">
          <Button
            variant="destructive"
            onClick={() => handleAdjust('subtract')}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MinusCircle className="h-4 w-4 mr-2" />}
            Subtract
          </Button>
          <Button
            variant="success"
            onClick={() => handleAdjust('add')}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
            Add Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
