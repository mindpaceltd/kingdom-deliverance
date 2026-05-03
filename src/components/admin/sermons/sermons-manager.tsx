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
  TypeIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  EyeIcon,
  CheckCircle2,
  FileEditIcon,
  ClockIcon,
  TrendingUpIcon,
  VideoIcon
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

function StatCard({ label, value, icon: Icon, trend, color }: { label: string, value: string | number, icon: any, trend?: string, color: string }) {
  return (
    <div className="bg-background rounded-xl border border-border/50 p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
          {trend && (
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUpIcon className="size-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg transition-colors", color)}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
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

  const stats = React.useMemo(() => {
    return {
      total: sermons.length,
      published: sermons.filter(s => s.status === 'published').length,
      drafts: sermons.filter(s => s.status === 'draft').length,
      views: sermons.reduce((acc, s) => acc + (s.views || 0), 0)
    }
  }, [sermons])

  const columns: ColumnDef<Sermon>[] = [
    {
      key: 'title',
      header: 'Sermon Details',
      className: 'max-w-[350px]',
      cell: (sermon) => (
        <div className="flex items-center gap-3">
          <div className="relative size-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50 group-hover:border-primary/30 transition-colors">
            {sermon.thumbnail_url ? (
              <img 
                src={sermon.thumbnail_url} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <VideoIcon className="size-5 opacity-30" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <button
              type="button"
              onClick={() => openEdit(sermon)}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate text-left"
              title={sermon.title}
            >
              {sermon.title}
            </button>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-medium text-muted-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded">
                {sermon.sermon_series?.name || sermon.series || 'Individual'}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <UserIcon className="size-2.5" />
                {sermon.preacher}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (sermon) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground/90" suppressHydrationWarning>
            {mounted ? formatDate(sermon.date) : sermon.date}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Publication</span>
        </div>
      ),
    },
    {
      key: 'views',
      header: 'Engagement',
      cell: (sermon) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground" suppressHydrationWarning>
              {mounted ? (sermon.views?.toLocaleString() ?? 0) : '0'}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <EyeIcon className="size-2.5" />
              Total Views
            </span>
          </div>
        </div>
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
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {sermon.status === 'trash' ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRestore(sermon)}
                title="Restore"
                className="hover:bg-emerald-50 hover:text-emerald-600"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handlePermanentDelete(sermon)}
                title="Delete Permanently"
                className="text-destructive/60 hover:text-destructive hover:bg-destructive/10"
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
                className="hover:bg-blue-50 hover:text-blue-600"
              >
                <CopyIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openEdit(sermon)}
                title="Edit"
                className="hover:bg-primary/10 hover:text-primary"
              >
                <PencilIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleTrash(sermon)}
                title="Trash"
                className="text-destructive/60 hover:text-destructive hover:bg-destructive/10"
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
    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/40">
      <div className="flex items-center gap-2 px-2">
        <FilterIcon className="size-3.5 text-muted-foreground" />
      </div>
      
      <Select value={filterPreacher} onValueChange={(v) => setFilterPreacher(v ?? 'all')}>
        <SelectTrigger className="h-8 w-[140px] border-none bg-transparent hover:bg-muted transition-colors shadow-none focus:ring-0">
          <SelectValue placeholder="Preacher" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Preachers</SelectItem>
          {preachers.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-px h-4 bg-border/60 mx-1" />

      <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
        <SelectTrigger className="h-8 w-[120px] border-none bg-transparent hover:bg-muted transition-colors shadow-none focus:ring-0">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="trash">Trash</SelectItem>
        </SelectContent>
      </Select>

      <div className="w-px h-4 bg-border/60 mx-1" />

      <div className="flex items-center gap-1 group">
        <CalendarIcon className="size-3.5 text-muted-foreground ml-2 group-focus-within:text-primary transition-colors" />
        <Input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="h-8 w-[130px] border-none bg-transparent p-1 focus-visible:ring-0 shadow-none text-xs"
          title="From date"
        />
        <span className="text-muted-foreground/50 text-[10px]">to</span>
        <Input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="h-8 w-[130px] border-none bg-transparent p-1 focus-visible:ring-0 shadow-none text-xs"
          title="To date"
        />
      </div>
    </div>
  )

  if (!mounted) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-96 w-full bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Sermons Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your collection of spiritual messages, transcripts, and media assets.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="relative group gap-2 h-10 px-4 border-violet-500/20 bg-violet-500/5 text-violet-600 hover:bg-violet-500 hover:text-white transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-purple-600/10 group-hover:from-transparent group-hover:to-transparent transition-all" />
                <SparklesIcon className="h-4 w-4 relative z-10 animate-pulse" />
                <span className="relative z-10 font-medium">Sermon Magic AI</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-violet-500/20">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-violet-600">
                  <SparklesIcon className="size-5" />
                  Sermon Magic AI
                </DialogTitle>
                <DialogDescription>
                  Leverage Google Gemini 1.5 Flash to automatically craft sermon notes and media.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                  <TabsTrigger value="url" className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all">
                    <LinkIcon className="h-4 w-4" />
                    From Video
                  </TabsTrigger>
                  <TabsTrigger value="title" className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all">
                    <TypeIcon className="h-4 w-4" />
                    From Title
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-6 space-y-4">
                  <TabsContent value="url" className="m-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="video-url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        YouTube Video URL
                      </Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input 
                          id="video-url" 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          value={magicUrl}
                          onChange={(e) => setMagicUrl(e.target.value)}
                          className="pl-10 h-11 border-border/50 focus-visible:ring-violet-500/30 focus-visible:border-violet-500"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        The AI will extract the transcript, summarize key points, and suggest an AI image prompt.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="title" className="m-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sermon-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Sermon Title
                      </Label>
                      <div className="relative">
                        <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input 
                          id="sermon-title" 
                          placeholder="e.g., The Power of Divine Grace" 
                          value={magicTitle}
                          onChange={(e) => setMagicTitle(e.target.value)}
                          className="pl-10 h-11 border-border/50 focus-visible:ring-violet-500/30 focus-visible:border-violet-500"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Ideal for new sermon outlines. AI will generate structure, scriptures, and an excerpt.
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
              
              <DialogFooter className="mt-2">
                <Button 
                  type="button" 
                  onClick={handleMagicAI} 
                  disabled={magicLoading || (activeTab === 'url' ? !magicUrl.trim() : !magicTitle.trim())}
                  className="w-full h-11 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20 gap-2 font-semibold"
                >
                  {magicLoading ? (
                    <>
                      <RotateCcw className="size-4 animate-spin" />
                      Weaving the message...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="size-4" />
                      Generate Draft
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={openNew} className="h-10 px-4 gap-2 shadow-sm font-medium">
            <PlusIcon className="size-4" />
            New Sermon
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Sermons" 
          value={stats.total} 
          icon={VideoIcon} 
          color="bg-blue-500/10 text-blue-600" 
        />
        <StatCard 
          label="Total Views" 
          value={stats.views.toLocaleString()} 
          icon={EyeIcon} 
          trend="+12% this month"
          color="bg-emerald-500/10 text-emerald-600" 
        />
        <StatCard 
          label="Published Content" 
          value={stats.published} 
          icon={CheckCircle2} 
          color="bg-violet-500/10 text-violet-600" 
        />
        <StatCard 
          label="Active Drafts" 
          value={stats.drafts} 
          icon={FileEditIcon} 
          color="bg-amber-500/10 text-amber-600" 
        />
      </div>

      {/* Main Table Area */}
      <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredSermons}
          searchPlaceholder="Search title, series or preacher..."
          filterSlot={filterSlot}
          isLoading={isRefreshing}
          className="p-0 border-none space-y-0"
        />
      </div>
    </div>
  )
}
