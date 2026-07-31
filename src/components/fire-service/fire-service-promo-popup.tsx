'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Flame,
  MapPin,
  Radio,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FireServicePromoPayload {
  shouldShow: boolean
  isToday: boolean
  isLive: boolean
  daysUntil: number
  storageKey: string
  formattedDate: string
  formattedTime: string
  ctaTitle: string
  location: string
}

const DISMISS_PREFIX = 'kdc-fire-service-dismissed'

function dismissKey(storageKey: string) {
  return `${DISMISS_PREFIX}:${storageKey}`
}

export function FireServicePromoPopup(props: FireServicePromoPayload) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  const onFireServicePage = pathname === '/fire-service' || pathname.startsWith('/fire-service/')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted || !props.shouldShow || onFireServicePage) return

    try {
      const dismissed = localStorage.getItem(dismissKey(props.storageKey))
      if (dismissed && !props.isToday) return
    } catch {
      /* private browsing */
    }

    const timer = window.setTimeout(() => setOpen(true), 1400)
    return () => window.clearTimeout(timer)
  }, [mounted, props.shouldShow, props.storageKey, props.isToday, onFireServicePage])

  function dismiss() {
    try {
      localStorage.setItem(dismissKey(props.storageKey), new Date().toISOString())
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  if (!props.shouldShow || onFireServicePage) return null

  const headline = props.isLive
    ? 'We Are Live at the Fire Altar'
    : props.isToday
      ? 'Fire Service Is Tonight'
      : props.daysUntil <= 1
        ? 'Fire Service Is Tomorrow'
        : 'The Fire Service Is Coming'

  const subline = props.isLive
    ? 'Join us now — bring your case before the Holy Fire Altar.'
    : 'Some battles only break in the place of fire. Submit your Fire List before we gather.'

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close Fire Service announcement"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fire-service-promo-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-[101] mx-auto max-w-lg sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-[#0a0612] text-white shadow-[0_0_80px_-12px_rgba(255,80,0,0.55)]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-red-600/25 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,120,0,0.18),transparent_55%)]" />

              <button
                type="button"
                onClick={dismiss}
                className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>

              <div className="relative p-6 pt-7 sm:p-8">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {props.isLive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-100">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-red-400" />
                      </span>
                      Live Now
                    </span>
                  ) : props.isToday ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-100">
                      <Flame className="size-3.5" />
                      Tonight
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
                      <Sparkles className="size-3.5 text-amber-300" />
                      {props.daysUntil} day{props.daysUntil === 1 ? '' : 's'} to go
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70">
                    Last Friday monthly
                  </span>
                </div>

                <div className="mb-2 flex items-center gap-2 text-orange-300">
                  <Flame className="size-5 shrink-0" />
                  <p className="text-sm font-semibold uppercase tracking-[0.2em]">Fire Service</p>
                </div>

                <h2
                  id="fire-service-promo-title"
                  className="font-serif text-2xl font-bold leading-tight sm:text-3xl"
                >
                  {headline}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75 sm:text-base">{subline}</p>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                  {[
                    { icon: Calendar, label: 'Date', value: props.formattedDate.split(',')[0] },
                    { icon: Clock, label: 'Time', value: '6 – 10 PM' },
                    { icon: MapPin, label: 'Venue', value: 'KDC Kampala' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur-sm"
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-200/80">
                        <Icon className="size-3" />
                        {label}
                      </div>
                      <p className="text-sm font-semibold leading-snug text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <ul className="mt-5 space-y-2 text-sm text-white/80">
                  <li className="flex gap-2">
                    <Radio className="mt-0.5 size-4 shrink-0 text-orange-400" />
                    Prayer, deliverance, and prophetic ministry with Bishop Climate Wiseman
                  </li>
                  <li className="flex gap-2">
                    <Radio className="mt-0.5 size-4 shrink-0 text-orange-400" />
                    Submit your Fire List online before {props.isToday ? 'we begin' : 'the service'}
                  </li>
                  <li className="flex gap-2">
                    <Radio className="mt-0.5 size-4 shrink-0 text-orange-400" />
                    {props.formattedDate} · {props.formattedTime}
                  </li>
                </ul>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button
                    asChild
                    className={cn(
                      'h-11 flex-1 rounded-full border-0 bg-gradient-to-r from-orange-500 to-red-600 font-bold text-white shadow-lg shadow-orange-900/40 hover:from-orange-400 hover:to-red-500',
                      props.isLive && 'animate-pulse'
                    )}
                  >
                    <Link href="/fire-service" onClick={dismiss}>
                      {props.isLive ? 'Join the Fire Service' : 'Submit Your Fire List'}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    onClick={dismiss}
                  >
                    Maybe later
                  </Button>
                </div>

                <p className="mt-4 text-center text-[11px] text-white/45">
                  {props.location}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
