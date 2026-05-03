# Design Document — Sermon AI Link Processor

## Overview

The Sermon AI Link Processor is a feature extension to the KDC Uganda CMS Platform's Sermons CRUD Manager that enables automated sermon content generation from YouTube and social media video links. The system leverages free AI services to extract transcripts, generate summaries, and optimize content for SEO, presenting results in a draft form for editorial review before publication.

This feature integrates seamlessly with the existing sermon management workflow at `/admin/sermons`, utilizing the established authentication, authorization, and content management patterns. The processor operates asynchronously to avoid blocking the user interface and implements rate limiting to ensure fair resource usage.

### Key Design Principles

1. **Free-First Architecture**: All AI processing uses free-tier services (Google Gemini API, YouTube Transcript API) with no paid API dependencies
2. **Draft-Review-Publish Pattern**: All generated content enters draft state for human review, maintaining editorial control
3. **Graceful Degradation**: Processing failures never corrupt database state; users can always fall back to manual entry
4. **Async Processing**: Long-running AI operations execute asynchronously with real-time status updates
5. **Security-First**: Role-based access control, input validation, and secure external API communication

---

## Architecture

### High-Level System Diagram

```
Browser (Admin User)
  │
  ├─ /admin/sermons (Sermons Manager)
  │     ├─ AI Link Processor Section (Client Component)
  │     │     ├─ Link Input Field
  │     │     ├─ Process Button
  │     │     └─ Status Indicator
  │     │
  │     └─ Draft Review Modal (Client Component)
  │           ├─ Pre-populated Form Fields
  │           ├─ Transcription Viewer (collapsible)
  │           └─ Save/Publish Actions
  │
  └─ Server Actions
        ├─ processSermonLink(url)
        │     ├─ validateLink(url)
        │     ├─ extractTranscript(url)
        │     ├─ generateSummary(transcript)
        │     └─ generateSEO(transcript, summary)
        │
        └─ saveSermonDraft(data)

External Services
  ├─ YouTube Transcript API (youtube-transcript npm)
  │     └─ Extract existing captions/transcripts
  │
  └─ Google Gemini API (free tier)
        ├─ Text Summarization
        └─ SEO Content Generation
```

### Processing Pipeline Flow

```
[User pastes link] → [Client-side validation]
  ↓
[Server Action: processSermonLink]
  ↓
[Step 1: Link Validation]
  → Validate URL pattern (YouTube/Vimeo/direct video)
  → Check video accessibility
  ↓
[Step 2: Transcript Extraction]
  → YouTube: Use youtube-transcript npm package
  → Vimeo/Direct: Return error (manual entry required)
  → Timeout: 5 minutes
  ↓
[Step 3: AI Summarization]
  → Send transcript to Gemini API
  → Generate 150-300 word summary
  → Extract key themes and scripture references
  → Timeout: 2 minutes
  ↓
[Step 4: SEO Generation]
  → Generate title (50-70 chars)
  → Generate description (150-160 chars)
  → Generate 5-8 keywords
  → Timeout: 1 minute
  ↓
[Return Draft Data]
  → { title, description, content, keywords, video_url, transcript }
  ↓
[Display Draft Review Modal]
  → User reviews and edits
  → User saves as draft or publishes
```

### Rate Limiting Architecture

```
processing_logs table
  ├─ user_id (FK → profiles.id)
  ├─ link_url
  ├─ status (pending | processing | completed | failed)
  ├─ created_at
  └─ duration_ms

Rate Limit Check (Server Action)
  → SELECT COUNT(*) FROM processing_logs
     WHERE user_id = ? AND created_at > NOW() - INTERVAL '1 hour'
  → IF count >= 5 THEN return error
  → ELSE proceed with processing
```

---

## Components and Interfaces

### AI Link Processor Section (`src/components/admin/sermons/ai-link-processor.tsx`)

Client component integrated into the Sermons Manager form:

```typescript
interface AILinkProcessorProps {
  onDraftGenerated: (draft: SermonDraft) => void
}

interface SermonDraft {
  title: string
  description: string
  content: string
  keywords: string[]
  video_url: string
  transcript: string
}

export function AILinkProcessor({ onDraftGenerated }: AILinkProcessorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Client-side URL validation
  // Process button handler
  // Status indicator rendering
  // Error display and recovery options
}
```

