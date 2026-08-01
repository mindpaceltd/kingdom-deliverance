'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getSermonImportContext,
  importSermonManuscript,
  type SermonImportResult,
} from '@/lib/actions/sermon-import'
import { cn } from '@/lib/utils'

type PublishMode = 'draft' | 'published' | 'scheduled'
type IntervalUnit = 'days' | 'hours'

interface QueuedFile {
  id: string
  file: File
  /** Prefer keeping .docx when a matching .pdf also exists. */
  preferred: boolean
  duplicateOf?: string
  /** Per-sermon publish time when mode is scheduled (local datetime string). */
  scheduledAt?: string
}

interface FileOutcome {
  filename: string
  ok: boolean
  skipped?: boolean
  title?: string
  slug?: string
  id?: string
  status?: string
  scheduledAt?: string | null
  seoScore?: number
  notice?: string
  error?: string
}

const ACCEPTED = '.docx,.pdf,.txt,.md'
const MAX_BYTES = 20 * 1024 * 1024

function addInterval(date: Date, amount: number, unit: IntervalUnit) {
  const next = new Date(date)
  if (unit === 'hours') {
    next.setHours(next.getHours() + amount)
  } else {
    next.setDate(next.getDate() + amount)
  }
  return next
}

function defaultScheduleForIndex(start: Date, index: number, amount: number, unit: IntervalUnit) {
  return toLocalDatetimeValue(addInterval(start, index * Math.max(1, amount), unit))
}

function fileKey(name: string) {
  return name.replace(/\.[^.]+$/, '').trim().toLowerCase()
}

function toLocalDatetimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function buildQueue(files: File[]): QueuedFile[] {
  const byKey = new Map<string, File[]>()
  for (const file of files) {
    const key = fileKey(file.name)
    const list = byKey.get(key) ?? []
    list.push(file)
    byKey.set(key, list)
  }

  const queued: QueuedFile[] = []
  for (const [, group] of byKey) {
    const preferred =
      group.find((f) => /\.docx$/i.test(f.name)) ??
      group.find((f) => /\.txt$/i.test(f.name)) ??
      group[0]

    for (const file of group) {
      queued.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        preferred: file === preferred,
        duplicateOf: file === preferred ? undefined : preferred.name,
      })
    }
  }

  return queued.sort((a, b) => a.file.name.localeCompare(b.file.name))
}

