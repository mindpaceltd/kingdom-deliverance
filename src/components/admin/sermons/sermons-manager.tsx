'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  PencilIcon, 
  Trash2Icon, 
  CopyIcon, 
  RotateCcw, 
  TrashIcon,
  SparklesIcon,
  LinkIcon,
  TypeIcon
} from 'lucide-react'

import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  trashSermon, 
  restoreSermon, 
  duplicateSermon, 
  deleteSermon 
} from '@/lib/actions/sermons'
import { analyzeSermonVideo } from '@/lib/actions/sermon-ai'
import { createClient } from '@/lib/supabase/client'
import type { Sermon } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch (e) {
    return dateStr
  }
}

/** Collect unique non-empty values from an array of sermons for a given key */
function uniqueValues(sermons: Sermon[], key: keyof Sermon): string[] {
  const seen = new Set<string>()
  for (const s of sermons) {
    const v = s[key]
    if (v && typeof v === 'string') seen.add(v)
  }
  return Array.from(seen).sort()
}

// ---------------------------------------------------------------------------
// SermonsManager
// ---------------------------------------------------------------------------

interface SermonsManagerProps {
  initialSermons: Sermon[]
}

export function SermonsManager({ initialSermons }: SermonsManagerProps) {
  const router = useRouter()
  const [sermons, setSermons] = React.useState<Sermon[]>(initialSermons)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Magic AI state
  const [magicUrl, setMagicUrl] = React.useState('')
  const [magicTitle, setMagicTitle] = React.useState('')
  const [magicLoading, setMagicLoading] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('url')

  // Filter state
  const [filterPreacher, setFilterPreacher] = React.useState<string>('all')
  const [filterStatus, setFilterStatus] = React.useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = React.useState<string>('')
  const [filterDateTo, setFilterDateTo] = React.useState<string>('')

  // Derived option lists
  const preachers = React.useMemo(() => uniqueValues(sermons, 'preacher'), [sermons])

  // Re-fetch sermons from Supabase using the browser client
  const refreshSermons = React.useCallback(async () => {
    setIsRefreshing(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('sermons')
      .select('*, sermon_series(name)')
      .order('date', { ascending: false })
    if (data) setSermons(data as Sermon[])
    setIsRefreshing(false)
  }, [])

  function openNew() {
    router.push('/admin/sermons/new')
  }

  function openEdit(sermon: Sermon) {
    router.push(`/admin/sermons/${sermon.id}`)
  }

  async function handleDuplicate(sermon: Sermon) {
    const result = await duplicateSermon(sermon.id)
    if ('success' in result) {
      await refreshSermons()
    } else {
      alert(result.error)
    }
  }

  async function handleTrash(sermon: Sermon) {
    if (!window.confirm(`Move "${sermon.title}" to trash?`)) return
    const result = await trashSermon(sermon.id)
    if ('success' in result) {
      await refreshSermons()
    } else {
      alert(result.error)
    }
  }

  async function handleRestore(sermon: Sermon) {
    const result = await restoreSermon(sermon.id)
    if ('success' in result) {
      await refreshSermons()
    } else {
      alert(result.error)
    }
  }

  async function handlePermanentDelete(sermon: Sermon) {
    if (!window.confirm(`Permanently delete "${sermon.title}"? THIS CANNOT BE UNDONE.`)) return
    const result = await deleteSermon(sermon.id)
    if ('success' in result) {
      await refreshSermons()
    } else {
      alert(result.error)
    }
  }

  async function handleMagicAI() {
    const isUrlMode = activeTab === 'url'
    const input = isUrlMode ? magicUrl.trim() : magicTitle.trim()
    
    if (!input) return
    
    setMagicLoading(true)
    try {
      const result = await analyzeSermonVideo({ 
        videoUrl: isUrlMode ? input : undefined,
        title: !isUrlMode ? input : undefined
      })
      if (result.success) {
        setMagicUrl('')
        setMagicTitle('')
        setIsDialogOpen(false)
        await refreshSermons()
        // Optional: redirect to the new draft if result.id is present
      } else {
        alert(result.error || 'AI Analysis failed')
      }
    } catch (e: any) {
      alert(e.message || 'An unexpected error occurred')
    } finally {
      setMagicLoading(false)
    }
  }

  // Client-side filtering
  const filteredSermons = React.useMemo(() => {
    return sermons.filter((s) => {
      if (filterPreacher !== 'all' && s.preacher !== filterPreacher) return false
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (filterDateFrom && s.date < filterDateFrom) return false
      if (filterDateTo && s.date > filterDateTo) return false
      return true
    })
  }, [sermons, filterPreacher, filterStatus, filterDateFrom, filterDateTo])

  const columns: ColumnDef<Sermon>[] = [
    {
      key: 'title',
      header: 'Title',
      className: 'max-w-[250px]',
      cell: (sermon) => (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => openEdit(sermon)}
            className="truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:underline block"
            title={sermon.title}
          >
            {sermon.title}
          </button>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {sermon.sermon_series?.name || sermon.series || 'Individual Sermon'}
          </span>
        </div>
      ),
    },
    {
      key: 'preacher',
      header: 'Preacher',
      cell: (sermon) => (
        <span className="text-sm text-muted-foreground">{sermon.preacher}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (sermon) => (
        <span className="text-sm text-muted-foreground" suppressHydrationWarning>
          {mounted ? formatDate(sermon.date) : sermon.date}
        </span>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      cell: (sermon) => (
        <span className="text-sm text-muted-foreground">{sermon.views?.toLocaleString() ?? 0}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (sermon) => <StatusBadge status={sermon.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[120px]',
      cell: (sermon) => (
        <div className="flex items-center gap-1 justify-end">
          {sermon.status === 'trash' ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRestore(sermon)}
                title="Restore"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handlePermanentDelete(sermon)}
                title="Delete Permanently"
                className="text-destructive hover:text-destructive"
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDuplicate(sermon)}
                title="Duplicate"
              >
                <CopyIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openEdit(sermon)}
                title="Edit"
              >
                <PencilIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleTrash(sermon)}
                title="Trash"
                className="text-destructive hover:text-destructive"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  const filterSlot = (
    <>
      <Select value={filterPreacher} onValueChange={(v) => setFilterPreacher(v ?? 'all')}>
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue placeholder="All preachers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All preachers</SelectItem>
          {preachers.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="trash">Trash</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={filterDateFrom}
        onChange={(e) => setFilterDateFrom(e.target.value)}
        className="h-9 w-[140px]"
        title="From date"
      />
      <Input
        type="date"
        value={filterDateTo}
        onChange={(e) => setFilterDateTo(e.target.value)}
        className="h-9 w-[140px]"
        title="To date"
      />
    </>
  )

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sermons</h1>
          <p className="text-sm text-muted-foreground">
            Manage sermon recordings, notes, and publication status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-violet-600 border-violet-200 hover:bg-violet-50 hover:text-violet-700">
                <SparklesIcon className="h-4 w-4" />
                Sermon Magic AI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Sermon Magic AI</DialogTitle>
                <DialogDescription>
                  Generate sermon content automatically using AI
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url" className="gap-2">
                    <LinkIcon className="h-4 w-4" />
                    From Video
                  </TabsTrigger>
                  <TabsTrigger value="title" className="gap-2">
                    <TypeIcon className="h-4 w-4" />
                    From Title
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-url">YouTube Video URL</Label>
                    <Input 
                      id="video-url" 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      value={magicUrl}
                      onChange={(e) => setMagicUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a YouTube link to extract transcript and generate sermon content
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="title" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="sermon-title">Sermon Title</Label>
                    <Input 
                      id="sermon-title" 
                      placeholder="e.g., The Power of Faith in Difficult Times" 
                      value={magicTitle}
                      onChange={(e) => setMagicTitle(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a sermon title and AI will generate complete sermon content
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  onClick={handleMagicAI} 
                  disabled={magicLoading || (activeTab === 'url' ? !magicUrl.trim() : !magicTitle.trim())}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {magicLoading ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="mr-2 h-4 w-4" />
                      Generate Sermon Draft
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={openNew} size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Sermon
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredSermons}
        searchPlaceholder="Search sermons…"
        filterSlot={filterSlot}
        isLoading={isRefreshing}
      />
    </div>
  )
}