**Processing Steps:**
```typescript
type ProcessingStep = 
  | { step: 1, label: 'Validating link...' }
  | { step: 2, label: 'Extracting transcript...', progress: number }
  | { step: 3, label: 'Generating summary...', progress: number }
  | { step: 4, label: 'Optimizing for SEO...', progress: number }
```

### Draft Review Modal (`src/components/admin/sermons/draft-review-modal.tsx`)

Client component displaying AI-generated content for review:

```typescript
interface DraftReviewModalProps {
  draft: SermonDraft
  isOpen: boolean
  onClose: () => void
  onSave: (data: SermonFormData, status: 'draft' | 'published') => Promise<void>
}

export function DraftReviewModal({ draft, isOpen, onClose, onSave }: DraftReviewModalProps) {
  const [formData, setFormData] = useState<SermonFormData>(draftToFormData(draft))
  const [showTranscript, setShowTranscript] = useState(false)
  
  // Editable form fields (title, description, content, etc.)
  // Collapsible transcript viewer
  // Save as Draft / Publish buttons
  // Discard changes confirmation
}
```

### Server Actions (`src/lib/actions/sermon-ai-processor.ts`)

```typescript
'use server'

export async function processSermonLink(url: string): Promise<ProcessingResult> {
  // 1. Verify user role (admin or editor only)
  const profile = await verifyRole(['admin', 'editor'])
  
  // 2. Check rate limit
  const canProcess = await checkRateLimit(profile.id)
  if (!canProcess) {
    return { error: 'Rate limit exceeded. Try again in an hour.' }
  }
  
  // 3. Create processing log entry
  const logId = await createProcessingLog(profile.id, url, 'pending')
  
  try {
    // 4. Validate link
    const validation = await validateMediaLink(url)
    if (!validation.valid) {
      return { error: validation.error }
    }
    
    // 5. Extract transcript
    await updateProcessingLog(logId, 'processing')
    const transcript = await extractTranscript(url)
    
    // 6. Generate summary
    const summary = await generateSummary(transcript)
    
    // 7. Generate SEO content
    const seo = await generateSEO(transcript, summary)
    
    // 8. Mark processing complete
    await updateProcessingLog(logId, 'completed')
    
    return {
      success: true,
      draft: {
        title: seo.title,
        description: seo.description,
        content: summary,
        keywords: seo.keywords,
        video_url: url,
        transcript
      }
    }
  } catch (error) {
    await updateProcessingLog(logId, 'failed', error.message)
    return { error: getErrorMessage(error) }
  }
}

interface ProcessingResult {
  success?: boolean
  draft?: SermonDraft
  error?: string
}
```

### Transcript Extraction Service (`src/lib/services/transcript-extractor.ts`)

```typescript
import { YoutubeTranscript } from 'youtube-transcript'

export async function extractTranscript(url: string): Promise<string> {
  const videoId = extractYouTubeVideoId(url)
  
  if (!videoId) {
    throw new Error('Could not extract video ID from URL')
  }
  
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
      country: 'US'
    })
    
    // Combine transcript segments into full text
    const fullText = transcript
      .map(segment => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (!fullText || fullText.length < 100) {
      throw new Error('Transcript too short or empty')
    }
    
    return fullText
  } catch (error) {
    if (error.message.includes('disabled')) {
      throw new Error('Transcripts are disabled for this video')
    }
    throw new Error('Failed to extract transcript. The video may be private or unavailable.')
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}
```

### AI Service Integration (`src/lib/services/gemini-ai.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateSummary(transcript: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `
You are a sermon content specialist. Analyze the following sermon transcript and create a comprehensive summary.

Requirements:
- Length: 150-300 words
- Include main themes and key points
- Mention any scripture references
- Highlight actionable takeaways
- Use clear, engaging language suitable for a church website

Transcript:
${transcript.slice(0, 30000)} // Limit to ~30k chars to stay within token limits

