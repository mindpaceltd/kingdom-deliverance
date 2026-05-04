# Implementation Plan: Sermon Queue Processor

## Overview

This implementation plan breaks down the Sermon Queue Processor feature into discrete, actionable coding tasks. The feature transforms the existing synchronous sermon-ai-link-processor into a production-ready, queue-based system with asynchronous processing, fault tolerance, and horizontal scalability.

The implementation follows a layered approach:
1. **Foundation**: Redis setup, BullMQ configuration, database schema, environment configuration
2. **Core Services**: Job queue service, audio extractor, transcription service, Ollama AI service
3. **Worker Process**: Worker implementation, job processing pipeline, error handling, retry logic
4. **Server Actions**: Job management APIs, status queries, rate limiting
5. **UI Components**: Queue-based link processor, job status dashboard, progress tracking
6. **Python Integration**: Transcription script, Python-Node.js communication
7. **Testing**: Unit tests, integration tests, property-based tests, smoke tests
8. **Deployment**: Docker Compose, health checks, migration guide, documentation

All tasks build incrementally, with each step validating functionality before proceeding to the next.

---

## Tasks

- [x] 1. Set up infrastructure and foundation
  - [x] 1.1 Install and configure Redis
    - Install Redis server (v6+) locally or via Docker
    - Configure Redis with persistence (AOF or RDB)
    - Test Redis connectivity with `redis-cli ping`
    - Document Redis setup in deployment guide
    - _Requirements: 1.1, 1.3, 14.1, 18.4_
  
  - [x] 1.2 Install BullMQ and configure queue
    - Install `bullmq` and `ioredis` npm packages
    - Create Redis connection configuration
    - Test BullMQ queue creation and basic operations
    - _Requirements: 1.1, 1.2_
  
  - [x] 1.3 Extend database schema for queue processor
    - Create migration to add `job_id`, `retry_count`, `processing_step` columns to `processing_logs` table
    - Create index on `job_id` column: `idx_processing_logs_job_id`
    - Test migration in development environment
    - _Requirements: 13.1, 13.2_
  
  - [x] 1.4 Add environment variables and validation
    - Update `.env.example` with queue processor configuration variables (REDIS_URL, OLLAMA_ENDPOINT, WHISPER_MODEL, WORKER_CONCURRENCY, timeouts, rate limits)
    - Extend `src/lib/env.ts` to validate queue processor environment variables
    - Add `queueProcessorEnv` export with all configuration values
    - Add `isQueueProcessorEnabled` feature flag based on Redis and Ollama configuration
    - _Requirements: 14.4, 15.1, 20.1_
  
  - [x] 1.5 Create TypeScript types for queue processor
    - Add `SermonJobData` interface (jobId, userId, videoUrl, priority, createdAt)
    - Add `SermonJobResult` interface (draft, processingDuration)
    - Add `JobProgress` interface (status, percentage, currentStep, estimatedTimeRemaining)
    - Add `JobStatus` type union (waiting, active, extracting_audio, transcribing, summarizing, generating_seo, completed, failed, stalled)
    - Add `JobInfo` interface for dashboard (id, videoUrl, status, progress, createdAt, completedAt, errorMessage)
    - _Requirements: 1.5, 6.1, 12.2_

- [x] 2. Implement job queue service
  - [x] 2.1 Create job queue service class
    - Create `src/lib/services/job-queue.ts`
    - Implement `JobQueueService` class with BullMQ Queue initialization
    - Configure default job options: attempts=3, exponential backoff (1min, 5min, 15min), retention (7 days)
    - _Requirements: 1.1, 1.2, 1.3, 7.1_
  
  - [x] 2.2 Implement job enqueueing with deduplication
    - Implement `enqueueJob(userId, videoUrl, priority)` method
    - Implement URL normalization: remove query params (except video ID), lowercase, trim
    - Implement deduplication key generation: `hash(normalize(videoUrl))`
    - Check for existing job with same deduplication key in past 24 hours
    - Return existing job ID if duplicate found (unless status is 'failed')
    - Store deduplication key in Redis with 24-hour TTL
    - _Requirements: 1.2, 1.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 2.3 Implement job status query methods
    - Implement `getJobStatus(jobId)` method returning JobProgress
    - Implement `getJobDraft(jobId)` method fetching draft from Redis
    - Implement `cancelJob(jobId)` method for waiting jobs only
    - _Requirements: 1.7, 11.5, 12.8_
  
  - [x] 2.4 Write unit tests for job queue service
    - Test URL normalization for various formats (YouTube, Vimeo, etc.)
    - Test deduplication key generation consistency
    - Test duplicate job detection and handling
    - Test job enqueueing with different priorities
    - _Requirements: 1.6, 9.1, 9.6, 19.1_

