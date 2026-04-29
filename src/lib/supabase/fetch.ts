/**
 * Secure fetch helper for Supabase requests.
 * TLS verification remains enabled in all environments.
 */
export const fetchWithInsecure = async (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, init)
}
