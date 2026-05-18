import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  await supabase.auth.signOut()

  const origin = new URL(request.url).origin
  return NextResponse.redirect(new URL('/account/login', origin), { status: 302 })
}

// Also handle GET in case a link is used
export async function GET(request: NextRequest) {
  return POST(request)
}
