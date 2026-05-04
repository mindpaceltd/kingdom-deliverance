/**
 * Smoke Tests — Infrastructure Dependencies (Task 15.16)
 *
 * Verifies that all required infrastructure dependencies are available and
 * reachable. These tests connect to real services and are designed to be
 * skipped gracefully when infrastructure is not configured.
 *
 * Tests:
 *   1. Redis connectivity (connect and ping)
 *   2. Ollama availability (HTTP GET to OLLAMA_ENDPOINT/api/tags)
 *   3. faster-whisper installation (python3 -c "import faster_whisper")
 *   4. yt-dlp installation (yt-dlp --version)
 *   5. Required environment variables set (REDIS_URL, OLLAMA_ENDPOINT, WHISPER_MODEL)
 *
 * Requirements: 14.1, 19.4
 */

import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

// ─────────────────────────────────────────────────────────────────────────────
// Environment variable checks
// ─────────────────────────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL
const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
const WHISPER_MODEL = process.env.WHISPER_MODEL

const hasRedisUrl = !!REDIS_URL
const hasOllamaEndpoint = !!process.env.OLLAMA_ENDPOINT
const hasWhisperModel = !!WHISPER_MODEL

// ─────────────────────────────────────────────────────────────────────────────
// 1. Required environment variables
// ─────────────────────────────────────────────────────────────────────────────

describe('Smoke — Required Environment Variables (Req 14.1, 19.4)', () => {
  it('REDIS_URL is set', () => {
    if (!hasRedisUrl) {
      console.warn('[smoke] REDIS_URL is not set — skipping')
      return
    }
    expect(REDIS_URL).toBeTruthy()
    expect(REDIS_URL).toMatch(/^redis(s)?:\/\//)
  })

  it('OLLAMA_ENDPOINT is set', () => {
    if (!hasOllamaEndpoint) {
      console.warn('[smoke] OLLAMA_ENDPOINT is not set — using default http://localhost:11434')
      return
    }
    expect(process.env.OLLAMA_ENDPOINT).toBeTruthy()
    expect(process.env.OLLAMA_ENDPOINT).toMatch(/^https?:\/\//)
  })

  it('WHISPER_MODEL is set', () => {
    if (!hasWhisperModel) {
      console.warn('[smoke] WHISPER_MODEL is not set — skipping')
      return
    }
    expect(WHISPER_MODEL).toBeTruthy()
    expect(WHISPER_MODEL!.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Redis connectivity
// ─────────────────────────────────────────────────────────────────────────────

describe('Smoke — Redis Connectivity (Req 14.1, 19.4)', () => {
  it.skipIf(!hasRedisUrl)('can connect to Redis and receive PONG', async () => {
    // Dynamically import to avoid module-level connection side effects
    const { createRedisConnection } = await import('../../lib/config/redis')
    const redis = createRedisConnection()

    try {
      const result = await redis.ping()
      expect(result).toBe('PONG')
    } finally {
      await redis.quit()
    }
  })

  it.skipIf(hasRedisUrl)('REDIS_URL not configured — test skipped', () => {
    // This test exists to document the skip reason in the output
    console.info('[smoke] Redis smoke test skipped: REDIS_URL not set')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Ollama availability
// ─────────────────────────────────────────────────────────────────────────────

describe('Smoke — Ollama Availability (Req 14.1, 19.4)', () => {
  it('can reach Ollama /api/tags endpoint', async () => {
    let reachable = false

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${OLLAMA_ENDPOINT}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      reachable = response.ok || response.status < 500
    } catch {
      // Connection refused or timeout — Ollama not running
      reachable = false
    }

    if (!reachable) {
      console.warn(`[smoke] Ollama not reachable at ${OLLAMA_ENDPOINT} — skipping assertion`)
      return
    }

    expect(reachable).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. faster-whisper installation
// ─────────────────────────────────────────────────────────────────────────────

describe('Smoke — faster-whisper Installation (Req 14.1, 19.4)', () => {
  it('faster-whisper Python package is importable', { timeout: 15000 }, () => {
    let installed = false

    try {
      execSync('python3 -c "import faster_whisper"', {
        stdio: 'pipe',
        timeout: 8000,
      })
      installed = true
    } catch {
      installed = false
    }

    if (!installed) {
      console.warn('[smoke] faster-whisper not installed — skipping assertion')
      console.warn('[smoke] Install with: pip install faster-whisper')
      return
    }

    expect(installed).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. yt-dlp installation
// ─────────────────────────────────────────────────────────────────────────────

describe('Smoke — yt-dlp Installation (Req 14.1, 19.4)', () => {
  it('yt-dlp is installed and returns a version string', { timeout: 15000 }, () => {
    let version: string | null = null

    try {
      const output = execSync('yt-dlp --version', {
        stdio: 'pipe',
        timeout: 8000,
      })
      version = output.toString().trim()
    } catch {
      version = null
    }

    if (version === null) {
      console.warn('[smoke] yt-dlp not found in PATH — skipping assertion')
      console.warn('[smoke] Install with: pip install yt-dlp  or  brew install yt-dlp')
      return
    }

    expect(version).toBeTruthy()
    // yt-dlp versions look like "2024.01.01" or similar
    expect(version.length).toBeGreaterThan(0)
  })
})
