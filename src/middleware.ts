import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Start with a pass-through response so cookies can be mutated below.
  let supabaseResponse = NextResponse.next({ request })

  // Create a Supabase client that reads/writes cookies on the request/response.
  // The setAll implementation ensures refreshed session tokens are forwarded to
  // the browser on every response (Requirement 12.1, 12.2).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies onto the request first (for downstream middleware)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Re-create the response so it carries the mutated request cookies
          supabaseResponse = NextResponse.next({ request })
          // Then write the same cookies onto the response so the browser receives them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() validates the JWT with Supabase Auth and refreshes the
  // session token if it is near expiry. This must be called before any redirect
  // logic so that the refreshed cookies are always set on the response.
  // (Requirements 1.1, 1.7, 12.1, 12.2)
  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  // Unauthenticated request to a protected admin route → redirect to login,
  // preserving the original path in `redirectTo` so the user lands back after
  // signing in. (Requirements 1.1, 1.7)
  if (isAdminRoute && !isLoginPage && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated user visiting the login page → redirect to dashboard.
  // (Requirement 1.2)
  if (isLoginPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // Pass through with the (potentially refreshed) session cookies.
  return supabaseResponse
}

export const config = {
  // Only run middleware on admin routes (excluding the login page itself
  // to prevent redirect loops).
  matcher: ['/admin', '/admin/((?!login).*)'],
}
