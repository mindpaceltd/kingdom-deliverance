import type { SupabaseClient } from '@supabase/supabase-js'
import { generateGeminiJson } from '@/lib/digital-ministry/gemini'
import {
  listConfiguredPlatformUrls,
  parseCompetitorPlatforms,
  platformField,
} from '@/lib/digital-ministry/competitor-platforms'
import { discoverSourcesFromWebsite } from '@/lib/digital-ministry/competitor-intelligence/discover'
import {
  fetchRssFeed,
  fetchSocialProfileMetadata,
  fetchWebsiteArticles,
  fetchYouTubePublic,
} from '@/lib/digital-ministry/competitor-intelligence/fetchers'
import {
  buildTopicDistribution,
  classifyTopic,
  postingFrequencyPerDay,
} from '@/lib/digital-ministry/competitor-intelligence/topics'
import type {
  CaptureStepResult,
  CompetitorCaptureRunResult,
  NormalizedContentItem,
} from '@/lib/digital-ministry/competitor-intelligence/types'

const SOCIAL_PLATFORMS = new Set(['facebook', 'instagram', 'tiktok', 'x', 'linkedin', 'threads', 'pinterest', 'whatsapp', 'telegram'])

async function upsertSource(
  admin: SupabaseClient,
  competitorId: string,
  platform: string,
  profileUrl: string | null,
  feedUrl: string | null,
  status: string,
  error?: string | null
) {
  const { data: existing } = await admin
    .from('dm_competitor_sources')
    .select('id')
    .eq('competitor_id', competitorId)
    .eq('platform', platform)
    .maybeSingle()

  const row = {
    competitor_id: competitorId,
    platform,
    profile_url: profileUrl,
    feed_url: feedUrl,
    source_type: feedUrl ? 'feed' : profileUrl ? 'profile' : 'website',
    discovery_status: status,
    last_checked_at: new Date().toISOString(),
    last_error: error ?? null,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    await admin.from('dm_competitor_sources').update(row).eq('id', existing.id)
    return existing.id as string
  }

  const { data } = await admin.from('dm_competitor_sources').insert(row).select('id').single()
  return data?.id as string
}

async function storeContentItems(
  admin: SupabaseClient,
  competitorId: string,
  sourceId: string | null,
  items: NormalizedContentItem[]
) {
  for (const item of items) {
    const topic = classifyTopic(item.title, item.description ?? item.caption)
    await admin.from('dm_competitor_content').insert(
      {
        competitor_id: competitorId,
        source_id: sourceId,
        platform: item.platform,
        external_id: item.externalId,
        url: item.url,
        title: item.title,
        caption: item.caption ?? null,
        description: item.description ?? null,
        content_type: item.contentType,
        published_at: item.publishedAt,
        likes: item.likes ?? null,
        comments: item.comments ?? null,
        shares: item.shares ?? null,
        views: item.views ?? null,
        hashtags: item.hashtags ?? [],
        topic,
        media_type: item.mediaType ?? null,
        raw_metadata: item.rawMetadata ?? {},
        captured_at: new Date().toISOString(),
      }
    )
  }
}

