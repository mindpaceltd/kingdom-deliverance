# Implementation Plan: Sermon AI Link Processor

## Overview

This implementation plan breaks down the Sermon AI Link Processor feature into discrete, actionable coding tasks. The feature extends the existing KDC Uganda CMS Platform Sermons CRUD Manager with AI-powered content generation from YouTube video links.

The implementation follows a layered approach:
1. **Foundation**: Database schema, environment configuration, and utilities
2. **Core Services**: Link validation, transcript extraction, and AI integration
3. **Server Actions**: Processing orchestration and rate limiting
4. **UI Components**: Link processor interface and draft review modal
5. **Testing**: Unit tests, integration tests, and property-based tests
6. **Documentation**: Environment setup and deployment guides

All tasks build incrementally, with each step validating functionality before proceeding to the next.

---

## Tasks

- [x] 1. Set up database schema and environment configuration
  - [x] 1.1 Create database migration for processing_logs table
    - Create migration file `supabase/migrations/YYYYMMDDHHMMSS_add_processing_logs.sql`
    - Define `processing_logs` table with columns: id, user_id, link_url, status, error_message, duration_ms, created_at, updated_at
    - Add CHECK constraint for status enum ('pending', 'processing', 'completed', 'failed')
    - Create indexes: `idx_processing_logs_user_created` and `idx_processing_logs_status_created`
    - Enable Row Level Security (RLS)
    - Create RLS policies: users can view own logs, service role can insert/update
    - Add updated_at trigger
    - _Requirements: 8.3, 11.2_
  
  - [x] 1.2 Add environment variables and validation
    - Update `.env.example` with AI processor configuration variables (GEMINI_API_KEY, AI_PROCESSING_TIMEOUT_MS, AI_RATE_LIMIT_PER_HOUR)
    - Extend `src/lib/env.ts` to validate AI processor environment variables
    - Add `aiProcessorEnv` export with geminiApiKey, processingTimeoutMs, rateLimitPerHour
    - Add `isAIProcessorEnabled` feature flag based on GEMINI_API_KEY presence
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [x] 1.3 Create TypeScript types for AI processor
    - Add `SermonDraft` interface to `src/lib/types.ts` (title, description, content, keywords, video_url, transcript)
    - Add `ProcessingLog` interface (id, user_id, link_url, status, error_message, duration_ms, created_at, updated_at)
    - Add `ProcessingResult` interface (success, draft, error)
    - Add `ProcessingStep` type union for status indicators
    - Add `LinkValidation` interface (valid, type, error)
    - _Requirements: 6.1, 8.5, 12.1_

- [x] 2. Implement link validation utilities
  - [x] 2.1 Create link validator utility
    - Create `src/lib/utils/link-validator.ts`
    - Implement `validateMediaLink(url: string): LinkValidation` function
    - Add URL format validation using try/catch with URL constructor
    - Add regex patterns for YouTube (watch, short, embed formats)
    - Add regex patterns for Vimeo (return unsupported error)
    - Add regex patterns for direct video files (return unsupported error)
    - Return appropriate error messages for unsupported platforms
    - _Requirements: 2.1, 2.2, 1.3_
  
  - [ ]* 2.2 Write unit tests for link validator
    - Test valid YouTube URLs (watch, youtu.be, embed formats)
    - Test invalid URLs (malformed, empty, whitespace-only)
    - Test unsupported platforms (Vimeo, direct video files)
    - Test edge cases (URLs with query params, fragments)
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 2.3 Write property test for URL validation correctness
    - **Property 1: URL Validation Correctness**
    - **Validates: Requirements 1.3, 2.1, 2.2**
    - Generate arbitrary URL strings and verify correct classification (valid YouTube, unsupported, invalid)
    - Verify appropriate error messages for unsupported/invalid URLs
    - _Requirements: 1.3, 2.1, 2.2_

