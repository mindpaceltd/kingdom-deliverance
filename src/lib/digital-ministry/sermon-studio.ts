'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import { generateGeminiJson, stripHtml } from '@/lib/digital-ministry/gemini'
import { createDmPost } from '@/lib/digital-ministry/posts'

export type SermonSegmentKind =
  | 'powerful'
  | 'prayer'
  | 'funny'
  | 'emotional'
  | 'applause'
  | 'reaction'
  | 'quote'
  | 'other'

export type SermonPack = {
  summary: string
  keyVerses: string[]
  prayerPoints: string[]
  discussionQuestions: string[]
  segments: Array<{
    kind: SermonSegmentKind
    label: string
    transcript_excerpt: string
    start_seconds?: number | null
    end_seconds?: number | null
    confidence?: number
  }>
  formats: {
    tweets: string[]
    facebookPosts: string[]
    linkedinPosts: string[]
    shortsIdeas: string[]
    reelsIdeas: string[]
    tiktokScripts: string[]
    newsletterBlurb: string
    blogOutline: string
    youthVersion: string
    childrenVersion: string
  }
}

function revalidateSermonStudio(sermonId?: string) {
  revalidatePath('/admin/digital-ministry/sermon-studio')
  revalidatePath('/admin/digital-ministry/studio')
  revalidatePath('/admin/digital-ministry/calendar')
  if (sermonId) revalidatePath(`/admin/digital-ministry/sermon-studio/${sermonId}`)
}

export async function listStudioSermons(limit = 20) {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('sermons')
    .select('id, title, slug, status, views, date, preacher, description, video_url')
    .neq('status', 'trash')
    .order('date', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function getSermonStudioDetail(sermonId: string) {
  const auth = await requireStaff()
  if ('error' in auth) return null

  const supabase = createClient()
  const { data: sermon } = await supabase
    .from('sermons')
    .select(
      'id, title, slug, status, views, date, preacher, description, content, video_url, audio_url'
    )
    .eq('id', sermonId)
    .maybeSingle()

  if (!sermon) return null

  const { data: segments } = await supabase
    .from('dm_sermon_segments')
    .select('*')
    .eq('sermon_id', sermonId)
    .order('start_seconds', { ascending: true, nullsFirst: false })

  const { data: recentGen } = await supabase
    .from('dm_ai_generations')
    .select('id, output, model, created_at')
    .eq('agent', 'sermon_studio_pack')
    .eq('input_ref', sermonId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    sermon,
    segments: segments ?? [],
    pack: (recentGen?.output as SermonPack | null) ?? null,
    packMeta: recentGen
      ? { id: recentGen.id, model: recentGen.model, created_at: recentGen.created_at }
      : null,
  }
}

export async function generateSermonPack(sermonId: string): Promise<
  { pack: SermonPack; segmentCount: number } | { error: string }
> {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: sermon } = await admin
    .from('sermons')
    .select('id, title, preacher, description, content, date')
    .eq('id', sermonId)
    .maybeSingle()

  if (!sermon) return { error: 'Sermon not found' }

  const sourceText = stripHtml(
    [sermon.title, sermon.description, sermon.content].filter(Boolean).join('\n\n')
  ).slice(0, 14000)

  if (sourceText.length < 40) {
    return {
      error:
        'Sermon needs more content (description/body) before generating a pack. Add notes in Sermons CMS first.',
    }
  }

  const prompt = `You are the Sermon Studio producer for Kingdom Deliverance Centre (KDC) Uganda.

From this sermon, produce clip segments and a multi-format content pack.
Title: ${sermon.title}
Preacher: ${sermon.preacher}
Date: ${sermon.date}
Source:
${sourceText}

Return ONLY raw JSON matching:
{
  "summary": "2-4 sentence summary",
  "keyVerses": ["ref — text"],
  "prayerPoints": ["..."],
  "discussionQuestions": ["..."],
  "segments": [
    {
      "kind": "powerful|prayer|funny|emotional|applause|reaction|quote|other",
      "label": "short clip title",
      "transcript_excerpt": "40-120 words of the moment",
      "start_seconds": null,
      "end_seconds": null,
      "confidence": 0.8
    }
  ],
  "formats": {
    "tweets": ["up to 8 short posts"],
    "facebookPosts": ["up to 5"],
    "linkedinPosts": ["up to 3"],
    "shortsIdeas": ["up to 8 Shorts concepts"],
    "reelsIdeas": ["up to 6"],
    "tiktokScripts": ["up to 5 short scripts"],
    "newsletterBlurb": "email paragraph",
    "blogOutline": "bulleted outline as one string",
    "youthVersion": "youth-friendly short version",
    "childrenVersion": "simple children's takeaway"
  }
}

Create 5-10 segments. Stay faithful to Scripture. No generic filler.`

  const result = await generateGeminiJson<SermonPack>({
    prompt,
    agent: 'sermon_studio_pack',
    userId: auth.id,
    inputType: 'sermon',
    inputRef: sermonId,
  })

  if ('error' in result) return result

  const pack = result.data
  const segments = Array.isArray(pack.segments) ? pack.segments : []

  await admin.from('dm_sermon_segments').delete().eq('sermon_id', sermonId)

  if (segments.length) {
    const kinds = new Set([
      'powerful',
      'prayer',
      'funny',
      'emotional',
      'applause',
      'reaction',
      'quote',
      'other',
    ])
    await admin.from('dm_sermon_segments').insert(
      segments.map((s) => ({
        sermon_id: sermonId,
        kind: kinds.has(s.kind) ? s.kind : 'other',
        label: s.label || 'Clip',
        transcript_excerpt: s.transcript_excerpt || '',
        start_seconds: s.start_seconds ?? null,
        end_seconds: s.end_seconds ?? null,
        confidence: s.confidence ?? null,
      }))
    )
  }

  revalidateSermonStudio(sermonId)
  return { pack, segmentCount: segments.length }
}

/** Push selected pack formats into Content Studio drafts (+ calendar optional). */
export async function pushSermonPackToStudio(sermonId: string): Promise<
  { created: number; ids: string[] } | { error: string }
> {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const detail = await getSermonStudioDetail(sermonId)
  if (!detail?.pack) return { error: 'Generate a pack first' }

  const pack = detail.pack
  const titleBase = detail.sermon.title
  const drafts: Array<{ title: string; body: string; platforms: string[] }> = []

  for (const t of (pack.formats?.tweets ?? []).slice(0, 5)) {
    drafts.push({ title: `${titleBase} · X`, body: t, platforms: ['x'] })
  }
  for (const t of (pack.formats?.facebookPosts ?? []).slice(0, 4)) {
    drafts.push({
      title: `${titleBase} · Facebook`,
      body: t,
      platforms: ['facebook', 'instagram'],
    })
  }
  if (pack.formats?.newsletterBlurb) {
    drafts.push({
      title: `${titleBase} · Newsletter`,
      body: pack.formats.newsletterBlurb,
      platforms: ['email'],
    })
  }
  for (const idea of (pack.formats?.shortsIdeas ?? []).slice(0, 3)) {
    drafts.push({
      title: `${titleBase} · Shorts idea`,
      body: idea,
      platforms: ['youtube', 'tiktok'],
    })
  }

  const ids: string[] = []
  for (const d of drafts) {
    const created = await createDmPost({
      title: d.title,
      body: d.body,
      platforms: d.platforms,
      sermonId,
      aiTone: 'evangelism',
      status: 'draft',
    })
    if ('id' in created && created.id) ids.push(created.id)
  }

  revalidateSermonStudio(sermonId)
  return { created: ids.length, ids }
}
