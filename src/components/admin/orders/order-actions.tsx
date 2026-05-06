'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  Truck, 
  MoreHorizontal,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { deleteOrder, updateOrderStatus } from '@/lib/actions/orders'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export function OrderActions({ order, showLabel = true }: { order: any, showLabel?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  const handleUpdateStatus = async (data: { status?: string, payment_status?: string }) => {
    if (!order?.id) {
      toast.error('Invalid order ID')
      return
    }
    setLoading(true)
    try {
      const res = await updateOrderStatus(order.id, data)
      if (res.success) {
        toast.success('Order status updated')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to update status')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!order?.id) {
      toast.error('Invalid order ID')
      return
    }
    setLoading(true)
    try {
      const res = await deleteOrder(order.id)
      if (res.success) {
        toast.success('Order deleted successfully')
        router.push('/admin/orders')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete order')
      }
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={showLabel ? "default" : "sm"} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MoreHorizontal className={`h-4 w-4 ${showLabel ? 'mr-2' : ''}`} />
            )}
            {showLabel && "Manage Order"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            disabled={order?.status === 'processing'}
            onClick={() => handleUpdateStatus({ status: 'processing' })}
          >
            <Loader2 className="h-4 w-4 mr-2" /> Mark as Processing
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            disabled={order?.status === 'shipped'}
            onClick={() => handleUpdateStatus({ status: 'shipped' })}
          >
            <Truck className="h-4 w-4 mr-2" /> Mark as Shipped
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            disabled={order?.status === 'completed'}
            onClick={() => handleUpdateStatus({ status: 'completed' })}
          >
            <CheckCircle className="h-4 w-4 mr-2" /> Mark as Completed
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Payment Status</DropdownMenuLabel>
          
          <DropdownMenuItem 
            className="text-orange-500"
            disabled={order?.payment_status === 'refunded'}
            onClick={() => handleUpdateStatus({ payment_status: 'refunded', status: 'cancelled' })}
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Refund & Cancel Order
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="text-destructive focus:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete Order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order for <strong>{order?.email || 'this customer'}</strong>, 
              including all order items and transaction history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
