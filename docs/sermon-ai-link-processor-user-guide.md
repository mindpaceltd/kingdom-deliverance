# Sermon AI Link Processor — User Guide

## Introduction

The Sermon AI Link Processor is a powerful tool that helps you quickly create sermon content from YouTube videos. Instead of manually typing sermon summaries, descriptions, and SEO content, you can simply paste a YouTube link and let AI generate a draft for you to review and publish.

This guide will walk you through how to use the AI Link Processor, what to expect during processing, and how to handle common issues.

---

## Who Can Use This Feature?

The AI Link Processor is available to:
- **Administrators** (role: `admin`)
- **Editors** (role: `editor`)

If you have an `author` or `member` role, you will not see the AI Link Processor section. Contact your administrator if you need access.

---

## Getting Started

### Step 1: Navigate to Sermons Manager

1. Log in to the KDC Uganda CMS admin panel
2. Click **Sermons** in the main navigation menu
3. You'll see the Sermons Manager page at `/admin/sermons`

### Step 2: Locate the AI Link Processor

At the top of the sermon form, you'll see a section titled **"AI-Powered Sermon Generator"** with:
- A text input field labeled "Paste Media Link"
- A "Process Link" button
- Placeholder text: `https://www.youtube.com/watch?v=...`

If you don't see this section, the AI processor may be disabled. Contact your administrator to enable it.

---

## How to Process a YouTube Link

### Step 1: Copy the YouTube Video URL

1. Go to YouTube and find the sermon video you want to process
2. Copy the video URL from your browser's address bar

**Supported URL formats:**
- Standard: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short: `https://youtu.be/VIDEO_ID`
- Embed: `https://www.youtube.com/embed/VIDEO_ID`

**Important:** The video must have captions/subtitles enabled. Videos without captions cannot be processed.

### Step 2: Paste the Link

1. Click in the "Paste Media Link" input field
2. Paste the YouTube URL (Ctrl+V or Cmd+V)
3. The system will automatically validate the URL format

**If the URL is invalid:**
- You'll see an error message: "Invalid URL format. Please paste a valid YouTube link."
- Double-check the URL and try again

### Step 3: Click "Process Link"

1. Click the **"Process Link"** button
2. The button will be disabled and show a loading indicator
3. You'll see real-time status updates as processing progresses

**Processing steps:**
1. **Step 1 of 4: Validating link...** (a few seconds)
2. **Step 2 of 4: Extracting transcript...** (1-5 minutes)
3. **Step 3 of 4: Generating summary...** (1-2 minutes)
4. **Step 4 of 4: Optimizing for SEO...** (30 seconds - 1 minute)

**Total processing time:** Typically 3-8 minutes, depending on video length.

### Step 4: Review the Generated Draft

Once processing completes, a **"Draft Review"** modal will appear with pre-populated fields:

| Field | Description | Editable? |
|-------|-------------|-----------|
| **Title** | SEO-optimized title (50-70 characters) | ✅ Yes |
| **Description** | Meta description for search engines (150-160 characters) | ✅ Yes |
| **Content** | AI-generated summary (150-300 words) | ✅ Yes |
| **Keywords** | 5-8 relevant keywords for SEO | ✅ Yes |
| **Video URL** | The YouTube link you pasted | ✅ Yes |
| **Preacher** | Empty (you must fill this in) | ✅ Yes |
| **Series** | Empty (optional) | ✅ Yes |
| **Date** | Defaults to today's date | ✅ Yes |
| **Duration** | Empty (optional) | ✅ Yes |
| **Thumbnail** | Empty (optional, select from Media Library) | ✅ Yes |

**Full Transcription Section:**
- A collapsible section shows the complete video transcript
- Use this as a reference to verify the AI-generated content
- The transcript is **not saved** to the database

### Step 5: Edit the Draft (Optional)

Review the AI-generated content carefully. While the AI does a good job, you may want to:
- Adjust the title for clarity or emphasis
- Refine the description to better match your church's voice
- Edit the summary to highlight specific points
- Add or remove keywords
- Fill in the preacher name and series information
- Select a thumbnail image from the Media Library

**Tip:** The AI-generated content is a starting point. Feel free to make it your own!

### Step 6: Save or Publish

You have three options:

1. **Save as Draft**
   - Click the **"Save as Draft"** button
   - The sermon is saved with `status = 'draft'`
   - It will **not** appear on the public website
   - You can edit it later from the Sermons Manager

2. **Publish**
   - Click the **"Publish"** button
   - The sermon is saved with `status = 'published'`
   - It will **immediately appear** on the public website at `/sermons/[slug]`
   - The `published_at` timestamp is set to the current time

3. **Discard**
   - Click the **"Close"** or **"Cancel"** button
   - The generated content is discarded
   - You return to the link input state
   - No sermon record is created

---

## Supported Platforms

### Currently Supported

✅ **YouTube** (with captions enabled)
- Standard YouTube videos
- YouTube Shorts (if captions are available)
- Embedded YouTube videos

### Not Yet Supported

❌ **Vimeo**
- Error message: "Vimeo videos are not yet supported. Use YouTube or enter content manually."

