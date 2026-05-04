# Requirements Document — Sermon Queue Processor

## Introduction

The Sermon Queue Processor is a production-ready, queue-based sermon processing system that extends the existing sermon-ai-link-processor feature. It addresses critical limitations of the current system: dependency on the unreliable Gemini API, restriction to YouTube videos with captions, and synchronous blocking processing.

This system enables asynchronous processing of ANY video (not just captioned YouTube videos) using free, self-hosted AI services. It provides a robust, fault-tolerant architecture with real-time progress updates, horizontal scalability, and comprehensive error recovery.

The system integrates seamlessly with the existing sermon workflow while providing a superior user experience through non-blocking operations, real-time status tracking, and the ability to process videos from any platform.

---

## Glossary

- **Queue_System**: BullMQ-based job queue backed by Redis for managing asynchronous sermon processing jobs.
- **Processing_Job**: A unit of work representing one video to be processed (audio extraction → transcription → AI processing).
- **Job_Queue**: The Redis-backed queue containing pending, active, completed, and failed jobs.
- **Worker_Process**: A separate Node.js process that consumes jobs from the queue and executes processing steps.
- **Audio_Extractor**: The yt-dlp tool that downloads audio from video URLs (supports YouTube, Vimeo, and 1000+ platforms).
- **Transcription_Engine**: The Whisper (faster-whisper) Python library that converts audio to text.
- **AI_Processor**: Ollama with Mistral/Llama models for summarization and SEO generation.
- **Job_Status**: The current state of a processing job (waiting, active, transcribing, summarizing, completed, failed, stalled).
- **Progress_Tracker**: Real-time progress updates sent to the UI via WebSocket or polling.
- **Retry_Strategy**: Automatic retry logic for failed jobs with exponential backoff.
- **Idempotency**: The guarantee that processing the same video multiple times produces the same result without side effects.
- **Horizontal_Scaling**: The ability to add more worker processes to increase processing throughput.
- **Job_Timeout**: Maximum time allowed for a job to complete before being marked as stalled.
- **Rate_Limiter**: Mechanism to prevent queue flooding and ensure fair resource usage.
- **Dead_Letter_Queue**: Storage for jobs that have failed all retry attempts for manual investigation.
- **Health_Check**: Endpoint to verify queue, Redis, and worker health status.
- **Sermon_Draft**: The final output containing title, description, content, keywords, video_url, and transcript.

---

## Requirements

### Requirement 1: Queue-Based Job Management

**User Story:** As the system, I want to manage sermon processing jobs in a persistent queue, so that processing is asynchronous, fault-tolerant, and scalable.

#### Acceptance Criteria

1. THE Queue_System SHALL use BullMQ with Redis as the backing store for job persistence.
2. WHEN a user submits a video URL, THE System SHALL enqueue a Processing_Job with status 'waiting' and return a job ID immediately without blocking.
3. THE Job_Queue SHALL persist jobs to Redis, ensuring jobs survive server restarts and crashes.
4. THE Queue_System SHALL support job priorities (high, normal, low) to allow urgent processing.
5. THE Queue_System SHALL track job metadata: job_id, user_id, video_url, status, progress_percentage, current_step, created_at, started_at, completed_at, error_message.
6. THE Queue_System SHALL provide job deduplication: submitting the same video URL within 24 hours SHALL return the existing job ID instead of creating a duplicate.
7. THE Queue_System SHALL expose job status query API: `getJobStatus(jobId)` returning current status and progress.

---

### Requirement 2: Worker Process Architecture

**User Story:** As the system, I want separate worker processes to consume and execute jobs, so that processing is isolated from the web server and horizontally scalable.

#### Acceptance Criteria

