'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, X, Loader2, FileText, PlayCircle, Calendar, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  description?: string | null
}

interface SearchResults {
  posts: SearchResult[]
  sermons: SearchResult[]
  events: SearchResult[]
}

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// SearchModal
// ---------------------------------------------------------------------------

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults(null)
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  // Debounced search — 300 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const q = query.trim()
      const supabase = createClient()

      const [postsResult, sermonsResult, eventsResult] = await Promise.all([
        supabase
          .from('posts')
          .select('id,title,slug,excerpt')
          .eq('status', 'published')
          .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
          .limit(5),
        supabase
          .from('sermons')
          .select('id,title,slug,description')
          .eq('status', 'published')
          .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(5),
        supabase
          .from('events')
          .select('id,title,slug,description')
          .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(5),
      ])

      setResults({
        posts: (postsResult.data ?? []) as SearchResult[],
        sermons: (sermonsResult.data ?? []) as SearchResult[],
        events: (eventsResult.data ?? []) as SearchResult[],
      })
      setLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  if (!open) return null

  const hasResults =
    results &&
    (results.posts.length > 0 ||
      results.sermons.length > 0 ||
      results.events.length > 0)

  const showNoResults =
    results &&
    !hasResults &&
    query.trim().length >= 2 &&
    !loading

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-[#0a121f]/80 backdrop-blur-md pt-[10vh] px-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
        aria-label="Search"
      >
        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="w-full max-w-2xl bg-[#0a121f] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-4 px-8 py-6 border-b border-white/5 relative">
            <Search className="w-6 h-6 text-[#eab308] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search kingdom resources..."
              className="flex-1 bg-transparent text-xl font-medium text-white outline-none placeholder:text-white/20"
              aria-label="Search query"
            />
            <div className="flex items-center gap-3">
              {loading && <Loader2 className="w-5 h-5 text-[#eab308] animate-spin shrink-0" />}
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-2 text-white/40 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Prompt state */}
            {!results && !loading && (
              <div className="px-8 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Search className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-black uppercase tracking-[0.2em]">
                  Start typing to find what you need
                </p>
              </div>
            )}

            {/* No results */}
            {showNoResults && (
              <div className="px-8 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <X className="w-6 h-6 text-red-500/50" />
                </div>
                <p className="text-white/40 text-sm font-medium">
                  No results found for <span className="text-[#eab308]">&ldquo;{query}&rdquo;</span>
                </p>
              </div>
            )}

            {/* Results grouped by type */}
            {hasResults && (
              <div className="p-4 space-y-2">
                <ResultGroup
                  title="Teachings & Articles"
                  items={results.posts}
                  icon={<FileText className="w-4 h-4" />}
                  getHref={(item) => `/blog/${item.slug}`}
                  getSnippet={(item) => item.excerpt}
                  onClose={onClose}
                />
                <ResultGroup
                  title="Sermon Archive"
                  items={results.sermons}
                  icon={<PlayCircle className="w-4 h-4" />}
                  getHref={(item) => `/sermons/${item.slug}`}
                  getSnippet={(item) => item.description}
                  onClose={onClose}
                />
                <ResultGroup
                  title="Upcoming Events"
                  items={results.events}
                  icon={<Calendar className="w-4 h-4" />}
                  getHref={(item) => `/events/${item.slug}`}
                  getSnippet={(item) => item.description}
                  onClose={onClose}
                />
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-8 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Kingdom Search Engine</span>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-medium text-white/30 flex items-center gap-1.5">
                 <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-sans">ESC</kbd> to close
               </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// ResultGroup
// ---------------------------------------------------------------------------

interface ResultGroupProps {
  title: string
  items: SearchResult[]
  icon: React.ReactNode
  getHref: (item: SearchResult) => string
  getSnippet: (item: SearchResult) => string | null | undefined
  onClose: () => void
}

function ResultGroup({ title, items, icon, getHref, getSnippet, onClose }: ResultGroupProps) {
  if (items.length === 0) return null

  return (
    <div className="space-y-1 mb-6 last:mb-0">
      <div className="px-4 py-2 flex items-center gap-2">
        <div className="text-[#eab308] opacity-50">{icon}</div>
        <p className="text-[10px] font-black text-[#eab308] uppercase tracking-[0.2em]">
          {title}
        </p>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={getHref(item)}
            onClick={onClose}
            className="flex items-center justify-between group px-4 py-4 rounded-2xl bg-white/0 hover:bg-white/5 transition-all duration-300"
          >
            <div className="space-y-1 overflow-hidden pr-8">
              <span className="text-white font-bold block truncate transition-colors duration-300 group-hover:text-[#eab308]">
                {item.title}
              </span>
              {getSnippet(item) && (
                <span className="text-xs text-white/30 block truncate font-medium">
                  {getSnippet(item)}
                </span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-[#eab308] group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
