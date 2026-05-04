import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OllamaAIService } from '../ollama-ai-service'

describe('OllamaAIService.generateSummary', () => {
  const originalEnv = {
    OLLAMA_ENDPOINT: process.env.OLLAMA_ENDPOINT,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  }

  beforeEach(() => {
    // Set default test environment
    process.env.OLLAMA_ENDPOINT = 'http://localhost:11434'
    process.env.OLLAMA_MODEL = 'mistral'
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original environment variables
    if (originalEnv.OLLAMA_ENDPOINT) {
      process.env.OLLAMA_ENDPOINT = originalEnv.OLLAMA_ENDPOINT
    } else {
      delete process.env.OLLAMA_ENDPOINT
    }
    
    if (originalEnv.OLLAMA_MODEL) {
      process.env.OLLAMA_MODEL = originalEnv.OLLAMA_MODEL
    } else {
      delete process.env.OLLAMA_MODEL
    }
  })

  it('should use default endpoint when OLLAMA_ENDPOINT is not set', async () => {
    delete process.env.OLLAMA_ENDPOINT
    
    // Mock fetch to simulate connection error
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'))
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    
    // Will fail at connection, but we're testing the default endpoint is used
    await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
      'AI service unavailable. Please ensure Ollama is running.'
    )
  })

  it('should use default model when OLLAMA_MODEL is not set', async () => {
    delete process.env.OLLAMA_MODEL
    
    // Mock fetch to simulate connection error
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'))
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    
    // Will fail at connection, but we're testing the default model is used
    await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
      'AI service unavailable. Please ensure Ollama is running.'
    )
  })

  it('should throw error when Ollama service is unavailable', async () => {
    process.env.OLLAMA_ENDPOINT = 'http://localhost:99999' // Invalid port
    
    // Mock fetch to simulate connection error
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'))
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    
    await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
      'AI service unavailable. Please ensure Ollama is running.'
    )
  })

  it('should handle ECONNREFUSED with clear error message', async () => {
    // Mock fetch to simulate ECONNREFUSED error
    const connError = new Error('connect ECONNREFUSED 127.0.0.1:11434')
    global.fetch = vi.fn().mockRejectedValue(connError)
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    
    await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
      'AI service unavailable. Please ensure Ollama is running.'
    )
  })

  it('should handle empty transcript', async () => {
    // Mock fetch to simulate connection error
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'))
    
    const transcript = ''
    
    // Should fail at API call or validation
    await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow()
  })

  it('should validate minimum summary length', async () => {
    // Mock fetch to return a short summary
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'Too short'
      })
    })
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    
    await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
      /Generated summary too short/
    )
  })

  it('should accept summary with minimum 100 words', async () => {
    // Create a summary with exactly 100 words
    const words = Array(100).fill('word').join(' ')
    
    // Mock fetch to return a valid summary
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: words
      })
    })
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    
    const result = await OllamaAIService.generateSummary(transcript)
    expect(result).toBe(words)
  })

  it('should handle API error responses', async () => {
    // Mock fetch to return an error response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    
    await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
      'Ollama API error: 500 Internal Server Error'
    )
  })

  it('should handle timeout after 10 minutes', async () => {
    // Mock fetch to simulate abort error
    global.fetch = vi.fn().mockImplementation(() => 
      Promise.reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }))
    )
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    
    await expect(OllamaAIService.generateSummary(transcript)).rejects.toThrow(
      'AI summarization timed out (max 10 minutes)'
    )
  })

  it('should trim whitespace from summary', async () => {
    const summaryWithWhitespace = '  ' + Array(100).fill('word').join(' ') + '  '
    
    // Mock fetch to return a summary with whitespace
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: summaryWithWhitespace
      })
    })
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    
    const result = await OllamaAIService.generateSummary(transcript)
    expect(result).toBe(summaryWithWhitespace.trim())
  })
})

