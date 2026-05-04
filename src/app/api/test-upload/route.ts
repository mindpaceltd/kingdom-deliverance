import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Temporary debug endpoint — remove after upload is fixed
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('media')
      .insert({
        filename: 'debug-test.jpg',
        url: 'https://example.com/debug.jpg',
        type: 'image',
        mime_type: 'image/jpeg',
        size_bytes: 1000,
        bucket: 'media',
        uploaded_by: null,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code, details: error.details }, { status: 500 })
    }

    // Clean up test record
    await supabase.from('media').delete().eq('id', data.id)

    return NextResponse.json({ ok: true, message: 'Insert and delete succeeded', id: data.id })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
