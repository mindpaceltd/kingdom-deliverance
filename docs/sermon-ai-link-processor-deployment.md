# Sermon AI Link Processor — Deployment Guide

## Overview

The Sermon AI Link Processor is a feature that enables automated sermon content generation from YouTube video links. This guide covers the prerequisites, configuration, database setup, and monitoring required to deploy this feature.

---

## Prerequisites

### 1. Google Gemini API Key

The AI processor uses Google's Gemini API (free tier) for content summarization and SEO generation.

**Steps to obtain API key:**

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key" in the top navigation
4. Create a new API key or use an existing one
5. Copy the API key for use in environment configuration

**Free tier limits:**
- 15 requests per minute
- 1,500 requests per day
- 1M tokens per minute input
- 8k tokens per minute output

**Note:** No credit card required for free tier access.

### 2. Database Migration

The feature requires a new `processing_logs` table to track AI processing requests and enforce rate limiting.

**Migration file:** `supabase/migrations/20260503204014_add_processing_logs.sql`

This migration creates:
- `processing_logs` table with columns: `id`, `user_id`, `link_url`, `status`, `error_message`, `duration_ms`, `created_at`, `updated_at`
- Indexes for efficient rate limiting and monitoring queries
- Row Level Security (RLS) policies
- Automatic `updated_at` timestamp trigger

### 3. Node.js Dependencies

The following npm packages are required (already in `package.json`):
- `@google/generative-ai` — Google Gemini API client
- `youtube-transcript` — YouTube transcript extraction

---

## Environment Variable Setup

### Required Variables

Add the following environment variables to your deployment environment:

```bash
# Google Gemini API Key (required)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional Variables

These variables have sensible defaults but can be customized:

```bash
# Processing timeout in milliseconds (default: 10 minutes)
AI_PROCESSING_TIMEOUT_MS=600000

# Rate limit: max processing requests per user per hour (default: 5)
AI_RATE_LIMIT_PER_HOUR=5
```

### Local Development Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Gemini API key to `.env.local`:
   ```bash
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

### Production Deployment

**For Vercel:**

1. Navigate to your project settings in Vercel dashboard
2. Go to "Environment Variables" section
3. Add `GEMINI_API_KEY` with your API key value
4. Select appropriate environments (Production, Preview, Development)
5. Save and redeploy

**For other platforms:**

Consult your platform's documentation for setting environment variables. Ensure `GEMINI_API_KEY` is available at runtime.

---

## Database Migration Steps

### Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link to your Supabase project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Run the migration**:
   ```bash
   supabase db push
   ```

4. **Verify migration**:
   ```bash
   supabase db diff
   ```
   
   You should see no pending changes if the migration was successful.

### Using Supabase Dashboard

1. Navigate to your Supabase project dashboard
2. Go to "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `supabase/migrations/20260503204014_add_processing_logs.sql`
5. Paste into the SQL editor
6. Click "Run" to execute the migration
7. Verify the `processing_logs` table appears in the "Table Editor"

### Verifying Migration Success

