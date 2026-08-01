import type { ContentGapMatrix, StrategyReportPayload } from '@/lib/digital-ministry/competitor-intelligence/types'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function heatColor(count: number, max: number) {
  if (!count) return '#f4f4f5'
  const t = Math.min(1, count / Math.max(1, max))
  const r = Math.round(240 - t * 120)
  const g = Math.round(245 - t * 80)
  const b = Math.round(250 - t * 100)
  return `rgb(${r},${g},${b})`
}

function matrixTableHtml(matrix: ContentGapMatrix | undefined) {
  if (!matrix?.topics.length) return ''

  const header = matrix.columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('')
  const rows = matrix.topics
    .map((topic, ri) => {
      const gap = matrix.gapScores[ri] ?? 0
      const gapBadge =
        gap >= 25
          ? `<span style="color:#b45309;font-size:11px;margin-left:6px">gap ${gap}%</span>`
          : ''
      const cells = (matrix.cells[ri] ?? [])
        .map(
          (count) =>
            `<td style="background:${heatColor(count, matrix.maxCount)};text-align:center;padding:6px;font-size:12px">${count || '—'}</td>`
        )
        .join('')
      return `<tr><td style="padding:6px;font-weight:600;font-size:12px">${escapeHtml(topic)}${gapBadge}</td>${cells}</tr>`
    })
    .join('')

  return `
    <h2 style="margin:24px 0 8px;font-size:16px">Content gap matrix</h2>
    <p style="margin:0 0 12px;color:#666;font-size:12px">Topic counts from KDC CMS (30d) vs latest peer captures. Darker cells = more content.</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7">
      <thead><tr><th style="text-align:left;padding:6px;font-size:11px">Topic</th>${header}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

export function formatStrategyReportHtml(
  payload: StrategyReportPayload,
  options?: { downloadUrl?: string; forPrint?: boolean }
) {
  const date = new Date(payload.generatedAt).toLocaleDateString('en-UG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const gaps = payload.contentGaps
    .map(
      (g) => `
      <li style="margin-bottom:12px">
        <strong>[${g.priority}] ${escapeHtml(g.title)}</strong><br/>
        ${escapeHtml(g.description)}<br/>
        <em>Recommendation:</em> ${escapeHtml(g.recommendation)}
      </li>`
    )
    .join('')

  const actions = payload.recommendedActions.map((a) => `<li>${escapeHtml(a)}</li>`).join('')

  const movement = payload.biggestCompetitorMovement
    ? `<p><strong>Peer movement:</strong> ${escapeHtml(payload.biggestCompetitorMovement.name)} — ${escapeHtml(payload.biggestCompetitorMovement.detail)}</p>`
    : ''

  const downloadBlock = options?.downloadUrl
    ? `<p style="margin-top:16px"><a href="${escapeHtml(options.downloadUrl)}" style="color:#115e59">Download print-ready report</a> (use browser Print → Save as PDF)</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>KDC Competitor Intelligence — ${date}</title>
  ${options?.forPrint ? '<style>@media print { body { margin: 0.5in; } }</style>' : ''}
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;color:#18181b;line-height:1.5;max-width:720px;margin:0 auto;padding:24px">
  <h1 style="font-size:22px;margin:0 0 4px">Competitor Intelligence Strategy Report</h1>
  <p style="margin:0 0 20px;color:#71717a;font-size:13px">Kingdom Deliverance Centre Uganda · ${date}</p>

  <h2 style="margin:20px 0 8px;font-size:16px">Executive summary</h2>
  <p>${escapeHtml(payload.executiveSummary)}</p>

  ${movement}
  <p><strong>Biggest KDC opportunity:</strong> ${escapeHtml(payload.biggestKdcOpportunity)}</p>

  <h2 style="margin:20px 0 8px;font-size:16px">Recommended actions</h2>
  <ol>${actions}</ol>

  <h2 style="margin:20px 0 8px;font-size:16px">Content gaps</h2>
  <ul style="padding-left:18px">${gaps}</ul>

  ${matrixTableHtml(payload.contentGapMatrix)}

  <h2 style="margin:20px 0 8px;font-size:16px">KDC strengths</h2>
  <ul>${payload.kdcStrengths.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>

  <h2 style="margin:20px 0 8px;font-size:16px">Areas to improve</h2>
  <ul>${payload.kdcWeaknesses.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>

  ${
    payload.dataLimitations.length
      ? `<h2 style="margin:20px 0 8px;font-size:16px">Data limitations</h2>
  <ul style="color:#92400e">${payload.dataLimitations.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`
      : ''
  }

  ${downloadBlock}
  <hr style="margin:32px 0;border:none;border-top:1px solid #e4e4e7"/>
  <p style="font-size:11px;color:#a1a1aa">Generated from verified public sources and KDC CMS data only — no invented engagement metrics.</p>
</body>
</html>`
}

export function formatStrategyReportText(payload: StrategyReportPayload) {
  const lines = [
    'KDC Competitor Intelligence Strategy Report',
    new Date(payload.generatedAt).toLocaleString(),
    '',
    payload.executiveSummary,
    '',
    `Opportunity: ${payload.biggestKdcOpportunity}`,
    '',
    'Recommended actions:',
    ...payload.recommendedActions.map((a, i) => `${i + 1}. ${a}`),
    '',
    'Content gaps:',
    ...payload.contentGaps.map((g) => `- [${g.priority}] ${g.title}: ${g.recommendation}`),
  ]
  return lines.join('\n')
}
