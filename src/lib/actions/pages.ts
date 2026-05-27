'use server'

import { revalidatePath } from 'next/cache'
import { revalidateSitemap } from '@/lib/seo/revalidate-sitemap'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  buildContentJson,
  pagePathFromSlug,
  parsePageContent,
  type CmsPageContent,
} from '@/lib/cms/page-content'
import { defaultContactDetails } from '@/lib/cms/contact-page-defaults'
import { SYSTEM_PAGE_DEFINITIONS } from '@/lib/cms/system-pages'

export interface CmsPagePayload {
  title: string
  slug: string
  content_json: Record<string, unknown>
  status: 'draft' | 'published'
}

function normalizeSlug(slug: string): string {
  const s = slug.trim().toLowerCase()
  if (s === '' || s === '/') return 'home'
  return s.replace(/^\/+/, '')
}

function revalidateAdminPages() {
  revalidatePath('/admin/pages')
  revalidateSitemap()
}

function revalidatePublicPage(slug: string) {
  revalidatePath(pagePathFromSlug(slug))
}

export async function ensureSystemPages(options?: {
  /** Replace content with built-in defaults (manual sync only). */
  overwrite?: boolean
}): Promise<{ synced: number } | { error: string }> {
  const auth = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in auth) return auth

  const overwrite = options?.overwrite === true
  const admin = createAdminClient()
  let synced = 0

  for (const def of SYSTEM_PAGE_DEFINITIONS) {
    const slug = normalizeSlug(def.slug)
    const content_json = buildContentJson(def.content)

    let existingQuery = admin.from('pages').select('id, slug')
    if (slug === 'home') {
      existingQuery = existingQuery.in('slug', ['home', ''])
    } else {
      existingQuery = existingQuery.eq('slug', slug)
    }
    const { data: existing } = await existingQuery.maybeSingle()

    if (existing?.id) {
      if (overwrite) {
        const { error } = await admin
          .from('pages')
          .update({
            title: def.title,
            slug,
            content_json,
            status: def.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (!error) synced++
      }
    } else {
      const { error } = await admin.from('pages').insert({
        title: def.title,
        slug,
        content_json,
        status: def.status,
      })
      if (!error) synced++
    }
  }

  revalidateAdminPages()
  if (overwrite || synced > 0) {
    for (const def of SYSTEM_PAGE_DEFINITIONS) {
      revalidatePublicPage(def.slug)
    }
  }
  return { synced }
}

export async function getAdminPage(id: string) {
  const auth = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in auth) return auth

  const supabase = createClient()
  const { data, error } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
  if (error) return { error: error.message }
  if (!data) return { error: 'Page not found' }
  return { data }
}

export async function createPage(
  payload: CmsPagePayload
): Promise<{ success: true; id: string } | { error: string }> {
  const auth = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in auth) return auth

  const slug = normalizeSlug(payload.slug)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pages')
    .insert({
      title: payload.title.trim(),
      slug,
      content_json: payload.content_json,
      status: payload.status,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidateAdminPages()
  revalidatePublicPage(slug)
  return { success: true, id: data.id }
}

export async function updatePage(
  id: string,
  payload: CmsPagePayload
): Promise<{ success: true } | { error: string }> {
  const auth = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in auth) return auth

  const slug = normalizeSlug(payload.slug)
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('pages')
    .select('slug, content_json')
    .eq('id', id)
    .maybeSingle()

  const parsed = parsePageContent(existing?.content_json)
  const updateRow: {
    title: string
    content_json: Record<string, unknown>
    status: 'draft' | 'published'
    updated_at: string
    slug?: string
  } = {
    title: payload.title.trim(),
    content_json: payload.content_json,
    status: payload.status,
    updated_at: new Date().toISOString(),
  }

  if (!parsed.isSystem) {
    updateRow.slug = slug
  }

  const { error } = await supabase.from('pages').update(updateRow).eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidateAdminPages()
  revalidatePublicPage(slug)
  revalidatePath(`/admin/pages/${id}`)
  return { success: true }
}

export async function updatePageFromEditor(
  id: string,
  input: {
    title: string
    slug: string
    status: 'draft' | 'published'
    content: CmsPageContent
  }
): Promise<{ success: true } | { error: string }> {
  const content = { ...input.content }
  if (content.pageType === 'contact') {
    content.contact = { ...defaultContactDetails(), ...content.contact }
  }
  if (content.isSystem) {
    const def = SYSTEM_PAGE_DEFINITIONS.find(
      (d) => normalizeSlug(d.slug) === normalizeSlug(input.slug)
    )
    if (def) {
      content.pageType = def.content.pageType
      content.listingTarget = def.content.listingTarget
      content.isSystem = true
    }
  }

  const systemSlug = content.isSystem
    ? SYSTEM_PAGE_DEFINITIONS.find((d) => normalizeSlug(d.slug) === normalizeSlug(input.slug))
        ?.slug ?? input.slug
    : input.slug

  return updatePage(id, {
    title: input.title,
    slug: systemSlug,
    status: input.status,
    content_json: buildContentJson(content),
  })
}

export async function deletePage(id: string): Promise<{ success: true } | { error: string }> {
  const auth = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in auth) return auth

  const supabase = createClient()
  const { data: existing } = await supabase
    .from('pages')
    .select('slug, content_json')
    .eq('id', id)
    .maybeSingle()

  const parsed = parsePageContent(existing?.content_json)
  if (parsed.isSystem) {
    return { error: 'System pages cannot be deleted. Set status to Draft instead.' }
  }

  const { error } = await supabase.from('pages').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidateAdminPages()
  if (existing?.slug) revalidatePublicPage(existing.slug)
  return { success: true }
}