❌ **Direct Video Files** (`.mp4`, `.webm`, `.ogg`, `.mov`)
- Error message: "Direct video files are not yet supported. Use YouTube or enter content manually."

❌ **Facebook, Instagram, TikTok**
- Error message: "Unsupported link format. Please paste a YouTube video URL."

**Future releases** may add support for these platforms. For now, use YouTube links or enter sermon content manually.

---

## Error Messages and Recovery

### "Invalid URL format"

**What it means:** The URL you pasted is not a valid web address.

**How to fix:**
- Double-check the URL for typos
- Make sure you copied the entire URL
- Try copying the URL again from YouTube

---

### "Unsupported link format"

**What it means:** The URL is valid, but it's not a YouTube video.

**How to fix:**
- Use a YouTube video link instead
- Or click "Cancel" and enter sermon content manually

---

### "Video is private, deleted, or unavailable"

**What it means:** The YouTube video cannot be accessed (it may be private, unlisted, deleted, or region-blocked).

**How to fix:**
- Verify the video is publicly accessible on YouTube
- Try a different video
- Or enter sermon content manually

---

### "Transcripts are disabled for this video"

**What it means:** The YouTube video does not have captions/subtitles enabled.

**How to fix:**
- Ask the video uploader to enable captions on YouTube
- Try a different video that has captions
- Or enter sermon content manually

**Note:** Many sermon videos have auto-generated captions. Check the video's caption settings on YouTube.

---

### "Transcript is too short to process"

**What it means:** The video transcript is less than 100 characters (likely a very short video or incomplete captions).

**How to fix:**
- Verify the video is a full sermon (not a short clip)
- Check if captions are complete on YouTube
- Try a different video
- Or enter sermon content manually

---

### "Processing took too long"

**What it means:** The processing exceeded the 10-minute timeout (usually for very long videos or slow API responses).

**How to fix:**
- Try again (the issue may be temporary)
- Try a shorter video
- Or enter sermon content manually

---

### "AI service temporarily unavailable"

**What it means:** The Google Gemini API is experiencing issues or is temporarily down.

**How to fix:**
- Wait a few minutes and try again
- Check if you've exceeded the daily processing limit (see Rate Limits below)
- Or enter sermon content manually

---

### "Rate limit exceeded"

**What it means:** You've reached the maximum number of processing requests allowed per hour.

**How to fix:**
- Wait for the rate limit window to reset (1 hour from your first request)
- Or enter sermon content manually

**See the Rate Limits section below for more details.**

---

### "Network error"

**What it means:** Your internet connection was interrupted during processing.

**How to fix:**
- Check your internet connection
- Try again
- If the issue persists, contact your administrator

---

## Rate Limits and Processing Timeouts

### Rate Limits

To ensure fair resource usage and prevent abuse, the AI Link Processor has the following limits:

**Per User:**
- **5 processing requests per hour**
- The counter resets 1 hour after your first request

**Example:**
- You process 5 videos between 2:00 PM and 2:30 PM
- You cannot process another video until 3:00 PM (1 hour after your first request)
- At 3:00 PM, your counter resets to 0

**If you hit the rate limit:**
- You'll see an error message: "You've reached the limit of 5 processing requests per hour. Try again later."
- You can still create sermons manually using the standard form
- Wait for the rate limit window to reset

**Tip:** If you need to process many videos, space them out over multiple hours or contact your administrator to increase the limit.

### Processing Timeouts

Each processing step has a timeout to prevent indefinite waiting:

| Step | Timeout | What Happens if Exceeded |
|------|---------|--------------------------|
| Transcript extraction | 5 minutes | Error: "Processing took too long" |
| Summary generation | 2 minutes | Error: "Processing took too long" |
| SEO generation | 1 minute | Error: "Processing took too long" |
| **Total processing** | **10 minutes** | **Request is cancelled** |

**If processing times out:**
- You'll see an error message with recovery options
- No partial sermon record is created (database remains unchanged)
- You can retry the same video or try a different one
- For very long videos (> 2 hours), consider entering content manually

---

## Tips for Best Results

### 1. Use Videos with Good Captions

- Videos with manually-created captions produce better results than auto-generated captions
- Check the caption quality on YouTube before processing

### 2. Choose Full Sermons

- The AI works best with complete sermons (20-60 minutes)
- Short clips or excerpts may not generate meaningful summaries

### 3. Review and Edit the Draft

- Always review the AI-generated content before publishing
- The AI is a helpful assistant, but human review ensures accuracy and quality
- Adjust the tone and emphasis to match your church's voice

### 4. Fill in Missing Fields

- The AI cannot determine the preacher name or series — you must fill these in
- Add a thumbnail image from the Media Library for better visual appeal
- Verify the date is correct (defaults to today)

### 5. Use the Transcript for Reference

- The full transcript is available in the Draft Review modal
- Use it to verify the AI-generated summary is accurate
- Check for any scripture references or key points the AI may have missed

### 6. Save as Draft First

- If you're unsure about the generated content, save it as a draft
- Review it later or have another team member review it
- Publish when you're confident it's ready

