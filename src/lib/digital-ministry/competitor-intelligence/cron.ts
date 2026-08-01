import { createAdminClient } from '@/lib/supabase/server'
import { sendSystemEmail } from '@/lib/email'
import { runCompetitorCapture } from '@/lib/digital-ministry/competitor-intelligence/capture-engine'
import { buildCompetitorStrategyReport } from '@/lib/digital-ministry/competitor-intelligence/analysis'
import {
  formatStrategyReportHtml,
  formatStrategyReportText,
} from '@/lib/digital-ministry/competitor-intelligence/report-format'
import type { MonitoringFrequency } from '@/lib/digital-ministry/competitor-intelligence/types'

function hoursSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY
  return (Date.now() - new Date(iso).getTime()) / 3600000
}

function isDueForCapture(
  frequency: MonitoringFrequency | string | null,
  lastCapturedAt: string | null
): boolean {
  if (!frequency || frequency === 'manual') return false
  const hours = hoursSince(lastCapturedAt)
  if (frequency === 'daily') return hours >= 20
  if (frequency === 'weekly') return hours >= 144
  return false
}

async function getReportRecipients(admin: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const emails = new Set<string>()

  const [{ data: dmSettings }, { data: siteSettings }] = await Promise.all([
    admin.from('dm_settings').select('key, value').in('key', ['competitor_report_emails']),
    admin.from('site_settings').select('key, value').eq('key', 'contact_email').maybeSingle(),
  ])

  for (const row of dmSettings ?? []) {
    if (row.key === 'competitor_report_emails' && Array.isArray(row.value)) {
      for (const e of row.value) {
        if (typeof e === 'string' && e.includes('@')) emails.add(e.trim())
      }
    }
  }

  if (siteSettings?.value && String(siteSettings.value).includes('@')) {
    emails.add(String(siteSettings.value).trim())
  }

  return [...emails]
}

export async function runCompetitorCaptureCron() {
  const admin = createAdminClient()

  const { data: competitors, error } = await admin
    .from('dm_competitors')
    .select('id, name, monitoring_frequency, last_captured_at')
    .is('deleted_at', null)
    .neq('monitoring_frequency', 'manual')
    .order('name')

  if (error) return { error: error.message }

  const captured: string[] = []
  const skipped: string[] = []
  const failures: Array<{ name: string; error: string }> = []

  for (const c of competitors ?? []) {
    if (!isDueForCapture(c.monitoring_frequency, c.last_captured_at)) {
      skipped.push(c.name)
      continue
    }

    try {
      await runCompetitorCapture(admin, c.id, { discover: false })
      captured.push(c.name)
    } catch (err) {
      failures.push({
        name: c.name,
        error: err instanceof Error ? err.message : 'Capture failed',
      })
    }
  }

  await admin.from('dm_settings').upsert(
    {
      key: 'competitor_cron_last_capture',
      value: {
        at: new Date().toISOString(),
        captured,
        skipped: skipped.length,
        failures,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  )

  return { captured, skipped: skipped.length, failures, total: competitors?.length ?? 0 }
}

export async function runCompetitorWeeklyReportCron() {
  const admin = createAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${(process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL)!.replace(/^https?:\/\//, '')}`
    : null

  const reportResult = await buildCompetitorStrategyReport(null)
  if ('error' in reportResult) return reportResult

  const payload = reportResult.data
  const downloadUrl =
    baseUrl && payload.reportId
      ? `${baseUrl}/api/digital-ministry/competitors/report/${payload.reportId}`
      : undefined

  const html = formatStrategyReportHtml(payload, { downloadUrl, forPrint: false })
  const text = formatStrategyReportText(payload)
  const subject = `KDC Competitor Intelligence — weekly strategy report (${new Date(payload.generatedAt).toLocaleDateString()})`

  const recipients = await getReportRecipients(admin)
  const emailResults: Array<{ to: string; ok: boolean; error?: string }> = []

  for (const to of recipients) {
    const sent = await sendSystemEmail(to, subject, html, text)
    emailResults.push({
      to,
      ok: !('error' in sent && sent.error),
      error: 'error' in sent ? sent.error : undefined,
    })
  }

  await admin.from('dm_settings').upsert(
    {
      key: 'competitor_cron_last_report',
      value: {
        at: payload.generatedAt,
        reportId: payload.reportId ?? null,
        recipients: emailResults,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  )

  return {
    reportId: payload.reportId,
    emailed: emailResults.filter((r) => r.ok).length,
    recipients: emailResults,
    noRecipients: recipients.length === 0,
  }
}

/** Full weekly job: capture due peers, then generate + email report */
export async function runCompetitorIntelligenceWeeklyCron() {
  const capture = await runCompetitorCaptureCron()
  if ('error' in capture) return capture

  const report = await runCompetitorWeeklyReportCron()
  if ('error' in report) return { capture, reportError: report.error }

  return { capture, report }
}
