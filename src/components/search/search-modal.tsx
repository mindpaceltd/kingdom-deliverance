'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
// Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
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

    // Requirement 16.5: no DB call for queries < 2 chars
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
    // Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[10vh] px-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Search"
    >
      {/* Modal panel */}
      <div
        className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, sermons, events…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            aria-label="Search query"
          />
          {loading && <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close search"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Prompt state */}
          {!results && !loading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}

          {/* No results */}
          {showNoResults && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Results grouped by type */}
          {hasResults && (
            <div className="divide-y divide-border">
              <ResultGroup
                title="Posts"
                items={results.posts}
                getHref={(item) => `/blog/${item.slug}`}
                getSnippet={(item) => item.excerpt}
                onClose={onClose}
              />
              <ResultGroup
                title="Sermons"
                items={results.sermons}
                getHref={(item) => `/sermons/${item.slug}`}
                getSnippet={(item) => item.description}
                onClose={onClose}
              />
              <ResultGroup
                title="Events"
                items={results.events}
                getHref={(item) => `/events/${item.slug}`}
                getSnippet={(item) => item.description}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ResultGroup
// ---------------------------------------------------------------------------

interface ResultGroupProps {
  title: string
  items: SearchResult[]
  getHref: (item: SearchResult) => string
  getSnippet: (item: SearchResult) => string | null | undefined
  onClose: () => void
}

function ResultGroup({ title, items, getHref, getSnippet, onClose }: ResultGroupProps) {
  if (items.length === 0) return null

  return (
    <div>
      <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
        {title}
      </p>
      {items.map((item) => (
        <Link
          key={item.id}
          href={getHref(item)}
          onClick={onClose}
          className="flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium text-foreground line-clamp-1">
            {item.title}
          </span>
          {getSnippet(item) && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {getSnippet(item)}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