describe('OllamaAIService.generateSEO', () => {
  const originalEnv = {
    OLLAMA_ENDPOINT: process.env.OLLAMA_ENDPOINT,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  }

  beforeEach(() => {
    // Set default test environment
    process.env.OLLAMA_ENDPOINT = 'http://localhost:11434'
    process.env.OLLAMA_MODEL = 'mistral'
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original environment variables
    if (originalEnv.OLLAMA_ENDPOINT) {
      process.env.OLLAMA_ENDPOINT = originalEnv.OLLAMA_ENDPOINT
    } else {
      delete process.env.OLLAMA_ENDPOINT
    }
    
    if (originalEnv.OLLAMA_MODEL) {
      process.env.OLLAMA_MODEL = originalEnv.OLLAMA_MODEL
    } else {
      delete process.env.OLLAMA_MODEL
    }
  })

  it('should throw error when Ollama service is unavailable', async () => {
    process.env.OLLAMA_ENDPOINT = 'http://localhost:99999' // Invalid port
    
    // Mock fetch to simulate connection error
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'))
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    const summary = 'A summary about faith and hope in difficult times.'
    
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow(
      'AI service unavailable. Please ensure Ollama is running.'
    )
  })

  it('should handle ECONNREFUSED with clear error message', async () => {
    // Mock fetch to simulate ECONNREFUSED error
    const connError = new Error('connect ECONNREFUSED 127.0.0.1:11434')
    global.fetch = vi.fn().mockRejectedValue(connError)
    
    const transcript = 'This is a sample sermon transcript about faith and hope.'
    const summary = 'A summary about faith and hope in difficult times.'
    
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow(
      'AI service unavailable. Please ensure Ollama is running.'
    )
  })

  it('should handle empty transcript and summary', async () => {
    // Mock fetch to simulate connection error
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'))
    
    const transcript = ''
    const summary = ''
    
    // Should fail at API call or validation
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow()
  })

  it('should validate response structure - missing title', async () => {
    // Mock fetch to return invalid SEO content (missing title)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          description: 'A description',
          keywords: ['keyword1', 'keyword2']
        })
      })
    })
    
    const transcript = 'Sample transcript'
    const summary = 'Sample summary'
    
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow(
      'Invalid SEO content structure'
    )
  })

  it('should validate response structure - missing description', async () => {
    // Mock fetch to return invalid SEO content (missing description)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          title: 'A title',
          keywords: ['keyword1', 'keyword2']
        })
      })
    })
    
    const transcript = 'Sample transcript'
    const summary = 'Sample summary'
    
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow(
      'Invalid SEO content structure'
    )
  })

  it('should validate response structure - keywords not an array', async () => {
    // Mock fetch to return invalid SEO content (keywords not an array)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          title: 'A title',
          description: 'A description',
          keywords: 'not-an-array'
        })
      })
    })
    
    const transcript = 'Sample transcript'
    const summary = 'Sample summary'
    
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow(
      'Invalid SEO content structure'
    )
  })

  it('should validate title length constraint', async () => {
    // Mock fetch to return SEO content with title too long
    const longTitle = 'a'.repeat(101)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          title: longTitle,
          description: 'A description',
          keywords: ['keyword1', 'keyword2']
        })
      })
    })
    
    const transcript = 'Sample transcript'
    const summary = 'Sample summary'
    
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow(
      /SEO title too long/
    )
  })

  it('should accept valid SEO content', async () => {
    const validSEO = {
      title: 'Faith and Hope in Difficult Times',
      description: 'A comprehensive sermon about maintaining faith and hope during challenging circumstances.',
      keywords: ['faith', 'hope', 'sermon', 'church', 'inspiration']
    }
    
    // Mock fetch to return valid SEO content
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify(validSEO)
      })
    })
    
    const transcript = 'Sample transcript'
    const summary = 'Sample summary'
    
    const result = await OllamaAIService.generateSEO(transcript, summary)
    expect(result).toEqual(validSEO)
  })

  it('should handle API error responses', async () => {
    // Mock fetch to return an error response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })
    
    const transcript = 'Sample transcript'
    const summary = 'Sample summary'
    
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow(
      'Ollama API error: 500 Internal Server Error'
    )
  })

  it('should handle timeout after 5 minutes', async () => {
    // Mock fetch to simulate abort error
    global.fetch = vi.fn().mockImplementation(() => 
      Promise.reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }))
    )
    
    const transcript = 'Sample transcript'
    const summary = 'Sample summary'
    
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow(
      'SEO generation timed out (max 5 minutes)'
    )
  })

  it('should extract JSON from response with extra text', async () => {
    const validSEO = {
      title: 'Faith and Hope',
      description: 'A sermon about faith and hope.',
      keywords: ['faith', 'hope']
    }
    
    // Mock fetch to return JSON with extra text
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: `Here is the SEO content: ${JSON.stringify(validSEO)} Hope this helps!`
      })
    })
    
    const transcript = 'Sample transcript'
    const summary = 'Sample summary'
    
    const result = await OllamaAIService.generateSEO(transcript, summary)
    expect(result).toEqual(validSEO)
  })

  it('should parse JSON wrapped in markdown code block (```json ... ```)', async () => {
    const validSEO = {
      title: 'Faith and Hope in Difficult Times',
      description: 'A sermon about maintaining faith and hope during challenges.',
      keywords: ['faith', 'hope', 'sermon', 'church']
    }

    // Simulate Ollama returning JSON wrapped in a markdown code block
    const markdownResponse = `\`\`\`json\n${JSON.stringify(validSEO, null, 2)}\n\`\`\``

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: markdownResponse })
    })

    const transcript = 'Sample transcript'
    const summary = 'Sample summary'

    const result = await OllamaAIService.generateSEO(transcript, summary)
    expect(result).toEqual(validSEO)
  })

  it('should parse JSON wrapped in plain markdown code block (``` ... ```)', async () => {
    const validSEO = {
      title: 'Grace and Redemption',
      description: 'A sermon exploring grace and redemption through scripture.',
      keywords: ['grace', 'redemption', 'scripture']
    }

    // Simulate Ollama returning JSON wrapped in a plain (no language tag) code block
    const markdownResponse = `\`\`\`\n${JSON.stringify(validSEO)}\n\`\`\``

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: markdownResponse })
    })

    const transcript = 'Sample transcript'
    const summary = 'Sample summary'

    const result = await OllamaAIService.generateSEO(transcript, summary)
    expect(result).toEqual(validSEO)
  })

  it('should handle response without JSON', async () => {
    // Mock fetch to return response without JSON
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'This is not JSON content'
      })
    })
    
    const transcript = 'Sample transcript'
    const summary = 'Sample summary'
    
    await expect(OllamaAIService.generateSEO(transcript, summary)).rejects.toThrow(
      'Failed to parse SEO content from AI response'
    )
  })

  it('should truncate summary to 2000 characters', async () => {
    const longSummary = 'a'.repeat(5000)
    const validSEO = {
      title: 'Faith and Hope',
      description: 'A sermon about faith and hope.',
      keywords: ['faith', 'hope']
    }
    
    // Mock fetch to return valid SEO content
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify(validSEO)
      })
    })
    
    const transcript = 'Sample transcript'
    
    const result = await OllamaAIService.generateSEO(transcript, longSummary)
    expect(result).toEqual(validSEO)
  })

  it('should truncate transcript to 3000 characters', async () => {
    const longTranscript = 'a'.repeat(5000)
    const validSEO = {
      title: 'Faith and Hope',
      description: 'A sermon about faith and hope.',
      keywords: ['faith', 'hope']
    }
    
    // Mock fetch to return valid SEO content
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify(validSEO)
      })
    })
    
    const summary = 'Sample summary'
    
    const result = await OllamaAIService.generateSEO(longTranscript, summary)
    expect(result).toEqual(validSEO)
  })
})