export async function runCompetitorCapture(
  admin: SupabaseClient,
  competitorId: string,
  options?: { discover?: boolean }
): Promise<CompetitorCaptureRunResult> {
  const { data: comp } = await admin
    .from('dm_competitors')
    .select('id, name, website_url, platforms')
    .eq('id', competitorId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!comp) throw new Error('Competitor not found')

  const { data: runRow } = await admin
    .from('dm_competitor_capture_runs')
    .insert({ competitor_id: competitorId, status: 'running', steps: [] })
    .select('id')
    .single()

  const runId = runRow!.id as string
  const steps: CaptureStepResult[] = []
  const limitations: string[] = []
  const allItems: NormalizedContentItem[] = []

  await admin.from('dm_competitor_content').delete().eq('competitor_id', competitorId)

  const parsed = parseCompetitorPlatforms((comp.platforms ?? {}) as Record<string, unknown>)
  let urls = listConfiguredPlatformUrls(parsed.urls, comp.website_url)

  if (options?.discover !== false && comp.website_url) {
    try {
      const discovered = await discoverSourcesFromWebsite(comp.website_url)
      for (const d of discovered.slice(0, 8)) {
        const existing = urls.find((u) => u.platform === d.platform)
        if (!existing) {
          urls.push({
            platform: d.platform as typeof urls[number]['platform'],
            url: d.feedUrl || d.profileUrl,
            captureKind:
              d.platform === 'rss' ? 'rss' : d.platform === 'youtube' ? 'youtube' : d.platform === 'website' ? 'web' : 'social',
          })
        }
        await upsertSource(admin, competitorId, String(d.platform), d.profileUrl, d.feedUrl ?? null, 'connected')
      }
      if (discovered.length) {
        steps.push({
          platform: 'discovery',
          label: 'Auto-discovery',
          status: 'ok',
          message: `Found ${discovered.length} public source(s) from website`,
          itemsFound: discovered.length,
        })
      }
    } catch (err) {
      steps.push({
        platform: 'discovery',
        label: 'Auto-discovery',
        status: 'warning',
        message: err instanceof Error ? err.message : 'Discovery failed',
      })
    }
  }

  if (!urls.length) {
    await admin
      .from('dm_competitor_capture_runs')
      .update({ status: 'failed', steps, completed_at: new Date().toISOString() })
      .eq('id', runId)
    throw new Error('Add a website or social URL first')
  }

  for (const source of urls.slice(0, 12)) {
    const label = platformField(String(source.platform))?.label ?? String(source.platform)

    try {
      if (source.captureKind === 'rss') {
        const { items, error } = await fetchRssFeed(source.url)
        if (error) throw new Error(error)
        const sourceId = await upsertSource(admin, competitorId, 'rss', null, source.url, items.length ? 'connected' : 'limited')
        await storeContentItems(admin, competitorId, sourceId, items)
        allItems.push(...items)
        steps.push({
          platform: 'rss',
          label: 'RSS / Atom',
          status: items.length ? 'ok' : 'warning',
          message: items.length ? `${items.length} feed items` : 'Feed reachable but empty',
          itemsFound: items.length,
        })
      } else if (source.captureKind === 'youtube') {
        const yt = await fetchYouTubePublic(source.url)
        if (yt.error) throw new Error(yt.error)
        const sourceId = await upsertSource(admin, competitorId, 'youtube', source.url, null, 'connected')
        await storeContentItems(admin, competitorId, sourceId, yt.items)
        allItems.push(...yt.items)
        if (yt.subscribers == null) {
          limitations.push('YouTube subscriber count not exposed on public page — only video titles captured.')
        }
        steps.push({
          platform: 'youtube',
          label: 'YouTube',
          status: yt.items.length ? 'ok' : 'warning',
          message: yt.subscribers
            ? `${yt.items.length} videos · ${yt.subscribers.toLocaleString()} subs (public page)`
            : `${yt.items.length} videos from public page`,
          itemsFound: yt.items.length,
        })
      } else if (source.captureKind === 'web') {
        const web = await fetchWebsiteArticles(source.url)
        if (web.error) throw new Error(web.error)
        const sourceId = await upsertSource(admin, competitorId, String(source.platform), source.url, null, 'connected')
        await storeContentItems(admin, competitorId, sourceId, web.items)
        allItems.push(...web.items)
        steps.push({
          platform: String(source.platform),
          label,
          status: web.items.length ? 'ok' : 'warning',
          message: `${web.items.length} pages/articles discovered`,
          itemsFound: web.items.length,
        })
      } else if (SOCIAL_PLATFORMS.has(String(source.platform))) {
        const meta = await fetchSocialProfileMetadata(String(source.platform), source.url)
        const status = meta.error ? 'warning' : meta.title ? 'ok' : 'warning'
        await upsertSource(
          admin,
          competitorId,
          String(source.platform),
          source.url,
          null,
          meta.error ? 'limited' : 'connected',
          meta.error
        )
        limitations.push(
          `${label}: public posts and engagement require official API/OAuth — only profile metadata captured unless connected.`
        )
        if (meta.title) {
          allItems.push({
            platform: String(source.platform),
            externalId: source.url,
            url: source.url,
            title: meta.title,
            description: meta.description,
            contentType: 'profile',
            publishedAt: null,
            mediaType: 'profile',
          })
        }
        steps.push({
          platform: String(source.platform),
          label,
          status,
          message: meta.error
            ? `Profile linked — ${meta.error}`
            : meta.title
              ? `Profile metadata only (no post API)`
              : 'Profile linked — limited public metadata',
          itemsFound: meta.title ? 1 : 0,
        })
      }
    } catch (err) {
      await upsertSource(
        admin,
        competitorId,
        String(source.platform),
        source.url,
        null,
        'error',
        err instanceof Error ? err.message : 'Failed'
      )
      steps.push({
        platform: String(source.platform),
        label,
        status: 'error',
        message: err instanceof Error ? err.message : 'Capture failed',
      })
    }
  }

  const videoCount = allItems.filter((i) => i.contentType === 'video' || i.platform === 'youtube').length
  const websitePosts = allItems.filter((i) => i.platform === 'website' || i.platform === 'rss').length
  const topicDistribution = buildTopicDistribution(allItems.map((i) => ({ topic: classifyTopic(i.title, i.description) })))
  const freq = postingFrequencyPerDay(
    allItems.map((i) => ({ published_at: i.publishedAt })),
    30
  )

  const aiResult = await generateGeminiJson<{
    topPerformingThemes: Array<{ theme: string; reason: string }>
    insight: string
    strengths: string[]
    weaknesses: string[]
  }>({
    prompt: `Analyze ONLY the following captured public content titles/descriptions for "${comp.name}".
Do NOT invent metrics, growth percentages, or engagement numbers not present in the data.
Content sample (${allItems.length} items):
${JSON.stringify(allItems.slice(0, 40).map((i) => ({ platform: i.platform, title: i.title, topic: classifyTopic(i.title, i.description) })), null, 2)}

Topic counts: ${JSON.stringify(topicDistribution)}
Posting frequency (dated items only, last 30d): ${freq ?? 'unknown'}

Return ONLY JSON:
{
  "topPerformingThemes": [{"theme": "...", "reason": "based on volume/recurrence in titles only"}],
  "insight": "one paragraph — no invented stats",
  "strengths": ["..."],
  "weaknesses": ["..."]
}`,
    agent: 'competitor_capture_analysis',
    inputType: 'competitor',
    inputRef: competitorId,
  })

  const aiAnalysis = 'data' in aiResult ? aiResult.data : {}

  const okSteps = steps.filter((s) => s.status === 'ok').length
  const status = okSteps === 0 ? 'failed' : okSteps < steps.length ? 'partial' : 'completed'

  await admin
    .from('dm_competitor_capture_runs')
    .update({
      status,
      steps,
      content_count: allItems.length,
      video_count: videoCount,
      website_posts: websitePosts,
      topic_distribution: topicDistribution,
      activity_score: freq,
      ai_analysis: aiAnalysis,
      data_limitations: limitations,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId)

  await admin
    .from('dm_competitors')
    .update({
      last_captured_at: new Date().toISOString(),
      latest_capture_run_id: runId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', competitorId)

  return {
    runId,
    status: status === 'failed' ? 'failed' : status === 'partial' ? 'partial' : 'completed',
    steps,
    contentCount: allItems.length,
    videoCount,
    websitePosts,
    topicDistribution,
    dataLimitations: limitations,
    aiAnalysis,
  }
}
