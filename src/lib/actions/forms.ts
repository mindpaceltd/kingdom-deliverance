'use server'

import { createClient } from '@/lib/supabase/server'
import { sendSystemEmail } from '@/lib/email'

export async function submitContactForm(data: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}) {
  const supabase = createClient()
  
  // 1. Insert into database
  const { error: dbError } = await supabase.from('contact_submissions').insert(data)
  if (dbError) {
    return { error: 'Failed to submit message to the database.' }
  }

  // 2. Fetch the contact_email setting
  const { data: settings } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'contact_email')
    .single()

  const adminEmail = settings?.value || 'info@kdcuganda.org'

  // 3. Send email to the church admin
  await sendSystemEmail(
    adminEmail,
    `New Contact Form: ${data.subject}`,
    `
      <h3>New Contact Submission</h3>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
    `,
    `New Contact Submission from ${data.name}. Message: ${data.message}`
  )

  return { success: true }
}

export async function submitPrayerRequest(data: {
  name?: string
  email?: string
  request: string
  is_anonymous: boolean
}) {
  const supabase = createClient()
  
  // 1. Insert into database
  const { error: dbError } = await supabase.from('prayer_requests').insert(data)
  if (dbError) {
    return { error: 'Failed to submit prayer request.' }
  }

  // 2. Fetch the contact_email setting
  const { data: settings } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'contact_email')
    .single()

  const adminEmail = settings?.value || 'info@kdcuganda.org'
  const senderName = data.is_anonymous ? 'Anonymous' : (data.name || 'Anonymous')

  // 3. Send email to the church admin
  await sendSystemEmail(
    adminEmail,
    `New Prayer Request from ${senderName}`,
    `
      <h3>New Prayer Request</h3>
      <p><strong>Name:</strong> ${senderName}</p>
      <p><strong>Email:</strong> ${data.email || 'N/A'}</p>
      <p><strong>Request:</strong></p>
      <p>${data.request}</p>
    `,
    `New Prayer Request from ${senderName}. Request: ${data.request}`
  )

  return { success: true }
}
