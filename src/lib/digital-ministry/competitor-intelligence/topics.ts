import { CHURCH_TOPICS } from '@/lib/digital-ministry/competitor-intelligence/types'

const TOPIC_KEYWORDS: Record<string, string[]> = {
  Worship: ['worship', 'praise', 'song', 'music', 'choir'],
  Evangelism: ['evangel', 'salvation', 'gospel', 'soul', 'mission'],
  Family: ['family', 'marriage', 'parent', 'children', 'home'],
  Youth: ['youth', 'young', 'teen', 'campus', 'student'],
  Prayer: ['prayer', 'intercession', 'fasting', 'fire service', 'fire night'],
  Testimonies: ['testimony', 'testimonies', 'healed', 'breakthrough', 'miracle'],
  Deliverance: ['deliverance', 'freedom', 'bondage', 'demon', 'spiritual warfare'],
  Leadership: ['leader', 'leadership', 'pastor', 'bishop', 'conference'],
  'Bible teaching': ['sermon', 'teaching', 'word', 'bible', 'scripture', 'study'],
  Outreach: ['outreach', 'community', 'serve', 'mission trip'],
  Marriage: ['marriage', 'couple', 'husband', 'wife'],
  Healing: ['healing', 'health', 'miracle', 'restoration'],
}

export function classifyTopic(title: string, description?: string | null): string {
  const text = `${title} ${description ?? ''}`.toLowerCase()
  let best = 'General'
  let bestScore = 0

  for (const topic of CHURCH_TOPICS) {
    const keys = TOPIC_KEYWORDS[topic] ?? []
    const score = keys.reduce((n, k) => (text.includes(k) ? n + 1 : n), 0)
    if (score > bestScore) {
      bestScore = score
      best = topic
    }
  }

  return best
}

export function buildTopicDistribution(
  items: Array<{ topic?: string | null }>
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const t = item.topic || 'General'
    counts[t] = (counts[t] || 0) + 1
  }
  return counts
}

export function topicRowsFromDistribution(
  dist: Record<string, number>
): Array<{ topic: string; count: number; share: number }> {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  return Object.entries(dist)
    .map(([topic, count]) => ({ topic, count, share: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

export function postingFrequencyPerDay(items: Array<{ published_at?: string | null }>, days = 30): number | null {
  const cutoff = Date.now() - days * 86400000
  const dated = items.filter((i) => i.published_at && new Date(i.published_at).getTime() >= cutoff)
  if (!dated.length) return null
  return Math.round((dated.length / days) * 10) / 10
}
