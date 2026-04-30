import type { UserRole } from '@/lib/types'

export const ROLES = {
  ADMIN: ['admin'] as UserRole[],
  CONTENT: ['admin', 'editor', 'author'] as UserRole[],
  MANAGE_STRUCTURE: ['admin', 'editor'] as UserRole[],
} as const
