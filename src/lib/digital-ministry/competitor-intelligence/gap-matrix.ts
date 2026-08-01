import { createAdminClient } from '@/lib/supabase/server'
import { classifyTopic } from '@/lib/digital-ministry/competitor-intelligence/topics'
import { CHURCH_TOPICS, type ContentGapMatrix } from '@/lib/digital-ministry/competitor-intelligence/types'

const MATRIX_TOPICS = [...CHURCH_TOPICS, 'General'] as const

function bumpTopic(counts: Record<string, number>, topic: string) {
  counts[topic] = (counts[topic] || 0) + 1
}

async function getKdcTopicCounts(): Promise<Record<string, number>> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - 30 * 86400000).toISOString()
  const counts: Record<string, number> = {}

  const [sermons, posts, dmPosts] = await Promise.all([
    admin
      .from('sermons')
      .select('title, description')
      .eq('status', 'published')
      .gte('created_at', since)
      .limit(200),
    admin.from('posts').select('title, excerpt').eq('status', 'published').gte('created_at', since).limit(200),
    admin
      .from('dm_posts')
      .select('title, body, body_markdown')
      .gte('created_at', since)
      .is('deleted_at', null)
      .limit(200),
  ])

  for (const row of sermons.data ?? []) {
    bumpTopic(counts, classifyTopic(row.title ?? '', row.description))
  }
  for (const row of posts.data ?? []) {
    bumpTopic(counts, classifyTopic(row.title ?? '', row.excerpt))
  }
  for (const row of dmPosts.data ?? []) {
    const text = `${row.title ?? ''} ${row.body ?? ''} ${row.body_markdown ?? ''}`
    bumpTopic(counts, classifyTopic(text.slice(0, 200), text))
  }

  return counts
}

export async function buildContentGapMatrix(): Promise<ContentGapMatrix> {
  const admin = createAdminClient()
  const kdcCounts = await getKdcTopicCounts()

  const { data: competitors } = await admin
    .from('dm_competitors')
    .select('id, name, latest_capture_run_id')
    .is('deleted_at', null)
    .order('name')
    .limit(8)

  const peerDistributions: Array<{ id: string; name: string; dist: Record<string, number> }> = []

  for (const c of competitors ?? []) {
    if (!c.latest_capture_run_id) {
      peerDistributions.push({ id: c.id, name: c.name, dist: {} })
      continue
    }
    const { data: run } = await admin
      .from('dm_competitor_capture_runs')
      .select('topic_distribution')
      .eq('id', c.latest_capture_run_id)
      .maybeSingle()

    peerDistributions.push({
      id: c.id,
      name: c.name,
      dist: (run?.topic_distribution ?? {}) as Record<string, number>,
    })
  }

  const columns = [
    { id: 'kdc', label: 'KDC', isKdc: true },
    ...peerDistributions.map((p) => ({ id: p.id, label: p.name, isKdc: false })),
  ]

  const cells: number[][] = []
  const gapScores: number[] = []
  let maxCount = 0

  for (const topic of MATRIX_TOPICS) {
    const row: number[] = []
    const kdcCount = kdcCounts[topic] ?? 0
    row.push(kdcCount)
    maxCount = Math.max(maxCount, kdcCount)

    let maxPeerShare = 0
    let kdcShare = 0

    const kdcTotal = Object.values(kdcCounts).reduce((a, b) => a + b, 0) || 1
    kdcShare = Math.round((kdcCount / kdcTotal) * 100)

    for (const peer of peerDistributions) {
      const count = peer.dist[topic] ?? 0
      row.push(count)
      maxCount = Math.max(maxCount, count)

      const peerTotal = Object.values(peer.dist).reduce((a, b) => a + b, 0) || 1
      const peerShare = Math.round((count / peerTotal) * 100)
      maxPeerShare = Math.max(maxPeerShare, peerShare)
    }

    cells.push(row)
    gapScores.push(Math.max(0, maxPeerShare - kdcShare))
  }

  return {
    topics: [...MATRIX_TOPICS],
    columns,
    cells,
    gapScores,
    maxCount: Math.max(1, maxCount),
    kdcTotal: Object.values(kdcCounts).reduce((a, b) => a + b, 0),
  }
}

/** KDC vs a single peer — used on competitor detail page */
export async function buildPeerGapMatrix(
  competitorId: string,
  peerName: string,
  topicDistribution: Record<string, number>
): Promise<ContentGapMatrix> {
  const kdcCounts = await getKdcTopicCounts()
  const columns = [
    { id: 'kdc', label: 'KDC', isKdc: true },
    { id: competitorId, label: peerName, isKdc: false },
  ]

  const cells: number[][] = []
  const gapScores: number[] = []
  let maxCount = 0

  for (const topic of MATRIX_TOPICS) {
    const kdcCount = kdcCounts[topic] ?? 0
    const peerCount = topicDistribution[topic] ?? 0
    cells.push([kdcCount, peerCount])
    maxCount = Math.max(maxCount, kdcCount, peerCount)

    const kdcTotal = Object.values(kdcCounts).reduce((a, b) => a + b, 0) || 1
    const peerTotal = Object.values(topicDistribution).reduce((a, b) => a + b, 0) || 1
    const kdcShare = Math.round((kdcCount / kdcTotal) * 100)
    const peerShare = Math.round((peerCount / peerTotal) * 100)
    gapScores.push(Math.max(0, peerShare - kdcShare))
  }

  return {
    topics: [...MATRIX_TOPICS],
    columns,
    cells,
    gapScores,
    maxCount: Math.max(1, maxCount),
    kdcTotal: Object.values(kdcCounts).reduce((a, b) => a + b, 0),
  }
}