Run the following query in the SQL Editor to confirm the table and indexes exist:

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'processing_logs';

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'processing_logs';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'processing_logs';
```

Expected results:
- Table `processing_logs` exists
- Indexes `idx_processing_logs_user_created` and `idx_processing_logs_status_created` exist
- RLS is enabled (`rowsecurity = true`)

---

## Feature Flag Behavior

The AI processor is automatically enabled or disabled based on the presence of the `GEMINI_API_KEY` environment variable.

### When Enabled (`GEMINI_API_KEY` is set)

- The "AI Link Processor" section appears in the sermon form at `/admin/sermons`
- Users with `admin` or `editor` roles can paste YouTube links and process them
- Processing requests are subject to rate limiting (5 per hour per user by default)

### When Disabled (`GEMINI_API_KEY` is not set)

- The "AI Link Processor" section is hidden
- A message displays: "AI link processing is currently unavailable. Please enter sermon content manually."
- Users can still create sermons manually using the standard form fields

### Checking Feature Status

You can verify the feature flag status in your application logs:

```typescript
// In src/lib/env.ts
export const isAIProcessorEnabled = !!aiProcessorEnv.geminiApiKey
```

If `GEMINI_API_KEY` is missing, you'll see a warning in server logs:

```
[env] Missing AI processor environment variable: GEMINI_API_KEY. 
AI link processing will be disabled. Check your .env.local file.
```

---

## Monitoring and Logging

### Processing Logs Table

All AI processing requests are logged in the `processing_logs` table for monitoring and debugging.

**Table schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to `profiles.id` |
| `link_url` | TEXT | YouTube URL being processed |
| `status` | TEXT | `pending`, `processing`, `completed`, or `failed` |
| `error_message` | TEXT | Error details if status is `failed` |
| `duration_ms` | INTEGER | Processing duration in milliseconds |
| `created_at` | TIMESTAMPTZ | Request timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Monitoring Queries

**Check recent processing activity:**

```sql
SELECT 
  user_id,
  link_url,
  status,
  duration_ms,
  created_at
FROM processing_logs
ORDER BY created_at DESC
LIMIT 20;
```

**Calculate success rate:**

```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM processing_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

**Identify slow processing requests:**

```sql
SELECT 
  user_id,
  link_url,
  duration_ms,
  created_at
FROM processing_logs
WHERE status = 'completed'
  AND duration_ms > 180000  -- More than 3 minutes
ORDER BY duration_ms DESC
LIMIT 10;
```

**Check rate limit usage by user:**

```sql
SELECT 
  user_id,
  COUNT(*) as requests_last_hour
FROM processing_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
ORDER BY requests_last_hour DESC;
```

**Monitor common errors:**

```sql
SELECT 
  error_message,
  COUNT(*) as occurrences
FROM processing_logs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error_message
ORDER BY occurrences DESC;
```

### Application Logs

Server-side processing events are logged to the console with structured context:

```typescript
console.error('[processSermonLink]', {
  userId,
  url,
  error: error.message,
  stack: error.stack
})
```

**Log levels:**
- `INFO`: Processing start, completion
- `WARN`: Processing duration exceeds expected thresholds
- `ERROR`: Processing failures, API errors, timeouts

### Performance Metrics

Monitor these metrics to ensure optimal performance:

| Metric | Expected Value | Action if Exceeded |
|--------|----------------|-------------------|
| Transcript extraction | < 3 minutes | Investigate YouTube API issues |
| Summary generation | < 2 minutes | Check Gemini API latency |
| SEO generation | < 1 minute | Check Gemini API latency |
| Total processing time | < 10 minutes | Review timeout configuration |
| Success rate | > 80% | Investigate common error patterns |

### Alerting Recommendations

Set up alerts for:
1. **High failure rate**: > 20% of requests failing in the last hour
2. **API quota exhaustion**: Approaching Gemini API daily limit (1,500 requests)
3. **Slow processing**: Average duration > 5 minutes
4. **Rate limit hits**: Multiple users hitting rate limits (may need to increase limit)

---

## Troubleshooting

### Issue: "AI link processing is currently unavailable"

**Cause:** `GEMINI_API_KEY` environment variable is not set.

**Solution:**
1. Verify the API key is added to your environment variables
2. Restart your application/server
3. Check server logs for environment variable warnings

### Issue: "Rate limit exceeded"

**Cause:** User has made 5 processing requests in the past hour.

**Solution:**
- Wait for the rate limit window to reset (1 hour from first request)
- Or increase `AI_RATE_LIMIT_PER_HOUR` if appropriate for your use case

### Issue: "Failed to extract transcript"

**Cause:** Video does not have captions enabled, or video is private/deleted.

**Solution:**
- Verify the video has captions enabled on YouTube
- Try a different video
- Use manual entry as fallback

### Issue: "AI service temporarily unavailable"

