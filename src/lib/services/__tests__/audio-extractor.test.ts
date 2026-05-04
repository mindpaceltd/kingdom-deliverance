/**
 * Unit Tests for AudioExtractor Service
 *
 * Tests audio file naming pattern, duration validation, cleanup, and error handling.
 * Validates Requirements 3.4, 3.8, 19.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'

// ── Hoisted mocks (must be declared before vi.mock factories) ─────────────────

const { mockExecAsync, mockUnlink, mockAccess } = vi.hoisted(() => ({
  mockExecAsync: vi.fn(),
  mockUnlink: vi.fn(),
  mockAccess: vi.fn(),
}))

// Mock util so that promisify always returns our controlled execAsync
vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecAsync),
}))

// Mock child_process (exec itself is not called directly; promisify wraps it)
vi.mock('child_process', () => ({
  exec: vi.fn(),
}))

// Mock fs/promises
vi.mock('fs/promises', () => ({
  unlink: mockUnlink,
  access: mockAccess,
}))

// Import after mocks are set up
import { AudioExtractor } from '../audio-extractor'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a fake ffprobe stdout for a given duration in seconds */
function ffprobeOutput(seconds: number): { stdout: string; stderr: string } {
  return { stdout: `${seconds}\n`, stderr: '' }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('AudioExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: access resolves (file exists), unlink resolves
    mockAccess.mockResolvedValue(undefined)
    mockUnlink.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── 1. Audio file naming pattern ─────────────────────────────────────────────

  describe('extractAudio – file naming pattern', () => {
    it('should save audio file with pattern {jobId}_{timestamp}.m4a', async () => {
      const jobId = 'job-abc123'
      const beforeCall = Date.now()

      // yt-dlp succeeds, ffprobe returns 1-hour video (valid)
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // yt-dlp
        .mockResolvedValueOnce(ffprobeOutput(3600))        // ffprobe

      const outputPath = await AudioExtractor.extractAudio(
        'https://youtube.com/watch?v=test',
        jobId,
      )

      const afterCall = Date.now()
      const filename = path.basename(outputPath)

      // Filename must match {jobId}_{timestamp}.m4a
      expect(filename).toMatch(/^job-abc123_\d+\.m4a$/)

      // Extract the timestamp from the filename and verify it's plausible
      const timestampStr = filename.replace(`${jobId}_`, '').replace('.m4a', '')
      const timestamp = parseInt(timestampStr, 10)
      expect(timestamp).toBeGreaterThanOrEqual(beforeCall)
      expect(timestamp).toBeLessThanOrEqual(afterCall)
    })

    it('should place the file inside the TEMP_DIR directory', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce(ffprobeOutput(1800))

      const outputPath = await AudioExtractor.extractAudio(
        'https://youtube.com/watch?v=test',
        'job-xyz',
      )

      const expectedDir = process.env.TEMP_AUDIO_DIR || '/tmp/sermon-audio'
      expect(outputPath.startsWith(expectedDir)).toBe(true)
    })
  })

  // ── 2. Duration validation – videos > 3 hours rejected ───────────────────────

  describe('validateDuration – duration > 3 hours', () => {
    it('should reject a video that is exactly 3 hours and 1 second (10801 s)', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // yt-dlp
        .mockResolvedValueOnce(ffprobeOutput(10801))       // ffprobe: 3h 0m 1s

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=long', 'job-long'),
      ).rejects.toThrow(/Video too long/)
    })

    it('should reject a video that is 4 hours (14400 s)', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce(ffprobeOutput(14400))

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=long', 'job-long'),
      ).rejects.toThrow(/Video too long/)
    })

    it('error message should include the actual duration in hours', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce(ffprobeOutput(14400)) // 4 hours

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=long', 'job-long'),
      ).rejects.toThrow(/4\.0 hours/)
    })
  })

  // ── 3. Duration validation – videos <= 3 hours pass ──────────────────────────

  describe('validateDuration – duration <= 3 hours', () => {
    it('should accept a video that is exactly 3 hours (10800 s)', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce(ffprobeOutput(10800)) // exactly 3 h

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=ok', 'job-ok'),
      ).resolves.toMatch(/\.m4a$/)
    })

    it('should accept a typical 30-minute sermon (1800 s)', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce(ffprobeOutput(1800))

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=sermon', 'job-sermon'),
      ).resolves.toMatch(/\.m4a$/)
    })

    it('should accept a very short video (60 s)', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce(ffprobeOutput(60))

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=short', 'job-short'),
      ).resolves.toMatch(/\.m4a$/)
    })
  })

  // ── 4. Cleanup – deleteAudioFile calls unlink with correct path ───────────────

  describe('deleteAudioFile', () => {
    it('should call unlink with the exact audio path provided', async () => {
      const audioPath = '/tmp/sermon-audio/job-123_1700000000000.m4a'

      await AudioExtractor.deleteAudioFile(audioPath)

      expect(mockUnlink).toHaveBeenCalledOnce()
      expect(mockUnlink).toHaveBeenCalledWith(audioPath)
    })

    it('should not throw when unlink fails (file already deleted)', async () => {
      mockUnlink.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'))

      await expect(
        AudioExtractor.deleteAudioFile('/tmp/sermon-audio/missing.m4a'),
      ).resolves.toBeUndefined()
    })

    it('should clean up the file after a successful extraction', async () => {
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce(ffprobeOutput(1800))

      const outputPath = await AudioExtractor.extractAudio(
        'https://youtube.com/watch?v=cleanup',
        'job-cleanup',
      )

      // Simulate the worker calling deleteAudioFile after transcription
      await AudioExtractor.deleteAudioFile(outputPath)

      expect(mockUnlink).toHaveBeenCalledWith(outputPath)
    })
  })

  // ── 5–7. Error handling ───────────────────────────────────────────────────────

  describe('extractAudio – error handling', () => {
    it('should throw an error containing "private or unavailable" for private videos', async () => {
      mockExecAsync.mockRejectedValueOnce(
        new Error("ERROR: Private video. Sign in if you've been granted access to this video"),
      )

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=private', 'job-priv'),
      ).rejects.toThrow(/private or unavailable/)
    })

    it('should throw an error containing "timed out" when extraction times out', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Command failed: timeout'))

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=slow', 'job-slow'),
      ).rejects.toThrow(/timed out/)
    })

    it('should throw an error containing "not found or region-blocked" for unavailable videos', async () => {
      mockExecAsync.mockRejectedValueOnce(
        new Error('ERROR: Video unavailable. This video is not available in your country.'),
      )

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=blocked', 'job-blocked'),
      ).rejects.toThrow(/not found or region-blocked/)
    })

    it('should clean up partial download on any extraction error', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=fail', 'job-fail'),
      ).rejects.toThrow()

      // unlink should have been called to clean up the partial file
      expect(mockUnlink).toHaveBeenCalled()
    })

    it('should wrap unknown errors with a generic message', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Some unexpected error'))

      await expect(
        AudioExtractor.extractAudio('https://youtube.com/watch?v=unknown', 'job-unknown'),
      ).rejects.toThrow(/Failed to download audio/)
    })
  })
})
