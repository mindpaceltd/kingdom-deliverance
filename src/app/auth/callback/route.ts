import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'
  const type = searchParams.get('type') // 'recovery' for password reset

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Password reset flow — send to the requested reset page or default to customer reset page
      if (type === 'recovery') {
        const resetDestination = next && next !== '/account' ? next : '/account/reset-password'
        return NextResponse.redirect(`${origin}${resetDestination}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  const failureLogin = next?.startsWith('/admin') ? '/admin/login' : '/account/login'
  return NextResponse.redirect(`${origin}${failureLogin}?error=auth-callback-failed`)
}
