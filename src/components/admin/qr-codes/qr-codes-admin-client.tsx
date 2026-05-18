'use client'

import * as React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  PlusIcon,
  Trash2Icon,
  SaveIcon,
  CheckCircleIcon,
  QrCodeIcon,
  GripVerticalIcon,
  ExternalLinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveSettings } from '@/lib/actions/settings'
import { cn } from '@/lib/utils'

interface QrEntry {
  id: string
  title: string
  subtitle: string
  value: string
  color: string
}

interface Props {
  initialQrCodes: QrEntry[]
}

function newEntry(): QrEntry {
  return {
    id: crypto.randomUUID(),
    title: '',
    subtitle: '',
    value: '',
    color: '#1e3a5f',
  }
}

const PRESET_COLORS = [
  '#1e3a5f', // deep navy
  '#7c2d12', // burnt orange
  '#14532d', // forest green
  '#4a1d96', // deep purple
  '#1a1a2e', // midnight
  '#831843', // berry
  '#0c4a6e', // ocean
  '#713f12', // amber brown
]

export function QrCodesAdminClient({ initialQrCodes }: Props) {
  const [entries, setEntries] = React.useState<QrEntry[]>(
    initialQrCodes.length > 0 ? initialQrCodes : []
  )
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [activeId, setActiveId] = React.useState<string | null>(
    initialQrCodes[0]?.id ?? null
  )

  const activeEntry = entries.find((e) => e.id === activeId) ?? null

  function addEntry() {
    const e = newEntry()
    setEntries((prev) => [...prev, e])
    setActiveId(e.id)
  }

  function removeEntry(id: string) {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      if (activeId === id) setActiveId(next[0]?.id ?? null)
      return next
    })
  }

  function updateEntry(id: string, field: keyof QrEntry, value: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const result = await saveSettings({ qr_codes_json: JSON.stringify(entries) })
    setSaving(false)
    if ('success' in result) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
      {/* ── Left panel: list + edit form ── */}
      <div className="lg:col-span-7 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {entries.length} QR code{entries.length !== 1 ? 's' : ''} configured
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addEntry}>
              <PlusIcon className="size-3.5 mr-1.5" /> Add QR Code
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 min-w-[120px]">
              {saving ? 'Saving…' : <><SaveIcon className="size-3.5" /> Save All</>}
              {saved && <CheckCircleIcon className="size-3.5 text-green-300 animate-in zoom-in" />}
            </Button>
          </div>
        </div>

        {/* Entry list */}
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <button
              key={entry.id}
              onClick={() => setActiveId(entry.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                activeId === entry.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40 hover:bg-muted/20'
              )}
            >
              <GripVerticalIcon className="size-4 text-muted-foreground/40 shrink-0" />
              <div
                className="size-8 rounded-lg shrink-0 flex items-center justify-center"
                style={{ backgroundColor: entry.color || '#1a1a2e' }}
              >
                <QrCodeIcon className="size-4 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.title || `QR Code #${idx + 1}`}</p>
                <p className="text-xs text-muted-foreground truncate">{entry.value || 'No value set'}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeEntry(entry.id) }}
                className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2Icon className="size-4" />
              </button>
            </button>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border">
              <QrCodeIcon className="size-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No QR codes yet.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={addEntry}>
                <PlusIcon className="size-3.5 mr-1.5" /> Create your first QR code
              </Button>
            </div>
          )}
        </div>

        {/* Edit form for active entry */}
        {activeEntry && (
          <div
            key={activeEntry.id}
            className="p-5 rounded-2xl border border-border bg-card space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Edit Entry
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input
                  value={activeEntry.title}
                  onChange={(e) => updateEntry(activeEntry.id, 'title', e.target.value)}
                  placeholder="e.g. Mobile Money – MTN"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subtitle / Instructions</Label>
                <Input
                  value={activeEntry.subtitle}
                  onChange={(e) => updateEntry(activeEntry.id, 'subtitle', e.target.value)}
                  placeholder="e.g. Scan to send via MTN MoMo"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">QR Value</Label>
                <Input
                  value={activeEntry.value}
                  onChange={(e) => updateEntry(activeEntry.id, 'value', e.target.value)}
                  placeholder="https://paypal.me/... or +256700000000 or any text"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  This exact text/URL is encoded into the QR code. Use a full URL for best scan compatibility.
                </p>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label className="text-xs">Card Accent Colour</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateEntry(activeEntry.id, 'color', c)}
                      className={cn(
                        'size-8 rounded-lg border-2 transition-all',
                        activeEntry.color === c
                          ? 'border-primary ring-2 ring-primary/40 scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={activeEntry.color || '#1a1a2e'}
                      onChange={(e) => updateEntry(activeEntry.id, 'color', e.target.value)}
                      className="h-8 w-12 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <span className="text-xs text-muted-foreground font-mono">{activeEntry.color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel: live preview ── */}
      <div className="lg:col-span-5">
        <div className="sticky top-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Live Preview
            </h3>
            <a
              href="/give"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View Public Page <ExternalLinkIcon className="size-3" />
            </a>
          </div>

          {activeEntry ? (
            <div
              className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-8 flex flex-col items-center gap-5 text-white"
              style={{
                background: `linear-gradient(145deg, ${activeEntry.color || '#1a1a2e'}ee, ${activeEntry.color || '#1a1a2e'}88)`,
              }}
            >
              <div className="text-center">
                <h2 className="text-xl font-bold tracking-tight">
                  {activeEntry.title || 'QR Code Title'}
                </h2>
                {activeEntry.subtitle && (
                  <p className="mt-1 text-sm text-white/60">{activeEntry.subtitle}</p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-xl ring-4 ring-white/20">
                {activeEntry.value ? (
                  <QRCodeSVG
                    value={activeEntry.value}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#111111"
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center text-gray-400 text-xs text-center px-4">
                    Enter a QR value to see the code
                  </div>
                )}
              </div>

              {activeEntry.value && (
                <p className="text-[11px] font-mono text-white/40 break-all text-center max-w-[220px] line-clamp-2">
                  {activeEntry.value}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
              <QrCodeIcon className="size-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select an entry to preview its QR card.</p>
            </div>
          )}

          {/* All previews mini-grid */}
          {entries.length > 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">All QR Codes ({entries.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {entries.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setActiveId(e.id)}
                    className={cn(
                      'rounded-xl p-2 flex flex-col items-center gap-1 border transition-all',
                      activeId === e.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div
                      className="w-full aspect-square rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: e.color || '#1a1a2e' }}
                    >
                      {e.value ? (
                        <QRCodeSVG value={e.value} size={48} bgColor="transparent" fgColor="white" level="L" />
                      ) : (
                        <QrCodeIcon className="size-5 text-white/40" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate w-full text-center">
                      {e.title || 'Untitled'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
