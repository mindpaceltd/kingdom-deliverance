import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProcessingLog, updateProcessingLog, checkRateLimit } from '../processing-log'

// Mock the Supabase admin client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

// Mock the environment configuration
vi.mock('@/lib/env', () => ({
  aiProcessorEnv: {
    rateLimitPerHour: 5,
  },
}))

describe('createProcessingLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a processing log entry and return the ID', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'log-123' },
        error: null,
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    const logId = await createProcessingLog('user-123', 'https://youtube.com/watch?v=abc', 'pending')

    expect(logId).toBe('log-123')
    expect(mockSupabase.from).toHaveBeenCalledWith('processing_logs')
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      link_url: 'https://youtube.com/watch?v=abc',
      status: 'pending',
    })
    expect(mockSupabase.select).toHaveBeenCalledWith('id')
    expect(mockSupabase.single).toHaveBeenCalled()
  })

  it('should throw an error if database insert fails', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    await expect(
      createProcessingLog('user-123', 'https://youtube.com/watch?v=abc', 'pending')
    ).rejects.toThrow('Failed to create processing log: Database error')
  })

  it('should throw an error if no ID is returned', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    await expect(
      createProcessingLog('user-123', 'https://youtube.com/watch?v=abc', 'pending')
    ).rejects.toThrow('Failed to create processing log: No ID returned')
  })
})

describe('updateProcessingLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update processing log with status only', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    await updateProcessingLog('log-123', 'processing')

    expect(mockSupabase.from).toHaveBeenCalledWith('processing_logs')
    expect(mockSupabase.update).toHaveBeenCalledWith({
      status: 'processing',
    })
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'log-123')
  })

  it('should update processing log with status and error message', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    await updateProcessingLog('log-123', 'failed', 'Transcription failed')

    expect(mockSupabase.update).toHaveBeenCalledWith({
      status: 'failed',
      error_message: 'Transcription failed',
    })
  })

  it('should update processing log with status, error message, and duration', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    await updateProcessingLog('log-123', 'completed', undefined, 5000)

    expect(mockSupabase.update).toHaveBeenCalledWith({
      status: 'completed',
      duration_ms: 5000,
    })
  })

  it('should throw an error if database update fails', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    await expect(
      updateProcessingLog('log-123', 'completed')
    ).rejects.toThrow('Failed to update processing log: Update failed')
  })
})

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true if user has not exceeded rate limit', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        count: 3,
        error: null,
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    const canProcess = await checkRateLimit('user-123')

    expect(canProcess).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('processing_logs')
    expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', expect.any(String))
  })

  it('should return false if user has reached rate limit', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        count: 5,
        error: null,
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    const canProcess = await checkRateLimit('user-123')

    expect(canProcess).toBe(false)
  })

  it('should return false if user has exceeded rate limit', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        count: 6,
        error: null,
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    const canProcess = await checkRateLimit('user-123')

    expect(canProcess).toBe(false)
  })

  it('should return true if count is null (no records found)', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        count: null,
        error: null,
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    const canProcess = await checkRateLimit('user-123')

    expect(canProcess).toBe(true)
  })

  it('should throw an error if database query fails', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        count: null,
        error: { message: 'Query failed' },
      }),
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

    await expect(
      checkRateLimit('user-123')
    ).rejects.toThrow('Failed to check rate limit: Query failed')
  })
})
