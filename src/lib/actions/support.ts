'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import {
  BOT_WELCOME,
  SUPPORT_BOT_NAME,
  detectBotIntent,
  getBotReply,
  type SupportBotFacts,
} from '@/lib/support/bot'
import {
  SUPPORT_VISITOR_COOKIE,
  type SupportConversation,
  type SupportMessage,
} from '@/lib/support/types'
import { randomUUID } from 'crypto'
import { parsePageContent } from '@/lib/cms/page-content'
import { resolveContactPage } from '@/lib/cms/contact-page-defaults'
import { upsertLeadFromSupport } from '@/lib/actions/leads'
import {
  conversationHasContact,
  validateSupportContact,
  type SupportContactMethod,
} from '@/lib/support/contact-validation'

function visitorTokenFromCookie(): string | null {
  return cookies().get(SUPPORT_VISITOR_COOKIE)?.value ?? null
}

function setVisitorCookie(token: string) {
  cookies().set(SUPPORT_VISITOR_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}

async function loadSupportBotFacts(
  admin: ReturnType<typeof createAdminClient>
): Promise<SupportBotFacts> {
  const [pageRes, settingsRes] = await Promise.all([
    admin
      .from('pages')
      .select('content_json')
      .eq('slug', 'contact')
      .eq('status', 'published')
      .maybeSingle(),
    admin.from('site_settings').select('key, value'),
  ])

  const settings = Object.fromEntries((settingsRes.data ?? []).map((row) => [row.key, row.value]))
  const cms = pageRes.data?.content_json ? parsePageContent(pageRes.data.content_json) : null
  const resolved = resolveContactPage(cms, settings)

  return {
    contactUrl: 'https://kdcuganda.org/contact',
    email: resolved.email,
    phones: resolved.phones,
    address: resolved.address,
    serviceTimes: resolved.serviceTimes,
  }
}

async function insertMessage(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    conversationId: string
    senderType: 'visitor' | 'agent' | 'bot'
    senderId?: string | null
    senderName?: string | null
    body: string
    bumpVisitorUnread?: boolean
    bumpStaffUnread?: boolean
  }
) {
  const preview = input.body.slice(0, 120)
  const { data: msg, error } = await admin
    .from('support_messages')
    .insert({
      conversation_id: input.conversationId,
      sender_type: input.senderType,
      sender_id: input.senderId ?? null,
      sender_name: input.senderName ?? null,
      body: input.body,
    })
    .select('*')
    .single()

  if (error || !msg) return { error: error?.message ?? 'Failed to send message' }

  const { data: conv } = await admin
    .from('support_conversations')
    .select('unread_staff_count, unread_visitor_count')
    .eq('id', input.conversationId)
    .single()

  await admin
    .from('support_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: preview,
      unread_staff_count:
        (conv?.unread_staff_count ?? 0) + (input.bumpStaffUnread ? 1 : 0),
      unread_visitor_count:
        (conv?.unread_visitor_count ?? 0) + (input.bumpVisitorUnread ? 1 : 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.conversationId)

  revalidatePath('/admin/support')
  revalidatePath('/admin/leads')
  return { message: msg as SupportMessage }
}

export async function resumeVisitorSupportChat(): Promise<
  | { conversation: SupportConversation; messages: SupportMessage[] }
  | { needsContact: true }
  | { error: string }
> {
  const token = visitorTokenFromCookie()
  if (!token) return { needsContact: true }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('support_conversations')
    .select('*')
    .eq('visitor_token', token)
    .neq('status', 'closed')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!existing || !conversationHasContact(existing)) {
    return { needsContact: true }
  }

  const { data: messages } = await admin
    .from('support_messages')
    .select('*')
    .eq('conversation_id', existing.id)
    .order('created_at', { ascending: true })

  return {
    conversation: existing as SupportConversation,
    messages: (messages ?? []) as SupportMessage[],
  }
}

export async function initVisitorSupportChat(input: {
  name: string
  email?: string
  phone?: string
  contactMethod: SupportContactMethod
}): Promise<
  | { conversation: SupportConversation; messages: SupportMessage[]; visitorToken: string }
  | { error: string }
> {
  const validated = validateSupportContact(input)
  if ('error' in validated) return validated

  const admin = createAdminClient()
  let token = visitorTokenFromCookie()

  if (!token) {
    token = randomUUID()
    setVisitorCookie(token)
  }

  let conversation: SupportConversation | null = null

  const { data: existing } = await admin
    .from('support_conversations')
    .select('*')
    .eq('visitor_token', token)
    .neq('status', 'closed')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    const { data: updated, error } = await admin
      .from('support_conversations')
      .update({
        visitor_name: validated.name,
        visitor_email: validated.email,
        visitor_phone: validated.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error || !updated) return { error: error?.message ?? 'Could not update conversation' }
    conversation = updated as SupportConversation
  } else {
    const { data: created, error } = await admin
      .from('support_conversations')
      .insert({
        visitor_token: token,
        visitor_name: validated.name,
        visitor_email: validated.email,
        visitor_phone: validated.phone,
        status: 'open',
        last_message_preview: BOT_WELCOME.slice(0, 120),
      })
      .select('*')
      .single()

    if (error || !created) return { error: error?.message ?? 'Could not start chat' }
    conversation = created as SupportConversation

    await insertMessage(admin, {
      conversationId: conversation.id,
      senderType: 'bot',
      senderName: SUPPORT_BOT_NAME,
      body: BOT_WELCOME,
      bumpStaffUnread: true,
    })
  }

  const leadResult = await upsertLeadFromSupport({
    conversationId: conversation.id,
    name: validated.name,
    email: validated.email,
    phone: validated.phone,
  })
  if ('error' in leadResult) return leadResult

  const { data: messages } = await admin
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  return {
    conversation,
    messages: (messages ?? []) as SupportMessage[],
    visitorToken: token,
  }
}

