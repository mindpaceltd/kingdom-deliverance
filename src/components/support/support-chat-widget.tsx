'use client'

import * as React from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  initVisitorSupportChat,
  sendVisitorSupportMessage,
  sendVisitorBotQuickReply,
  fetchVisitorSupportMessages,
} from '@/lib/actions/support'
import { BOT_QUICK_REPLIES } from '@/lib/support/bot'
import type { SupportConversation, SupportMessage } from '@/lib/support/types'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function SupportChatWidget() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [conversation, setConversation] = React.useState<SupportConversation | null>(null)
  const [messages, setMessages] = React.useState<SupportMessage[]>([])
  const [draft, setDraft] = React.useState('')
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [started, setStarted] = React.useState(false)
  const [unread, setUnread] = React.useState(0)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  React.useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, open, scrollToBottom])

  async function bootstrap() {
    setLoading(true)
    const result = await initVisitorSupportChat({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
    })
    setLoading(false)
    if ('error' in result) return
    setConversation(result.conversation)
    setMessages(result.messages)
    setStarted(true)
    setUnread(0)
  }

  async function handleOpen() {
    setOpen(true)
    if (!started) {
      await bootstrap()
    }
  }

  async function handleSend() {
    if (!conversation || !draft.trim()) return
    setSending(true)
    const result = await sendVisitorSupportMessage(conversation.id, draft)
    setSending(false)
    if (result.message) {
      setMessages((prev) => [...prev, result.message!])
      setDraft('')
    }
  }

  async function handleQuickReply(replyKey: string) {
    if (!conversation) return
    setSending(true)
    const result = await sendVisitorBotQuickReply(conversation.id, replyKey)
    setSending(false)
    if (result.messages) setMessages(result.messages)
  }

  React.useEffect(() => {
    if (!conversation?.id) return

    const supabase = createClient()
    const channel = supabase
      .channel(`support-visitor-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const row = payload.new as SupportMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, row]
          })
          if (!open && row.sender_type === 'agent') {
            setUnread((n) => n + 1)
          }
        }
      )
      .subscribe()

    const poll = setInterval(async () => {
      const result = await fetchVisitorSupportMessages(conversation.id)
      if (result.messages) setMessages(result.messages)
    }, 8000)

    return () => {
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [conversation?.id, open])

  return (
    <div className="fixed bottom-5 left-5 z-[60] flex flex-col items-start gap-3">
      {open && (
        <div className="w-[min(100vw-2rem,380px)] h-[min(70vh,520px)] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between gap-2 bg-[#c9a227] text-[#1f1500] px-4 py-3">
            <div>
              <p className="font-semibold text-sm">KDC Support</p>
              <p className="text-xs text-[#1f1500]/70">We typically reply during office hours</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="size-4" />
            </button>
          </div>

          {!started ? (
            <div className="flex-1 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Start a conversation with our team. Optional details help us follow up.
              </p>
              <Input
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button className="w-full" onClick={() => void bootstrap()} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Start chat'}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/30">
                {messages.map((msg) => {
                  const isVisitor = msg.sender_type === 'visitor'
                  const isBot = msg.sender_type === 'bot'
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex', isVisitor ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                          isVisitor
                            ? 'bg-accent text-primary rounded-br-md'
                            : isBot
                              ? 'bg-white border border-border text-foreground rounded-bl-md'
                              : 'bg-[#c9a227] text-[#1f1500] rounded-bl-md'
                        )}
                      >
                        {!isVisitor && (
                          <p className="text-[10px] font-semibold opacity-80 mb-0.5">
                            {msg.sender_name ?? (isBot ? 'Assistant' : 'Support')}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        <p className="text-[10px] opacity-60 mt-1">{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {messages.length <= 2 && (
                <div className="px-3 pb-2 flex flex-wrap gap-2 border-t border-border/60 pt-2">
                  {BOT_QUICK_REPLIES.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      disabled={sending}
                      onClick={() => void handleQuickReply(q.reply)}
                      className="text-xs rounded-full border border-border bg-background px-3 py-1 hover:bg-muted transition-colors"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-3 border-t border-border flex gap-2 items-end bg-background">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message…"
                  rows={2}
                  className="min-h-[44px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleSend()
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="shrink-0"
                  disabled={sending || !draft.trim()}
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
      )}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : void handleOpen())}
        className="relative flex items-center justify-center size-14 rounded-full bg-[#c9a227] text-[#1f1500] shadow-lg hover:bg-[#b58b1a] transition-colors"
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </div>
  )
}
