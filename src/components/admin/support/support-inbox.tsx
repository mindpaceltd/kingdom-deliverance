'use client'

import * as React from 'react'
import { MessageCircle, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  getSupportConversation,
  listSupportConversations,
  sendStaffSupportMessage,
  updateSupportConversationStatus,
} from '@/lib/actions/support'
import type { SupportConversation, SupportMessage } from '@/lib/support/types'
import { formatAdminDate } from '@/lib/format-admin-date'

function statusVariant(status: SupportConversation['status']) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (status === 'closed') return 'bg-muted text-muted-foreground'
  return 'bg-green-100 text-green-800 border-green-200'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function SupportInbox({
  initialConversations,
}: {
  initialConversations: SupportConversation[]
}) {
  const [conversations, setConversations] = React.useState(initialConversations)
  const [activeId, setActiveId] = React.useState<string | null>(
    initialConversations[0]?.id ?? null
  )
  const [messages, setMessages] = React.useState<SupportMessage[]>([])
  const [loadingChat, setLoadingChat] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const active = conversations.find((c) => c.id === activeId) ?? null

  const loadChat = React.useCallback(async (id: string) => {
    setLoadingChat(true)
    const result = await getSupportConversation(id)
    setLoadingChat(false)
    if ('error' in result) return
    setMessages(result.messages)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_staff_count: 0 } : c))
    )
  }, [])

  React.useEffect(() => {
    if (activeId) void loadChat(activeId)
  }, [activeId, loadChat])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  React.useEffect(() => {
    const supabase = createClient()

    const convChannel = supabase
      .channel('support-inbox-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_conversations' },
        async () => {
          const result = await listSupportConversations()
          if (!Array.isArray(result)) return
          setConversations(result)
        }
      )
      .subscribe()

    let msgChannel: ReturnType<typeof supabase.channel> | null = null
    if (activeId) {
      msgChannel = supabase
        .channel(`support-inbox-messages-${activeId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `conversation_id=eq.${activeId}`,
          },
          (payload) => {
            const row = payload.new as SupportMessage
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev
              return [...prev, row]
            })
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeId
                  ? {
                      ...c,
                      last_message_at: row.created_at,
                      last_message_preview: row.body.slice(0, 120),
                      unread_staff_count:
                        row.sender_type === 'visitor'
                          ? c.unread_staff_count + 1
                          : c.unread_staff_count,
                    }
                  : c
              )
            )
          }
        )
        .subscribe()
    }

    return () => {
      supabase.removeChannel(convChannel)
      if (msgChannel) supabase.removeChannel(msgChannel)
    }
  }, [activeId])

  async function handleSend() {
    if (!activeId || !draft.trim()) return
    setSending(true)
    const result = await sendStaffSupportMessage(activeId, draft)
    setSending(false)
    if (result.message) {
      setMessages((prev) => [...prev, result.message!])
      setDraft('')
    }
  }

  const totalUnread = conversations.reduce((n, c) => n + (c.unread_staff_count ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="size-7 text-primary" />
            Live Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chat with visitors from the website widget. Any admin user can reply.
          </p>
        </div>
        {totalUnread > 0 && (
          <Badge className="bg-accent text-primary">{totalUnread} unread</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[calc(100vh-12rem)]">
        <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b font-semibold text-sm">Conversations</div>
          <div className="flex-1 overflow-y-auto divide-y max-h-[calc(100vh-14rem)]">
            {conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors',
                    activeId === c.id && 'bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {c.visitor_name || c.visitor_email || 'Website visitor'}
                    </span>
                    {c.unread_staff_count > 0 && (
                      <span className="shrink-0 text-[10px] font-bold bg-accent text-primary rounded-full px-1.5 py-0.5">
                        {c.unread_staff_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.last_message_preview || '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border',
                        statusVariant(c.status)
                      )}
                    >
                      {c.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                      {formatAdminDate(c.last_message_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card flex flex-col min-h-[480px]">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
              Select a conversation to start chatting.
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {active.visitor_name || 'Visitor'}
                    {active.visitor_email ? (
                      <span className="text-muted-foreground font-normal">
                        {' '}
                        · {active.visitor_email}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex gap-2">
                  {active.status !== 'closed' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void updateSupportConversationStatus(active.id, 'closed').then(() =>
                          setConversations((prev) =>
                            prev.map((c) =>
                              c.id === active.id ? { ...c, status: 'closed' } : c
                            )
                          )
                        )
                      }
                    >
                      Close
                    </Button>
                  )}
                  {active.status === 'closed' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void updateSupportConversationStatus(active.id, 'open').then(() =>
                          setConversations((prev) =>
                            prev.map((c) =>
                              c.id === active.id ? { ...c, status: 'open' } : c
                            )
                          )
                        )
                      }
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {loadingChat ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAgent = msg.sender_type === 'agent'
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', isAgent ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                            isAgent
                              ? 'bg-accent text-primary rounded-br-md'
                              : 'bg-background border border-border rounded-bl-md'
                          )}
                        >
                          <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                            {msg.sender_name ??
                              (msg.sender_type === 'bot'
                                ? 'Bot'
                                : msg.sender_type === 'visitor'
                                  ? 'Visitor'
                                  : 'Support')}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                          <p className="text-[10px] opacity-60 mt-1">
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t flex gap-2 items-end">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Reply to visitor…"
                  rows={2}
                  className="resize-none min-h-[44px]"
                  disabled={active.status === 'closed'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleSend()
                    }
                  }}
                />
                <Button
                  size="icon"
                  disabled={sending || !draft.trim() || active.status === 'closed'}
                  onClick={() => void handleSend()}
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
