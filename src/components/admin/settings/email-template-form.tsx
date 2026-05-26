'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { EMAIL_TEMPLATE_STARTER_HTML } from '@/lib/email/template-starter-html'

const RichTextEditor = dynamic(
  () =>
    import('@/components/admin/rich-text-editor').then((m) => ({
      default: m.RichTextEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center rounded-md border border-input bg-muted/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveEmailTemplate } from '@/lib/actions/settings-shop'

const TEMPLATE_TYPES = [
  { value: 'order_confirmation', label: 'Order Confirmation' },
  { value: 'order_shipped', label: 'Order Shipped' },
  { value: 'order_delivered', label: 'Order Delivered' },
  { value: 'order_cancelled', label: 'Order Cancelled' },
  { value: 'refund_initiated', label: 'Refund Initiated' },
  { value: 'refund_completed', label: 'Refund Completed' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'download_ready', label: 'Download Ready' },
  { value: 'customer_notification', label: 'Customer Notification' },
  { value: 'admin_notification', label: 'Admin Notification' },
] as const

export interface EmailTemplateRow {
  id: string
  template_name: string
  display_name: string
  subject: string
  html_content: string
  text_content: string | null
  template_type: string
  is_active: boolean
  variables: string[] | null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function EmailTemplateForm({ initial }: { initial?: EmailTemplateRow }) {
  const router = useRouter()
  const isEdit = Boolean(initial)

  const [templateName, setTemplateName] = React.useState(initial?.template_name ?? '')
  const [displayName, setDisplayName] = React.useState(initial?.display_name ?? '')
  const [subject, setSubject] = React.useState(initial?.subject ?? '')
  const [htmlContent, setHtmlContent] = React.useState(
    initial?.html_content ?? (!isEdit ? EMAIL_TEMPLATE_STARTER_HTML : '')
  )
  const [textContent, setTextContent] = React.useState(initial?.text_content ?? '')
  const [templateType, setTemplateType] = React.useState(
    initial?.template_type ?? 'order_confirmation'
  )
  const [variablesText, setVariablesText] = React.useState(
    (initial?.variables ?? []).join(', ')
  )
  const [isActive, setIsActive] = React.useState(initial?.is_active ?? true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isEdit && displayName && !templateName) {
      setTemplateName(slugify(displayName))
    }
  }, [displayName, isEdit, templateName])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const nameKey = (isEdit ? initial!.template_name : templateName || slugify(displayName)).trim()
    if (!displayName.trim() || !subject.trim() || !htmlContent.trim() || !nameKey) {
      setError('Display name, subject, and HTML content are required')
      return
    }

    const variables = variablesText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

    setSubmitting(true)
    const result = await saveEmailTemplate(
      {
        template_name: nameKey,
        display_name: displayName,
        subject,
        html_content: htmlContent,
        text_content: textContent || undefined,
        template_type: templateType,
        is_active: isActive,
        variables,
      },
      initial?.id
    )
    setSubmitting(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    router.push('/admin/settings/emails')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/settings/emails">
          <ArrowLeft className="mr-2 size-4" />
          Back to templates
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit email template' : 'New email template'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="et-display">Display name</Label>
          <Input
            id="et-display"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="et-key">Template key</Label>
          <Input
            id="et-key"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            disabled={submitting || isEdit}
            placeholder="order_confirmation_custom"
            className="font-mono text-sm"
          />
          {!isEdit && (
            <p className="text-xs text-muted-foreground">Unique identifier; auto-filled from display name.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={templateType} onValueChange={setTemplateType} disabled={submitting}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="et-subject">Subject</Label>
          <Input
            id="et-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="et-vars">Variables (comma-separated)</Label>
          <Input
            id="et-vars"
            value={variablesText}
            onChange={(e) => setVariablesText(e.target.value)}
            placeholder="customer_name, order_id, total"
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Email body (HTML)</Label>
          <p className="text-xs text-muted-foreground">
            Design your template with headings, links, and images. Use variables like{' '}
            <code className="rounded bg-muted px-1">{'{{customer_name}}'}</code> in the
            subject or body.
          </p>
          <RichTextEditor
            value={htmlContent}
            onChange={setHtmlContent}
            placeholder="Write your email content…"
            disabled={submitting}
            compact
            editorMinHeight="min-h-[280px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="et-text">Plain text (optional)</Label>
          <Textarea
            id="et-text"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={6}
            disabled={submitting}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <Label>Active</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} disabled={submitting} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save template' : 'Create template'}
          </Button>
          <Button type="button" variant="outline" asChild disabled={submitting}>
            <Link href="/admin/settings/emails">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
