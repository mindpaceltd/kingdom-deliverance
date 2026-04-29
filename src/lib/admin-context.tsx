'use client'

import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/lib/types'

export interface AdminContextValue {
  user: User
  profile: Profile
  role: UserRole
}

export const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({
  value,
  children,
}: {
  value: AdminContextValue
  children: React.ReactNode
}) {
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider')
  return ctx
}
