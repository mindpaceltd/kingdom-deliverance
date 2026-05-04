/**
 * Ollama AI Service for sermon summarization and SEO generation
 * 
 * This service integrates with the Ollama API for AI-powered content generation
 * using self-hosted models (Mistral/Llama). It provides:
 * - Comprehensive sermon summarization (1500+ words)
 * - SEO-optimized metadata generation
 * - Configurable endpoint and model selection
 * - Robust error handling and timeout management
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.8
 */

export interface SEOContent {
  title: string
  description: string
  keywords: string[]
}

export class OllamaAIService {
  private static readonly OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
  private static readonly MODEL = process.env.OLLAMA_MODEL || 'mistral'
  private static readonly SUMMARY_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes
  private static readonly SEO_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
  
  /**
   * Generate comprehensive sermon summary using Ollama
   * Target: 1500+ words with themes, scripture, takeaways, structure
   * 
   * @param transcript - Full sermon transcript text
   * @returns AI-generated comprehensive summary (1500+ words)
   * @throws Error if Ollama is unavailable, timeout occurs, or summary is too short
   */
  static async generateSummary(transcript: string): Promise<string> {
    const prompt = `You are a sermon content specialist. Analyze the following sermon transcript and create a comprehensive, detailed summary.

Requirements:
- Length: 1500+ words (this is a full sermon summary, not a brief overview)
- Include main themes and key theological points
- Mention all scripture references with context
- Highlight actionable takeaways and applications
- Describe the sermon structure and flow
- Use clear, engaging language suitable for a church website
- Maintain the sermon's tone and emphasis

Transcript:
${transcript}

Provide only the summary text, no additional commentary or meta-text.`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.SUMMARY_TIMEOUT_MS)
      
      const response = await fetch(
        `${this.OLLAMA_ENDPOINT}/api/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.MODEL,
            prompt,
            stream: false,
          }),
          signal: controller.signal,
        }
      )
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      const summary = data.response.trim()
      
      // Validate summary length
      const wordCount = summary.split(/\s+/).length
      if (wordCount < 100) {
        throw new Error(`Generated summary too short (${wordCount} words, min 100 words)`)
      }
      
      return summary
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('AI summarization timed out (max 10 minutes)')
        }
        
        if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          throw new Error('AI service unavailable. Please ensure Ollama is running.')
        }
        
        // Re-throw other errors with context
        throw error
      }
      
      throw new Error(`AI summarization failed: ${String(error)}`)
    }
  }
  
  /**
   * Generate SEO-optimized metadata using Ollama
   * 
   * @param transcript - Full sermon transcript text
   * @param summary - AI-generated sermon summary
   * @returns SEO metadata object with title, description, and keywords array
   * @throws Error if Ollama is unavailable, timeout occurs, or response structure is invalid
   */
  static async generateSEO(transcript: string, summary: string): Promise<SEOContent> {
    const prompt = `You are an SEO specialist for a church website. Based on the sermon content below, generate SEO-optimized metadata.

Summary:
${summary.slice(0, 2000)}

Transcript excerpt:
${transcript.slice(0, 3000)}

Generate the following in JSON format:
{
  "title": "SEO-optimized title (50-70 characters)",
  "description": "Meta description (150-160 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}

Requirements:
- Title should be compelling and include main topic
- Description should entice clicks while summarizing content
- Keywords should be relevant search terms (5-8 keywords)
- Use natural language, avoid keyword stuffing

Respond with ONLY the JSON object, no additional text or markdown formatting.`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.SEO_TIMEOUT_MS)
      
      const response = await fetch(
        `${this.OLLAMA_ENDPOINT}/api/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.MODEL,
            prompt,
            stream: false,
          }),
          signal: controller.signal,
        }
      )
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      const responseText = data.response.trim()
      
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Failed to parse SEO content from AI response')
      }
      
      const seo = JSON.parse(jsonMatch[0])
      
      // Validate response structure
      if (!seo.title || !seo.description || !Array.isArray(seo.keywords)) {
        throw new Error('Invalid SEO content structure')
      }
      
      // Validate constraints
      if (seo.title.length > 100) {
        throw new Error(`SEO title too long (${seo.title.length} chars, max 100 chars)`)
      }
      
      return seo
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('SEO generation timed out (max 5 minutes)')
        }
        
        if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          throw new Error('AI service unavailable. Please ensure Ollama is running.')
        }
        
        // Re-throw validation and parsing errors
        if (error.message.includes('parse') || error.message.includes('Invalid') || error.message.includes('too long')) {
          throw error
        }
      }
      
      throw new Error(`SEO generation failed: ${String(error)}`)
    }
  }
}