Provide only the summary text, no additional commentary.
`
  
  const result = await model.generateContent(prompt)
  const response = await result.response
  const summary = response.text().trim()
  
  if (summary.length < 100) {
    throw new Error('Generated summary is too short')
  }
  
  return summary
}

export async function generateSEO(
  transcript: string,
  summary: string
): Promise<{ title: string; description: string; keywords: string[] }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `
You are an SEO specialist for a church website. Based on the sermon content below, generate SEO-optimized metadata.

Summary:
${summary}

Transcript excerpt:
${transcript.slice(0, 5000)}

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
  
  const result = await model.generateContent(prompt)
  const response = await result.response
  const jsonText = response.text().trim()
  
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse SEO content from AI response')
  }
  
  const seo = JSON.parse(jsonMatch[0])
  
  // Validate response structure
  if (!seo.title || !seo.description || !Array.isArray(seo.keywords)) {
    throw new Error('Invalid SEO content structure')
  }
  
  return seo
}
```

### Link Validation Utility (`src/lib/utils/link-validator.ts`)

```typescript
export interface LinkValidation {
  valid: boolean
  type?: 'youtube' | 'vimeo' | 'direct'
  error?: string
}

export function validateMediaLink(url: string): LinkValidation {
  // Check if URL is well-formed
  try {
    new URL(url)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
  
  // YouTube patterns
  if (/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(url)) {
    return { valid: true, type: 'youtube' }
  }
  
  // Vimeo patterns
  if (/vimeo\.com\/\d+/.test(url)) {
    return { valid: false, error: 'Vimeo videos are not yet supported. Please use YouTube links or enter content manually.' }
  }
  
  // Direct video file patterns
  if (/\.(mp4|webm|ogg|mov)$/i.test(url)) {
    return { valid: false, error: 'Direct video files are not yet supported. Please use YouTube links or enter content manually.' }
  }
  
  return { valid: false, error: 'Unsupported link format. Please paste a YouTube video URL.' }
}
```

---

## Data Models

### Extended Types (`src/lib/types.ts`)

```typescript
export interface SermonDraft {
  title: string
  description: string
  content: string
  keywords: string[]
  video_url: string
  transcript: string
}

export interface ProcessingLog {
  id: string
  user_id: string
  link_url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  duration_ms: number | null
  created_at: string
  updated_at: string
}
```

### Database Schema Addition

New table: `processing_logs`

```sql
CREATE TABLE processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  link_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate limiting queries
CREATE INDEX idx_processing_logs_user_created 
  ON processing_logs(user_id, created_at DESC);

-- Index for monitoring queries
CREATE INDEX idx_processing_logs_status_created 
  ON processing_logs(status, created_at DESC);
```

### RLS Policies for `processing_logs`

```sql
-- Users can only view their own processing logs
CREATE POLICY "Users can view own processing logs"
  ON processing_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert processing logs
CREATE POLICY "Service role can insert processing logs"
  ON processing_logs FOR INSERT
  WITH CHECK (true);

-- Service role can update processing logs
CREATE POLICY "Service role can update processing logs"
  ON processing_logs FOR UPDATE
  USING (true);
```

---

## Error Handling

### Error Categories and Recovery Strategies

| Error Type | User Message | Recovery Options | Technical Handling |
|------------|--------------|------------------|-------------------|
| Invalid URL format | "Invalid URL format. Please paste a valid YouTube link." | Retry with correct URL | Client-side validation |
| Unsupported platform | "Vimeo/direct videos not yet supported. Use YouTube or enter manually." | Try YouTube link or manual entry | Server-side validation |
| Video inaccessible | "Video is private, deleted, or unavailable. Try a different video." | Try different video or manual entry | Transcript extraction error |
| No transcript available | "Transcripts are disabled for this video. Please enter content manually." | Manual entry | Transcript extraction error |
| Transcript too short | "Transcript is too short to process. Please enter content manually." | Manual entry | Transcript validation |
| AI service timeout | "Processing took too long. Please try again or enter content manually." | Retry or manual entry | Timeout after 10 minutes |
| AI service error | "AI service temporarily unavailable. Please try again in a few minutes." | Retry later or manual entry | Gemini API error |
| Rate limit exceeded | "You've reached the limit of 5 processing requests per hour. Try again later." | Wait or manual entry | Rate limit check |
| Network error | "Network error. Check your connection and try again." | Retry | Fetch/API error |

### Error Logging Pattern

```typescript
async function processSermonLink(url: string): Promise<ProcessingResult> {
  const logId = await createProcessingLog(userId, url, 'pending')
  
  try {
    // Processing steps...
    await updateProcessingLog(logId, 'completed', null, duration)
    return { success: true, draft }
  } catch (error) {
    // Log error with context
    console.error('[processSermonLink]', {
      userId,
      url,
      error: error.message,
      stack: error.stack
    })
    
    // Update processing log
    await updateProcessingLog(logId, 'failed', error.message, duration)
    
    // Return user-friendly error
    return { error: getUserFriendlyError(error) }
  }
}
```

---

## Testing Strategy

### Unit Tests

Focus on pure functions and isolated logic:

1. **Link Validation** (`link-validator.test.ts`)
   - Valid YouTube URLs (watch, short, embed formats)
   - Invalid URLs (malformed, unsupported platforms)
   - Edge cases (URLs with query params, fragments)

2. **Video ID Extraction** (`transcript-extractor.test.ts`)
   - Extract ID from various YouTube URL formats
   - Return null for non-YouTube URLs
   - Handle edge cases (short URLs, embed URLs)

3. **Transcript Text Processing** (`transcript-extractor.test.ts`)
   - Combine transcript segments correctly
   - Normalize whitespace
   - Handle empty/short transcripts

4. **SEO JSON Parsing** (`gemini-ai.test.ts`)
   - Extract JSON from markdown code blocks
   - Handle malformed JSON responses
   - Validate required fields

5. **Error Message Mapping** (`error-handler.test.ts`)
   - Map technical errors to user-friendly messages
   - Preserve error context for logging
   - Handle unknown error types

### Integration Tests

Test component interactions and external services:

1. **Server Action Authorization**
   - Reject requests from users with role `author` or `member`
   - Allow requests from `admin` and `editor` roles
   - Return 403 error for unauthorized users

2. **Rate Limiting**
   - Allow 5 requests per hour per user
   - Block 6th request with appropriate error
   - Reset counter after 1 hour

3. **Processing Log Creation**
   - Insert log entry with correct user_id and status
   - Update status as processing progresses
   - Record error message on failure

4. **YouTube Transcript Extraction** (with real API)
   - Extract transcript from public video with captions
   - Handle video without captions gracefully
   - Handle private/deleted video gracefully

5. **Gemini API Integration** (with real API, limited runs)
   - Generate summary from sample transcript
   - Generate SEO content from sample transcript
   - Handle API errors gracefully

### Property-Based Tests

Use **fast-check** with minimum 100 iterations per property.

Tag format: `// Feature: sermon-ai-link-processor, Property N: <property_text>`

*Note: Property-based testing is appropriate for this feature because it involves data transformation, validation, and text processing logic that should hold universally across inputs.*

### Smoke Tests

1. **Environment Variables**
   - `GEMINI_API_KEY` is present and non-empty
   - Gemini API is reachable (single test request)

2. **Database Schema**
   - `processing_logs` table exists
   - Required indexes are present
   - RLS policies are active

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing the correctness properties, I need to analyze each acceptance criterion to determine which are testable as properties.


### Property Reflection

After analyzing all acceptance criteria, I've identified the following properties that are suitable for property-based testing. I've eliminated redundancy by:

1. **Combining validation properties**: Properties 1.3 and 2.1 both test URL validation logic — combined into Property 1
2. **Combining error response properties**: Properties 2.2 and 9.1 both test error responses — combined into Property 2
3. **Combining length validation properties**: Properties 4.2, 5.1, 5.2, 5.3 all test output length constraints — kept separate as they test different outputs
4. **Combining database integrity properties**: Properties 6.5, 6.6, and 9.4 all test database mutations — combined into Property 7
5. **Combining authorization properties**: Property 14.5 tests role-based access — kept as Property 10
6. **Combining logging properties**: Properties 11.1 and 11.4 both test logging behavior — combined into Property 11
7. **Eliminating duplicate properties**: Properties 3.6 and 14.2 are identical — kept only one
8. **Combining sanitization and privacy properties**: Properties 14.1 and 14.6 both test data handling — combined into Property 12

The remaining properties provide unique validation value and cover the core logic of the system.

### Property 1: URL Validation Correctness

*For any* URL string, the link validator SHALL correctly classify it as either valid YouTube, unsupported platform (Vimeo/direct), or invalid format, and SHALL return the appropriate error message for unsupported/invalid URLs.

**Validates: Requirements 1.3, 2.1, 2.2**

### Property 2: Error Messages Include Recovery Suggestions

*For any* processing error (validation failure, transcript extraction failure, AI service failure, timeout), the error response SHALL contain both a descriptive message indicating what failed and a suggestion for recovery (retry, try different video, manual entry).

**Validates: Requirements 9.1, 9.2**

### Property 3: Whitespace-Only Input Validation

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines, or combinations), the link input validation SHALL reject it as invalid and the Process button SHALL remain disabled.

