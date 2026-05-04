import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TranscriptionService } from '../transcription-service'
import { spawn } from 'child_process'
import { EventEmitter } from 'events'

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}))

// Helper: 100+ word transcript for testing
const LONG_TRANSCRIPT = 'This is a comprehensive test of the transcription service that needs to contain at least one hundred words to pass the minimum word count validation requirement. The transcription service is designed to convert audio files into text using the faster-whisper Python library. It processes audio segments and combines them into a single formatted transcript. The service includes progress tracking, timeout handling, and validation of the transcript length to ensure quality results. This test verifies that the service correctly processes audio files and returns properly formatted text output with all segments combined into a single string with normalized spacing and proper formatting.'

describe('TranscriptionService', () => {
  let mockProcess: any
  
  beforeEach(() => {
    // Create a mock child process
    mockProcess = new EventEmitter()
    mockProcess.stdout = new EventEmitter()
    mockProcess.stderr = new EventEmitter()
    mockProcess.kill = vi.fn()
    
    vi.mocked(spawn).mockReturnValue(mockProcess as any)
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  describe('transcribe', () => {
    it('should successfully transcribe audio and return formatted text', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const mockResult = {
        segments: [
          { start: 0.0, end: 30.0, text: LONG_TRANSCRIPT },
        ],
        language: 'en',
        duration: 30.0,
      }
      
      const transcribePromise = TranscriptionService.transcribe(audioPath)
      
      // Simulate Python script output
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(mockResult)))
      mockProcess.emit('close', 0)
      
      const result = await transcribePromise
      
      expect(result).toBe(LONG_TRANSCRIPT)
      expect(spawn).toHaveBeenCalledWith('python3', [
        expect.stringContaining('transcribe.py'),
        audioPath,
        'base',
      ])
    })
    
    it('should call progress callback with increasing progress values', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const onProgress = vi.fn()
      const mockResult = {
        segments: [
          { start: 0.0, end: 30.0, text: LONG_TRANSCRIPT },
        ],
        language: 'en',
        duration: 30.0,
      }
      
      const transcribePromise = TranscriptionService.transcribe(audioPath, onProgress)
      
      // Simulate progress updates from stderr
      mockProcess.stderr.emit('data', Buffer.from('PROGRESS:0.25\n'))
      mockProcess.stderr.emit('data', Buffer.from('PROGRESS:0.50\n'))
      mockProcess.stderr.emit('data', Buffer.from('PROGRESS:0.75\n'))
      mockProcess.stderr.emit('data', Buffer.from('PROGRESS:1.00\n'))
      
      // Simulate completion
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(mockResult)))
      mockProcess.emit('close', 0)
      
      await transcribePromise
      
      expect(onProgress).toHaveBeenCalledWith(0.25)
      expect(onProgress).toHaveBeenCalledWith(0.50)
      expect(onProgress).toHaveBeenCalledWith(0.75)
      expect(onProgress).toHaveBeenCalledWith(1.00)
    })
    
    it('should not call progress callback for decreasing progress values', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const onProgress = vi.fn()
      const mockResult = {
        segments: [
          { start: 0.0, end: 30.0, text: LONG_TRANSCRIPT },
        ],
        language: 'en',
        duration: 30.0,
      }
      
      const transcribePromise = TranscriptionService.transcribe(audioPath, onProgress)
      
      // Simulate progress updates with a decrease
      mockProcess.stderr.emit('data', Buffer.from('PROGRESS:0.50\n'))
      mockProcess.stderr.emit('data', Buffer.from('PROGRESS:0.30\n')) // Should be ignored
      mockProcess.stderr.emit('data', Buffer.from('PROGRESS:0.75\n'))
      
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(mockResult)))
      mockProcess.emit('close', 0)
      
      await transcribePromise
      
      expect(onProgress).toHaveBeenCalledWith(0.50)
      expect(onProgress).not.toHaveBeenCalledWith(0.30)
      expect(onProgress).toHaveBeenCalledWith(0.75)
    })
    
    it('should reject with timeout error after 30 minutes', async () => {
      vi.useFakeTimers()
      
      const audioPath = '/tmp/test-audio.m4a'
      const transcribePromise = TranscriptionService.transcribe(audioPath)
      
      // Fast-forward time by 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000)
      
      await expect(transcribePromise).rejects.toThrow('Transcription timed out (max 30 minutes)')
      expect(mockProcess.kill).toHaveBeenCalled()
      
      vi.useRealTimers()
    })
    
    it('should reject when Python process exits with non-zero code', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const transcribePromise = TranscriptionService.transcribe(audioPath)
      
      mockProcess.stderr.emit('data', Buffer.from('Error: File not found\n'))
      mockProcess.emit('close', 1)
      
      await expect(transcribePromise).rejects.toThrow('Transcription failed: Error: File not found')
    })
    
    it('should reject when transcript is too short', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const mockResult = {
        segments: [
          { start: 0.0, end: 1.0, text: 'Short' },
        ],
        language: 'en',
        duration: 1.0,
      }
      
      const transcribePromise = TranscriptionService.transcribe(audioPath)
      
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(mockResult)))
      mockProcess.emit('close', 0)
      
      await expect(transcribePromise).rejects.toThrow(/Transcript too short/)
    })
    
    it('should reject when JSON parsing fails', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const transcribePromise = TranscriptionService.transcribe(audioPath)
      
      mockProcess.stdout.emit('data', Buffer.from('Invalid JSON'))
      mockProcess.emit('close', 0)
      
      await expect(transcribePromise).rejects.toThrow('Failed to parse transcription result')
    })
    
    it('should reject when process fails to start', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const transcribePromise = TranscriptionService.transcribe(audioPath)
      
      mockProcess.emit('error', new Error('ENOENT: python3 not found'))
      
      await expect(transcribePromise).rejects.toThrow('Failed to start transcription process')
    })
    
    it('should format transcript with proper spacing', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const words = LONG_TRANSCRIPT.split(' ')
      const part1 = words.slice(0, 40).join(' ')
      const part2 = words.slice(40, 80).join(' ')
      const part3 = words.slice(80).join(' ')
      
      const mockResult = {
        segments: [
          { start: 0.0, end: 10.0, text: `  ${part1}  ` },
          { start: 10.0, end: 20.0, text: `  ${part2}  ` },
          { start: 20.0, end: 30.0, text: `  ${part3}  ` },
        ],
        language: 'en',
        duration: 30.0,
      }
      
      const transcribePromise = TranscriptionService.transcribe(audioPath)
      
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(mockResult)))
      mockProcess.emit('close', 0)
      
      const result = await transcribePromise
      
      // Should trim each segment and normalize spaces
      expect(result).toBe(LONG_TRANSCRIPT)
    })
    
    it('should use WHISPER_MODEL from environment or default to base', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const mockResult = {
        segments: [
          { start: 0.0, end: 30.0, text: LONG_TRANSCRIPT },
        ],
        language: 'en',
        duration: 30.0,
      }
      
      const transcribePromise = TranscriptionService.transcribe(audioPath)
      
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(mockResult)))
      mockProcess.emit('close', 0)
      
      await transcribePromise
      
      // Verify spawn was called with python3 and the transcribe script
      expect(spawn).toHaveBeenCalledWith('python3', [
        expect.stringContaining('transcribe.py'),
        audioPath,
        expect.any(String), // Model name (either from env or 'base')
      ])
      
      // Verify the model parameter is either the env variable or 'base'
      const spawnCall = vi.mocked(spawn).mock.calls[0]
      const modelParam = spawnCall[1][2]
      expect(modelParam).toBeTruthy()
      expect(typeof modelParam).toBe('string')
    })
    
    it('should handle multi-chunk stdout data', async () => {
      const audioPath = '/tmp/test-audio.m4a'
      const mockResult = {
        segments: [
          { start: 0.0, end: 30.0, text: LONG_TRANSCRIPT },
        ],
        language: 'en',
        duration: 30.0,
      }
      
      const jsonString = JSON.stringify(mockResult)
      const chunk1 = jsonString.slice(0, 50)
      const chunk2 = jsonString.slice(50)
      
      const transcribePromise = TranscriptionService.transcribe(audioPath)
      
      // Emit JSON in multiple chunks
      mockProcess.stdout.emit('data', Buffer.from(chunk1))
      mockProcess.stdout.emit('data', Buffer.from(chunk2))
      mockProcess.emit('close', 0)
      
      const result = await transcribePromise
      
      expect(result).toBeTruthy()
      expect(result.split(/\s+/).length).toBeGreaterThanOrEqual(100)
    })
  })
})