1. THE System SHALL run Worker_Process instances as separate Node.js processes independent of the Next.js web server.
2. WHEN a Worker_Process starts, THE Worker SHALL connect to Redis and begin consuming jobs from the Job_Queue.
3. THE Worker_Process SHALL process jobs sequentially: extract audio → transcribe → summarize → generate SEO → mark complete.
4. THE Worker_Process SHALL update job progress after each step: 'active' (0%), 'extracting_audio' (10%), 'transcribing' (30%), 'summarizing' (70%), 'generating_seo' (90%), 'completed' (100%).
5. THE Worker_Process SHALL handle graceful shutdown: on SIGTERM/SIGINT, finish current job before exiting.
6. THE System SHALL support multiple concurrent Worker_Process instances for horizontal scaling (e.g., 3 workers processing 3 jobs simultaneously).
7. THE Worker_Process SHALL have a configurable concurrency limit (default: 1 job per worker to avoid resource contention).

---

### Requirement 3: Audio Extraction from Any Video Platform

**User Story:** As a user, I want to process videos from any platform (not just YouTube with captions), so that I can generate sermon content from any video source.

#### Acceptance Criteria

1. THE Audio_Extractor SHALL use yt-dlp to download audio from video URLs.
2. THE Audio_Extractor SHALL support YouTube, Vimeo, Facebook, Instagram, TikTok, and 1000+ platforms supported by yt-dlp.
3. WHEN extracting audio, THE Audio_Extractor SHALL download audio in the highest quality available format (prefer m4a, fallback to mp3).
4. THE Audio_Extractor SHALL save audio files to a temporary directory with naming pattern: `{job_id}_{timestamp}.m4a`.
5. THE Audio_Extractor SHALL have a timeout of 10 minutes per video to prevent indefinite downloads.
6. IF audio extraction fails (video unavailable, private, region-blocked), THE Worker SHALL mark the job as 'failed' with error message "Failed to download audio: {reason}".
7. THE Audio_Extractor SHALL delete temporary audio files after transcription completes to conserve disk space.
8. THE Audio_Extractor SHALL validate video duration: videos longer than 3 hours SHALL be rejected with error "Video too long (max 3 hours)".

---

### Requirement 4: Whisper Transcription Engine

**User Story:** As the system, I want to transcribe audio using Whisper, so that I can generate text from any video regardless of caption availability.

#### Acceptance Criteria

1. THE Transcription_Engine SHALL use faster-whisper Python library for speech-to-text conversion.
2. THE Transcription_Engine SHALL use the 'base' Whisper model by default (balance of speed and accuracy).
3. WHEN transcribing audio, THE Transcription_Engine SHALL process the audio file and return timestamped transcript segments.
4. THE Transcription_Engine SHALL combine transcript segments into full text with proper punctuation and capitalization.
5. THE Transcription_Engine SHALL have a timeout of 30 minutes for transcription (allows processing of long sermons).
6. THE Transcription_Engine SHALL update job progress during transcription: report percentage based on audio duration processed.
7. IF transcription fails (corrupted audio, unsupported format, out of memory), THE Worker SHALL mark the job as 'failed' with error message "Transcription failed: {reason}".
8. THE Transcription_Engine SHALL validate transcript length: transcripts shorter than 100 words SHALL be rejected with error "Transcript too short (min 100 words)".
9. THE Transcription_Engine SHALL support language detection: automatically detect sermon language (default: English).

---

### Requirement 5: Ollama AI Integration

**User Story:** As the system, I want to use self-hosted Ollama for AI processing, so that I have no dependency on paid external APIs.

#### Acceptance Criteria