- [x] 3. Implement audio extraction service
  - [x] 3.1 Install yt-dlp and ffmpeg
    - Install yt-dlp via package manager or pip
    - Install ffmpeg and ffprobe for audio validation
    - Test yt-dlp with sample YouTube video
    - Document installation steps in deployment guide
    - _Requirements: 3.1, 3.2, 14.1_
  
  - [x] 3.2 Create audio extractor service
    - Create `src/lib/services/audio-extractor.ts`
    - Implement `AudioExtractor.extractAudio(videoUrl, jobId)` method
    - Use yt-dlp to download audio in m4a format (fallback to mp3)
    - Save audio files to temporary directory with pattern: `{jobId}_{timestamp}.m4a`
    - Add 10-minute timeout for audio extraction
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  
  - [x] 3.3 Implement audio validation and cleanup
    - Implement `validateDuration(audioPath)` method using ffprobe
    - Reject videos longer than 3 hours with error message
    - Implement `deleteAudioFile(audioPath)` method
    - Add error handling for private/unavailable videos
    - _Requirements: 3.6, 3.7, 3.8_
  
  - [x] 3.4 Write unit tests for audio extractor
    - Test audio file naming pattern
    - Test duration validation logic
    - Test cleanup after successful extraction
    - Test error handling for invalid URLs
    - _Requirements: 3.4, 3.8, 19.1_

- [x] 4. Implement transcription service
  - [x] 4.1 Install faster-whisper Python library
    - Create Python virtual environment
    - Install faster-whisper: `pip install faster-whisper`
    - Download Whisper 'base' model (first run will download automatically)
    - Test faster-whisper with sample audio file
    - Document installation steps in deployment guide
    - _Requirements: 4.1, 4.2, 14.1_
  
  - [x] 4.2 Create Python transcription script
    - Create `scripts/transcribe.py`
    - Load faster-whisper model (configurable: base, small, medium, large)
    - Implement transcription with VAD (voice activity detection)
    - Report progress to stderr: `PROGRESS:0.45`
    - Output JSON result to stdout with segments array
    - Add error handling and exit codes
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  
  - [x] 4.3 Create Node.js transcription service
    - Create `src/lib/services/transcription-service.ts`
    - Implement `TranscriptionService.transcribe(audioPath, onProgress)` method
    - Spawn Python process with transcribe.py script
    - Parse progress updates from stderr
    - Parse JSON result from stdout
    - Add 30-minute timeout for transcription
    - Combine transcript segments into formatted text
    - _Requirements: 4.3, 4.4, 4.5, 4.6_
  
  - [x] 4.4 Implement transcript validation
    - Validate transcript length: minimum 100 words
    - Add error handling for corrupted audio, unsupported formats
    - Add language detection support
    - _Requirements: 4.7, 4.8, 4.9_
  
  - [x] 4.5 Write unit tests for transcription service
    - Test transcript segment formatting
    - Test word count validation
    - Test progress callback invocation
    - Test error handling for short transcripts
    - _Requirements: 4.4, 4.8, 19.1_

