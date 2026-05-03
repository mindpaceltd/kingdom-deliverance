import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

/**
 * Generate a sermon summary from transcript text using Google Gemini AI
 * 
 * Requirements:
 * - Summary length: minimum 1500 words for comprehensive sermon content
 * - Captures main themes, scripture references, and takeaways
 * - Truncates transcript to 30k characters to stay within token limits
 * - 5-minute timeout for summarization (increased for longer content)
 * - Validates minimum summary length of 1000 characters
 * 
 * @param transcript - Full sermon transcript text
 * @returns AI-generated summary (1500+ words)
 * @throws Error if API key is missing, summarization fails, timeout occurs, or summary is too short
 */
export async function generateSummary(transcript: string): Promise<string> {
  // Validate API key
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not configured')
  }
  
  // Truncate transcript to 30k characters to stay within token limits
  const truncatedTranscript = transcript.slice(0, 30000)
  
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  
  const prompt = `
You are a sermon content specialist. Analyze the following sermon transcript and create a comprehensive, detailed summary suitable for a church website.

Requirements:
- Length: MINIMUM 1500 words (this is critical - write a thorough, detailed summary)
- Include ALL main themes and key points with detailed explanations
- Mention ALL scripture references with context and application
- Highlight actionable takeaways with practical examples
- Include sermon structure (introduction, main points, conclusion)
- Capture the preacher's tone and emphasis
- Use clear, engaging language suitable for a church website
- Write in paragraph form with proper transitions
- Be thorough and comprehensive - this will be the main sermon content

Transcript:
${truncatedTranscript}

Provide only the detailed summary text (minimum 1500 words), no additional commentary or meta-text.
`
  
  // Create a timeout promise (5 minutes - increased for longer content)
  const timeoutMs = 5 * 60 * 1000
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Summarization timed out after 5 minutes'))
    }, timeoutMs)
  })
  
  try {
    // Race between AI generation and timeout
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ])
    
    const response = await result.response
    const summary = response.text().trim()
    
    // Validate minimum summary length (1000 characters ≈ 150-200 words minimum)
    if (summary.length < 1000) {
      throw new Error('Generated summary is too short (minimum 1500 words required)')
    }
    
    return summary
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        throw error
      }
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing Gemini API key')
      }
      if (error.message.includes('too short')) {
        throw error
      }
    }
    
    // Generic error for other cases
    throw new Error('Failed to generate summary. Please try again or manually enter the sermon summary.')
  }
}

/**
 * Generate SEO-optimized metadata from transcript and summary using Google Gemini AI
 * 
 * Requirements:
 * - Title: 50-70 characters
 * - Description: 150-160 characters
 * - Keywords: 5-8 relevant keywords
 * - Parse JSON response (handle markdown code blocks)
 * - Validate response structure
 * - 1-minute timeout for SEO generation
 * 
 * @param transcript - Full sermon transcript text
 * @param summary - AI-generated sermon summary
 * @returns SEO metadata object with title, description, and keywords array
 * @throws Error if API key is missing, SEO generation fails, timeout occurs, or response structure is invalid
 */
export async function generateSEO(
  transcript: string,
  summary: string
): Promise<{ title: string; description: string; keywords: string[] }> {
  // Validate API key
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not configured')
  }
  
  // Truncate transcript to 5k characters for SEO generation
  const truncatedTranscript = transcript.slice(0, 5000)
  
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  
  const prompt = `
You are an SEO specialist for a church website. Based on the sermon content below, generate SEO-optimized metadata.

Summary:
${summary}

Transcript excerpt:
${truncatedTranscript}

Generate the following in JSON format:
{
  "title": "SEO-optimized title (50-70 characters)",
  "description": "Meta description (150-160 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Requirements:
- Title should be compelling and include main topic
- Description should entice clicks while summarizing content
- Keywords should be relevant search terms (5-8 keywords)
- Use natural language, avoid keyword stuffing

Respond with ONLY the JSON object, no additional text.
`
  
  // Create a timeout promise (1 minute)
  const timeoutMs = 1 * 60 * 1000
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('SEO generation timed out after 1 minute'))
    }, timeoutMs)
  })
  
  try {
    // Race between AI generation and timeout
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ])
    
    const response = await result.response
    const jsonText = response.text().trim()
    
    // Extract JSON from response (handle markdown code blocks like ```json)
    let jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      // Found JSON in markdown code block
      const seo = JSON.parse(jsonMatch[1])
      
      // Validate response structure
      if (!seo.title || !seo.description || !Array.isArray(seo.keywords)) {
        throw new Error('Invalid SEO content structure: missing required fields (title, description, keywords)')
      }
      
      return seo
    }
    
    // Try to extract JSON without markdown code blocks
    jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse SEO content from AI response: no JSON found')
    }
    
    const seo = JSON.parse(jsonMatch[0])
    
    // Validate response structure
    if (!seo.title || !seo.description || !Array.isArray(seo.keywords)) {
      throw new Error('Invalid SEO content structure: missing required fields (title, description, keywords)')
    }
    
    return seo
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        throw error
      }
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing Gemini API key')
      }
      if (error.message.includes('Invalid SEO content structure')) {
        throw error
      }
      if (error.message.includes('Failed to parse')) {
        throw error
      }
      if (error.message.includes('JSON')) {
        throw new Error('Failed to parse SEO content from AI response')
      }
    }
    
    // Generic error for other cases
    throw new Error('Failed to generate SEO content. Please try again or manually enter SEO details.')
  }
}
