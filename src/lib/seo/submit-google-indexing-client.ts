export type SubmitGoogleIndexingResult =
  | { ok: true; submitted: number; failed: number; message: string }
  | { ok: false; message: string; needsReauth?: boolean; hint?: string }

export async function submitGoogleIndexing(
  urls: string[]
): Promise<SubmitGoogleIndexingResult> {
  if (urls.length === 0) {
    return { ok: false, message: 'No URLs to submit.' }
  }

  const res = await fetch('/api/google/search-console/index-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  })

  const data = await res.json().catch(() => ({}))

  if (data.needsReauth) {
    return {
      ok: false,
      needsReauth: true,
      message: data.error || 'Reconnect Google to enable URL indexing.',
      hint: data.hint,
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      message: data.error || 'Indexing request failed.',
      hint: data.hint,
    }
  }

  const submitted = Number(data.submitted ?? 0)
  const failed = Number(data.failed ?? 0)

  if (submitted === 0) {
    const firstError =
      data.results?.find((r: { success?: boolean; error?: string }) => !r.success)?.error ||
      data.error
    return {
      ok: false,
      message: firstError || 'Google accepted 0 URLs. Check Search Console property and API setup.',
      hint: data.hint,
    }
  }

  const message =
    failed > 0
      ? `Submitted ${submitted} URL(s); ${failed} failed.`
      : `Submitted ${submitted} URL(s) to Google for indexing.`

  return { ok: true, submitted, failed, message }
}