export function SermonImportClient() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [mode, setMode] = useState<PublishMode>('published')
  const [intervalAmount, setIntervalAmount] = useState(2)
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('days')
  const [startAt, setStartAt] = useState(() => toLocalDatetimeValue(addDays(new Date(), 1)))
  const [preacher, setPreacher] = useState('Bishop Climate Wiseman')
  const [seriesId, setSeriesId] = useState<string>('none')
  const [useAi, setUseAi] = useState(true)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [series, setSeries] = useState<{ id: string; name: string }[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [outcomes, setOutcomes] = useState<FileOutcome[]>([])
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getSermonImportContext().then((ctx) => {
      setAiAvailable(ctx.aiAvailable)
      setUseAi(ctx.aiAvailable)
      setSeries(ctx.series)
      if (ctx.defaultPreacher) setPreacher(ctx.defaultPreacher)
    })
  }, [])

  const selected = useMemo(() => queue.filter((q) => q.preferred), [queue])
  const skippedDupes = useMemo(() => queue.filter((q) => !q.preferred), [queue])

  const schedulePreview = useMemo(() => {
    if (mode !== 'scheduled' || !selected.length) return []
    const start = new Date(startAt)
    if (Number.isNaN(start.getTime())) return []
    return selected.map((item, index) => ({
      id: item.id,
      name: item.file.name,
      at: item.scheduledAt
        ? new Date(item.scheduledAt)
        : addInterval(start, index * Math.max(1, intervalAmount), intervalUnit),
    }))
  }, [mode, selected, startAt, intervalAmount, intervalUnit])

  const applyDefaultSchedule = useCallback(() => {
    const start = new Date(startAt)
    if (Number.isNaN(start.getTime())) return
    setQueue((prev) => {
      let slot = 0
      return prev.map((item) => {
        if (!item.preferred) return item
        const scheduledAt = defaultScheduleForIndex(start, slot, intervalAmount, intervalUnit)
        slot += 1
        return { ...item, scheduledAt }
      })
    })
  }, [startAt, intervalAmount, intervalUnit])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter((f) => {
      if (!/\.(docx|pdf|txt|md)$/i.test(f.name)) {
        toast.error(`${f.name}: unsupported type — use .docx, .pdf, or .txt`)
        return false
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: larger than 20 MB`)
        return false
      }
      return true
    })
    if (!list.length) return

    setQueue((prev) => {
      const merged = new Map<string, File>()
      for (const item of prev) merged.set(item.id, item.file)
      for (const file of list) {
        merged.set(`${file.name}-${file.size}-${file.lastModified}`, file)
      }
      return buildQueue(Array.from(merged.values()))
    })
    setOutcomes([])
  }, [])

  function updateSchedule(id: string, scheduledAt: string) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, scheduledAt } : q)))
  }

  function removeFile(id: string) {
    setQueue((prev) => buildQueue(prev.filter((q) => q.id !== id).map((q) => q.file)))
  }

  function preferFile(id: string) {
    setQueue((prev) => {
      const target = prev.find((q) => q.id === id)
      if (!target) return prev
      const key = fileKey(target.file.name)
      return prev.map((q) =>
        fileKey(q.file.name) === key
          ? { ...q, preferred: q.id === id, duplicateOf: q.id === id ? undefined : target.file.name }
          : q
      )
    })
  }

  async function runImport() {
    if (!selected.length) {
      toast.error('Drop at least one manuscript first.')
      return
    }
    if (mode === 'scheduled') {
      const start = new Date(startAt)
      if (Number.isNaN(start.getTime())) {
        toast.error('Choose a valid start date for the schedule.')
        return
      }
    }

    setRunning(true)
    setOutcomes([])
    setProgress({ done: 0, total: selected.length })

    const start = new Date(startAt)
    const results: FileOutcome[] = []

    for (let i = 0; i < selected.length; i++) {
      const item = selected[i]
      try {
        const data = await readAsBase64(item.file)
        const scheduledAt =
          mode === 'scheduled'
            ? item.scheduledAt
              ? new Date(item.scheduledAt).toISOString()
              : addInterval(start, i * Math.max(1, intervalAmount), intervalUnit).toISOString()
            : null

        const result = await importSermonManuscript({
          filename: item.file.name,
          data,
          options: {
            status: mode,
            scheduledAt,
            preacher,
            seriesId: seriesId === 'none' ? null : seriesId,
            useAi: useAi && aiAvailable,
          },
        })

        if ('error' in result) {
          results.push({ filename: item.file.name, ok: false, error: result.error })
        } else if ('skipped' in result && result.skipped) {
          results.push({
            filename: result.filename,
            ok: true,
            skipped: true,
            title: result.title,
            slug: result.slug,
            notice: result.reason,
          })
        } else {
          const ok = result as SermonImportResult
          results.push({
            filename: ok.filename,
            ok: true,
            title: ok.title,
            slug: ok.slug,
            id: ok.id,
            status: ok.status,
            scheduledAt: ok.scheduledAt,
            seoScore: ok.seoScore,
            notice: ok.notice,
          })
        }
      } catch (err: any) {
        results.push({
          filename: item.file.name,
          ok: false,
          error: err?.message || 'Import failed',
        })
      }

      setProgress({ done: i + 1, total: selected.length })
      setOutcomes([...results])
    }

    setRunning(false)
    const imported = results.filter((r) => r.ok && !r.skipped).length
    const skipped = results.filter((r) => r.skipped).length
    const failed = results.filter((r) => !r.ok).length
    if (imported) toast.success(`Imported ${imported} sermon${imported === 1 ? '' : 's'}`)
    if (skipped) toast.message(`${skipped} duplicate${skipped === 1 ? '' : 's'} skipped`)
    if (failed) toast.error(`${failed} file${failed === 1 ? '' : 's'} failed`)
    startTransition(() => router.refresh())
  }

  const imported = outcomes.filter((o) => o.ok && !o.skipped)
  const skipped = outcomes.filter((o) => o.skipped)
  const failed = outcomes.filter((o) => !o.ok)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href="/admin/sermons">
              <ArrowLeft className="mr-1.5 size-3.5" />
              All sermons
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Import manuscripts</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Drop every .docx / .pdf sermon manuscript at once. The system extracts the title,
            scripture, body, and SEO fields, then can schedule them to publish automatically.
          </p>
        </div>
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (e.currentTarget === e.target) setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'cursor-pointer rounded-2xl border-2 border-dashed bg-card p-10 text-center transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border/70 hover:border-primary/40 hover:bg-muted/20'
        )}
      >
        <UploadCloud className="mx-auto size-10 text-muted-foreground/60" />
        <p className="mt-3 text-sm font-semibold">Drop all sermon manuscripts here</p>
        <p className="mt-1 text-xs text-muted-foreground">
          or click to browse files · .docx preferred · .pdf / .txt also accepted · max 20 MB each
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              folderInputRef.current?.click()
            }}
          >
            Select Sermons folder
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  Queue · {selected.length} to import
                  {skippedDupes.length ? ` · ${skippedDupes.length} duplicate skipped` : ''}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Matching .docx and .pdf of the same sermon are de-duplicated — .docx wins.
                </p>
              </div>
              {queue.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={running}
                  onClick={() => {
                    setQueue([])
                    setOutcomes([])
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>

            {queue.length === 0 ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                No files yet — drop the Sermons folder contents above.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border/60">
                {queue.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 py-3',
                      !item.preferred && 'opacity-55'
                    )}
                  >
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(item.file.size / 1024).toFixed(0)} KB
                        {!item.preferred && item.duplicateOf
                          ? ` · skipped duplicate of ${item.duplicateOf}`
                          : ''}
                      </p>
                      {mode === 'scheduled' && item.preferred ? (
                        <Input
                          type="datetime-local"
                          className="mt-2 h-8 text-xs"
                          value={
                            item.scheduledAt ??
                            defaultScheduleForIndex(
                              new Date(startAt),
                              selected.findIndex((s) => s.id === item.id),
                              intervalAmount,
                              intervalUnit
                            )
                          }
                          disabled={running}
                          onChange={(e) => updateSchedule(item.id, e.target.value)}
                        />
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!item.preferred ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={running}
                          onClick={() => preferFile(item.id)}
                        >
                          Use this
                        </Button>
                      ) : null}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        disabled={running}
                        onClick={() => removeFile(item.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {outcomes.length > 0 ? (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm font-semibold">
                Results · {imported.length} imported
                {skipped.length ? ` · ${skipped.length} skipped` : ''}
                {failed.length ? ` · ${failed.length} failed` : ''}
              </p>
              <ul className="mt-3 space-y-2">
                {outcomes.map((o) => (
                  <li
                    key={o.filename}
                    className="flex items-start gap-2 rounded-xl border border-border/60 p-3"
                  >
                    {o.ok && !o.skipped ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : o.skipped ? (
                      <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {o.title || o.filename}
                      </p>
                      {o.ok ? (
                        <p className="text-xs text-muted-foreground">
                          {o.skipped
                            ? `Skipped duplicate · ${o.notice ?? 'already in library'}`
                            : [
                                o.status,
                                typeof o.seoScore === 'number' ? `SEO ${o.seoScore}/100` : '',
                                o.scheduledAt
                                  ? `goes live ${new Date(o.scheduledAt).toLocaleString()}`
                                  : '',
                                o.notice ?? '',
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                      ) : (
                        <p className="text-xs text-destructive">{o.error}</p>
                      )}
                    </div>
                    {o.ok && o.id && !o.skipped ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/sermons/${o.id}`}>Edit</Link>
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {imported.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href="/admin/sermons">View all sermons</Link>
                  </Button>
                  {mode === 'scheduled' ? (
                    <p className="self-center text-xs text-muted-foreground">
                      Auto-publish runs daily via{' '}
                      <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                        /api/sermons/cron/publish
                      </code>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
            <p className="text-sm font-semibold">Publish plan</p>

            <div className="space-y-1.5">
              <Label>After import</Label>
              <Select
                value={mode}
                onValueChange={(v) => setMode((v as PublishMode) || 'scheduled')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Save as drafts</SelectItem>
                  <SelectItem value="scheduled">Schedule auto-publish</SelectItem>
                  <SelectItem value="published">Publish immediately</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'scheduled' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="startAt">First sermon goes live</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="interval">Then one every</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="interval"
                      type="number"
                      min={1}
                      max={intervalUnit === 'hours' ? 168 : 30}
                      className="w-20"
                      value={intervalAmount}
                      onChange={(e) =>
                        setIntervalAmount(Math.max(1, Number(e.target.value) || 1))
                      }
                    />
                    <Select
                      value={intervalUnit}
                      onValueChange={(v) => setIntervalUnit((v as IntervalUnit) || 'days')}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">day(s)</SelectItem>
                        <SelectItem value="hours">hour(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selected.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={running}
                    onClick={applyDefaultSchedule}
                  >
                    Apply stagger to all queued sermons
                  </Button>
                ) : null}
                {schedulePreview.length > 0 ? (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Schedule preview
                    </p>
                    <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                      {schedulePreview.slice(0, 8).map((row) => (
                        <li key={row.id} className="flex justify-between gap-2">
                          <span className="truncate">{row.name.replace(/\.[^.]+$/, '')}</span>
                          <span className="shrink-0 tabular-nums">
                            {row.at.toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </li>
                      ))}
                      {schedulePreview.length > 8 ? (
                        <li>+{schedulePreview.length - 8} more</li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="preacher">Preacher</Label>
              <Input
                id="preacher"
                value={preacher}
                onChange={(e) => setPreacher(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Series (optional)</Label>
              <Select value={seriesId} onValueChange={(v) => setSeriesId(v || 'none')}>
                <SelectTrigger>
                  <SelectValue placeholder="No series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No series</SelectItem>
                  {series.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={useAi && aiAvailable}
                disabled={!aiAvailable}
                onChange={(e) => setUseAi(e.target.checked)}
              />
              <span>
                <span className="font-medium">AI enrichment</span>
                <span className="block text-xs text-muted-foreground">
                  {aiAvailable
                    ? 'Gemini writes the summary and SEO fields from the manuscript.'
                    : 'GEMINI_API_KEY is not set — heuristics will be used instead.'}
                </span>
              </span>
            </label>

            <Button
              className="w-full"
              disabled={running || pending || selected.length === 0}
              onClick={runImport}
            >
              {running ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Importing {progress.done}/{progress.total}…
                </>
              ) : (
                `Import ${selected.length || ''} sermon${selected.length === 1 ? '' : 's'}`
              )}
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold">How it works</p>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">1. Drop files</span> — title,
                scripture, and body are read from each manuscript.
              </li>
              <li>
                <span className="font-semibold text-foreground">2. Choose a plan</span> — draft,
                publish now, or stagger auto-publish across days.
              </li>
              <li>
                <span className="font-semibold text-foreground">3. Cron publishes</span> — when the
                scheduled time arrives,{' '}
                <code className="rounded bg-muted px-1">/api/sermons/cron/publish</code> flips
                them live.
              </li>
              <li>
                <span className="font-semibold text-foreground">4. Optional:</span> open each sermon
                in Sermon Studio later to generate social posts from it.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
