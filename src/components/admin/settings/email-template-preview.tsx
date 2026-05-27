'use client'

import * as React from 'react'
import { Eye, Monitor, Smartphone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  applyTemplateVariables,
  buildSampleContext,
  wrapEmailPreviewDocument,
} from '@/lib/email/template-preview'

type Viewport = 'desktop' | 'mobile'

interface EmailTemplatePreviewProps {
  subject: string
  htmlContent: string
  textContent: string
  variablesText: string
  displayName?: string
  className?: string
}

function parseVariablesList(variablesText: string): string[] {
  return variablesText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export function EmailTemplatePreview({
  subject,
  htmlContent,
  textContent,
  variablesText,
  displayName,
  className,
}: EmailTemplatePreviewProps) {
  const [viewport, setViewport] = React.useState<Viewport>('desktop')

  const explicitVars = React.useMemo(
    () => parseVariablesList(variablesText),
    [variablesText]
  )

  const sampleContext = React.useMemo(
    () => buildSampleContext(explicitVars, subject, htmlContent, textContent),
    [explicitVars, subject, htmlContent, textContent]
  )

  const previewSubject = React.useMemo(
    () => applyTemplateVariables(subject || 'Email subject preview', sampleContext),
    [subject, sampleContext]
  )

  const previewHtml = React.useMemo(() => {
    const body = htmlContent.trim() || '<p style="color:#64748b;font-family:sans-serif;padding:24px;">Start writing your email body to see a preview.</p>'
    return wrapEmailPreviewDocument(applyTemplateVariables(body, sampleContext))
  }, [htmlContent, sampleContext])

  const previewText = React.useMemo(() => {
    const raw = textContent.trim() || stripHtmlToText(htmlContent)
    return applyTemplateVariables(raw || 'Plain text version will appear here.', sampleContext)
  }, [textContent, htmlContent, sampleContext])

  const variableEntries = Object.entries(sampleContext).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
        className
      )}
    >
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Eye className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Live preview</p>
              <p className="text-xs text-muted-foreground">Sample data replaces {'{{variables}}'}</p>
            </div>
          </div>
          <div className="flex rounded-lg border border-border bg-background p-0.5">
            <button
              type="button"
              title="Desktop width"
              className={cn(
                'rounded-md p-1.5 transition-colors',
                viewport === 'desktop'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setViewport('desktop')}
            >
              <Monitor className="size-4" />
            </button>
            <button
              type="button"
              title="Mobile width"
              className={cn(
                'rounded-md p-1.5 transition-colors',
                viewport === 'mobile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setViewport('mobile')}
            >
              <Smartphone className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-[#f4f6f8] px-4 py-3">
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
            <Mail className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Inbox preview
            </span>
          </div>
          <dl className="space-y-2 px-4 py-3 text-sm">
            <div className="grid grid-cols-[4.5rem_1fr] gap-2">
              <dt className="text-xs font-medium text-muted-foreground">From</dt>
              <dd className="truncate font-medium text-foreground">
                Kingdom Deliverance Centre &lt;noreply@kdcuganda.org&gt;
              </dd>
            </div>
            <div className="grid grid-cols-[4.5rem_1fr] gap-2">
              <dt className="text-xs font-medium text-muted-foreground">To</dt>
              <dd className="truncate text-foreground">
                {sampleContext.customer_name ?? 'Jane Mukasa'}{' '}
                &lt;{sampleContext.customer_email ?? 'jane.mukasa@example.com'}&gt;
              </dd>
            </div>
            <div className="grid grid-cols-[4.5rem_1fr] gap-2">
              <dt className="text-xs font-medium text-muted-foreground">Subject</dt>
              <dd className="font-semibold text-foreground">{previewSubject}</dd>
            </div>
            {displayName && (
              <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                <dt className="text-xs font-medium text-muted-foreground">Template</dt>
                <dd className="text-muted-foreground">{displayName}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <Tabs defaultValue="html" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-3 w-auto justify-start">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="text">Plain text</TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="mt-0 flex-1 px-4 pb-4 focus-visible:outline-none">
          <div
            className={cn(
              'mx-auto overflow-hidden rounded-lg border border-border bg-[#e8ecf1] shadow-inner transition-[max-width] duration-200',
              viewport === 'desktop' ? 'max-w-full' : 'max-w-[320px]'
            )}
          >
            <iframe
              title="Email HTML preview"
              sandbox=""
              className="block w-full border-0 bg-transparent"
              style={{ minHeight: 420 }}
              srcDoc={previewHtml}
            />
          </div>
        </TabsContent>

        <TabsContent value="text" className="mt-0 flex-1 px-4 pb-4 focus-visible:outline-none">
          <pre className="max-h-[420px] overflow-auto rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground">
            {previewText}
          </pre>
        </TabsContent>
      </Tabs>

      {variableEntries.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sample values
          </p>
          <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
            {variableEntries.map(([key, value]) => (
              <Badge
                key={key}
                variant="secondary"
                className="max-w-full font-mono text-[10px] font-normal"
                title={value}
              >
                <span className="text-muted-foreground">{`{{${key}}}`}</span>
                <span className="mx-1 text-border">→</span>
                <span className="truncate">{value}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function stripHtmlToText(html: string): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
