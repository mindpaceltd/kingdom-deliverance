# Sermon Queue Processor — Migration Guide

## Overview

This guide explains how to migrate from the existing synchronous `sermon-ai-link-processor` to the new queue-based `sermon-queue-processor`. The migration is designed to be gradual and fully reversible using a feature flag.

The migration follows a 6-phase approach: infrastructure setup → code deployment → worker startup → admin-only rollout → full rollout → cleanup. Each phase can be paused or reversed independently.

---

## Feature Flag

The queue processor is controlled by a single environment variable:

```bash
ENABLE_QUEUE_PROCESSOR=true   # Use queue-based processor
ENABLE_QUEUE_PROCESSOR=false  # Use legacy synchronous processor (default)
```

The flag is read at server startup via `src/lib/features.ts`:

```typescript
// src/lib/features.ts
export const features = {
  useQueueProcessor: process.env.ENABLE_QUEUE_PROCESSOR === 'true',
}
```

The sermon form uses this flag to conditionally render the appropriate component:

```tsx
import { features } from '@/lib/features'

{features.useQueueProcessor ? (
  <AILinkProcessorQueue onDraftGenerated={handleDraft} />
) : (
  <AILinkProcessor onDraftGenerated={handleDraft} />
)}
```

When `ENABLE_QUEUE_PROCESSOR=false` (or unset), the sermon form renders the original `AILinkProcessor` component and all processing continues to use the Gemini API synchronously. No queue infrastructure is required.

When `ENABLE_QUEUE_PROCESSOR=true`, the sermon form renders the new `AILinkProcessorQueue` component and all processing is handled asynchronously via BullMQ and the worker process.

> **Important**: The flag defaults to `false`. The queue processor is opt-in. Existing deployments are unaffected until the flag is explicitly set to `true`.

---

## Prerequisites Before Enabling

Before setting `ENABLE_QUEUE_PROCESSOR=true`, ensure the following are in place:

