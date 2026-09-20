'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { sendSystemEmail } from '@/lib/email'

interface PasswordResetRequestParams {
  email: string
  nextPath?: string // e.g. '/admin/reset-password' or '/account/reset-password'
}

export async function requestPasswordResetAction({ email, nextPath = '/account/reset-password' }: PasswordResetRequestParams) {
  const cleanEmail = email.trim().toLowerCase()

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  try {
    const admin = createAdminClient()

    // Generate recovery link via Supabase Admin API without triggering GoTrue SMTP
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
    })

    if (error) {
      console.warn('generateLink warning:', error.message)
      // If user doesn't exist, still return success for security (prevents user enumeration)
      if (error.message.toLowerCase().includes('not found') || error.status === 404) {
        return { success: true }
      }
      return { error: error.message }
    }

    const tokenHash = data?.properties?.hashed_token
    if (!tokenHash) {
      console.error('No hashed_token returned by generateLink')
      return { error: 'Unable to generate password reset token.' }
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kdcuganda.org').replace(/\/+$/, '')
    const callbackUrl = `${baseUrl}/auth/callback?token_hash=${tokenHash}&type=recovery&next=${encodeURIComponent(nextPath)}`

    // Render branded HTML email
    const subject = 'Reset Your Password — Kingdom Deliverance Centre Uganda'
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0a1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f0a1e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background: linear-gradient(180deg, #1e1538 0%, #17102b 100%); border-radius: 16px; border: 1px solid rgba(234, 179, 8, 0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.5); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center; background: linear-gradient(135deg, #3b0764 0%, #1e1538 100%); border-bottom: 1px solid rgba(234, 179, 8, 0.2);">
              <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: #1e1538; font-size: 26px; font-weight: bold; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.35);">
                🛡️
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Kingdom Deliverance Centre
              </h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #eab308; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                Uganda Portal
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ffffff;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #d1d5db;">
                Hello,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #d1d5db;">
                We received a request to reset your password for your account associated with <strong style="color: #ffffff;">${cleanEmail}</strong>.
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #d1d5db;">
                Click the button below to choose a new password. This link is secure and valid for 1 hour.
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${callbackUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 700; color: #0f0a1e; background: linear-gradient(135deg, #facc15 0%, #eab308 100%); text-decoration: none; border-radius: 10px; box-shadow: 0 6px 20px rgba(234, 179, 8, 0.35); letter-spacing: 0.3px;">
                      Reset Your Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 12px; font-size: 13px; line-height: 1.5; color: #9ca3af;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.5; word-break: break-all; color: #eab308; background-color: rgba(234, 179, 8, 0.08); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(234, 179, 8, 0.15);">
                ${callbackUrl}
              </p>

              <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; margin-top: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9ca3af;">
                  <strong>Didn't request this change?</strong> You can safely ignore this email; your current password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: rgba(0, 0, 0, 0.25); text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                © ${new Date().getFullYear()} Kingdom Deliverance Centre Uganda. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const text = `Reset Your Password - Kingdom Deliverance Centre Uganda\n\nWe received a request to reset your password for ${cleanEmail}.\n\nClick the link below to set a new password:\n${callbackUrl}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.`

    const sendRes = await sendSystemEmail(cleanEmail, subject, html, text)
    if (sendRes?.error) {
      console.error('sendSystemEmail error:', sendRes.error)
      return { error: `Failed to deliver email: ${sendRes.error}` }
    }

    return { success: true }
  } catch (err: any) {
    console.error('requestPasswordResetAction error:', err)
    return { error: err.message || 'An unexpected error occurred while processing password reset.' }
  }
}