---

## Accessibility Features

The AI Link Processor is designed to be accessible to all users:

### Keyboard Navigation

- All buttons and form fields are keyboard-accessible
- Use **Tab** to navigate between fields
- Use **Enter** or **Space** to activate buttons
- Use **Escape** to close the Draft Review modal

### Screen Reader Support

- All form inputs have descriptive labels
- Processing status updates are announced to screen readers
- Error messages are announced when they appear
- The Draft Review modal has proper focus management

### Visual Accessibility

- Error messages include icons (not just color)
- Loading indicators are clearly visible
- High contrast text for readability
- Descriptive button labels (not just icons)

---

## Frequently Asked Questions

### Can I process multiple videos at once?

No, you can only process one video at a time. Batch processing is planned for a future release.

### Can I edit the transcript before summarization?

No, the transcript is used directly for summarization. Transcript editing is planned for a future release.

### Can I customize the AI prompts?

No, the AI prompts are pre-configured for sermon content. Custom prompts are planned for a future release.

### What happens to the transcript after processing?

The transcript is **not saved** to the database. It's only used to generate the summary and SEO content, then discarded. This protects your data privacy.

### Can I use the AI processor for non-sermon content?

The AI is optimized for sermon content (religious themes, scripture references, etc.). It may not work well for other types of content.

### How accurate is the AI-generated content?

The AI is generally accurate but not perfect. Always review and edit the generated content before publishing. The AI is a helpful assistant, not a replacement for human judgment.

### What if the AI misses important points?

Use the full transcript (available in the Draft Review modal) to identify any missed points, then manually add them to the summary.

### Can I cancel processing once it starts?

Yes, click the **"Cancel"** button that appears during processing. This will stop the request and return you to the link input state.

### Does processing cost money?

No, the AI Link Processor uses Google Gemini's free tier. There are no per-request costs. However, there is a daily limit of 1,500 requests across all users.

### What if I exceed the daily limit?

Processing requests will fail with an error message. You can still create sermons manually. The limit resets daily at midnight UTC.

---

## Privacy and Security

### What data is sent to external services?

- **YouTube Transcript API:** Only the video ID is sent (extracted from the URL)
- **Google Gemini API:** Only the transcript text and summary are sent for AI processing
- **No personal data** (your name, email, password) is ever sent to external services

### Is my data stored?

- **Transcript:** Not stored (discarded after processing)
- **Summary and SEO content:** Stored in the database as part of the sermon record
- **Processing logs:** Metadata only (user ID, link URL, status, duration) — no sensitive content

### Is the connection secure?

Yes, all external API calls use **HTTPS** encryption. Your data is protected in transit.

### Who can see my processing logs?

Only you can see your own processing logs. Administrators cannot view other users' logs (enforced by Row Level Security policies).

---

## Troubleshooting Checklist

If you encounter issues, try these steps:

1. ✅ **Verify the YouTube URL is correct**
   - Copy the URL directly from YouTube
   - Check for typos or missing characters

2. ✅ **Check if the video has captions**
   - Open the video on YouTube
   - Click the "CC" button to enable captions
   - If no captions are available, the video cannot be processed

3. ✅ **Verify the video is publicly accessible**
   - Open the video in an incognito/private browser window
   - If you can't watch it, the AI processor can't access it either

4. ✅ **Check your rate limit status**
   - Have you processed 5 videos in the past hour?
   - Wait for the rate limit window to reset

5. ✅ **Try a different video**
   - Some videos may have issues with captions or accessibility
   - Test with a known working video

6. ✅ **Refresh the page and try again**
   - Temporary network issues may resolve on retry

7. ✅ **Contact your administrator**
   - If the issue persists, your administrator can check server logs and API status

---

## Getting Help

If you need assistance:

1. **Check this user guide** for common issues and solutions
2. **Contact your administrator** for technical issues or feature requests
3. **Refer to the deployment guide** (for administrators) for configuration and monitoring

---

## What's Next?

Future releases may include:

- **Vimeo support** — Process Vimeo videos
- **Direct video file support** — Upload and process video files directly
- **Multi-language support** — Process sermons in languages other than English
- **Batch processing** — Process multiple videos at once
- **Custom AI prompts** — Customize how the AI generates summaries
- **Transcript editing** — Edit the transcript before summarization
- **Speaker identification** — Identify and label different speakers in the transcript
- **Automatic thumbnail extraction** — Extract video thumbnails automatically

Stay tuned for updates!

---

## Summary

The Sermon AI Link Processor is a powerful tool that saves you time and effort when creating sermon content. Here's a quick recap:

1. **Paste a YouTube link** with captions enabled
2. **Click "Process Link"** and wait 3-8 minutes
3. **Review the generated draft** (title, description, summary, keywords)
4. **Edit as needed** to match your church's voice
5. **Save as draft or publish** to the website

**Remember:**
- Only YouTube videos with captions are supported (for now)
- You can process up to 5 videos per hour
- Always review AI-generated content before publishing
- Use the full transcript as a reference
- Save as draft if you're unsure

Happy sermon processing! 🎉
