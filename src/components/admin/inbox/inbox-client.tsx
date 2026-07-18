'use client'

import * as React from 'react'
import { 
  MailIcon, 
  MailOpenIcon, 
  HandIcon, 
  Trash2Icon, 
  SearchIcon, 
  RotateCcw,
  UserIcon,
  CalendarIcon,
  ReplyIcon,
  MoreVerticalIcon,
  CheckCircleIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  markContactRead, 
  markPrayerReviewed, 
  deleteContactSubmission, 
  deletePrayerRequest 
} from '@/lib/actions/inbox'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ContactSubmission, PrayerRequest } from '@/lib/types'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InboxItem = (ContactSubmission | PrayerRequest) & { _type: 'contact' | 'prayer' }

interface InboxClientProps {
  initialContacts: ContactSubmission[]
  initialPrayers: PrayerRequest[]
}

type FilterStatus = 'unread' | 'all'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

// ---------------------------------------------------------------------------
// InboxClient
// ---------------------------------------------------------------------------

export function InboxClient({ initialContacts, initialPrayers }: InboxClientProps) {
  const [activeTab, setActiveTab] = React.useState<'contacts' | 'prayers'>('contacts')
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('unread')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [contacts, setContacts] = React.useState<ContactSubmission[]>(initialContacts)
  const [prayers, setPrayers] = React.useState<PrayerRequest[]>(initialPrayers)
  const [selectedItem, setSelectedItem] = React.useState<InboxItem | null>(null)
  const selectedContact = selectedItem?._type === 'contact' ? (selectedItem as ContactSubmission) : null
  const selectedPrayer = selectedItem?._type === 'prayer' ? (selectedItem as PrayerRequest) : null
  
  const [processing, setProcessing] = React.useState<string | null>(null)

  // Combined and filtered items
  const currentItems = React.useMemo(() => {
    let items: InboxItem[] = []
    if (activeTab === 'contacts') {
      items = contacts.map(c => ({ ...c, _type: 'contact' as const }))
    } else {
      items = prayers.map(p => ({ ...p, _type: 'prayer' as const }))
    }

    if (filterStatus === 'unread') {
      items = items.filter(i => i._type === 'contact' ? !(i as ContactSubmission).is_read : !(i as PrayerRequest).is_reviewed)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i => {
        const c = i as any
        return (
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.subject?.toLowerCase().includes(q) ||
          c.message?.toLowerCase().includes(q) ||
          c.request?.toLowerCase().includes(q)
        )
      })
    }

    return items
  }, [activeTab, filterStatus, searchQuery, contacts, prayers])

  const unreadContactCount = contacts.filter(c => !c.is_read).length
  const unreadPrayerCount = prayers.filter(p => !p.is_reviewed).length

  // Handlers
  async function handleMarkRead(item: InboxItem) {
    const newState = item._type === 'contact' 
      ? !('is_read' in item && item.is_read)
      : !('is_reviewed' in item && item.is_reviewed)

    setProcessing(item.id)
    if (item._type === 'contact') {
      const result = await markContactRead(item.id, newState)
      if ('success' in result) {
         setContacts(prev => prev.map(c => c.id === item.id ? { ...c, is_read: newState } : c))
         if (selectedItem?.id === item.id) {
           setSelectedItem(prev => prev ? { ...prev, is_read: newState } : null)
         }
      }
    } else {
      const result = await markPrayerReviewed(item.id, newState)
      if ('success' in result) {
         setPrayers(prev => prev.map(p => p.id === item.id ? { ...p, is_reviewed: newState } : p))
         if (selectedItem?.id === item.id) {
           setSelectedItem(prev => prev ? { ...prev, is_reviewed: newState } : null)
         }
      }
    }
    setProcessing(null)
  }

  async function handleDelete(item: InboxItem) {
    if (!window.confirm('Permanently delete this message?')) return
    setProcessing(item.id)
    if (item._type === 'contact') {
      const result = await deleteContactSubmission(item.id)
      if ('success' in result) {
        setContacts(prev => prev.filter(c => c.id !== item.id))
        setSelectedItem(null)
      }
    } else {
      const result = await deletePrayerRequest(item.id)
      if ('success' in result) {
        setPrayers(prev => prev.filter(p => p.id !== item.id))
        setSelectedItem(null)
      }
    }
    setProcessing(null)
  }

  function handleSelect(item: InboxItem) {
    setSelectedItem(item)
    // Automatically mark as read if it's currently unread
    const isRead = item._type === 'contact' ? (item as ContactSubmission).is_read : (item as PrayerRequest).is_reviewed
    if (!isRead) {
      handleMarkRead(item)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden -m-3 sm:-m-4 lg:-m-6">
      {/* Top Header */}
      <header className="shrink-0 border-b border-border bg-background/95 px-3 py-4 sm:px-6 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Inbox</h1>
            <p className="text-xs text-muted-foreground">Manage communications and prayer requests.</p>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
             <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
             </div>
             <div className="flex bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setFilterStatus('unread')}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    filterStatus === 'unread' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    filterStatus === 'all' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All
                </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <nav className="w-16 flex flex-col items-center py-6 border-r border-border gap-6 bg-muted/20">
           <button 
             onClick={() => setActiveTab('contacts')}
             className={cn(
               "relative p-3 rounded-xl transition-all",
               activeTab === 'contacts' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted hover:text-foreground"
             )}
             title="Contact Submissions"
           >
             <MailIcon className="size-5" />
             {unreadContactCount > 0 && <span className="absolute -top-1 -right-1 size-4 bg-destructive text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-background">{unreadContactCount}</span>}
           </button>
           <button 
             onClick={() => setActiveTab('prayers')}
             className={cn(
               "relative p-3 rounded-xl transition-all",
               activeTab === 'prayers' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted hover:text-foreground"
             )}
             title="Prayer Requests"
           >
             <HandIcon className="size-5" />
             {unreadPrayerCount > 0 && <span className="absolute -top-1 -right-1 size-4 bg-destructive text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-background">{unreadPrayerCount}</span>}
           </button>
        </nav>

        {/* Message List */}
        <main className="flex-1 overflow-y-auto bg-background/50">
           {currentItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <MailOpenIcon className="size-12 opacity-20" />
                <p className="text-sm font-medium">No messages found here.</p>
             </div>
           ) : (
             <div className="divide-y divide-border/50">
                {currentItems.map((item) => {
                  const isRead = item._type === 'contact' ? (item as ContactSubmission).is_read : (item as PrayerRequest).is_reviewed
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full flex items-start gap-3 sm:gap-4 px-3 sm:px-6 py-4 text-left transition-all hover:bg-muted/40",
                        !isRead && "bg-primary/[0.03] border-l-4 border-l-primary",
                        selectedItem?.id === item.id && "bg-muted"
                      )}
                    >
                      <div className="mt-1">
                         {item._type === 'contact' ? <MailIcon className={cn("size-4", !isRead ? "text-primary" : "text-muted-foreground/60")} /> : <HandIcon className={cn("size-4", !isRead ? "text-violet-500" : "text-muted-foreground/60")} />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                         <div className="flex items-center justify-between gap-2">
                            <span className={cn("text-sm font-semibold truncate", !isRead ? "text-foreground" : "text-muted-foreground")}>
                               {item._type === 'prayer' && (item as PrayerRequest).is_anonymous ? 'Anonymous Prayer Request' : (item as any).name}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(item.created_at)}</span>
                         </div>
                         <p className={cn("text-xs font-medium truncate", !isRead ? "text-foreground/80" : "text-muted-foreground/80")}>
                            {item._type === 'contact' ? ((item as ContactSubmission).subject || 'No Subject') : 'Prayer Request'}
                         </p>
                         <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item._type === 'contact' ? (item as ContactSubmission).message : (item as PrayerRequest).request}
                         </p>
                      </div>
                    </button>
                  )
                })}
             </div>
           )}
        </main>
      </div>

      {/* Message Details Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-0">
          <SheetHeader className="px-6 pb-4 border-b border-border flex flex-row items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-lg">Message Detail</SheetTitle>
              <div className="flex items-center gap-2">
                 <span className={cn(
                   "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                   selectedItem?._type === 'contact' ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"
                 )}>
                   {selectedItem?._type === 'contact' ? 'Contact' : 'Prayer'}
                 </span>
                 <span className="text-[10px] text-muted-foreground">{selectedItem && formatDate(selectedItem.created_at)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
               <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={() => selectedItem && handleMarkRead(selectedItem)}
                title={selectedItem?._type === 'contact' ? (selectedContact?.is_read ? 'Mark Unread' : 'Mark Read') : (selectedPrayer?.is_reviewed ? 'Mark Unreviewed' : 'Mark Reviewed')}
               >
                 <CheckCircleIcon className={cn("size-4", (selectedItem?._type === 'contact' ? selectedContact?.is_read : selectedPrayer?.is_reviewed) ? "text-green-600" : "text-muted-foreground")} />
               </Button>
               <Button 
                variant="ghost" 
                size="icon-sm" 
                className="text-destructive"
                onClick={() => selectedItem && handleDelete(selectedItem)}
               >
                 <Trash2Icon className="size-4" />
               </Button>
            </div>
          </SheetHeader>

          {selectedItem && (
            <div className="p-4 sm:p-6 space-y-8">
               {/* Sender Info Card */}
               <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UserIcon className="size-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold">
                           {selectedItem._type === 'prayer' && (selectedItem as PrayerRequest).is_anonymous ? 'Anonymous' : (selectedItem as any).name}
                        </p>
                        <p className="text-xs text-muted-foreground">{(selectedItem as any).email || 'No email provided'}</p>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2 border-t border-border/50">
                     <div className="flex items-center gap-1.5">
                        <CalendarIcon className="size-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium text-muted-foreground">{formatDate(selectedItem.created_at)}</span>
                     </div>
                     {selectedItem._type === 'contact' && (selectedItem as ContactSubmission).subject && (
                        <div className="flex items-center gap-1.5">
                           <MailIcon className="size-3 text-muted-foreground" />
                           <span className="text-[11px] font-medium text-muted-foreground">{(selectedItem as ContactSubmission).subject}</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* Message Body */}
               <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message Content</h3>
                  <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
                     <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {selectedItem._type === 'contact' ? (selectedItem as ContactSubmission).message : (selectedItem as PrayerRequest).request}
                     </p>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="pt-4 flex items-center gap-3">
                  {(selectedItem as any).email && (
                    <Button className="flex-1 gap-2" asChild>
                       <a href={`mailto:${(selectedItem as any).email}?subject=Regarding your message to KDC Uganda`}>
                          <ReplyIcon className="size-4" />
                          Reply via Email
                       </a>
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => handleMarkRead(selectedItem)}>
                     { (selectedItem?._type === 'contact' ? selectedContact?.is_read : selectedPrayer?.is_reviewed) ? <><RotateCcw className="size-4" /> Mark as New</> : <><CheckCircleIcon className="size-4" /> Mark Done</> }
                  </Button>
               </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
