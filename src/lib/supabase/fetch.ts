import https from 'https'

/**
 * Self-hosted Supabase uses a self-signed cert — disable TLS verification on Node.js side.
 * In production with a valid cert, you can remove this or set rejectUnauthorized to true.
 */
export const fetchWithInsecure = (input: RequestInfo | URL, init?: RequestInit) => {
  const agent = new https.Agent({ rejectUnauthorized: false })
  return fetch(input, { ...init, ...(agent ? { agent } : {}) } as RequestInit)
}