- [x] 3. Implement transcript extraction service
  - [x] 3.1 Create transcript extractor service
    - Create `src/lib/services/transcript-extractor.ts`
    - Install `youtube-transcript` npm package if not present
    - Implement `extractYouTubeVideoId(url: string): string | null` function with regex patterns
    - Implement `extractTranscript(url: string): Promise<string>` function
    - Use `YoutubeTranscript.fetchTranscript()` with lang='en', country='US'
    - Combine transcript segments into full text with whitespace normalization
    - Add validation for minimum transcript length (100 characters)
    - Add error handling for disabled transcripts, private videos, unavailable videos
    - Add 5-minute timeout for transcript extraction
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [ ]* 3.2 Write unit tests for transcript extractor
    - Test video ID extraction from various YouTube URL formats
    - Test video ID extraction returns null for non-YouTube URLs
    - Test transcript text processing (segment combination, whitespace normalization)
    - Test error handling for empty/short transcripts
    - _Requirements: 3.1, 3.2_

- [x] 4. Implement Google Gemini AI integration
  - [x] 4.1 Create Gemini AI service
    - Create `src/lib/services/gemini-ai.ts`
    - Install `@google/generative-ai` npm package if not present
    - Initialize GoogleGenerativeAI client with GEMINI_API_KEY from env
    - Implement `generateSummary(transcript: string): Promise<string>` function
    - Use `gemini-1.5-flash` model
    - Create prompt for sermon summarization (150-300 words, themes, scripture, takeaways)
    - Truncate transcript to 30k characters to stay within token limits
    - Validate summary length (minimum 100 characters)
    - Add 2-minute timeout for summarization
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 4.2 Implement SEO content generation
    - Add `generateSEO(transcript: string, summary: string): Promise<{title, description, keywords}>` function to `gemini-ai.ts`
    - Use `gemini-1.5-flash` model
    - Create prompt for SEO generation (title 50-70 chars, description 150-160 chars, 5-8 keywords)
    - Parse JSON response from AI (handle markdown code blocks)
    - Validate response structure (title, description, keywords array present)
    - Add 1-minute timeout for SEO generation
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 4.3 Write unit tests for Gemini AI service
    - Test SEO JSON parsing from markdown code blocks
    - Test SEO JSON parsing error handling for malformed responses
    - Test SEO response structure validation
    - Test summary length validation
    - _Requirements: 4.2, 5.1, 5.2, 5.3_
  
  - [ ]* 4.4 Write property test for AI summary length constraints
    - **Property 4: AI Summary Length Constraints**
    - **Validates: Requirements 4.2**
    - Generate arbitrary transcript texts and verify summaries are 150-300 words
    - _Requirements: 4.2_
  
  - [ ]* 4.5 Write property test for SEO title length constraints
    - **Property 5: SEO Title Length Constraints**
    - **Validates: Requirements 5.1**
    - Generate arbitrary transcripts/summaries and verify titles are 50-70 characters
    - _Requirements: 5.1_
  
  - [ ]* 4.6 Write property test for SEO description length constraints
    - **Property 6: SEO Description Length Constraints**
    - **Validates: Requirements 5.2**
    - Generate arbitrary transcripts/summaries and verify descriptions are 150-160 characters
    - _Requirements: 5.2_
  
  - [ ]* 4.7 Write property test for SEO keywords count constraints
    - **Property 7: SEO Keywords Count Constraints**
    - **Validates: Requirements 5.3**
    - Generate arbitrary transcripts/summaries and verify keywords array has 5-8 elements
    - _Requirements: 5.3_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement error handling utilities
  - [x] 6.1 Create error handler utility
    - Create `src/lib/utils/error-handler.ts`
    - Implement `getUserFriendlyError(error: Error): string` function
    - Map technical errors to user-friendly messages with recovery suggestions
    - Handle error types: invalid URL, unsupported platform, video inaccessible, no transcript, transcript too short, AI timeout, AI service error, rate limit, network error
    - _Requirements: 9.1, 9.2_
  
  - [ ]* 6.2 Write unit tests for error handler
    - Test error message mapping for each error type
    - Test error context preservation for logging
    - Test handling of unknown error types
    - _Requirements: 9.1, 9.2_
  
  - [ ]* 6.3 Write property test for error messages include recovery suggestions
    - **Property 2: Error Messages Include Recovery Suggestions**
    - **Validates: Requirements 9.1, 9.2**
    - Generate arbitrary processing errors and verify error responses contain descriptive message and recovery suggestion
    - _Requirements: 9.1, 9.2_

