import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost || request.headers.get('host') || 'kdcuganda.org'
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '')

  let origin = `${proto}://${host}`
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    origin = configuredSiteUrl || 'https://kdcuganda.org'
  }
  const token_hash = searchParams.get('token_hash')
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'
  const type = searchParams.get('type') // 'recovery', 'signup', etc.

  if (token_hash && type) {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })
    if (!error) {
      const target = next && next !== '/account' ? next : (type === 'recovery' ? '/account/reset-password' : next)
      return NextResponse.redirect(`${origin}${target}`)
    }
  }

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
