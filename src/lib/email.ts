import nodemailer from 'nodemailer'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function sendSystemEmail(to: string, subject: string, html: string, text: string) {
  const supabase = createClient()
  
  // Fetch SMTP settings using admin client or public client
  let settings: { key: string; value: string }[] | null = null
  try {
    const supabase = createClient()
    const res = await supabase
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
    settings = res.data
  } catch (err) {
    // If running in a context where cookies() is not available
    const admin = createAdminClient()
    const res = await admin
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
    settings = res.data
  }

  const config = (settings || []).reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {} as Record<string, string>)

  const host = config.smtp_host || '127.0.0.1'
  const isLocal = host === '127.0.0.1' || host === 'localhost'
  const port = parseInt(config.smtp_port || (isLocal ? '25' : '587'), 10)
  const secure = config.smtp_encryption === 'ssl' || port === 465

  // If not local and credentials missing, cannot authenticate
  if (!isLocal && (!config.smtp_user || !config.smtp_pass)) {
    console.warn('SMTP is not fully configured in site settings.')
    return { error: 'SMTP is not configured' }
  }

  const transportOptions: any = {
    host,
    port,
    secure,
    tls: {
      rejectUnauthorized: false
    }
  }

  if (config.smtp_user && config.smtp_pass) {
    transportOptions.auth = {
      user: config.smtp_user,
      pass: config.smtp_pass,
    }
  }

  const transporter = nodemailer.createTransport(transportOptions)

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