1. **Redis** is running and accessible at `REDIS_URL`
2. **Ollama** is running with the Mistral model downloaded
3. **faster-whisper** is installed (`pip install faster-whisper`)
4. **yt-dlp** and **ffmpeg** are installed
5. **At least one worker process** is running (`npm run worker`)
6. All required environment variables are set (see [Environment Variables](#environment-variables))

Run the health check to verify all dependencies are ready:

```bash
bash scripts/health-check.sh
```

All checks must pass before enabling the feature flag.

---

## Migration Phases

### Phase 1 — Infrastructure Setup

Install and configure all required services before touching the application code.

```bash
# 1. Install and start Redis
brew install redis          # macOS
sudo apt-get install redis  # Ubuntu/Debian
redis-server --daemonize yes

# Verify Redis is running
redis-cli ping              # Expected: PONG

# 2. Install Ollama and download the Mistral model
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve &
ollama pull mistral

# Verify Ollama is running
curl http://localhost:11434/api/version

# 3. Set up Python virtual environment and install faster-whisper
python3 -m venv venv
source venv/bin/activate
pip install faster-whisper

# 4. Install yt-dlp and ffmpeg
python3 -m pip install yt-dlp
brew install ffmpeg         # macOS
# sudo apt-get install ffmpeg  # Ubuntu/Debian

# 5. Create the temporary audio directory
mkdir -p /tmp/sermon-audio
chmod 755 /tmp/sermon-audio
```

See the [Deployment Guide](./sermon-queue-processor-deployment.md) for detailed installation instructions.

### Phase 2 — Deploy Code

Deploy the queue processor code to production with the feature flag **disabled**.

```bash
# Set environment variables (feature flag OFF)
ENABLE_QUEUE_PROCESSOR=false
REDIS_URL=redis://localhost:6379
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=mistral
WHISPER_MODEL=base
WORKER_CONCURRENCY=1
JOB_TIMEOUT_MS=3600000
RATE_LIMIT_PER_HOUR=10
TEMP_AUDIO_DIR=/tmp/sermon-audio
```

Deploy the application. The legacy processor remains active. Monitor for any deployment issues before proceeding.

### Phase 3 — Start Workers

Start one worker process and verify it connects to Redis and processes a test job.

```bash
# Start a single worker
npm run worker

# Expected startup output:
# [Worker] Sermon processor worker started
# [Worker] Concurrency: 1
# [Worker] Lock duration: 3600000ms
# [Worker] Stalled interval: 60000ms
```

Monitor worker logs for connection errors. The worker should idle quietly, waiting for jobs.

### Phase 4 — Admin-Only Rollout

Enable the queue processor for admin users first to validate the system in production before exposing it to all editors.

**Step 1**: Set the feature flag in your environment:

```bash
ENABLE_QUEUE_PROCESSOR=true
```

**Step 2**: Restart the Next.js server to pick up the new environment variable:

```bash
# Production (PM2)
pm2 restart kingdom-deliverance

# Production (systemd)
sudo systemctl restart kingdom-deliverance

# Development
npm run dev
```

**Step 3**: Log in as an admin user and test the sermon form:
- Navigate to `/admin/sermons/new`
- Paste a video URL and click "Process Video"
- Verify the job is enqueued and progress updates appear
- Verify the draft is generated correctly
- Check the job status dashboard at `/admin/sermons/jobs`

**Step 4**: Monitor for errors over 1–2 weeks:
- Check worker logs for failures
- Check `/api/health/queue` for system health
- Check `/api/metrics/queue` for processing statistics

> **Note**: The feature flag is global — once enabled, all users with `admin` or `editor` roles can access the queue processor. To restrict to admins only during this phase, you can temporarily limit access at the role-check level in the server action, or simply monitor admin usage closely before communicating the change to editors.

### Phase 5 — Full Rollout

Once admin testing is successful, the feature is already available to all `admin` and `editor` users. No additional configuration is needed.

Scale up workers to handle increased load:

```bash
# Terminal 1 — Worker 1
WORKER_CONCURRENCY=2 npm run worker

# Terminal 2 — Worker 2
WORKER_CONCURRENCY=2 npm run worker

# Terminal 3 — Worker 3
WORKER_CONCURRENCY=2 npm run worker
```

Continue monitoring:
- Queue length via `/api/metrics/queue`
- Failed job rate via `/api/health/queue`
- Worker health and throughput

### Phase 6 — Cleanup (Optional)

After the queue processor has been stable in production for at least 1 week:

1. Remove the legacy `sermon-ai-link-processor` code
2. Remove the `GEMINI_API_KEY` dependency
3. Remove the `ENABLE_QUEUE_PROCESSOR` feature flag (queue processor becomes the default)
4. Update documentation to reflect the new architecture

> **Caution**: Only proceed with cleanup after confirming the queue processor is stable and the rollback window has passed.

---

## Rollback Procedure

If issues arise at any phase, rolling back is immediate and non-destructive.

**Step 1**: Set the feature flag to `false`:

```bash
ENABLE_QUEUE_PROCESSOR=false
```

**Step 2**: Restart the Next.js server:

```bash
# Production (PM2)
pm2 restart kingdom-deliverance

# Production (systemd)
sudo systemctl restart kingdom-deliverance

# Development — restart the dev server
```

**Step 3**: Stop the worker processes (optional — they will idle harmlessly if no jobs are enqueued):

```bash
# Send SIGTERM for graceful shutdown (finishes current job before exiting)
kill -SIGTERM <worker_pid>
```

The application immediately reverts to the legacy synchronous processor. No data is lost — the `processing_logs` table retains all historical records from both processors.

**Step 4**: Investigate and fix the issue, then retry the rollout when ready.

> **Note**: Jobs that were enqueued but not yet processed will remain in Redis. They will be processed when the queue processor is re-enabled and a worker is running. If you want to discard them, flush the queue with `redis-cli FLUSHDB` (destructive — use with caution).

---

## Backward Compatibility

### Database Schema

The queue processor adds new nullable columns to the existing `processing_logs` table without modifying or removing any existing columns. It also adds a new `job_queue` table for BullMQ job tracking.

**`processing_logs` table — existing columns (unchanged):**

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | User who submitted |
| `video_url` | text | Video URL processed |
| `status` | text | Processing status |
| `error_message` | text | Error details |
| `created_at` | timestamptz | Submission time |

**`processing_logs` table — new nullable columns (added by queue processor):**

| Column | Type | Description |
|---|---|---|
| `job_id` | text | BullMQ job ID |
| `retry_count` | integer | Number of retries |
| `processing_step` | text | Current processing step |

The new columns are nullable, so existing rows created by the legacy processor are unaffected. Both processors write to the same table, making historical data queryable regardless of which processor was used.

**New `job_queue` table (added by queue processor):**

This table is used for persistent job tracking and is separate from the BullMQ Redis queue. It is only populated when the queue processor is active. The legacy processor does not interact with this table.

### API Compatibility

- The existing `/api/health/queue` and `/api/metrics/queue` endpoints are new additions and do not replace any existing endpoints.
- The legacy `/api/process-sermon` endpoint (if it exists) is unaffected.
- Server actions for the legacy processor remain in place and are used when `ENABLE_QUEUE_PROCESSOR=false`.

### UI Compatibility

- The sermon form conditionally renders either `AILinkProcessor` (legacy) or `AILinkProcessorQueue` (new) based on the feature flag.
- The Draft Review Modal is shared between both processors — no changes required.
- The job status dashboard at `/admin/sermons/jobs` is only accessible when the queue processor is enabled.

### Legacy Processor Preservation

The legacy `sermon-ai-link-processor` is preserved in full until Phase 6 cleanup. Disabling the feature flag at any time restores the original behavior with zero code changes.

---

## Environment Variables

All queue processor variables have sensible defaults. Only `REDIS_URL` and `OLLAMA_ENDPOINT` are required when enabling the feature:

| Variable | Default | Required | Description |
|---|---|---|---|
| `ENABLE_QUEUE_PROCESSOR` | `false` | No | Feature flag — set to `true` to enable |
| `REDIS_URL` | `redis://localhost:6379` | Yes (when enabled) | Redis connection URL |
| `OLLAMA_ENDPOINT` | `http://localhost:11434` | Yes (when enabled) | Ollama API endpoint |
| `OLLAMA_MODEL` | `mistral` | No | AI model for summarization |
| `WHISPER_MODEL` | `base` | No | Whisper model size (tiny/base/small/medium/large) |
| `WORKER_CONCURRENCY` | `1` | No | Jobs per worker process |
| `JOB_TIMEOUT_MS` | `3600000` | No | Max job duration in ms (default: 60 min) |
| `RATE_LIMIT_PER_HOUR` | `10` | No | Max job submissions per user per hour |
| `TEMP_AUDIO_DIR` | `/tmp/sermon-audio` | No | Temporary directory for audio files |

---

## Testing Steps Before Full Rollout

Run these checks before enabling the feature flag in production:

### 1. Infrastructure Health

```bash
# Verify all dependencies are running
bash scripts/health-check.sh

# Expected: ALL CHECKS PASSED
```

### 2. Worker Startup

```bash
# Start a worker and verify it connects
npm run worker

# Expected output:
# [Worker] Sermon processor worker started
```

### 3. End-to-End Job Processing

```bash
# Run the queue integration test
npm run test:queue
```

### 4. API Health Endpoint

```bash
# Check queue health (requires Next.js server running)
curl http://localhost:3005/api/health/queue

# Expected: JSON with all services "healthy"
```

### 5. Rate Limiting

Submit 10 jobs in quick succession and verify the 11th is rejected with a rate limit error.

### 6. Job Status Dashboard

Navigate to `/admin/sermons/jobs` and verify:
- Jobs appear in the table
- Status updates in real time
- "View Draft", "Retry", and "Cancel" buttons work correctly

---

## Monitoring After Rollout

### Health Endpoint

```
GET /api/health/queue
```

Returns the status of Redis, Ollama, active workers, queue length, and failed job count.

### Metrics Endpoint

```
GET /api/metrics/queue
```

Returns jobs processed (last hour/day), average processing time, success rate, and failure rate.

### Worker Logs

Monitor worker output for errors:

```bash
# If running with PM2
pm2 logs sermon-worker

# If running with systemd
sudo journalctl -u sermon-worker -f

# If running directly
npm run worker 2>&1 | tee worker.log
```

### Alerting Thresholds

The system logs warnings for the following conditions:

| Condition | Threshold | Action |
|---|---|---|
| Queue length (waiting) | > 100 jobs | Add more worker processes |
| Failed jobs (last hour) | > 10 | Investigate worker logs |
| Active workers | 0 | Start worker: `npm run worker` |
| Redis connection | Lost | Check Redis service |

---

## Troubleshooting

### Jobs stuck in "waiting" state

No worker processes are running. Start a worker:

```bash
npm run worker
```

### Jobs failing immediately

Check worker logs for the error message. Common causes:
- Redis not reachable: verify `REDIS_URL` and run `redis-cli ping`
- Ollama not running: run `curl http://localhost:11434/api/tags`
- yt-dlp not installed: run `yt-dlp --version` or `python3 -m yt_dlp --version`
- faster-whisper not installed: run `python3 -c "import faster_whisper; print('OK')"`

### Feature flag not taking effect

Ensure the Next.js server was restarted after changing `ENABLE_QUEUE_PROCESSOR`. Environment variables are read at startup.

### Rollback not working

Verify `ENABLE_QUEUE_PROCESSOR=false` is set in the correct `.env` file and the server was restarted. Check with:

```bash
# In the running Next.js process
curl http://localhost:3005/api/health/queue
# Should return 404 or "queue processor disabled" when flag is false
```

### Worker exits immediately after starting

- Check that `REDIS_URL` is set and Redis is reachable: `redis-cli ping`
- Check that all required environment variables are configured
- Review worker logs for the specific error

### Stalled jobs after worker crash

BullMQ automatically detects stalled jobs (within 1 minute) and re-queues them for retry. No manual intervention is needed. Check worker logs for the stall event and the reason for the crash.

---

## Related Documentation

- [Deployment Guide](./sermon-queue-processor-deployment.md) — detailed infrastructure setup instructions
- [Requirements](../.kiro/specs/sermon-queue-processor/requirements.md) — full system requirements
- [Design Document](../.kiro/specs/sermon-queue-processor/design.md) — architecture and implementation details

---

*Last Updated: May 2025*
