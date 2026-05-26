"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, LogOut, ShieldCheck, Mail, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GoogleConnectionCardProps {
  isConnected: boolean
  userEmail?: string | null
  onDisconnect: () => void
  needsIndexingScope?: boolean
}

export function GoogleConnectionCard({
  isConnected,
  userEmail,
  onDisconnect,
  needsIndexingScope = false,
}: GoogleConnectionCardProps) {
  const [disconnecting, setDisconnecting] = React.useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await onDisconnect()
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border transition-all duration-300",
      isConnected 
        ? "bg-gradient-to-br from-green-50/50 to-white border-green-100 shadow-sm" 
        : "bg-white border-dashed border-gray-200"
    )}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500",
              isConnected ? "bg-white text-green-600 scale-110" : "bg-gray-50 text-gray-400"
            )}>
              {isConnected ? (
                 <svg viewBox="0 0 24 24" className="size-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              ) : (
                <ShieldCheck className="size-6" />
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-primary flex items-center gap-2">
                Google Integration
                {isConnected && <StatusBadge status="connected" />}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                {isConnected 
                  ? "Your account is successfully linked. We are now synchronizing data from your Analytics and Search Console properties."
                  : "Link your Google Workspace to enable real-time search visibility and visitor analytics directly in your dashboard."
                }
              </p>
              
              {isConnected && userEmail && (
                <div className="flex items-center gap-2 mt-3 text-xs font-medium text-primary/70 bg-white/50 w-fit px-3 py-1.5 rounded-full border border-green-50/50">
                  <Mail className="size-3 text-green-600" />
                  {userEmail}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-wrap gap-2">
            {isConnected ? (
              <>
                {needsIndexingScope && (
                  <Button
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => {
                      window.location.href = '/api/google/auth?reconnect=1'
                    }}
                  >
                    <LogIn className="size-3.5" />
                    Reconnect for indexing
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="rounded-xl border-gray-200 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all gap-2"
                >
                  <LogOut className="size-3.5" />
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => window.location.href = '/api/google/auth'}
                size="sm"
                className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 gap-2 px-6"
              >
                <LogIn className="size-3.5" />
                Connect Account
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: 'connected' | 'error' | 'needs_config' }) {
  const configs = {
    connected: {
      label: 'Linked',
      class: 'bg-green-100 text-green-700 border-green-200',
      icon: <CheckCircle2 className="size-3" />
    },
    error: {
      label: 'Error',
      class: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: <AlertCircle className="size-3" />
    },
    needs_config: {
      label: 'Config Required',
      class: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: <AlertCircle className="size-3" />
    }
  }

  const config = configs[status]

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
      config.class
    )}>
      {config.icon}
      {config.label}
    </span>
  )
}
