'use client'

import * as React from 'react'
import { 
  UserXIcon, 
  UserPlusIcon, 
  MailIcon, 
  ShieldIcon, 
  CalendarIcon, 
  PhoneIcon,
  UserIcon,
  SearchIcon,
  FilterIcon,
  MoreVerticalIcon,
  Trash2Icon,
  CheckCircleIcon
} from 'lucide-react'
import { 
  DataTable, 
  type ColumnDef 
} from '@/components/admin/data-table'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { inviteUser, updateUserRole, deactivateUser } from '@/lib/actions/users'
import type { Profile, UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserRow extends Profile {
  email: string | null
}

interface UsersManagerProps {
  initialUsers: UserRow[]
  currentUserId: string
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
  admin: 'Administrator',
  editor: 'Editor',
  author: 'Author',
  member: 'Member',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  editor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  author: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  member: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

// ---------------------------------------------------------------------------
// UsersManager
// ---------------------------------------------------------------------------

export function UsersManager({ initialUsers, currentUserId }: UsersManagerProps) {
  const [users, setUsers] = React.useState<UserRow[]>(initialUsers)
  const [activeTab, setActiveTab] = React.useState<UserRole | 'all'>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedUser, setSelectedUser] = React.useState<UserRow | null>(null)
  
  // Invite state
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [inviteForm, setInviteForm] = React.useState({ email: '', role: 'member' as UserRole })
  const [inviting, setInviting] = React.useState(false)

  // Role change loading state
  const [roleChanging, setRoleChanging] = React.useState<Record<string, boolean>>({})

  // Handlers
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteForm.email.trim()) return
    setInviting(true)
    const result = await inviteUser(inviteForm.email.trim(), inviteForm.role)
    setInviting(false)
    if ('success' in result) {
      alert('Invitation sent successfully')
      setInviteForm({ email: '', role: 'member' })
      setInviteOpen(false)
    } else {
      alert(result.error)
    }
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    setRoleChanging(prev => ({ ...prev, [userId]: true }))
    const result = await updateUserRole(userId, role)
    if ('success' in result) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, role } : null)
    } else {
      alert(result.error)
    }
    setRoleChanging(prev => ({ ...prev, [userId]: false }))
  }

  async function handleDeactivate(user: UserRow) {
    if (!window.confirm(`Permanently deactivate "${user.name || user.email}"?`)) return
    const result = await deactivateUser(user.id)
    if ('success' in result) {
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setSelectedUser(null)
    } else {
      alert(result.error)
    }
  }

  const filteredUsers = React.useMemo(() => {
    return users.filter(u => {
      const matchesTab = activeTab === 'all' || u.role === activeTab
      const matchesSearch = !searchQuery || 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [users, activeTab, searchQuery])

  const roleCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: users.length }
    ROLES.forEach(r => counts[r] = users.filter(u => u.role === r).length)
    return counts
  }, [users])

  const columns: ColumnDef<UserRow>[] = [
    {
      key: 'user',
      header: 'User',
      className: 'min-w-[200px]',
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
             {user.avatar_url ? (
               <img src={user.avatar_url} alt="" className="size-full object-cover" />
             ) : (
               <UserIcon className="size-4 text-muted-foreground" />
             )}
          </div>
          <div className="flex flex-col min-w-0">
             <button 
               onClick={() => setSelectedUser(user)}
               className="text-sm font-semibold hover:underline text-left truncate"
             >
               {user.name || 'Untitled'}
             </button>
             <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user) => (
        <span className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          ROLE_COLORS[user.role]
        )}>
          {ROLE_LABELS[user.role]}
        </span>
      )
    },
    {
      key: 'joined',
      header: 'Date Joined',
      cell: (user) => (
        <span className="text-xs text-muted-foreground">{formatDate(user.created_at)}</span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[60px]',
      cell: (user) => (
        <div className="flex justify-end">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon-sm">
                    <MoreVerticalIcon className="size-4" />
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                 <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                    <UserIcon className="size-4 mr-2" /> View Profile
                 </DropdownMenuItem>
                 {user.id !== currentUserId && (
                   <DropdownMenuItem onClick={() => handleDeactivate(user)} className="text-destructive">
                      <Trash2Icon className="size-4 mr-2" /> Deactivate
                   </DropdownMenuItem>
                 )}
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <header className="px-6 py-5 bg-background/95 border-b border-border">
           <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                 {(['all', ...ROLES] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                        activeTab === tab ? "bg-background shadow-sm text-primary border border-border/50" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab === 'all' ? 'All' : ROLE_LABELS[tab]}
                      <span className="ml-1.5 opacity-50">({roleCounts[tab]})</span>
                    </button>
                 ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                 <div className="relative w-full sm:w-72">
                    <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                 </div>
                 <Button onClick={() => setInviteOpen(true)} size="sm">
                    <UserPlusIcon className="mr-2 size-4" /> Add New
                 </Button>
              </div>
           </div>
        </header>

        {/* Data Table */}
        <main className="overflow-x-auto">
          <div className="min-w-full">
            <DataTable
              columns={columns}
              data={filteredUsers}
              hideSearch={true}
              className="border-0 rounded-none shadow-none"
            />
          </div>
        </main>
      </div>

      {/* Invite Modal */}
      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent className="sm:max-w-md">
           <SheetHeader>
              <SheetTitle>Invite New User</SheetTitle>
           </SheetHeader>
           <form onSubmit={handleInvite} className="space-y-6 mt-8">
              <div className="space-y-1.5">
                 <Label>Email Address</Label>
                 <Input
                   type="email"
                   placeholder="e.g. staff@kdcuganda.org"
                   value={inviteForm.email}
                   onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                   required
                 />
                 <p className="text-[10px] text-muted-foreground">The user will receive an invitation link via email.</p>
              </div>

              <div className="space-y-1.5">
                 <Label>Assigned Role</Label>
                 <Select
                   value={inviteForm.role}
                   onValueChange={v => setInviteForm(prev => ({ ...prev, role: v as UserRole }))}
                 >
                    <SelectTrigger>
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       {ROLES.map(r => (
                         <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
                 <p className="text-[10px] text-muted-foreground italic mt-2 border-l-2 border-primary/20 pl-2">
                    {inviteForm.role === 'admin' && 'Full access to all settings and user management.'}
                    {inviteForm.role === 'editor' && 'Can manage and publish all content types.'}
                    {inviteForm.role === 'author' && 'Can create and manage their own content.'}
                    {inviteForm.role === 'member' && 'Read-only access to the admin dashboard.'}
                 </p>
              </div>

              <Button type="submit" className="w-full" disabled={inviting}>
                 {inviting ? 'Sending Invitation...' : 'Send Invite'}
              </Button>
           </form>
        </SheetContent>
      </Sheet>

      {/* User Details Sidebar */}
      <Sheet open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
        <SheetContent className="w-full sm:max-w-md px-0">
           <SheetHeader className="px-6 border-b border-border pb-4 flex flex-row items-center justify-between">
              <SheetTitle>User Profile</SheetTitle>
              {selectedUser?.id !== currentUserId && (
                 <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDeactivate(selectedUser!)}>
                    <Trash2Icon className="size-4" />
                 </Button>
              )}
           </SheetHeader>

           {selectedUser && (
              <div className="flex flex-col">
                 <div className="p-8 flex flex-col items-center justify-center text-center bg-muted/20 border-b border-border gap-3">
                    <div className="size-20 rounded-full bg-muted border-4 border-background shadow-md overflow-hidden flex items-center justify-center">
                       {selectedUser.avatar_url ? (
                         <img src={selectedUser.avatar_url} alt="" className="size-full object-cover" />
                       ) : (
                         <UserIcon className="size-10 text-muted-foreground/50" />
                       )}
                    </div>
                    <div>
                       <h3 className="text-lg font-bold">{selectedUser.name || 'Untitled'}</h3>
                       <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <span className={cn(
                      "mt-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      ROLE_COLORS[selectedUser.role]
                    )}>
                       {ROLE_LABELS[selectedUser.role]}
                    </span>
                 </div>

                 <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                       <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User ID</Label>
                          <p className="text-xs font-mono bg-muted p-2 rounded truncate">{selectedUser.id}</p>
                       </div>

                       <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role Management</Label>
                          <Select
                            disabled={selectedUser.id === currentUserId || roleChanging[selectedUser.id]}
                            value={selectedUser.role}
                            onValueChange={v => handleRoleChange(selectedUser.id, v as UserRole)}
                          >
                             <SelectTrigger>
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                                {ROLES.map(r => (
                                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                          {selectedUser.id === currentUserId && <p className="text-[10px] text-muted-foreground italic">You cannot change your own role.</p>}
                       </div>

                       <div className="space-y-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-3 text-sm">
                             <MailIcon className="size-4 text-muted-foreground" />
                             <span>{selectedUser.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                             <PhoneIcon className="size-4 text-muted-foreground" />
                             <span>{selectedUser.phone || 'No phone provided'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                             <CalendarIcon className="size-4 text-muted-foreground" />
                             <span>Joined {formatDate(selectedUser.created_at)}</span>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Biography</Label>
                          <p className="text-sm text-muted-foreground leading-relaxed italic">
                             {selectedUser.bio || 'This user hasn\'t provided a bio yet.'}
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="sticky bottom-0 bg-background p-6 border-t border-border">
                    <Button variant="outline" className="w-full" onClick={() => setSelectedUser(null)}>
                       Close Profile
                    </Button>
                 </div>
              </div>
           )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
