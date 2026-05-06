'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MoreHorizontal, Eye, CheckCircle, XCircle, Loader2, Download } from 'lucide-react'
import { updateRequestStatus } from '@/lib/actions/credits'
import { toast } from 'sonner'

export function RequestStatusActions({ request }: { request: any }) {
  const [loading, setLoading] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)

  const handleUpdate = async (status: string) => {
    setLoading(true)
    try {
      const res = await updateRequestStatus(request.id, status)
      if (res.success) {
        toast.success(`Request marked as ${status}`)
      } else {
        toast.error(res.error || 'Failed to update status')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setViewOpen(true)}>
          <Eye className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Manage Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleUpdate('completed')} className="text-green-500">
              <CheckCircle className="h-4 w-4 mr-2" /> Mark Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdate('cancelled')} className="text-destructive">
              <XCircle className="h-4 w-4 mr-2" /> Cancel Request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Prayer Request Details</DialogTitle>
            <DialogDescription>
              Submitted by {request.first_name} {request.last_name} on {new Date(request.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{request.country}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{request.phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Attendance</p>
                <p className="font-medium">{request.attendance_mode}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Mode</p>
                <p className="font-medium capitalize">{request.payment_method}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Prayer Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {request.prayer_focus_areas?.map((area: string) => (
                  <Badge key={area} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Detailed Request</p>
              <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap italic">
                "{request.prayer_request_details}"
              </div>
            </div>

            {request.attachment_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Attachment</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={request.attachment_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Download File
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: any, className?: string }) {
  const variants: any = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border text-foreground',
    success: 'bg-green-500/10 text-green-500',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
