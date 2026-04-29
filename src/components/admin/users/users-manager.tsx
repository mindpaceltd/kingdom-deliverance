'use client'

import * as React from 'react'
import { UserXIcon } from 'lucide-react'

import { DataTable, type ColumnDef } from '@/components/admin/data-table'
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
import { inviteUser, updateUserRole, deactivateUser } from '@/lib/actions/users'
import type { Profile, UserRole } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserRow extends Profile {
  email: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

const ROLES: UserRole[] = ['admin', 'editor', 'author', 'member']

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  author: 'Author',
  member: 'Member',
}

// ---------------------------------------------------------------------------
// UsersManager
// ---------------------------------------------------------------------------

interface UsersManagerProps {
  initialUsers: UserRow[]
  currentUserId: string
}

export function UsersManager({ initialUsers, currentUserId }: UsersManagerProps) {
  const [users, setUsers] = React.useState<UserRow[]>(initialUsers)

  // Invite form state
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteRole, setInviteRole] = React.useState<UserRole>('member')
  const [inviting, setInviting] = React.useState(false)
  const [inviteError, setInviteError] = React.useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = React.useState(false)

  // Pending role-change state (userId → loading)
  const [roleChanging, setRoleChanging] = React.useState<Record<string, boolean>>({})
  // Pending deactivate state
  const [deactivating, setDeactivating] = React.useState<Record<string, boolean>>({})

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setInviteError(null)
    setInviteSuccess(false)

    const result = await inviteUser(inviteEmail.trim(), inviteRole)

    if ('error' in result) {
      setInviteError(result.error)
    } else {
      setInviteSuccess(true)
      setInviteEmail('')
      setInviteRole('member')
      // Optimistically add a placeholder row — a full refresh would require
      // re-fetching auth users which is server-only; show a success message instead.
    }

    setInviting(false)
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    setRoleChanging((prev) => ({ ...prev, [userId]: true }))

    const result = await updateUserRole(userId, role)

    if ('error' in result) {
      alert(`Failed to update role: ${result.error}`)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      )
    }

    setRoleChanging((prev) => ({ ...prev, [userId]: false }))
  }

  async function handleDeactivate(user: UserRow) {
    if (
      !window.confirm(
        `Deactivate "${user.name ?? user.email ?? 'this user'}"? This will permanently delete their account.`
      )
    )
      return

    setDeactivating((prev) => ({ ...prev, [user.id]: true }))

    const result = await deactivateUser(user.id)

    if ('error' in result) {
      alert(`Failed to deactivate user: ${result.error}`)
      setDeactivating((prev) => ({ ...prev, [user.id]: false }))
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setDeactivating((prev) => {
        const next = { ...prev }
        delete next[user.id]
        return next
      })
    }
  }

  // -------------------------------------------------------------------------
  // Columns
  // -------------------------------------------------------------------------

  const columns: ColumnDef<UserRow>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (user) => (
        <span className="text-sm font-medium">{user.name ?? '—'}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (user) => (
        <span className="text-sm text-muted-foreground">{user.email ?? '—'}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user) => {
        const isSelf = user.id === currentUserId
        if (isSelf) {
          return (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {ROLE_LABELS[user.role]} (you)
            </span>
          )
        }
        return (
          <Select
            value={user.role}
            onValueChange={(v) => {
              if (v) handleRoleChange(user.id, v as UserRole)
            }}
            disabled={roleChanging[user.id]}
          >
            <SelectTrigger size="sm" className="w-[110px]" aria-label={`Role for ${user.name ?? user.email}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Joined',
      cell: (user) => (
        <span className="text-sm text-muted-foreground">{formatDate(user.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      cell: (user) => {
        const isSelf = user.id === currentUserId
        if (isSelf) return null
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDeactivate(user)}
            disabled={deactivating[user.id]}
            aria-label={`Deactivate ${user.name ?? user.email}`}
            className="text-destructive hover:text-destructive"
          >
            <UserXIcon className="size-3.5" />
          </Button>
        )
      },
    },
  ]

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage CMS users, assign roles, and control platform access.
        </p>
      </div>

      {/* Invite form */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Invite a New User</h2>
        <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5 min-w-[220px] flex-1">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              disabled={inviting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={inviteRole}
              onValueChange={(v) => { if (v) setInviteRole(v as UserRole) }}
              disabled={inviting}
            >
              <SelectTrigger id="invite-role" className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={inviting}>
            {inviting ? 'Sending…' : 'Invite'}
          </Button>
        </form>

        {inviteError && (
          <p className="text-sm text-destructive">{inviteError}</p>
        )}
        {inviteSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Invitation sent successfully.
          </p>
        )}
      </div>

      {/* Users table */}
      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search users…"
      />
    </div>
  )
}
