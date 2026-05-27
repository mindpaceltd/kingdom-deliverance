/** Sample values for live email template preview in admin. */
export const EMAIL_TEMPLATE_SAMPLE_VALUES: Record<string, string> = {
  customer_name: 'Jane Mukasa',
  customer_email: 'jane.mukasa@example.com',
  order_number: 'KDC-10482',
  order_id: 'KDC-10482',
  total_amount: '189,000',
  total: '189,000',
  currency: 'UGX',
  order_link: 'https://kdcuganda.org/shop/orders/KDC-10482',
  tracking_number: 'UG-TRK-8839201',
  refund_amount: '45,000',
  product_name: 'Deliverance Prayer Guide (PDF)',
  download_link: 'https://kdcuganda.org/download/example-token',
  days_valid: '7',
  max_downloads: '3',
  payment_method: 'Mobile Money (Pesapal)',
  site_name: 'Kingdom Deliverance Centre',
  site_url: 'https://kdcuganda.org',
  support_email: 'info@kdcuganda.org',
  admin_name: 'KDC Admin',
  message: 'Your prayer request has been received. Our team will respond within 48 hours.',
}

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export function parseTemplateVariables(text: string): string[] {
  const found = new Set<string>()
  let match: RegExpExecArray | null
  const re = new RegExp(VARIABLE_PATTERN.source, 'g')
  while ((match = re.exec(text)) !== null) {
    found.add(match[1])
  }
  return [...found]
}

export function sampleValueForVariable(name: string): string {
  const key = name.trim()
  if (!key) return ''
  if (EMAIL_TEMPLATE_SAMPLE_VALUES[key]) return EMAIL_TEMPLATE_SAMPLE_VALUES[key]
  const label = key.replace(/_/g, ' ')
  return `[${label}]`
}

export function buildSampleContext(
  explicitVariables: string[],
  ...texts: string[]
): Record<string, string> {
  const names = new Set<string>(explicitVariables.map((v) => v.trim()).filter(Boolean))
  for (const text of texts) {
    for (const name of parseTemplateVariables(text)) {
      names.add(name)
    }
  }
  const context: Record<string, string> = {}
  for (const name of names) {
    context[name] = sampleValueForVariable(name)
  }
  return context
}

export function applyTemplateVariables(
  template: string,
  context: Record<string, string>
): string {
  if (!template) return ''
  return template.replace(VARIABLE_PATTERN, (_, name: string) => {
    return context[name] ?? sampleValueForVariable(name)
  })
}

export function wrapEmailPreviewDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #e8ecf1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .preview-shell { padding: 20px 12px 28px; min-height: 100%; box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="preview-shell">${bodyHtml}</div>
</body>
</html>`
}
