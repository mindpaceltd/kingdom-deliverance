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

// Queue Processor environment variables (optional)
const queueProcessorVars = [
  'REDIS_URL',
  'OLLAMA_ENDPOINT',
  'WHISPER_MODEL',
] as const

// Only warn on server-side
if (typeof window === 'undefined') {
  for (const key of queueProcessorVars) {
    if (!process.env[key]) {
      console.warn(
        `[env] Missing queue processor environment variable: ${key}. ` +
        `Queue processing will be disabled. Check your .env.local file.`
      )
    }
  }
}

export const queueProcessorEnv = {
  redisUrl: process.env.REDIS_URL || '',
  ollamaEndpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'mistral',
  whisperModel: process.env.WHISPER_MODEL || 'base',
  tempAudioDir: process.env.TEMP_AUDIO_DIR || '/tmp/sermon-audio',
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '1'),
  maxActiveJobs: parseInt(process.env.MAX_ACTIVE_JOBS || '10'),
  audioExtractionTimeoutMs: parseInt(process.env.AUDIO_EXTRACTION_TIMEOUT_MS || '600000'),
  transcriptionTimeoutMs: parseInt(process.env.TRANSCRIPTION_TIMEOUT_MS || '1800000'),
  aiSummaryTimeoutMs: parseInt(process.env.AI_SUMMARY_TIMEOUT_MS || '600000'),
  aiSeoTimeoutMs: parseInt(process.env.AI_SEO_TIMEOUT_MS || '300000'),
  jobTimeoutMs: parseInt(process.env.JOB_TIMEOUT_MS || '3600000'),
  rateLimitPerHour: parseInt(process.env.QUEUE_RATE_LIMIT_PER_HOUR || '10'),
}

// Feature flag: Queue processor is enabled only if Redis and Ollama are configured
export const isQueueProcessorEnabled = !!(
  queueProcessorEnv.redisUrl &&
  queueProcessorEnv.ollamaEndpoint
)
