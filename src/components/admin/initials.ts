/**
 * Derives display initials from a user's full name.
 *
 * - Two or more words → first letter of first word + first letter of last word (uppercased)
 * - Single word       → first letter (uppercased)
 * - Null / empty / whitespace-only → "?"
 */
export function getInitials(name: string | null): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0][0]?.toUpperCase() ?? '?'
  const first = words[0][0]?.toUpperCase() ?? ''
  const last = words[words.length - 1][0]?.toUpperCase() ?? ''
  return first + last || '?'
}
