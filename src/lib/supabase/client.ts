import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

/** Single browser Supabase client — multiple instances contend for the auth storage lock. */
export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  clientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return clientInstance
}

let sessionReadInFlight: ReturnType<
  ReturnType<typeof createBrowserClient>['auth']['getSession']
> | null = null

/** Deduplicated session read for client UI (avoids parallel getUser() lock steals). */
export function getBrowserSession() {
  const supabase = createClient()
  if (!sessionReadInFlight) {
    sessionReadInFlight = supabase.auth.getSession().finally(() => {
      sessionReadInFlight = null
    })
  }
  return sessionReadInFlight
}