**Cause:** Gemini API is experiencing issues or rate limits exceeded.

**Solution:**
1. Check [Google AI Studio status](https://ai.google.dev/)
2. Verify API key is valid and not expired
3. Check if daily quota (1,500 requests) has been exceeded
4. Wait a few minutes and retry

### Issue: Processing takes too long

**Cause:** Long videos or high API latency.

**Solution:**
1. Check `processing_logs` table for duration metrics
2. Consider increasing `AI_PROCESSING_TIMEOUT_MS` if needed
3. Monitor Gemini API latency
4. For very long videos (> 2 hours), recommend manual entry

---

## Security Considerations

### API Key Security

- **Never commit** `GEMINI_API_KEY` to version control
- Store API key in environment variables only
- Use different API keys for development, staging, and production
- Rotate API keys periodically

### Rate Limiting

- Default limit: 5 requests per user per hour
- Prevents abuse and ensures fair resource usage
- Adjust `AI_RATE_LIMIT_PER_HOUR` based on your user base and API quota

### Row Level Security (RLS)

- Users can only view their own processing logs
- Service role can insert/update logs for all users
- RLS policies are automatically applied by the migration

### Data Privacy

- Raw transcripts are **never stored** in the database
- Only generated summaries and SEO content are saved
- Processing logs contain metadata only (no sensitive content)
- All external API calls use HTTPS

---

## Rollback Procedure

If you need to rollback the feature:

### 1. Disable the Feature

Remove or unset `GEMINI_API_KEY` from environment variables. This will disable the AI processor without requiring code changes.

### 2. Rollback Database Migration (Optional)

If you need to remove the `processing_logs` table:

```sql
-- Drop the table and all related objects
DROP TABLE IF EXISTS processing_logs CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

**Warning:** This will permanently delete all processing logs. Consider exporting data first if needed.

### 3. Verify Rollback

1. Confirm the "AI Link Processor" section is hidden in `/admin/sermons`
2. Verify users can still create sermons manually
3. Check that no errors appear in application logs

---

## Support and Resources

### Documentation

- [Requirements Document](.kiro/specs/sermon-ai-link-processor/requirements.md)
- [Design Document](.kiro/specs/sermon-ai-link-processor/design.md)
- [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [YouTube Transcript NPM Package](https://www.npmjs.com/package/youtube-transcript)

### Common Questions

**Q: Can I use a different AI service instead of Gemini?**

A: Yes, but it requires code changes. The design document includes notes on using self-hosted Ollama as an alternative. Contact your development team for implementation.

**Q: Can I process Vimeo or direct video files?**

A: Not in the initial release. Only YouTube videos with captions are supported. Vimeo and direct video support are planned for future releases.

**Q: How much does this feature cost?**

A: The feature uses Google Gemini's free tier, which provides 1,500 requests per day at no cost. No credit card is required.

**Q: What happens if I exceed the daily API quota?**

A: Processing requests will fail with an error message. Users can still create sermons manually. The quota resets daily at midnight UTC.

**Q: Can I customize the AI prompts?**

A: Not in the initial release. Custom prompts are planned for a future release. The current prompts are optimized for sermon content.

---

## Changelog

### Version 1.0.0 (Initial Release)

- YouTube video transcript extraction
- AI-powered summarization (150-300 words)
- SEO optimization (title, description, keywords)
- Draft review workflow
- Rate limiting (5 requests/hour/user)
- Processing logs and monitoring
- Role-based access control (admin/editor only)

---

## Next Steps

After completing deployment:

1. ✅ Verify `GEMINI_API_KEY` is set in production environment
2. ✅ Run database migration to create `processing_logs` table
3. ✅ Test the feature with a sample YouTube video
4. ✅ Monitor `processing_logs` table for the first few days
5. ✅ Set up alerting for high failure rates or slow processing
6. ✅ Document any custom configuration for your team

For questions or issues, refer to the design document or contact your development team.