**Validates: Requirements 1.5**

### Property 4: AI Summary Length Constraints

*For any* transcript text that successfully generates a summary, the summary SHALL contain between 150 and 300 words (inclusive).

**Validates: Requirements 4.2**

### Property 5: SEO Title Length Constraints

*For any* transcript and summary that successfully generate SEO content, the generated title SHALL contain between 50 and 70 characters (inclusive).

**Validates: Requirements 5.1**

### Property 6: SEO Description Length Constraints

*For any* transcript and summary that successfully generate SEO content, the generated description SHALL contain between 150 and 160 characters (inclusive).

**Validates: Requirements 5.2**

### Property 7: SEO Keywords Count Constraints

*For any* transcript and summary that successfully generate SEO content, the generated keywords array SHALL contain between 5 and 8 elements (inclusive).

**Validates: Requirements 5.3**

### Property 8: Draft Data Mapping Correctness

*For any* AI-generated draft data (title, description, content, keywords, video_url), when mapped to sermon fields, the mapping SHALL preserve all values correctly and SHALL NOT populate fields that were not provided (preacher, series, duration remain null unless explicitly set).

**Validates: Requirements 7.1, 7.2**

### Property 9: Database Integrity on Failure

*For any* processing failure at any step (validation, transcript extraction, summarization, SEO generation), the database state SHALL remain unchanged — no partial sermon records, no orphaned data, and the sermons table count SHALL be the same before and after the failed operation.

