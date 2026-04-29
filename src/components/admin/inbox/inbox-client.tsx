'use client'

import * as React from 'react'
import { MailOpenIcon, HandIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markContactRead, markPrayerReviewed } from '@/lib/actions/inbox'
import type { ContactSubmission, PrayerRequest } from '@/lib/types'

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

interface InboxClientProps {
  initialContacts: ContactSubmission[]
  initialPrayers: PrayerRequest[]
}

type Tab = 'contacts' | 'prayers'

export function InboxClient({ initialContacts, initialPrayers }: InboxClientProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>('contacts')
  const [contacts, setContacts] = React.useState<ContactSubmission[]>(initialContacts)
  const [prayers, setPrayers] = React.useState<PrayerRequest[]>(initialPrayers)
  const [markingContact, setMarkingContact] = React.useState<Record<string, boolean>>({})
  const [markingPrayer, setMarkingPrayer] = React.useState<Record<string, boolean>>({})

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  async function handleMarkContactRead(id: string) {
    setMarkingContact((prev) => ({ ...prev, [id]: true }))
    const result = await markContactRead(id)
    if ('error' in result) {
      alert(`Error: ${result.error}`)
      setMarkingContact((prev) => ({ ...prev, [id]: false }))
    } else {
      setContacts((prev) => prev.filter((c) => c.id !== id))
      setMarkingContact((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  async function handleMarkPrayerReviewed(id: string) {
    setMarkingPrayer((prev) => ({ ...prev, [id]: true }))
    const result = await markPrayerReviewed(id)
    if ('error' in result) {
      alert(`Error: ${result.error}`)
      setMarkingPrayer((prev) => ({ ...prev, [id]: false }))
    } else {
      setPrayers((prev) => prev.filter((p) => p.id !== id))
      setMarkingPrayer((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Review unread contact submissions and unreviewed prayer requests.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        <TabButton
          active={activeTab === 'contacts'}
          onClick={() => setActiveTab('contacts')}
          count={contacts.length}
        >
          Contact Submissions
        </TabButton>
        <TabButton
          active={activeTab === 'prayers'}
          onClick={() => setActiveTab('prayers')}
          count={prayers.length}
        >
          Prayer Requests
        </TabButton>
      </div>

      {/* Tab content */}
      {activeTab === 'contacts' && (
        <ContactsTab
          contacts={contacts}
          marking={markingContact}
          onMarkRead={handleMarkContactRead}
        />
      )}
      {activeTab === 'prayers' && (
        <PrayersTab
          prayers={prayers}
          marking={markingPrayer}
          onMarkReviewed={handleMarkPrayerReviewed}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TabButton
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {count > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none ${
            active
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// ContactsTab
// ---------------------------------------------------------------------------

function ContactsTab({
  contacts,
  marking,
  onMarkRead,
}: {
  contacts: ContactSubmission[]
  marking: Record<string, boolean>
  onMarkRead: (id: string) => void
}) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <MailOpenIcon className="size-8 opacity-40" />
        <p className="text-sm">No unread contact submissions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="rounded-xl border bg-card p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-medium">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{contact.email}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(contact.created_at)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkRead(contact.id)}
                disabled={marking[contact.id]}
                aria-label="Mark as read"
              >
                <MailOpenIcon className="size-3.5 mr-1" />
                {marking[contact.id] ? 'Marking…' : 'Mark as Read'}
              </Button>
            </div>
          </div>
          {contact.subject && (
            <p className="text-sm font-medium text-foreground/80">
              Subject: {contact.subject}
            </p>
          )}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {contact.message}
          </p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PrayersTab
// ---------------------------------------------------------------------------

function PrayersTab({
  prayers,
  marking,
  onMarkReviewed,
}: {
  prayers: PrayerRequest[]
  marking: Record<string, boolean>
  onMarkReviewed: (id: string) => void
}) {
  if (prayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <HandIcon className="size-8 opacity-40" />
        <p className="text-sm">No unreviewed prayer requests.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {prayers.map((prayer) => (
        <div
          key={prayer.id}
          className="rounded-xl border bg-card p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-medium">
                {prayer.is_anonymous ? 'Anonymous' : (prayer.name ?? 'Unknown')}
              </p>
              {!prayer.is_anonymous && prayer.email && (
                <p className="text-xs text-muted-foreground">{prayer.email}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(prayer.created_at)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkReviewed(prayer.id)}
                disabled={marking[prayer.id]}
                aria-label="Mark as reviewed"
              >
                <HandIcon className="size-3.5 mr-1" />
                {marking[prayer.id] ? 'Marking…' : 'Mark as Reviewed'}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {prayer.request}
          </p>
        </div>
      ))}
    </div>
  )
}
