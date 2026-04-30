'use client'

import * as React from 'react'
import { XIcon, TagIcon, PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tag } from '@/lib/types'

// ---------------------------------------------------------------------------
// TagInput
// WordPress-style tag input: type to add, click × to remove, autocomplete
// from existing tags.
// ---------------------------------------------------------------------------

interface TagInputProps {
  /** Currently selected tags */
  value: Tag[]
  /** All available tags for autocomplete */
  allTags: Tag[]
  /** Called when the tag list changes */
  onChange: (tags: Tag[]) => void
  disabled?: boolean
}

export function TagInput({
  value,
  allTags,
  onChange,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close suggestions on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Filtered suggestions: existing tags not already selected, matching input
  const selectedIds = new Set(value.map((t) => t.id))
  const suggestions = allTags.filter(
    (t) =>
      !selectedIds.has(t.id) &&
      t.name.toLowerCase().includes(inputValue.toLowerCase().trim())
  )

  // Whether the typed value is a new tag (not in allTags)
  const trimmed = inputValue.trim()
  const isNew =
    trimmed.length > 0 &&
    !allTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function addTag(tag: Tag) {
    if (!selectedIds.has(tag.id)) {
      onChange([...value, tag])
    }
    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  function removeTag(id: string) {
    onChange(value.filter((t) => t.id !== id))
  }

  async function handleCreateAndAdd() {
    if (!trimmed || creating) return
    setCreating(true)

    let tag: Tag | null = null
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const json = await res.json()
      if (json.tag) {
        tag = json.tag as Tag
      } else {
        console.error('[TagInput] create tag error:', json.error)
      }
    } catch (e) {
      console.error('[TagInput] fetch error:', e)
    }

    setCreating(false)
    if (tag) {
      addTag(tag)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (trimmed) {
        // If there's an exact match in suggestions, add it
        const exact = allTags.find(
          (t) => t.name.toLowerCase() === trimmed.toLowerCase()
        )
        if (exact && !selectedIds.has(exact.id)) {
          addTag(exact)
        } else if (isNew) {
          void handleCreateAndAdd()
        }
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace when input is empty
      onChange(value.slice(0, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {/* Tag chips + input */}
      <div
        className={cn(
          'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0',
          disabled && 'opacity-60 pointer-events-none'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <TagIcon className="size-3.5 shrink-0 text-muted-foreground" />

        {/* Selected tag chips */}
        {value.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag.id)
              }}
              className="rounded-full hover:bg-primary/20 p-0.5"
              aria-label={`Remove tag ${tag.name}`}
              disabled={disabled}
            >
              <XIcon className="size-2.5" />
            </button>
          </span>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Add tags…' : ''}
          disabled={disabled || creating}
          className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          aria-label="Add tag"
          aria-autocomplete="list"
          autoComplete="off"
        />

        {/* Creating spinner */}
        {creating && (
          <span className="text-xs text-muted-foreground animate-pulse">Adding…</span>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || isNew) && (
        <div className="rounded-md border border-border bg-popover shadow-md overflow-hidden">
          {/* Existing tag suggestions */}
          {suggestions.slice(0, 8).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault() // prevent input blur
                addTag(tag)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
            >
              <TagIcon className="size-3 shrink-0 text-muted-foreground" />
              {tag.name}
            </button>
          ))}

          {/* Create new tag option */}
          {isNew && (
            <>
              {suggestions.length > 0 && <div className="border-t border-border" />}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  void handleCreateAndAdd()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left text-primary"
              >
                <PlusIcon className="size-3 shrink-0" />
                Create tag &ldquo;{trimmed}&rdquo;
              </button>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Type a tag name and press Enter or comma to add. Click × to remove.
      </p>
    </div>
  )
}
