'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/content/post-card'
import type { Post } from '@/lib/types'

const AUTO_SCROLL_MS = 12_000

interface PostsCarouselProps {
  posts: Post[]
  badge?: string
  title?: string
  viewAllLabel?: string
  viewAllUrl?: string
}

export function PostsCarousel({
  posts,
  badge = 'Latest Posts',
  title = 'News & Teachings',
  viewAllLabel = 'Read All Posts',
  viewAllUrl = '/blog',
}: PostsCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const visibleCount = 3
  const maxIndex = Math.max(posts.length - visibleCount, 0)

  const scrollToIndex = (index: number) => {
    if (!trackRef.current || maxIndex === 0) return
    const step = (trackRef.current.scrollWidth - trackRef.current.clientWidth) / maxIndex
    trackRef.current.scrollTo({ left: index * step, behavior: 'smooth' })
  }

  useEffect(() => {
    setCurrentIndex(0)
    trackRef.current?.scrollTo({ left: 0, behavior: 'auto' })
  }, [posts])

  useEffect(() => {
    if (isPaused || posts.length <= visibleCount) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev >= maxIndex ? 0 : prev + 1
        scrollToIndex(nextIndex)
        return nextIndex
      })
    }, AUTO_SCROLL_MS)

    return () => clearInterval(interval)
  }, [isPaused, maxIndex, posts.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      const nextIndex = Math.max(prev - 1, 0)
      scrollToIndex(nextIndex)
      return nextIndex
    })
  }

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev >= maxIndex ? 0 : prev + 1
      scrollToIndex(nextIndex)
      return nextIndex
    })
  }

  if (!posts.length) return null

  return (
    <section className="py-12 bg-gray-50/80">
      <div className="container px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
              <BookOpen className="h-3.5 w-3.5" />
              {badge}
            </div>
            <h2 className="text-3xl font-bold font-serif text-primary md:text-4xl">{title}</h2>
          </div>
          <Button asChild variant="outline" className="self-start border-primary/20 text-primary rounded-full px-6">
            <Link href={viewAllUrl} className="flex items-center gap-2">
              {viewAllLabel} <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          <div className="overflow-hidden">
            <div
              ref={trackRef}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-1"
            >
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="snap-start min-w-full sm:min-w-[calc((100%-1.5rem)/2)] lg:min-w-[calc((100%-3rem)/3)]"
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          </div>

          {posts.length > visibleCount && (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                disabled={currentIndex <= 0}
                className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous post"
              >
                <ChevronLeft className="h-5 w-5 text-primary" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-lg transition-all hover:scale-105"
                aria-label="Next post"
              >
                <ChevronRight className="h-5 w-5 text-primary" />
              </button>

              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index)
                      scrollToIndex(index)
                    }}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      index === currentIndex ? 'scale-125 bg-accent' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