- [x] 7. Implement processing log database operations
  - [x] 7.1 Create processing log service
    - Create `src/lib/services/processing-log.ts`
    - Implement `createProcessingLog(userId: string, linkUrl: string, status: string): Promise<string>` function
    - Implement `updateProcessingLog(logId: string, status: string, errorMessage?: string, durationMs?: number): Promise<void>` function
    - Implement `checkRateLimit(userId: string): Promise<boolean>` function
    - Query processing_logs for user's requests in past hour (use idx_processing_logs_user_created index)
    - Return false if count >= AI_RATE_LIMIT_PER_HOUR (default 5)
    - Use Supabase service role client for database operations
    - _Requirements: 8.1, 8.2, 8.3, 11.1, 11.2_
  
  - [ ]* 7.2 Write unit tests for processing log service
    - Test log entry creation with correct fields
    - Test log status updates
    - Test rate limit check logic
    - _Requirements: 8.1, 8.2, 11.1_

- [x] 8. Implement main server action for link processing
  - [x] 8.1 Create sermon AI processor server action
    - Create `src/lib/actions/sermon-ai-processor.ts` with 'use server' directive
    - Implement `processSermonLink(url: string): Promise<ProcessingResult>` function
    - Step 1: Verify user role (admin or editor only) using existing auth utilities
    - Step 2: Check rate limit using `checkRateLimit()`
    - Step 3: Create processing log entry with status 'pending'
    - Step 4: Validate link using `validateMediaLink()`
    - Step 5: Update log to 'processing', extract transcript using `extractTranscript()`
    - Step 6: Generate summary using `generateSummary()`
    - Step 7: Generate SEO content using `generateSEO()`
    - Step 8: Update log to 'completed' with duration
    - Return ProcessingResult with success=true and draft data
    - Wrap in try/catch, update log to 'failed' on error, return user-friendly error
    - Add total timeout of 10 minutes (AI_PROCESSING_TIMEOUT_MS)
    - _Requirements: 1.4, 2.4, 3.3, 4.3, 5.4, 8.4, 9.1, 11.1, 14.5_
  
  - [ ]* 8.2 Write property test for database integrity on failure
    - **Property 9: Database Integrity on Failure**
    - **Validates: Requirements 9.4**
    - Simulate processing failures at various steps and verify database state unchanged (no partial records, sermons table count unchanged)
    - _Requirements: 9.4_
  
  - [ ]* 8.3 Write property test for role-based authorization enforcement
    - **Property 10: Role-Based Authorization Enforcement**
    - **Validates: Requirements 14.5**
    - Generate users with roles 'author' and 'member', verify processSermonLink returns Forbidden error and executes no processing steps
    - _Requirements: 14.5_
  
  - [ ]* 8.4 Write property test for rate limiting enforcement
    - **Property 11: Rate Limiting Enforcement**
    - **Validates: Requirements 8.1, 8.2**
    - Simulate 5 requests in past hour, verify 6th request returns rate limit error and executes no processing steps
    - Verify processing_logs shows exactly 5 requests for user in past hour
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 8.5 Write property test for processing event logging completeness
    - **Property 12: Processing Event Logging Completeness**
    - **Validates: Requirements 11.1, 11.4, 14.6**
    - Generate arbitrary processing requests (successful and failed), verify processing_logs entry created with user_id, link_url, status, duration_ms
    - Verify no sensitive data in logs (no full transcript, no passwords, no API keys)
    - _Requirements: 11.1, 11.4, 14.6_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement AI Link Processor UI component
  - [x] 10.1 Create AI Link Processor client component
    - Create `src/components/admin/sermons/ai-link-processor.tsx` as client component ('use client')
    - Define AILinkProcessorProps interface with onDraftGenerated callback
    - Add state: linkUrl, isProcessing, processingStep, error
    - Implement client-side URL validation (disable button if empty/whitespace)
    - Implement Process button handler that calls processSermonLink server action
    - Display loading indicator with current processing step (Step 1/3: Validating, Step 2/3: Extracting transcript, Step 3/3: Generating summary, Step 4/3: Optimizing for SEO)
    - Display error messages with dismissible alert
    - Call onDraftGenerated callback with draft data on success
    - Add Cancel button to abort processing
    - Clear link input after successful processing
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 12.1, 12.2, 12.4_
  
  - [ ]* 10.2 Write property test for whitespace-only input validation
    - **Property 3: Whitespace-Only Input Validation**
    - **Validates: Requirements 1.5**
    - Generate strings of whitespace characters (spaces, tabs, newlines), verify validation rejects them and Process button disabled
    - _Requirements: 1.5_
  
  - [ ]* 10.3 Write property test for input sanitization
    - **Property 13: Input Sanitization**
    - **Validates: Requirements 14.1**
    - Generate user input strings with malicious patterns (SQL injection, XSS, script tags), verify sanitization before database/API calls
    - _Requirements: 14.1_

