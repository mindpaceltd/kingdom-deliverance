import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

export async function sendSystemEmail(to: string, subject: string, html: string, text: string) {
  const supabase = createClient()
  
  // Fetch SMTP settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'smtp_host',
      'smtp_port',
      'smtp_user',
      'smtp_pass',
      'smtp_encryption',
      'smtp_from_email',
      'smtp_from_name'
    ])

  if (!settings) {
    throw new Error('Could not load SMTP settings from database.')
  }

  const config = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {} as Record<string, string>)

  if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
    console.warn('SMTP is not fully configured in site settings.')
    return { error: 'SMTP is not configured' }
  }

  const secure = config.smtp_encryption === 'ssl' || config.smtp_port === '465'

  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: parseInt(config.smtp_port || '587', 10),
    secure,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
  })

  const fromName = config.smtp_from_name || 'KDC Uganda'
  const fromEmail = config.smtp_from_email || 'noreply@kdcuganda.org'

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    return { error: error.message }
  }
}
