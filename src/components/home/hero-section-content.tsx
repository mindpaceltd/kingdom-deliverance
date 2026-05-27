'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, ArrowRight, Sparkles, Heart, Clock } from 'lucide-react'
import Link from 'next/link'

/** Hero copy and CTAs — animations kept off the LCP text node (h1 stays visible immediately). */
export interface HeroSectionContentProps {
  welcomeText: string
  headingTop: string
  headingBottom: string
  lead: string
  primaryCtaLabel: string
  primaryCtaUrl: string
  secondaryCtaLabel: string
  secondaryCtaUrl: string
  joinUsLabel: string
  serviceSlots: { label: string; time: string }[]
}

export function HeroSectionContent({
  welcomeText,
  headingTop,
  headingBottom,
  lead,
  primaryCtaLabel,
  primaryCtaUrl,
  secondaryCtaLabel,
  secondaryCtaUrl,
  joinUsLabel,
  serviceSlots,
}: HeroSectionContentProps) {
  return (
    <div className="container relative z-10 px-4 pb-16 pt-28 text-center text-white md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mx-auto max-w-4xl space-y-6 md:space-y-8"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md sm:text-xs"
        >
          <Sparkles className="h-3 w-3 text-accent sm:h-3.5 sm:w-3.5" aria-hidden />
          {welcomeText}
          <Heart className="h-3 w-3 text-accent sm:h-3.5 sm:w-3.5" aria-hidden />
        </motion.div>

        <h1 className="font-serif text-3xl font-bold leading-[1.15] tracking-tight drop-shadow-sm sm:text-5xl md:text-6xl lg:text-7xl sm:leading-[1.1]">
          <span className="text-accent">{headingTop}</span>{' '}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">
            {headingBottom}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base md:text-lg lg:text-xl"
        >
          {lead}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col items-center justify-center gap-3.5 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="group w-full rounded-full bg-accent px-8 py-5 text-base font-bold text-primary shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105 hover:bg-accent/90 hover:shadow-accent/50 sm:w-auto sm:py-6"
          >
            <Link href={primaryCtaUrl} className="flex items-center justify-center gap-2">
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="group w-full rounded-full border-white/30 bg-white/10 px-8 py-5 text-base text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/20 sm:w-auto sm:py-6"
          >
            <Link href={secondaryCtaUrl} className="flex items-center justify-center gap-2">
              <Play className="h-4 w-4 fill-current" aria-hidden />
              {secondaryCtaLabel}
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mx-auto w-full max-w-2xl"
        >
          <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-md sm:p-6">
            <div className="mb-3.5 flex items-center justify-center gap-2 sm:mb-5">
              <Clock className="h-4 w-4 text-accent" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-accent sm:text-sm">
                {joinUsLabel}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 divide-y divide-white/10 text-sm sm:grid-cols-3 sm:gap-4 sm:divide-y-0">
              {serviceSlots.slice(0, 3).map((slot, idx) => (
                <div
                  key={`${slot.label}-${idx}`}
                  className={`space-y-0.5 text-center ${
                    idx === 0
                      ? 'pb-2.5 sm:pb-0'
                      : idx === 1
                        ? 'relative py-2.5 sm:py-0'
                        : 'pt-2.5 sm:pt-0'
                  }`}
                >
                  {idx === 1 && (
                    <>
                      <div className="absolute left-0 top-1/2 hidden h-8 w-px -translate-y-1/2 bg-white/15 sm:block" />
                      <div className="absolute right-0 top-1/2 hidden h-8 w-px -translate-y-1/2 bg-white/15 sm:block" />
                    </>
                  )}
                  <div className="text-sm font-semibold text-white">{slot.label}</div>
                  <div className="text-xs text-white/60">{slot.time}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:flex"
        aria-hidden
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-widest text-white/40">Scroll</span>
          <div className="flex h-8 w-5 justify-center rounded-full border border-white/25 pt-1.5">
            <div className="h-2 w-0.5 animate-bounce rounded-full bg-accent" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