1. THE AI_Processor SHALL use Ollama with Mistral or Llama models for summarization and SEO generation.
2. THE AI_Processor SHALL connect to Ollama via HTTP API at configurable endpoint (default: http://localhost:11434).
3. WHEN generating a summary, THE AI_Processor SHALL pass the full transcript to Ollama and request a comprehensive 1500+ word summary.
4. THE AI_Processor SHALL generate summaries that include: main themes, key scripture references, actionable takeaways, sermon structure, and detailed explanations.
5. WHEN generating SEO content, THE AI_Processor SHALL request: title (50-70 chars), description (150-160 chars), and 5-8 keywords.
6. THE AI_Processor SHALL have a timeout of 10 minutes for summarization and 5 minutes for SEO generation.
7. IF Ollama is unavailable or returns an error, THE Worker SHALL mark the job as 'failed' with error message "AI service unavailable: {reason}".
8. THE AI_Processor SHALL validate AI outputs: summaries < 100 words or SEO titles > 100 chars SHALL trigger retry with adjusted prompt.

---

### Requirement 6: Real-Time Progress Updates

**User Story:** As a user, I want to see real-time progress updates while my video is processing, so that I know the current status and estimated completion time.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL update job progress after each processing step: 'waiting' (0%), 'extracting_audio' (10%), 'transcribing' (30%), 'summarizing' (70%), 'generating_seo' (90%), 'completed' (100%).
2. THE UI SHALL poll the job status API every 2 seconds while a job is active to fetch current progress.
3. THE UI SHALL display a progress bar with percentage and current step label (e.g., "Transcribing audio... 45%").
4. THE UI SHALL display estimated time remaining based on average processing duration for similar video lengths.
5. THE UI SHALL allow users to navigate away from the page and return later: job status persists in Redis and can be queried by job ID.
6. WHEN a job completes, THE UI SHALL display a success notification and open the Draft Review Modal automatically.
7. WHEN a job fails, THE UI SHALL display the error message and provide retry and manual entry options.

---

### Requirement 7: Error Handling and Retry Strategy

**User Story:** As the system, I want automatic retry logic for transient failures, so that temporary issues don't require manual intervention.

#### Acceptance Criteria

1. THE Queue_System SHALL automatically retry failed jobs up to 3 times with exponential backoff (1 min, 5 min, 15 min).
2. THE Queue_System SHALL distinguish between retryable errors (network timeout, Ollama unavailable) and non-retryable errors (video deleted, invalid URL).
3. WHEN a job fails with a retryable error, THE Queue_System SHALL increment the retry count and re-enqueue the job with delay.
4. WHEN a job fails with a non-retryable error, THE Queue_System SHALL mark the job as 'failed' immediately without retry.
5. WHEN a job exceeds maximum retry attempts, THE Queue_System SHALL move the job to the Dead_Letter_Queue for manual investigation.
6. THE Worker_Process SHALL log all errors with full context: job_id, user_id, video_url, error_message, stack_trace, retry_count.
7. THE UI SHALL display retry status: "Processing failed. Retrying in 5 minutes... (Attempt 2 of 3)".

---

### Requirement 8: Job Timeout and Stalled Job Detection

**User Story:** As the system, I want to detect and recover from stalled jobs, so that hung workers don't block the queue indefinitely.

#### Acceptance Criteria

1. THE Queue_System SHALL set a job timeout of 60 minutes: jobs not completed within 60 minutes SHALL be marked as 'stalled'.
2. WHEN a job is marked as 'stalled', THE Queue_System SHALL automatically retry the job (counts toward retry limit).
3. THE Worker_Process SHALL send heartbeat signals every 30 seconds while processing a job to indicate it's still alive.
4. IF a Worker_Process crashes mid-job, THE Queue_System SHALL detect the missing heartbeat and mark the job as 'stalled' after 2 minutes.
5. THE Queue_System SHALL have a stalled job checker that runs every 1 minute to identify and recover stalled jobs.
6. THE System SHALL log stalled jobs for monitoring: "Job {job_id} stalled after {duration}. Retrying...".

---

### Requirement 9: Idempotency and Job Deduplication

**User Story:** As the system, I want to prevent duplicate processing of the same video, so that resources aren't wasted and users get consistent results.

#### Acceptance Criteria

1. THE Queue_System SHALL generate a deduplication key from the video URL: `hash(normalize(video_url))`.
2. WHEN a user submits a video URL, THE Queue_System SHALL check if a job with the same deduplication key exists in the past 24 hours.
3. IF a duplicate job exists with status 'waiting', 'active', or 'completed', THE Queue_System SHALL return the existing job ID instead of creating a new job.
4. IF a duplicate job exists with status 'failed', THE Queue_System SHALL allow creating a new job (user is retrying).
5. THE Queue_System SHALL store deduplication keys in Redis with 24-hour TTL.
6. THE Queue_System SHALL normalize video URLs before hashing: remove query params (except video ID), convert to lowercase, trim whitespace.

---

### Requirement 10: Rate Limiting and Resource Management

**User Story:** As the system, I want to prevent queue flooding and ensure fair resource usage, so that the system remains responsive for all users.

#### Acceptance Criteria

1. THE Queue_System SHALL enforce a rate limit of 10 job submissions per user per hour.
2. WHEN a user exceeds the rate limit, THE System SHALL return error "Rate limit exceeded. You can submit 10 videos per hour. Try again in {minutes} minutes."
3. THE Queue_System SHALL track rate limit counters in Redis with 1-hour sliding window.
4. THE Worker_Process SHALL limit concurrent jobs per worker to 1 (configurable) to prevent resource exhaustion.
5. THE System SHALL limit total active jobs across all workers to 10 (configurable) to prevent Redis/disk overload.
6. THE Audio_Extractor SHALL limit download bandwidth to 5 MB/s per job to prevent network saturation.
7. THE System SHALL monitor disk space: if available space < 5 GB, reject new jobs with error "Insufficient disk space. Try again later."

---

### Requirement 11: Integration with Existing Sermon Form

**User Story:** As a user, I want the queue processor to integrate seamlessly with the existing sermon form, so that I have a consistent user experience.

#### Acceptance Criteria

1. THE Sermon Form SHALL display the AI Link Processor section with a "Process Video" button.
2. WHEN a user clicks "Process Video", THE System SHALL enqueue a job and display "Processing started. Job ID: {job_id}".
3. THE Sermon Form SHALL display a progress indicator showing current step and percentage.
4. THE Sermon Form SHALL allow users to navigate away: display "Processing in background. Check back later or view status at /admin/sermons/jobs/{job_id}".
5. WHEN a job completes, THE System SHALL store the Sermon_Draft in Redis with 24-hour TTL keyed by job_id.
6. THE Sermon Form SHALL fetch the draft using job_id and display the Draft Review Modal.
7. THE Draft Review Modal SHALL function identically to the existing sermon-ai-link-processor modal: editable fields, save as draft, publish.

---

### Requirement 12: Job Status Dashboard

**User Story:** As a user, I want to view the status of all my processing jobs, so that I can track progress and access completed drafts.

#### Acceptance Criteria

1. THE System SHALL provide a Job Status Dashboard at `/admin/sermons/jobs` listing all jobs for the current user.
2. THE Dashboard SHALL display job list with columns: Video URL, Status, Progress, Submitted At, Completed At, Actions.
3. THE Dashboard SHALL support filtering by status: All, Waiting, Active, Completed, Failed.
4. THE Dashboard SHALL support sorting by submission date (newest first by default).
5. THE Dashboard SHALL display job actions: "View Draft" (for completed jobs), "Retry" (for failed jobs), "Cancel" (for waiting/active jobs).
6. WHEN a user clicks "View Draft", THE System SHALL fetch the draft from Redis and open the Draft Review Modal.
7. WHEN a user clicks "Retry", THE System SHALL create a new job with the same video URL.
8. WHEN a user clicks "Cancel", THE System SHALL remove the job from the queue (only allowed for 'waiting' jobs).

---

### Requirement 13: Monitoring and Observability

**User Story:** As a developer, I want comprehensive logging and monitoring, so that I can debug issues and optimize performance.

#### Acceptance Criteria

1. THE System SHALL log all job lifecycle events: enqueued, started, progress updates, completed, failed, retried, stalled.
2. THE System SHALL log processing durations for each step: audio extraction, transcription, summarization, SEO generation.
3. THE System SHALL expose a health check endpoint at `/api/health/queue` returning: Redis status, worker count, active jobs, queue length, failed jobs count.
4. THE System SHALL expose metrics endpoint at `/api/metrics/queue` returning: jobs processed (last hour/day), average processing time, success rate, failure rate.
5. THE System SHALL log errors with full context: job_id, user_id, video_url, error_message, stack_trace, retry_count, timestamp.
6. THE System SHALL retain job records in Redis for 7 days for debugging and audit purposes.
7. THE System SHALL send alerts (log warnings) when: queue length > 100, failed jobs > 10 in past hour, worker count = 0, Redis connection lost.

---

### Requirement 14: Deployment and Infrastructure

**User Story:** As a developer, I want clear deployment instructions and infrastructure requirements, so that I can deploy the system reliably.

#### Acceptance Criteria

1. THE System SHALL require the following infrastructure: Redis server (v6+), Python 3.9+ with faster-whisper, Ollama with Mistral/Llama model, Node.js 18+.
2. THE System SHALL provide a Docker Compose configuration for local development with all dependencies.
3. THE System SHALL provide deployment documentation covering: Redis setup, Ollama installation, Whisper model download, worker process deployment, environment variables.
4. THE System SHALL use environment variables for configuration: REDIS_URL, OLLAMA_ENDPOINT, WHISPER_MODEL, WORKER_CONCURRENCY, JOB_TIMEOUT_MS, RATE_LIMIT_PER_HOUR.
5. THE System SHALL provide a worker startup script: `npm run worker` that starts a Worker_Process.
6. THE System SHALL support running multiple workers: `npm run worker` can be executed multiple times on different servers.
7. THE System SHALL provide a health check script: `npm run health-check` that verifies Redis, Ollama, and Whisper are accessible.

---

### Requirement 15: Security and Data Privacy

**User Story:** As an admin, I want the queue processor to handle data securely, so that sermon content and user data are protected.

#### Acceptance Criteria

1. THE Queue_System SHALL validate and sanitize all video URLs before enqueueing to prevent injection attacks.
2. THE Queue_System SHALL verify user authentication and authorization before allowing job submission: only 'admin' and 'editor' roles allowed.
3. THE Queue_System SHALL store job data in Redis with encryption at rest (if Redis is configured with encryption).
4. THE Worker_Process SHALL delete temporary audio files immediately after transcription to minimize data exposure.
5. THE System SHALL NOT store raw transcripts in the database: transcripts are stored in Redis with 24-hour TTL only.
6. THE System SHALL use HTTPS for all Ollama API calls if Ollama is hosted remotely.
7. THE Job Status Dashboard SHALL enforce RLS: users can only view their own jobs, admins can view all jobs.

---

### Requirement 16: Graceful Degradation and Fallback

**User Story:** As a user, I want the system to degrade gracefully when services are unavailable, so that I can still create sermons manually.

#### Acceptance Criteria

1. IF Redis is unavailable, THE System SHALL display error "Queue service unavailable. Please try again later or enter sermon content manually."
2. IF Ollama is unavailable, THE System SHALL fail jobs with error "AI service unavailable" and allow retry.
3. IF Whisper is unavailable, THE System SHALL fail jobs with error "Transcription service unavailable" and allow retry.
4. IF yt-dlp is unavailable, THE System SHALL fail jobs with error "Video download service unavailable" and allow retry.
5. THE Sermon Form SHALL always provide manual entry option: "Or enter sermon content manually" link below the AI processor.
6. THE System SHALL display service status indicators: "Queue: Online", "AI: Online", "Transcription: Online" with color-coded status.

---

### Requirement 17: Accessibility and Usability

**User Story:** As a user with accessibility needs, I want the queue processor UI to be accessible, so that I can use the feature efficiently.

#### Acceptance Criteria

1. THE Progress Tracker SHALL use ARIA live regions to announce progress updates to screen readers.
2. THE Job Status Dashboard SHALL be keyboard-navigable with proper focus management and tab order.
3. THE Progress Bar SHALL have aria-label describing current step and percentage (e.g., "Transcribing audio, 45% complete").
4. THE Error Messages SHALL be displayed with color-independent indicators (icons, text prefixes).
5. ALL buttons (Process Video, Retry, Cancel, View Draft) SHALL have descriptive labels and be keyboard-accessible.
6. THE Job Status Dashboard SHALL support screen reader announcements for status changes.

---

### Requirement 18: Performance and Scalability

**User Story:** As the system, I want to handle high processing loads efficiently, so that the system scales with user demand.

#### Acceptance Criteria

1. THE Queue_System SHALL support processing 100+ jobs per hour with 3 worker processes.
2. THE Worker_Process SHALL process a typical 30-minute sermon video in under 15 minutes (audio extraction: 2 min, transcription: 8 min, AI: 5 min).
3. THE Queue_System SHALL handle 1000+ jobs in the queue without performance degradation.
4. THE Redis instance SHALL be configured with persistence (AOF or RDB) to prevent data loss on restart.
5. THE System SHALL support horizontal scaling: adding more workers SHALL linearly increase throughput.
6. THE Audio_Extractor SHALL use streaming downloads to minimize memory usage for large videos.
7. THE Transcription_Engine SHALL use GPU acceleration if available to reduce transcription time by 50%.

---

### Requirement 19: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive tests, so that I can ensure system reliability and catch regressions.

#### Acceptance Criteria

1. THE System SHALL have unit tests for: job enqueueing, deduplication logic, rate limiting, retry strategy, URL normalization.
2. THE System SHALL have integration tests for: end-to-end job processing, worker lifecycle, Redis persistence, error handling.
3. THE System SHALL have property-based tests for: idempotency (processing same video twice produces same result), retry logic (failed jobs eventually succeed or reach dead letter queue), rate limiting (users cannot exceed limits).
4. THE System SHALL have smoke tests for: Redis connectivity, Ollama availability, Whisper availability, yt-dlp installation.
5. THE System SHALL have load tests: simulate 50 concurrent job submissions and verify queue handles load without errors.
6. THE System SHALL have chaos tests: simulate worker crashes, Redis restarts, Ollama timeouts and verify recovery.

---

### Requirement 20: Migration from Existing System

**User Story:** As a developer, I want to migrate from the existing sermon-ai-link-processor to the queue processor, so that users benefit from the improved system.

#### Acceptance Criteria

1. THE System SHALL provide a feature flag: `ENABLE_QUEUE_PROCESSOR` (default: false) to toggle between old and new systems.
2. WHEN the feature flag is enabled, THE Sermon Form SHALL use the queue processor instead of the synchronous processor.
3. WHEN the feature flag is disabled, THE Sermon Form SHALL use the existing sermon-ai-link-processor.
4. THE System SHALL provide a migration guide documenting: infrastructure setup, environment variables, testing steps, rollback procedure.
5. THE System SHALL support gradual rollout: enable queue processor for admin users first, then all users.
6. THE System SHALL maintain backward compatibility: existing processing_logs table remains unchanged, queue processor adds new job_queue table.

---

## Special Requirements Guidance

### Parser and Serializer Requirements

This feature does not involve parsers or serializers in the traditional sense. However, the following components handle structured data transformation:

1. **Job Serialization**: Jobs are serialized to JSON for Redis storage and deserialized when consumed by workers.
2. **URL Normalization**: Video URLs are normalized (remove query params, lowercase, trim) before hashing for deduplication.
3. **Transcript Formatting**: Whisper transcript segments are combined into formatted text with punctuation.

**Round-Trip Property**: For job serialization, the following property SHALL hold:
- FOR ALL valid job objects, serializing to JSON then deserializing SHALL produce an equivalent job object (all fields preserved, no data loss).

---

## Document Format

This requirements document follows the EARS (Easy Approach to Requirements Syntax) patterns and INCOSE quality rules as specified in the workflow definition. All requirements use SHALL statements with appropriate EARS patterns (Ubiquitous, Event-driven, State-driven, Unwanted event, Optional feature, Complex).

---

## Acceptance Criteria Testing Strategy

The acceptance criteria in this document are designed to be testable using a combination of:

1. **Unit Tests**: For isolated logic (URL normalization, deduplication key generation, rate limit calculation).
2. **Integration Tests**: For component interactions (job enqueueing → worker processing → draft generation).
3. **Property-Based Tests**: For universal correctness properties (idempotency, retry logic, rate limiting enforcement).
4. **Smoke Tests**: For infrastructure dependencies (Redis, Ollama, Whisper, yt-dlp).
5. **Load Tests**: For performance and scalability validation.
6. **Chaos Tests**: For fault tolerance and recovery validation.

Each requirement includes specific acceptance criteria that can be directly translated into test cases during the design and implementation phases.
