'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { createSermonSeries } from '@/lib/actions/sermon-series'
import type { SermonSeries } from '@/lib/types'

interface SeriesSelectProps {
  value: string | null // series_id
  allSeries: SermonSeries[]
  onChange: (id: string | null) => void
  disabled?: boolean
}

export function SeriesSelect({ value, allSeries, onChange, disabled }: SeriesSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)

  const selectedSeries = allSeries.find((s) => s.id === value)

  async function handleCreateNew() {
    if (!searchValue.trim()) return
    setIsCreating(true)
    const result = await createSermonSeries({
      name: searchValue.trim(),
      slug: searchValue.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: null,
      image_url: null,
    })
    setIsCreating(false)
    if ('success' in result) {
      onChange(result.id)
      setOpen(false)
      setSearchValue('')
      // Note: Ideally allSeries would refresh via revalidation, 
      // but for better UX we might want to reload or pass a refresher.
      window.location.reload() 
    } else {
      alert(result.error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedSeries ? selectedSeries.name : "Select series..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Search series..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty className="py-2 px-4 text-sm">
              <p className="text-muted-foreground mb-2">No series found.</p>
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full gap-2"
                onClick={handleCreateNew}
                disabled={isCreating}
              >
                <Plus className="h-4 w-4" />
                Create "{searchValue}"
              </Button>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0"
                  )}
                />
                None / Individual Sermon
              </CommandItem>
              {allSeries.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.name}
                  onSelect={() => {
                    onChange(s.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === s.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {s.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
