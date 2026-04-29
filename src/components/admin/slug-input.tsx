'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateSlug } from '@/lib/utils'

interface SlugInputProps {
  title: string
  value: string
  onChange: (slug: string) => void
  label?: string
  disabled?: boolean
}

export function SlugInput({
  title,
  value,
  onChange,
  label = 'Slug',
  disabled = false,
}: SlugInputProps) {
  const [manuallyEdited, setManuallyEdited] = React.useState(false)

  // Auto-update slug from title when not manually edited
  React.useEffect(() => {
    if (!manuallyEdited) {
      onChange(generateSlug(title))
    }
  }, [title, manuallyEdited]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setManuallyEdited(true)
    onChange(e.target.value)
  }

  function handleReset() {
    setManuallyEdited(false)
    onChange(generateSlug(title))
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor="slug-input">{label}</Label>
        {!manuallyEdited && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Auto
          </span>
        )}
        {manuallyEdited && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="text-xs text-primary underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <span className="select-none pl-2.5 text-sm text-muted-foreground">/</span>
        <Input
          id="slug-input"
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="your-slug-here"
          className="border-0 pl-0.5 focus-visible:border-0 focus-visible:ring-0"
        />
      </div>
    </div>
  )
}
