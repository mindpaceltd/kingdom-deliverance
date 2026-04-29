/**
 * Pure helper that determines whether the delete control should be visible
 * for a given content record, based on the current user's role and id.
 *
 * Rules (mirrors the canDelete logic in every CRUD manager):
 *   - 'admin'            → always visible
 *   - 'editor' | 'author' → visible only when record.author_id === currentUserId
 *   - 'member' / other   → never visible
 *
 * This function is extracted so it can be property-tested independently of
 * any React component or Supabase client.
 */
export function isDeleteVisible(
  role: string,
  currentUserId: string,
  recordAuthorId: string | null
): boolean {
  if (role === 'admin') return true
  if (role === 'editor' || role === 'author') {
    return recordAuthorId === currentUserId
  }
  return false
}
