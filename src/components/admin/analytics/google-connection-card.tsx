'use client'

import * as React from 'react'
import { Loader2, CheckCircle2, XCircle, AlertCircle, ChevronRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface GoogleConnectionCardProps {
  isConnected: boolean
  userEmail?: string | null
  onDisconnect: () => void
}

export function GoogleConnectionCard({ isConnected, userEmail, onDisconnect }: GoogleConnectionCardProps) {
  return (
    <div className="flex items-center justify-between p-5 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-full bg-white border shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="size-6">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm">Google Account</p>
          {isConnected && userEmail ? (
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Not connected</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isConnected ? (
          <>
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <CheckCircle2 className="size-4" /> Connected
            </span>
            <Button variant="outline" size="sm" onClick={onDisconnect} className="gap-1.5 text-destructive hover:text-destructive">
              <LogOut className="size-3.5" /> Disconnect
            </Button>
          </>
        ) : (
          <Button asChild size="sm" className="gap-2">
            <a href="/api/google/auth">
              <svg viewBox="0 0 24 24" className="size-4">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              </svg>
              Connect Google Account
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

// Status badge helper
export function StatusBadge({ status }: { status: 'connected' | 'needs_config' | 'disconnected' }) {
  const map = {
    connected: { icon: CheckCircle2, label: 'Connected', cls: 'text-green-600' },
    needs_config: { icon: AlertCircle, label: 'Needs Setup', cls: 'text-yellow-600' },
    disconnected: { icon: XCircle, label: 'Disconnected', cls: 'text-muted-foreground' },
  }
  const { icon: Icon, label, cls } = map[status]
  return (
    <span className={cn('flex items-center gap-1.5 text-xs font-medium', cls)}>
      <Icon className="size-3.5" /> {label}
    </span>
  )
}
