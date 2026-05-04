import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OllamaAIService } from '../ollama-ai-service'
import { classifyError, isConnectionError, isTimeoutError } from '../error-classifier'

/**
 * Integration tests for error handling and classification
 * 
 * These tests verify that:
 * 1. Ollama service throws appropriate errors
 * 2. Error classifier correctly identifies error types
 * 3. Errors are properly classified as retryable/non-retryable
 * 
 * Requirements: 5.7, 7.2
 */
describe('Error Handling Integration', () => {
  beforeEach(() => {
    process.env.OLLAMA_ENDPOINT = 'http://localhost:11434'
    process.env.OLLAMA_MODEL = 'mistral'
    vi.clearAllMocks()
  })

  describe('ECONNREFUSED Error Handling', () => {
    it('should handle ECONNREFUSED in generateSummary and classify as retryable', async () => {
      // Simulate ECONNREFUSED error
      const connError = new Error('connect ECONNREFUSED 127.0.0.1:11434')
      global.fetch = vi.fn().mockRejectedValue(connError)
      
      const transcript = 'Sample sermon transcript'
      
      try {
        await OllamaAIService.generateSummary(transcript)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // Verify error message is clear
        expect(error.message).toBe('AI service unavailable. Please ensure Ollama is running.')
        
        // Verify error is classified as retryable
        expect(classifyError(error as Error)).toBe('retryable')
        
        // Verify it's identified as a service unavailable error
        // (The original ECONNREFUSED is transformed to a clearer message)
        expect(error.message).toContain('unavailable')
      }
    })

    it('should handle ECONNREFUSED in generateSEO and classify as retryable', async () => {
      // Simulate ECONNREFUSED error
      const connError = new Error('connect ECONNREFUSED 127.0.0.1:11434')
      global.fetch = vi.fn().mockRejectedValue(connError)
      
      const transcript = 'Sample sermon transcript'
      const summary = 'Sample summary'
      
      try {
        await OllamaAIService.generateSEO(transcript, summary)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // Verify error message is clear
        expect(error.message).toBe('AI service unavailable. Please ensure Ollama is running.')
        
        // Verify error is classified as retryable
        expect(classifyError(error as Error)).toBe('retryable')
        
        // Verify it's identified as a service unavailable error
        // (The original ECONNREFUSED is transformed to a clearer message)
        expect(error.message).toContain('unavailable')
      }
    })

    it('should handle fetch failed error and classify as retryable', async () => {
      // Simulate generic fetch failure
      const fetchError = new Error('fetch failed')
      global.fetch = vi.fn().mockRejectedValue(fetchError)
      
      const transcript = 'Sample sermon transcript'
      
      try {
        await OllamaAIService.generateSummary(transcript)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // Verify error message is clear
        expect(error.message).toBe('AI service unavailable. Please ensure Ollama is running.')
        
        // Verify error is classified as retryable
        expect(classifyError(error as Error)).toBe('retryable')
      }
    })
  })

  describe('Timeout Error Handling', () => {
    it('should handle timeout in generateSummary and classify as retryable', async () => {
      // Simulate AbortError (timeout)
      const timeoutError = Object.assign(
        new Error('The operation was aborted'),
        { name: 'AbortError' }
      )
      global.fetch = vi.fn().mockRejectedValue(timeoutError)
      
      const transcript = 'Sample sermon transcript'
      
      try {
        await OllamaAIService.generateSummary(transcript)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // Verify error message is clear
        expect(error.message).toBe('AI summarization timed out (max 10 minutes)')
        
        // Verify error is classified as retryable
        expect(classifyError(error as Error)).toBe('retryable')
        
        // Verify it's identified as a timeout error
        expect(isTimeoutError(error as Error)).toBe(true)
      }
    })

    it('should handle timeout in generateSEO and classify as retryable', async () => {
      // Simulate AbortError (timeout)
      const timeoutError = Object.assign(
        new Error('The operation was aborted'),
        { name: 'AbortError' }
      )
      global.fetch = vi.fn().mockRejectedValue(timeoutError)
      
      const transcript = 'Sample sermon transcript'
      const summary = 'Sample summary'
      
      try {
        await OllamaAIService.generateSEO(transcript, summary)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // Verify error message is clear
        expect(error.message).toBe('SEO generation timed out (max 5 minutes)')
        
        // Verify error is classified as retryable
        expect(classifyError(error as Error)).toBe('retryable')
        
        // Verify it's identified as a timeout error
        expect(isTimeoutError(error as Error)).toBe(true)
      }
    })
  })

  describe('Non-Retryable Error Handling', () => {
    it('should classify validation errors as non-retryable', async () => {
      // Mock fetch to return a short summary
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: 'Too short'
        })
      })
      
      const transcript = 'Sample sermon transcript'
      
      try {
        await OllamaAIService.generateSummary(transcript)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // Verify error message
        expect(error.message).toMatch(/Generated summary too short/)
        
        // Verify error is classified as non-retryable
        expect(classifyError(error as Error)).toBe('non-retryable')
      }
    })

    it('should classify invalid SEO structure as non-retryable', async () => {
      // Mock fetch to return invalid SEO content
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: JSON.stringify({
            title: 'Title',
            // Missing description and keywords
          })
        })
      })
      
      const transcript = 'Sample sermon transcript'
      const summary = 'Sample summary'
      
      try {
        await OllamaAIService.generateSEO(transcript, summary)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // Verify error message
        expect(error.message).toBe('Invalid SEO content structure')
        
        // Verify error is classified as non-retryable
        expect(classifyError(error as Error)).toBe('non-retryable')
      }
    })

    it('should classify SEO title too long as non-retryable', async () => {
      // Mock fetch to return SEO with title too long
      const longTitle = 'a'.repeat(101)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: JSON.stringify({
            title: longTitle,
            description: 'Description',
            keywords: ['keyword1', 'keyword2']
          })
        })
      })
      
      const transcript = 'Sample sermon transcript'
      const summary = 'Sample summary'
      
      try {
        await OllamaAIService.generateSEO(transcript, summary)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // Verify error message
        expect(error.message).toMatch(/SEO title too long/)
        
        // Verify error is classified as non-retryable
        expect(classifyError(error as Error)).toBe('non-retryable')
      }
    })
  })

  describe('API Error Handling', () => {
    it('should handle API errors and classify as non-retryable', async () => {
      // Mock fetch to return API error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
      
      const transcript = 'Sample sermon transcript'
      
      try {
        await OllamaAIService.generateSummary(transcript)
        expect.fail('Should have thrown an error')
      } catch (error) {
        // Verify error message
        expect(error.message).toBe('Ollama API error: 500 Internal Server Error')
        
        // Verify error is classified as non-retryable
        // (API errors are not in the retryable patterns list)
        expect(classifyError(error as Error)).toBe('non-retryable')
      }
    })
  })

  describe('Error Message Clarity', () => {
    it('should provide clear message for ECONNREFUSED', async () => {
      const connError = new Error('connect ECONNREFUSED 127.0.0.1:11434')
      global.fetch = vi.fn().mockRejectedValue(connError)
      
      const transcript = 'Sample sermon transcript'
      
      await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
        'AI service unavailable. Please ensure Ollama is running.'
      )
    })

    it('should provide clear message for timeout', async () => {
      const timeoutError = Object.assign(
        new Error('The operation was aborted'),
        { name: 'AbortError' }
      )
      global.fetch = vi.fn().mockRejectedValue(timeoutError)
      
      const transcript = 'Sample sermon transcript'
      
      await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
        'AI summarization timed out (max 10 minutes)'
      )
    })

    it('should provide clear message for validation errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: 'Short'
        })
      })
      
      const transcript = 'Sample sermon transcript'
      
      await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
        /Generated summary too short \(\d+ words, min 100 words\)/
      )
    })
  })
})