- [x] 11. Implement Draft Review Modal UI component
  - [x] 11.1 Create Draft Review Modal client component
    - Create `src/components/admin/sermons/draft-review-modal.tsx` as client component ('use client')
    - Define DraftReviewModalProps interface (draft, isOpen, onClose, onSave)
    - Add state: formData (initialized from draft), showTranscript
    - Implement editable form fields: title, description, content, keywords, video_url, preacher, series, date, duration, thumbnail, status
    - Implement collapsible transcript viewer section
    - Implement Save as Draft button (calls onSave with status='draft')
    - Implement Publish button (calls onSave with status='published')
    - Implement Discard changes confirmation dialog
    - Add keyboard navigation and focus management
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 11.2 Implement draft-to-form-data mapping utility
    - Add `draftToFormData(draft: SermonDraft): SermonFormData` function
    - Map AI-generated fields: title, description, content, keywords, video_url
    - Set defaults: status='draft', date=today, preacher=null, series=null, duration=null, thumbnail=null
    - Generate slug from title using existing generateSlug utility
    - _Requirements: 7.1, 7.2, 7.4_
  
  - [ ]* 11.3 Write property test for draft data mapping correctness
    - **Property 8: Draft Data Mapping Correctness**
    - **Validates: Requirements 7.1, 7.2**
    - Generate arbitrary draft data, verify mapping preserves all values and doesn't populate unprovided fields
    - _Requirements: 7.1, 7.2_
  
  - [ ]* 11.4 Write property test for form accessibility labels
    - **Property 14: Form Accessibility Labels**
    - **Validates: Requirements 13.2**
    - Verify all form input elements have associated label elements with descriptive text
    - _Requirements: 13.2_
  
  - [ ]* 11.5 Write property test for button accessibility
    - **Property 15: Button Accessibility**
    - **Validates: Requirements 13.5**
    - Verify all button elements have descriptive labels and are keyboard-accessible
    - _Requirements: 13.5_