**Validates: Requirements 9.4**

### Property 10: Role-Based Authorization Enforcement

*For any* user with role `author` or `member`, attempting to invoke the processSermonLink Server Action SHALL return a Forbidden error and SHALL NOT execute any processing steps (no transcript extraction, no AI calls, no database writes).

**Validates: Requirements 14.5**

### Property 11: Rate Limiting Enforcement

*For any* user who has made 5 processing requests within the past hour, attempting a 6th request SHALL return a rate limit error and SHALL NOT execute any processing steps, and the processing_logs table SHALL show exactly 5 completed/failed requests for that user in the past hour.

**Validates: Requirements 8.1, 8.2**

### Property 12: Processing Event Logging Completeness

*For any* processing request (successful or failed), a corresponding entry SHALL be created in the processing_logs table with user_id, link_url, status, and duration_ms populated, and the entry SHALL NOT contain sensitive data (no full transcript text, no user passwords, no API keys).

**Validates: Requirements 11.1, 11.4, 14.6**

### Property 13: Input Sanitization

*For any* user input string (link URL, edited title, edited description, edited content), the input SHALL be sanitized to remove or escape potentially malicious patterns (SQL injection, XSS, script tags) before being stored in the database or sent to external APIs.

**Validates: Requirements 14.1**

### Property 14: Form Accessibility Labels

*For any* form input element in the AI Link Processor or Draft Review Modal, the element SHALL have an associated `<label>` element with descriptive text, ensuring screen reader accessibility.

