// Validate required environment variables
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

// Only validate on server-side (not during client-side hydration)
if (typeof window === 'undefined') {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `[env] Missing required environment variable: ${key}. ` +
        `Check your .env.local file.`
      )
    }
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

// AI Processor environment variables (optional)
const aiProcessorVars = [
  'GEMINI_API_KEY',
] as const

// Only warn on server-side
if (typeof window === 'undefined') {
  for (const key of aiProcessorVars) {
    if (!process.env[key]) {
      console.warn(
        `[env] Missing AI processor environment variable: ${key}. ` +
        `AI link processing will be disabled. Check your .env.local file.`
      )
    }
  }
}

export const aiProcessorEnv = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  processingTimeoutMs: parseInt(process.env.AI_PROCESSING_TIMEOUT_MS || '600000'),
  rateLimitPerHour: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '5'),
}

// Feature flag: AI processor is enabled only if API key is present
export const isAIProcessorEnabled = !!aiProcessorEnv.geminiApiKey