export async function sendVisitorSupportMessage(
  conversationId: string,
  body: string
): Promise<{ message?: SupportMessage; error?: string }> {
  const token = visitorTokenFromCookie()
  if (!token) return { error: 'Session expired. Please refresh and try again.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Message cannot be empty.' }

  const admin = createAdminClient()
  const { data: conv } = await admin
    .from('support_conversations')
    .select('id, visitor_name')
    .eq('id', conversationId)
    .eq('visitor_token', token)
    .single()

  if (!conv) return { error: 'Conversation not found.' }

  const visitorMessage = await insertMessage(admin, {
    conversationId,
    senderType: 'visitor',
    senderName: conv.visitor_name,
    body: trimmed,
    bumpStaffUnread: true,
  })

  if ('error' in visitorMessage && visitorMessage.error) return visitorMessage

  const detectedIntent = detectBotIntent(trimmed)
  if (detectedIntent) {
    if (detectedIntent === 'agent') {
      await admin
        .from('support_conversations')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    }

    const facts = await loadSupportBotFacts(admin)
    const botBody = getBotReply(detectedIntent, facts)
    if (botBody) {
      await insertMessage(admin, {
        conversationId,
        senderType: 'bot',
        senderName: SUPPORT_BOT_NAME,
        body: botBody,
        bumpVisitorUnread: true,
      })
    }
  }

  return visitorMessage
}

export async function sendVisitorBotQuickReply(
  conversationId: string,
  replyKey: string
): Promise<{ messages?: SupportMessage[]; error?: string }> {
  const token = visitorTokenFromCookie()
  if (!token) return { error: 'Session expired.' }

  const admin = createAdminClient()
  const { data: conv } = await admin
    .from('support_conversations')
    .select('id, status')
    .eq('id', conversationId)
    .eq('visitor_token', token)
    .single()

  if (!conv) return { error: 'Conversation not found.' }

  const facts = await loadSupportBotFacts(admin)
  const botBody = getBotReply(replyKey, facts)
  if (!botBody) return { error: 'Unknown quick reply.' }

  if (replyKey === 'agent') {
    await admin
      .from('support_conversations')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', conversationId)
  }

  const botResult = await insertMessage(admin, {
    conversationId,
    senderType: 'bot',
    senderName: SUPPORT_BOT_NAME,
    body: botBody,
    bumpVisitorUnread: true,
  })

  if ('error' in botResult && botResult.error) return { error: botResult.error }

  const { data: messages } = await admin
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return { messages: (messages ?? []) as SupportMessage[] }
}

export async function fetchVisitorSupportMessages(
  conversationId: string
): Promise<{ messages?: SupportMessage[]; error?: string }> {
  const token = visitorTokenFromCookie()
  if (!token) return { error: 'No session' }

  const admin = createAdminClient()
  const { data: conv } = await admin
    .from('support_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('visitor_token', token)
    .maybeSingle()

  if (!conv) return { error: 'Not found' }

  await admin
    .from('support_conversations')
    .update({ unread_visitor_count: 0 })
    .eq('id', conversationId)

  const { data: messages } = await admin
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return { messages: (messages ?? []) as SupportMessage[] }
}

export async function listSupportConversations(): Promise<
  SupportConversation[] | { error: string }
> {
  const auth = await requireStaff()
  if ('error' in auth) return auth

  const supabase = createClient()
  const { data, error } = await supabase
    .from('support_conversations')
    .select('*')
    .order('last_message_at', { ascending: false })
    .limit(200)

  if (error) return { error: error.message }
  return (data ?? []) as SupportConversation[]
}

export async function getSupportConversation(
  conversationId: string
): Promise<
  | { conversation: SupportConversation; messages: SupportMessage[] }
  | { error: string }
> {
  const auth = await requireStaff()
  if ('error' in auth) return auth

  const supabase = createClient()
  const { data: conversation, error: convError } = await supabase
    .from('support_conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) return { error: 'Conversation not found' }

  await supabase
    .from('support_conversations')
    .update({ unread_staff_count: 0 })
    .eq('id', conversationId)

  const { data: messages, error: msgError } = await supabase
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgError) return { error: msgError.message }

  return {
    conversation: conversation as SupportConversation,
    messages: (messages ?? []) as SupportMessage[],
  }
}

export async function sendStaffSupportMessage(
  conversationId: string,
  body: string
): Promise<{ message?: SupportMessage; error?: string }> {
  const auth = await requireStaff()
  if ('error' in auth) return auth

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Message cannot be empty.' }

  const supabase = createClient()
  const admin = createAdminClient()

  const senderName = auth.name || 'Support'

  const result = await insertMessage(admin, {
    conversationId,
    senderType: 'agent',
    senderId: auth.id,
    senderName,
    body: trimmed,
    bumpVisitorUnread: true,
  })

  if ('error' in result && result.error) return { error: result.error }

  await supabase
    .from('support_conversations')
    .update({
      status: 'open',
      assigned_to: auth.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  return result
}

export async function updateSupportConversationStatus(
  conversationId: string,
  status: 'open' | 'pending' | 'closed'
): Promise<{ success: true } | { error: string }> {
  const auth = await requireStaff()
  if ('error' in auth) return auth

  const supabase = createClient()
  const { error } = await supabase
    .from('support_conversations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) return { error: error.message }
  revalidatePath('/admin/support')
  return { success: true }
}
