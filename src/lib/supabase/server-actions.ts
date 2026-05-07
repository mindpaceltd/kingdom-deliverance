import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Admin client — bypasses RLS via service role key.
 * ONLY use in Server Actions or API routes. Never expose to browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
