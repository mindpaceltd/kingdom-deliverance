import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// API route fallback for media record creation
// Used when the server action fails (e.g. CSRF issues in production)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { filename, url, type, mime_type, size_bytes, bucket, uploaded_by } = body

    if (!filename || !url || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('media')
      .insert({
        filename,
        url,
        type,
        mime_type: mime_type ?? 'application/octet-stream',
        size_bytes: size_bytes ?? null,
        bucket: bucket ?? 'media',
        uploaded_by: uploaded_by ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[POST /api/media]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[POST /api/media] unexpected:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
