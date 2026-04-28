/**
 * Utility to handle fetch requests to a self-hosted Supabase instance.
 * In Node.js environment (Server Components/Actions), it bypasses self-signed certificate checks.
 * In Edge environment (Middleware), it falls back to standard fetch.
 */
export const fetchWithInsecure = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const https = await import('https')
      const agent = new https.Agent({ rejectUnauthorized: false })
      return fetch(input, { ...init, ...(agent ? { agent } : {}) } as any)
    } catch (e) {
      console.error('Failed to load https module in Node.js runtime:', e)
    }
  }

  // Fallback for Edge Runtime or Browser
  return fetch(input, init)
}