**Validates: Requirements 13.2**

### Property 15: Button Accessibility

*For any* button element in the AI Link Processor or Draft Review Modal, the button SHALL have a descriptive label (text content or aria-label) and SHALL be keyboard-accessible (focusable and activatable via Enter/Space keys).

**Validates: Requirements 13.5**

---

## Environment & Configuration

### Environment Variables

Required variables for the Sermon AI Link Processor:

```bash
# Google Gemini API (free tier)
GEMINI_API_KEY=your_gemini_api_key_here

# Processing Configuration
AI_PROCESSING_TIMEOUT_MS=600000  # 10 minutes total timeout
AI_RATE_LIMIT_PER_HOUR=5         # Max requests per user per hour

# Supabase (already configured in main CMS)
NEXT_PUBLIC_SUPABASE_URL=https://wuqhrjczlolhiaihosei.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### `.env.example` Addition

```bash
# ============================================
# Sermon AI Link Processor Configuration
# ============================================

# Google Gemini API Key (free tier)
# Get your key at: https://ai.google.dev/
GEMINI_API_KEY=

# Processing timeout in milliseconds (default: 10 minutes)
AI_PROCESSING_TIMEOUT_MS=600000

# Rate limit: max processing requests per user per hour (default: 5)
AI_RATE_LIMIT_PER_HOUR=5
```

### Environment Validation (`src/lib/env.ts` addition)

```typescript
// Add to existing env validation
const aiProcessorVars = [
  'GEMINI_API_KEY',
] as const

for (const key of aiProcessorVars) {
  if (!process.env[key]) {
    console.warn(
      `[env] Missing AI processor environment variable: ${key}. ` +
      `AI link processing will be disabled. Check your .env.local file.`
    )
  }
}

export const aiProcessorEnv = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  processingTimeoutMs: parseInt(process.env.AI_PROCESSING_TIMEOUT_MS || '600000'),
  rateLimitPerHour: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '5'),
}

// Feature flag: AI processor is enabled only if API key is present
export const isAIProcessorEnabled = !!aiProcessorEnv.geminiApiKey
```

---

## Security Considerations

### Input Validation and Sanitization

1. **URL Validation**: All URLs are validated against strict regex patterns before processing
2. **SQL Injection Prevention**: All database queries use parameterized queries via Supabase client
3. **XSS Prevention**: All user-generated content is sanitized before rendering (React's built-in escaping + DOMPurify for rich text)
4. **API Key Security**: Gemini API key is server-side only, never exposed to client

### Authorization

1. **Role-Based Access**: Only users with role `admin` or `editor` can access AI processing
2. **Session Verification**: All Server Actions verify user session via `supabase.auth.getUser()`
3. **RLS Enforcement**: Processing logs are protected by Row Level Security policies

### Rate Limiting

1. **Per-User Limits**: 5 requests per hour per user to prevent abuse
2. **Database-Backed**: Rate limit state stored in `processing_logs` table
3. **Graceful Degradation**: Rate limit errors provide clear feedback and retry timing

### Data Privacy

1. **No Transcript Storage**: Raw transcripts are never persisted to database
2. **Minimal API Data**: Only necessary data sent to Gemini API (transcript excerpt, summary)
3. **Log Sanitization**: Processing logs contain only metadata, no sensitive content
4. **HTTPS Only**: All external API calls use HTTPS

---

## Performance Considerations

### Async Processing

- All AI operations execute asynchronously to avoid blocking the UI
- Real-time status updates via React state management
- User can cancel long-running operations

### Timeout Management

- Total processing timeout: 10 minutes
- Per-step timeouts: Transcript (5 min), Summary (2 min), SEO (1 min)
- Graceful timeout handling with user-friendly error messages

### API Efficiency

- **YouTube Transcript API**: Fetches existing captions (no transcription needed)
- **Gemini API**: Uses `gemini-1.5-flash` model (fast, free tier)
- **Transcript Truncation**: Limits transcript to 30k characters for summarization to stay within token limits

### Database Optimization

- Indexed queries for rate limiting (`idx_processing_logs_user_created`)
- Indexed queries for monitoring (`idx_processing_logs_status_created`)
- Efficient RLS policies with user_id filtering

---

## Deployment Considerations

### Prerequisites

1. **Gemini API Key**: Obtain free API key from [Google AI Studio](https://ai.google.dev/)
2. **Database Migration**: Run migration to create `processing_logs` table and indexes
3. **Environment Variables**: Configure `GEMINI_API_KEY` in production environment

### Migration Script

```sql
-- File: supabase/migrations/YYYYMMDDHHMMSS_add_processing_logs.sql

