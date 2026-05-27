export type SupportConversationStatus = 'open' | 'pending' | 'closed'
export type SupportSenderType = 'visitor' | 'agent' | 'bot'

export interface SupportConversation {
  id: string
  visitor_token: string
  visitor_name: string | null
  visitor_email: string | null
  visitor_phone: string | null
  status: SupportConversationStatus
  assigned_to: string | null
  last_message_at: string
  last_message_preview: string | null
  unread_staff_count: number
  unread_visitor_count: number
  created_at: string
  updated_at: string
}

export interface SupportMessage {
  id: string
  conversation_id: string
  sender_type: SupportSenderType
  sender_id: string | null
  sender_name: string | null
  body: string
  created_at: string
}

export const SUPPORT_VISITOR_COOKIE = 'kdc_support_token'