- [x] 5. Implement Ollama AI service
  - [x] 5.1 Install and configure Ollama
    - Install Ollama from https://ollama.ai/
    - Start Ollama server: `ollama serve`
    - Download Mistral model: `ollama pull mistral`
    - Test Ollama API with curl
    - Document installation steps in deployment guide
    - _Requirements: 5.1, 5.2, 14.1_
  
  - [x] 5.2 Create Ollama AI service
    - Create `src/lib/services/ollama-ai-service.ts`
    - Implement `OllamaAIService.generateSummary(transcript)` method
    - Use Ollama HTTP API at configurable endpoint (default: http://localhost:11434)
    - Create prompt for comprehensive 1500+ word sermon summary
    - Add 10-minute timeout for summarization
    - Validate summary length: minimum 100 words
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.8_
  
  - [x] 5.3 Implement SEO content generation
    - Implement `OllamaAIService.generateSEO(transcript, summary)` method
    - Create prompt for SEO metadata (title 50-70 chars, description 150-160 chars, 5-8 keywords)
    - Parse JSON response from Ollama (handle markdown code blocks)
    - Validate response structure and constraints
    - Add 5-minute timeout for SEO generation
    - _Requirements: 5.5, 5.6, 5.8_
  
  - [x] 5.4 Implement error handling and retry logic
    - Handle Ollama unavailable (ECONNREFUSED) with clear error message
    - Handle timeout errors
    - Classify errors as retryable vs non-retryable
    - _Requirements: 5.7, 7.2_
  
  - [x] 5.5 Write unit tests for Ollama AI service
    - Test JSON parsing from markdown code blocks
    - Test SEO response structure validation
    - Test summary length validation
    - Test error handling for Ollama unavailable
    - _Requirements: 5.8, 19.1_

- [x] 6. Checkpoint - Ensure all services are functional
  - Test Redis connectivity
  - Test BullMQ queue operations
  - Test yt-dlp audio extraction
  - Test faster-whisper transcription
  - Test Ollama AI generation
  - Ask the user if questions arise

- [x] 7. Implement worker process
  - [x] 7.1 Create worker process entry point
    - Create `src/workers/sermon-processor.ts`
    - Initialize Redis connection
    - Create BullMQ Worker with job processor function
    - Configure worker options: concurrency, lockDuration (60 min), stalledInterval (1 min)
    - _Requirements: 2.1, 2.2, 2.7, 8.1, 8.5_
  
  - [x] 7.2 Implement job processing pipeline
    - Implement job processor function with steps: extract audio → transcribe → summarize → generate SEO → store draft
    - Update job progress after each step: extracting_audio (10%), transcribing (30%), summarizing (70%), generating_seo (90%), completed (100%)
    - Call AudioExtractor.extractAudio() for step 1
    - Call TranscriptionService.transcribe() for step 2 with progress callback
    - Call OllamaAIService.generateSummary() for step 3
    - Call OllamaAIService.generateSEO() for step 4
    - Store draft in Redis with 24-hour TTL keyed by job_id
    - _Requirements: 2.3, 2.4, 6.1, 11.5_
  
  - [x] 7.3 Implement error handling and logging
    - Wrap processing in try/catch block
    - Log processing events to processing_logs table (job_id, user_id, video_url, status, duration, error_message)
    - Clean up audio file on success or failure
    - Classify errors as retryable vs non-retryable
    - Throw error to trigger BullMQ retry logic
    - _Requirements: 7.2, 7.6, 13.1, 13.5, 15.4_
  
  - [x] 7.4 Implement graceful shutdown
    - Add SIGTERM and SIGINT signal handlers
    - Call `worker.close()` to finish current job before exiting
    - Log shutdown events
    - _Requirements: 2.5_
  
  - [x] 7.5 Add worker event listeners
    - Add 'completed' event listener to log successful jobs
    - Add 'failed' event listener to log failed jobs
    - Add 'stalled' event listener to log stalled jobs
    - _Requirements: 8.6, 13.1_
  
  - [x] 7.6 Create worker startup script
    - Add `worker` script to package.json: `"worker": "tsx src/workers/sermon-processor.ts"`
    - Test worker startup and job processing
    - Document worker startup in deployment guide
    - _Requirements: 14.5_

- [x] 8. Implement rate limiting service
  - [x] 8.1 Create rate limiter service
    - Create `src/lib/services/rate-limiter.ts`
    - Implement `checkRateLimit(userId, limit)` function
    - Use Redis to track rate limit counters with 1-hour sliding window
    - Key format: `ratelimit:{userId}:{hour_timestamp}`
    - Return true if under limit, false if exceeded
    - _Requirements: 10.1, 10.3_
  
  - [x] 8.2 Write unit tests for rate limiter
    - Test rate limit counter increments
    - Test rate limit enforcement (10 jobs per hour)
    - Test counter reset after 1 hour
    - Test concurrent requests
    - _Requirements: 10.1, 10.3, 19.1_

- [x] 9. Implement server actions for job management
  - [x] 9.1 Create sermon queue processor server actions
    - Create `src/lib/actions/sermon-queue-processor.ts` with 'use server' directive
    - Implement `processSermonLink(url)` function
    - Step 1: Verify user role (admin or editor only)
    - Step 2: Check rate limit (10 jobs per hour)
    - Step 3: Validate URL format (non-empty, trimmed)
    - Step 4: Enqueue job using JobQueueService
    - Return job ID on success
    - _Requirements: 1.2, 10.1, 15.1, 15.2_
  
  - [x] 9.2 Implement job status query actions
    - Implement `getJobStatus(jobId)` function
    - Call JobQueueService.getJobStatus()
    - Return status and progress
    - _Requirements: 1.7, 6.2_
  
  - [x] 9.3 Implement job draft retrieval action
    - Implement `getJobDraft(jobId)` function
    - Call JobQueueService.getJobDraft()
    - Return draft data
    - _Requirements: 11.6, 12.6_
  
  - [x] 9.4 Implement job cancellation action
    - Implement `cancelJob(jobId)` function
    - Call JobQueueService.cancelJob()
    - Return success or error
    - _Requirements: 12.8_
  
  - [x] 9.5 Implement user jobs query action
    - Implement `getUserJobs(filter)` function
    - Query BullMQ for user's jobs with status filter
    - Return list of JobInfo objects
    - _Requirements: 12.1, 12.3, 12.4, 15.7_

- [x] 10. Checkpoint - Ensure all backend services are functional
  - Test job enqueueing via server action
  - Test worker consuming and processing jobs
  - Test job status queries
  - Test rate limiting
  - Ask the user if questions arise

- [x] 11. Implement UI components
  - [x] 11.1 Create queue-based AI link processor component
    - Create `src/components/admin/sermons/ai-link-processor-queue.tsx` as client component ('use client')
    - Add state: linkUrl, jobId, status, error, isProcessing
    - Implement URL input field with validation
    - Implement "Process Video" button that calls processSermonLink server action
    - Display job ID and "Processing started" message on success
    - _Requirements: 11.1, 11.2_
  
  - [x] 11.2 Implement progress tracking with polling
    - Add useEffect hook to poll getJobStatus every 2 seconds while processing
    - Update status state with current progress
    - Display progress bar with percentage and current step label
    - Display estimated time remaining (if available)
    - Stop polling when job completes or fails
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [x] 11.3 Implement completion and error handling
    - When job completes, fetch draft using getJobDraft
    - Call onDraftGenerated callback with draft data
    - Open Draft Review Modal (reuse existing component)
    - Display error message and recovery options on failure
    - Clear form after successful completion
    - _Requirements: 6.6, 6.7, 11.6, 11.7_
  
  - [x] 11.4 Add accessibility features
    - Add aria-live="polite" to progress indicator
    - Add aria-live="assertive" to error messages
    - Add aria-label to progress bar with current step and percentage
    - Ensure keyboard navigation works correctly
    - _Requirements: 17.1, 17.3, 17.5_
  
  - [x] 11.5 Create job status dashboard page
    - Create `src/app/admin/sermons/jobs/page.tsx`
    - Display table with columns: Video URL, Status, Progress, Submitted At, Completed At, Actions
    - Implement status filter buttons: All, Waiting, Active, Completed, Failed
    - Implement sorting by submission date (newest first)
    - Poll getUserJobs every 5 seconds to refresh data
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [x] 11.6 Implement job actions in dashboard
    - Add "View Draft" button for completed jobs (opens Draft Review Modal)
    - Add "Retry" button for failed jobs (creates new job with same URL)
    - Add "Cancel" button for waiting jobs (calls cancelJob action)
    - Disable actions based on job status
    - _Requirements: 12.5, 12.6, 12.7, 12.8_
  
  - [x] 11.7 Add accessibility features to dashboard
    - Ensure table is keyboard-navigable
    - Add proper focus management
    - Add screen reader announcements for status changes
    - Use color-independent status indicators (icons + text)
    - _Requirements: 17.2, 17.4, 17.5, 17.6_

- [x] 12. Integrate queue processor with sermon form
  - [x] 12.1 Add feature flag to sermon form
    - Import `isQueueProcessorEnabled` from env.ts
    - Conditionally render AILinkProcessorQueue or AILinkProcessor based on feature flag
    - Display fallback message if queue processor disabled
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [x] 12.2 Add navigation hint for background processing
    - Display message: "Processing in background. Check back later or view status at /admin/sermons/jobs/{job_id}"
    - Allow users to navigate away while job processes
    - _Requirements: 11.4_
  
  - [x] 12.3 Reuse existing Draft Review Modal
    - Ensure Draft Review Modal works with queue processor drafts
    - Test save as draft and publish functionality
    - _Requirements: 11.7_

- [x] 13. Checkpoint - Ensure all UI components are functional
  - Test queue-based link processor in sermon form
  - Test progress tracking and polling
  - Test job status dashboard
  - Test job actions (view draft, retry, cancel)
  - Ask the user if questions arise

- [x] 14. Implement monitoring and health check endpoints
  - [x] 14.1 Create health check API endpoint
    - Create `src/app/api/health/queue/route.ts`
    - Check Redis connectivity
    - Check Ollama availability
    - Query BullMQ for worker count, active jobs, queue length, failed jobs count
    - Return JSON with service statuses
    - _Requirements: 13.3_
  
  - [x] 14.2 Create metrics API endpoint
    - Create `src/app/api/metrics/queue/route.ts`
    - Query processing_logs for jobs processed (last hour/day)
    - Calculate average processing time
    - Calculate success rate and failure rate
    - Return JSON with metrics
    - _Requirements: 13.4_
  
  - [x] 14.3 Implement alerting logic
    - Add logging for critical conditions: queue length > 100, failed jobs > 10 in past hour, worker count = 0, Redis connection lost
    - Log warnings with context
    - _Requirements: 13.7_

- [x] 15. Write tests
  - [x] 15.1 Write unit tests for URL normalization
    - Test YouTube URL normalization (remove query params except video ID)
    - Test other platform URL normalization (hostname + pathname)
    - Test case-insensitive normalization
    - Test whitespace trimming
    - _Requirements: 9.6, 19.1_
  
  - [x] 15.2 Write unit tests for deduplication key generation
    - Test consistent key generation for same video
    - Test different keys for different videos
    - Test URL variation handling (http vs https, www vs non-www)
    - _Requirements: 9.1, 19.1_
  
  - [x] 15.3 Write unit tests for error classification
    - Test retryable error detection (timeout, ECONNREFUSED, etc.)
    - Test non-retryable error detection (video deleted, invalid URL, etc.)
    - _Requirements: 7.2, 19.1_
  
  - [x] 15.4 Write integration test for job enqueueing and consumption
    - Enqueue job and verify it appears in Redis
    - Start worker and verify it consumes job
    - Verify job status updates throughout lifecycle
    - _Requirements: 1.2, 2.2, 19.2_
  
  - [x] 15.5 Write integration test for deduplication logic
    - Submit same URL twice and verify same job ID returned
    - Submit different URLs and verify different job IDs
    - Test deduplication expiration after 24 hours
    - _Requirements: 9.2, 9.3, 9.5, 19.2_
  
  - [x] 15.6 Write integration test for rate limiting
    - Submit 10 jobs and verify all succeed
    - Submit 11th job and verify rate limit error
    - Wait 1 hour and verify counter resets
    - _Requirements: 10.1, 10.2, 19.2_
  
  - [x] 15.7 Write integration test for retry logic
    - Simulate retryable error and verify job retries
    - Verify retry count increments
    - Verify job moves to dead letter queue after 3 failures
    - _Requirements: 7.1, 7.3, 7.5, 19.2_
  
  - [x] 15.8 Write integration test for stalled job detection
    - Simulate worker crash mid-job
    - Verify job marked as stalled
    - Verify job retries automatically
    - _Requirements: 8.1, 8.2, 8.4, 19.2_
  
  - [x] 15.9 Write property test for progress updates at milestones
    - **Property 1: Progress Updates at Milestones**
    - Generate arbitrary job processing scenarios
    - Verify progress updates occur at specified milestones (0%, 10%, 30%, 70%, 90%, 100%)
    - Verify percentage is monotonically increasing
    - _Requirements: 2.4, 6.1_
  
  - [x] 15.10 Write property test for error handling and status updates
    - **Property 2: Error Handling and Status Updates**
    - Generate arbitrary processing errors
    - Verify job marked as 'failed' with error message
    - Verify error message includes failure reason
    - Verify no sensitive data in error message
    - _Requirements: 3.6, 4.7, 5.7, 15.5_
  
  - [x] 15.11 Write property test for temporary file cleanup
    - **Property 3: Temporary File Cleanup**
    - Generate arbitrary job processing scenarios (success and failure)
    - Verify temporary audio file deleted after processing
    - _Requirements: 3.7, 15.4_
  
  - [x] 15.12 Write property test for retry logic with exponential backoff
    - **Property 4: Retry Logic with Exponential Backoff**
    - Generate arbitrary retryable errors
    - Verify job retries up to 3 times with correct delays (1min, 5min, 15min)
    - Verify job moves to dead letter queue after 3 failures
    - Verify non-retryable errors don't trigger retry
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 15.13 Write property test for job deduplication and idempotency
    - **Property 5: Job Deduplication and Idempotency**
    - Generate arbitrary video URLs
    - Submit same URL multiple times within 24 hours
    - Verify same job ID returned for duplicate submissions
    - Verify new job created for failed job retry
    - Verify URL normalization produces consistent keys
    - _Requirements: 1.6, 9.1, 9.2, 9.3, 9.4, 9.6_
  
  - [x] 15.14 Write property test for rate limiting enforcement
    - **Property 6: Rate Limiting Enforcement**
    - Generate arbitrary user job submissions
    - Submit 10 jobs within 1 hour
    - Verify 11th job returns rate limit error
    - Verify counter resets after 1 hour
    - _Requirements: 10.1, 10.3_
  
  - [x] 15.15 Write property test for input validation and rejection
    - **Property 7: Input Validation and Rejection**
    - Generate arbitrary video durations
    - Verify videos > 3 hours rejected
    - Generate arbitrary transcript lengths
    - Verify transcripts < 100 words rejected
    - _Requirements: 3.8, 4.8_
  
  - [x] 15.16 Write smoke test for infrastructure dependencies
    - Test Redis connectivity
    - Test Ollama availability
    - Test faster-whisper installation
    - Test yt-dlp installation
    - Test required environment variables set
    - _Requirements: 14.1, 19.4_
  
  - [x] 15.17 Write smoke test for database schema
    - Test processing_logs table has required columns (job_id, retry_count, processing_step)
    - Test required indexes present (idx_processing_logs_job_id)
    - _Requirements: 13.1, 19.4_

- [x] 16. Create deployment configuration and documentation
  - [x] 16.1 Create Docker Compose configuration
    - Create `docker-compose.yml` with services: redis, ollama, worker
    - Configure Redis with persistence (AOF)
    - Configure Ollama with model volume
    - Configure worker with replicas=3
    - Test Docker Compose setup locally
    - _Requirements: 14.2_
  
  - [x] 16.2 Create health check script
    - Create `scripts/health-check.sh`
    - Check Redis connectivity
    - Check Ollama availability
    - Check faster-whisper installation
    - Check yt-dlp installation
    - Exit with error code if any check fails
    - _Requirements: 14.7_
  
  - [x] 16.3 Create deployment guide
    - Create `docs/sermon-queue-processor-deployment.md`
    - Document prerequisites (Redis, Python, Ollama, yt-dlp, ffmpeg)
    - Document installation steps for each dependency
    - Document environment variable configuration
    - Document worker startup and scaling
    - Document health check usage
    - Document monitoring and troubleshooting
    - _Requirements: 14.3, 14.4, 14.5, 14.6_
  
  - [x] 16.4 Create migration guide
    - Create `docs/sermon-queue-processor-migration.md`
    - Document feature flag usage (ENABLE_QUEUE_PROCESSOR)
    - Document gradual rollout strategy (admin users first, then all users)
    - Document rollback procedure
    - Document backward compatibility considerations
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_
  
  - [x] 16.5 Update .env.example file
    - Add queue processor configuration section with comments
    - Document all environment variables with default values
    - Add links to installation guides for dependencies
    - _Requirements: 14.4_

- [-] 17. Final checkpoint - Ensure all features are complete
  - Run health check script and verify all services healthy
  - Test end-to-end job processing (enqueue → worker → draft)
  - Test job status dashboard with multiple jobs
  - Test rate limiting enforcement
  - Test retry logic with simulated failures
  - Test graceful degradation when services unavailable
  - Run all tests and verify they pass
  - Review deployment documentation
  - Ask the user if questions arise

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions and external service integrations
- The implementation uses TypeScript throughout, as specified in the design document
- All processing uses free, self-hosted services: yt-dlp, faster-whisper, Ollama
- The feature integrates seamlessly with the existing KDC Uganda CMS Platform Sermons CRUD Manager
- The system is designed for horizontal scalability: add more workers to increase throughput
- The system is fault-tolerant: automatic retries, stalled job detection, graceful degradation
