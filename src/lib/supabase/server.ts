import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Self-hosted Supabase uses a self-signed cert — disable TLS verification on Node.js side.
// In production with a valid cert, remove this.
const fetchWithInsecure = (input: RequestInfo | URL, init?: RequestInit) => {
  const https = require('https')
  const agent = new https.Agent({ rejectUnauthorized: false })
  return fetch(input, { ...init, ...(agent ? { agent } : {}) } as RequestInit)
}

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Bypass self-signed SSL on server side
        fetch: fetchWithInsecure,
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Admin client with service role key — bypasses RLS.
 * ONLY use in Server Actions, API routes, or server-side code. Never expose to the client.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: fetchWithInsecure,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