- [x] 12. Integrate AI Link Processor into Sermons Manager
  - [x] 12.1 Add AI Link Processor to sermon form
    - Open existing sermon form component (likely `src/app/admin/sermons/page.tsx` or similar)
    - Import AILinkProcessor component
    - Add conditional rendering based on isAIProcessorEnabled feature flag
    - Display AI Link Processor section above existing sermon fields
    - Implement onDraftGenerated handler to open Draft Review Modal
    - Display fallback message if AI processor disabled: "AI link processing is currently unavailable. Please enter sermon content manually."
    - _Requirements: 1.1, 15.3_
  
  - [x] 12.2 Add Draft Review Modal to sermon form
    - Import DraftReviewModal component
    - Add state for modal visibility and draft data
    - Implement onSave handler to save sermon record (draft or published)
    - Call revalidatePath('/sermons') and revalidatePath('/sermons/[slug]') after save
    - Implement onClose handler to discard draft and return to link input
    - _Requirements: 6.1, 6.5, 6.6, 6.7, 7.3_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Write integration tests for end-to-end flows
  - [ ]* 14.1 Write integration test for server action authorization
    - Test requests from users with role 'author' or 'member' are rejected with 403
    - Test requests from users with role 'admin' or 'editor' are allowed
    - _Requirements: 14.5_
  
  - [ ]* 14.2 Write integration test for rate limiting
    - Test 5 requests per hour per user are allowed
    - Test 6th request is blocked with rate limit error
    - Test counter resets after 1 hour
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 14.3 Write integration test for processing log creation
    - Test log entry inserted with correct user_id and status
    - Test log status updated as processing progresses
    - Test error message recorded on failure
    - _Requirements: 11.1, 11.2_
  
  - [ ]* 14.4 Write integration test for YouTube transcript extraction
    - Test transcript extraction from public video with captions (use real API, limited runs)
    - Test graceful handling of video without captions
    - Test graceful handling of private/deleted video
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ]* 14.5 Write integration test for Gemini API integration
    - Test summary generation from sample transcript (use real API, limited runs)
    - Test SEO content generation from sample transcript (use real API, limited runs)
    - Test graceful handling of API errors
    - _Requirements: 4.1, 4.4, 5.4, 5.5_

- [ ] 15. Write smoke tests for environment and database
  - [ ]* 15.1 Write smoke test for environment variables
    - Test GEMINI_API_KEY is present and non-empty
    - Test Gemini API is reachable (single test request)
    - _Requirements: 15.1, 15.2_
  
  - [ ]* 15.2 Write smoke test for database schema
    - Test processing_logs table exists
    - Test required indexes are present (idx_processing_logs_user_created, idx_processing_logs_status_created)
    - Test RLS policies are active
    - _Requirements: 8.3, 11.2_

- [x] 16. Add accessibility features
  - [x] 16.1 Add ARIA live regions for status updates
    - Add aria-live="polite" to loading indicator in AI Link Processor
    - Add aria-live="assertive" to error messages
    - Ensure status messages are announced to screen readers
    - _Requirements: 13.3_
  
  - [x] 16.2 Add keyboard navigation support
    - Ensure all interactive elements are keyboard-accessible (tab order, Enter/Space activation)
    - Add focus management for Draft Review Modal (trap focus, restore focus on close)
    - Test keyboard navigation flow through entire feature
    - _Requirements: 13.4, 13.5_
  
  - [x] 16.3 Add color-independent error indicators
    - Add error icon (not just red text) to error messages
    - Add "Error:" text prefix to error messages
    - Ensure error states are distinguishable without color
    - _Requirements: 13.6_

- [x] 17. Create documentation
  - [x] 17.1 Update .env.example file
    - Add AI processor configuration section with comments
    - Document GEMINI_API_KEY with link to get API key
    - Document AI_PROCESSING_TIMEOUT_MS with default value
    - Document AI_RATE_LIMIT_PER_HOUR with default value
    - _Requirements: 15.2_
  
  - [x] 17.2 Create deployment guide
    - Create `docs/sermon-ai-link-processor-deployment.md`
    - Document prerequisites (Gemini API key, database migration)
    - Document environment variable setup
    - Document database migration steps
    - Document feature flag behavior
    - Document monitoring and logging
    - _Requirements: 15.1, 15.3_
  
  - [x] 17.3 Create user guide
    - Create `docs/sermon-ai-link-processor-user-guide.md`
    - Document how to use AI Link Processor (paste link, process, review draft)
    - Document supported platforms (YouTube only initially)
    - Document error messages and recovery options
    - Document rate limits and processing timeouts
    - Add screenshots or diagrams
    - _Requirements: 1.1, 1.2, 1.4, 9.2, 12.1_

- [x] 18. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are implemented and tested
  - Verify accessibility compliance (WCAG 2.1 AA)
  - Verify error handling and recovery flows
  - Verify rate limiting and performance
  - Verify security and data privacy

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions and external service integrations
- The implementation uses TypeScript throughout, as specified in the design document
- All AI processing uses Google Gemini API (free tier) and YouTube Transcript API (free)
- The feature integrates seamlessly with the existing KDC Uganda CMS Platform Sermons CRUD Manager