-- Create processing_logs table
CREATE TABLE processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  link_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_processing_logs_user_created 
  ON processing_logs(user_id, created_at DESC);

CREATE INDEX idx_processing_logs_status_created 
  ON processing_logs(status, created_at DESC);

-- Enable RLS
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own processing logs"
  ON processing_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert processing logs"
  ON processing_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update processing logs"
  ON processing_logs FOR UPDATE
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER set_processing_logs_updated_at
  BEFORE UPDATE ON processing_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Feature Flag

The AI processor is automatically disabled if `GEMINI_API_KEY` is not configured:

```typescript
// In sermon form component
{isAIProcessorEnabled && <AILinkProcessor onDraftGenerated={handleDraft} />}
{!isAIProcessorEnabled && (
  <div className="text-sm text-muted-foreground">
    AI link processing is currently unavailable. Please enter sermon content manually.
  </div>
)}
```

### Monitoring

1. **Processing Logs**: Query `processing_logs` table for success/failure rates
2. **Duration Metrics**: Monitor `duration_ms` for performance trends
3. **Error Tracking**: Monitor `error_message` for common failure patterns
4. **Rate Limit Hits**: Monitor rate limit errors to adjust limits if needed

---

## Future Enhancements

### Phase 2 Considerations (Out of Scope for Initial Release)

1. **Vimeo Support**: Add Vimeo transcript extraction via Vimeo API
2. **Direct Video Support**: Add audio extraction and transcription for direct video files using Whisper
3. **Multi-Language Support**: Add language detection and multi-language summarization
4. **Batch Processing**: Allow processing multiple videos at once
5. **Custom Prompts**: Allow users to customize AI prompts for summarization and SEO
6. **Transcript Editing**: Allow users to edit transcripts before summarization
7. **Speaker Diarization**: Identify and label different speakers in the transcript
8. **Automatic Thumbnail Extraction**: Extract and upload video thumbnail automatically
9. **Social Media Integration**: Support Facebook, Instagram, TikTok video links
10. **Webhook Notifications**: Notify users when processing completes (for long videos)

---

## Appendix: Free AI Service Details

### Google Gemini API (Free Tier)

- **Model**: `gemini-1.5-flash` (fast, efficient, free)
- **Rate Limits**: 15 requests per minute, 1,500 requests per day (free tier)
- **Token Limits**: 1M tokens per minute input, 8k tokens per minute output
- **Pricing**: Free tier available, no credit card required
- **Documentation**: https://ai.google.dev/gemini-api/docs

### YouTube Transcript API (youtube-transcript npm)

- **Package**: `youtube-transcript` (already in package.json)
- **Functionality**: Fetches existing captions/transcripts from YouTube videos
- **Limitations**: Only works for videos with captions enabled
- **Rate Limits**: No official limits (uses unofficial YouTube API)
- **Cost**: Free, no API key required
- **Documentation**: https://www.npmjs.com/package/youtube-transcript

### Alternative: Self-Hosted Ollama (Future Consideration)

For organizations wanting full data control:

- **Ollama**: Self-hosted LLM runtime
- **Models**: Llama 3, Mistral, Gemma (free, open-source)
- **Deployment**: Docker container on own infrastructure
- **Cost**: Infrastructure costs only (no per-request fees)
- **Documentation**: https://ollama.ai/

---

## References

- [KDC Uganda CMS Platform Design Document](.kiro/specs/kdcuganda-cms-platform/design.md)
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [YouTube Transcript NPM Package](https://www.npmjs.com/package/youtube-transcript)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Property-Based Testing with fast-check](https://github.com/dubzzz/fast-check)
