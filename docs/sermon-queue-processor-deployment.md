# Sermon Queue Processor - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Sermon Queue Processor, a production-ready, queue-based sermon processing system that enables asynchronous processing of videos from any platform using self-hosted AI services.

## Prerequisites

Before deploying the Sermon Queue Processor, ensure you have the following:

- **Node.js 18+**: For running the Next.js server and worker processes
- **Redis 6+**: For job queue persistence
- **Python 3.9+**: For running the Whisper transcription service
- **Ollama**: For AI summarization and SEO generation
- **yt-dlp**: For downloading audio from video URLs
- **ffmpeg/ffprobe**: For audio validation and processing

## Infrastructure Setup

### 1. Redis Installation and Configuration

Redis serves as the backing store for the BullMQ job queue, ensuring jobs persist across server restarts and crashes.

#### macOS Installation

```bash
# Install Redis via Homebrew
brew install redis

# Verify installation
redis-server --version
# Expected output: Redis server v=8.6.2 (or higher)
```

#### Ubuntu/Debian Installation

```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Verify installation
redis-server --version
```

#### Configuration

Redis must be configured with persistence to ensure job data survives restarts.

**Enable AOF (Append Only File) Persistence:**

1. Locate the Redis configuration file:
   - macOS (Homebrew): `/usr/local/etc/redis.conf`
   - Ubuntu/Debian: `/etc/redis/redis.conf`

2. Edit the configuration file:
   ```bash
   # macOS
   sudo nano /usr/local/etc/redis.conf
   
   # Ubuntu/Debian
   sudo nano /etc/redis/redis.conf
   ```

3. Enable AOF persistence:
   ```conf
   # Change this line:
   appendonly no
   
   # To:
   appendonly yes
   ```

4. Verify the fsync policy (should already be set):
   ```conf
   appendfsync everysec
   ```

5. Save and exit the editor.

**Start Redis:**

```bash
# macOS (Homebrew)
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Test Connectivity:**

```bash
redis-cli ping
# Expected output: PONG
```

**Verify Persistence Settings:**

```bash
redis-cli CONFIG GET appendonly
# Expected output:
# 1) "appendonly"
# 2) "yes"

redis-cli CONFIG GET appendfsync
# Expected output:
# 1) "appendfsync"
# 2) "everysec"
```

#### Redis Configuration Summary

- **Persistence Mode**: AOF (Append Only File)
- **Fsync Policy**: `everysec` (balance between performance and durability)
- **Default Port**: 6379
- **Connection URL**: `redis://localhost:6379`

### 2. Python and Whisper Installation

The Sermon Queue Processor uses faster-whisper for speech-to-text transcription. faster-whisper is a reimplementation of OpenAI's Whisper model using CTranslate2, which is 4x faster than the original implementation while using less memory.

#### Prerequisites

Ensure Python 3.9+ is installed:

```bash
python3 --version
# Expected output: Python 3.9.0 or higher
```

#### Create Python Virtual Environment

Create a dedicated virtual environment for the transcription service:

```bash
# Navigate to project root
cd /path/to/kingdom-deliverance

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate
```

#### Install faster-whisper

With the virtual environment activated, install faster-whisper:

```bash
# Upgrade pip first
pip install --upgrade pip

# Install faster-whisper
pip install faster-whisper
```

Expected output:
```
Successfully installed faster-whisper-1.2.1 ctranslate2-4.7.1 ...
```

#### Download Whisper Model

The Whisper 'base' model will be downloaded automatically on first use. To pre-download it:

```bash
# Test installation and download model
python3 << 'EOF'
from faster_whisper import WhisperModel
print("Downloading Whisper 'base' model...")
model = WhisperModel("base", device="cpu", compute_type="int8")
print("✓ Model downloaded and ready!")
EOF
```

The base model is approximately 150MB and will be cached in `~/.cache/huggingface/hub/`.

#### Verify Installation

Create a test script to verify the installation:

```bash
cat > test_whisper.py << 'EOF'
from faster_whisper import WhisperModel

print("Testing faster-whisper installation...")
model = WhisperModel("base", device="cpu", compute_type="int8")
print("✓ faster-whisper is working correctly!")
print(f"  - Model size: base")
print(f"  - Device: CPU")
print(f"  - Compute type: int8")
EOF

python3 test_whisper.py
```

Expected output:
```
Testing faster-whisper installation...
✓ faster-whisper is working correctly!
  - Model size: base
  - Device: CPU
  - Compute type: int8
```

#### Model Information

**Available Models:**
- `tiny`: Fastest, lowest accuracy (~75MB)
- `base`: Good balance of speed and accuracy (~150MB) **[Recommended]**
- `small`: Better accuracy, slower (~500MB)
- `medium`: High accuracy, much slower (~1.5GB)
- `large-v2`: Best accuracy, very slow (~3GB)

**Compute Types:**
- `int8`: Fastest, lowest memory usage **[Recommended for CPU]**
- `float16`: Better accuracy, requires GPU
- `float32`: Best accuracy, highest memory usage

The system uses the `base` model with `int8` compute type for optimal performance on CPU.

#### Transcription Performance

Expected transcription speeds (base model, CPU):
- 1 minute of audio: ~10-15 seconds processing time
- 30 minute sermon: ~5-7 minutes processing time
- 60 minute sermon: ~10-15 minutes processing time

#### Troubleshooting

**Import Error:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Verify faster-whisper is installed
pip list | grep faster-whisper
```

**Model Download Fails:**
```bash
# Check internet connectivity
curl -I https://huggingface.co

# Manually set cache directory (optional)
export HF_HOME=/path/to/cache
```

**Out of Memory Errors:**
- Use smaller model: `tiny` instead of `base`
- Reduce beam_size: Use `beam_size=1` instead of `beam_size=5`
- Process shorter audio segments

**Slow Transcription:**
- Ensure you're using `compute_type="int8"` for CPU
- Consider using GPU if available: `device="cuda"`
- Use smaller model for faster processing

#### Integration with Worker

The transcription worker will use faster-whisper as follows:

```python
from faster_whisper import WhisperModel

# Initialize model (once at startup)
model = WhisperModel("base", device="cpu", compute_type="int8")

# Transcribe audio
segments, info = model.transcribe(
    audio_path,
    beam_size=5,
    language="en",  # or None for auto-detection
    vad_filter=True,  # Voice Activity Detection
    vad_parameters=dict(min_silence_duration_ms=500)
)

# Extract text
transcript = " ".join([segment.text for segment in segments])
```

#### Virtual Environment Management

**Activate virtual environment:**
```bash
source venv/bin/activate
```

**Deactivate virtual environment:**
```bash
deactivate
```

**Verify active environment:**
```bash
which python3
# Should show: /path/to/project/venv/bin/python3
```

### 3. Ollama Installation

Ollama is used for AI-powered summarization and SEO generation. It runs locally and provides a REST API for generating text using large language models.

#### macOS Installation

**Install Ollama:**

```bash
# Download and install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
```

This will:
- Download Ollama for macOS
- Install Ollama.app to `/Applications/`
- Add the `ollama` command to your PATH

**Verify Installation:**

```bash
# Check if ollama command is available
which ollama
# Expected output: /usr/local/bin/ollama

# Check if Ollama.app is installed
ls -la /Applications/ | grep Ollama
# Expected output: drwxr-xr-x ... Ollama.app
```

#### Ubuntu/Debian Installation

```bash
# Download and install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Start Ollama Server

The Ollama server must be running to process AI requests.

**Start the server:**

```bash
# Start Ollama server (runs in foreground)
ollama serve
```

For production deployments, run Ollama as a background service:

```bash
# macOS (using launchd)
# Create a launch agent plist file
cat > ~/Library/LaunchAgents/com.ollama.server.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/ollama</string>
        <string>serve</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/ollama.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ollama.error.log</string>
</dict>
</plist>
EOF

# Load the launch agent
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

# Verify it's running
launchctl list | grep ollama
```

```bash
# Ubuntu/Debian (using systemd)
sudo systemctl start ollama
sudo systemctl enable ollama
```

**Verify Server is Running:**

```bash
# Test API endpoint
curl http://localhost:11434/api/version

# Expected output:
# {"version":"0.23.0"}
```

#### Download Mistral Model

The Sermon Queue Processor uses the Mistral model for summarization and SEO generation. Mistral is a 7B parameter model that provides excellent quality while being fast enough for production use.

**Download the model:**

```bash
ollama pull mistral
```

Expected output:
```
pulling manifest 
pulling f5074b1221da: 100% ▕███████████▏ 4.4 GB                         
pulling 43070e2d4e53: 100% ▕███████████▏  11 KB                         
pulling 1ff5b64b61b9: 100% ▕███████████▏  799 B                         
pulling ed11eda7790d: 100% ▕███████████▏   30 B                         
pulling 1064e17101bd: 100% ▕███████████▏  487 B                         
verifying sha256 digest 
writing manifest 
success
```

The Mistral model is approximately 4.4GB and will be cached in `~/.ollama/models/`.

**Verify Model Installation:**

```bash
# List installed models
ollama list

# Expected output:
# NAME            ID              SIZE      MODIFIED
# mistral:latest  f5074b1221da    4.4 GB    X minutes ago
```

#### Test Ollama API

Test the Ollama API with a simple prompt to ensure everything is working:

```bash
# Test with a simple prompt
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "What is the capital of France?",
  "stream": false
}'
```

Expected output (formatted):
```json
{
  "model": "mistral",
  "created_at": "2026-05-04T05:52:02.113978Z",
  "response": " The capital of France is Paris.",
  "done": true,
  "done_reason": "stop",
  "total_duration": 54702200649,
  "load_duration": 19068349609,
  "prompt_eval_count": 11,
  "prompt_eval_duration": 25695350599,
  "eval_count": 8,
  "eval_duration": 8774900041
}
```

#### Model Information

**Mistral Model Specifications:**
- **Size**: 4.4GB
- **Parameters**: 7B
- **Context Window**: 8192 tokens
- **Use Case**: General-purpose text generation, summarization, SEO content
- **Performance**: ~10-20 tokens/second on CPU, ~50-100 tokens/second on GPU

**Alternative Models:**

If you need different performance characteristics:

```bash
# Smaller, faster model (1.5GB)
ollama pull llama3.2:1b

# Larger, more capable model (4.7GB)
ollama pull llama3.2:3b

# Much larger, highest quality (8.0GB)
ollama pull llama3.1:8b
```

The system is configured to use `mistral` by default, but you can change the model in the environment configuration.

#### API Endpoints

Ollama provides several API endpoints:

**Generate Text (Non-streaming):**
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "Your prompt here",
  "stream": false
}'
```

**Generate Text (Streaming):**
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "Your prompt here",
  "stream": true
}'
```

**Chat Completion:**
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "mistral",
  "messages": [
    {"role": "user", "content": "Your message here"}
  ],
  "stream": false
}'
```

#### Performance Expectations

**Summarization Performance (Mistral model, CPU):**
- Short sermon (1000 words): ~5-10 seconds
- Medium sermon (3000 words): ~15-30 seconds
- Long sermon (5000+ words): ~30-60 seconds

**SEO Generation Performance:**
- Meta description: ~3-5 seconds
- Keywords: ~3-5 seconds
- Social media posts: ~5-10 seconds each

#### Troubleshooting

**Server Not Starting:**
```bash
# Check if port 11434 is already in use
lsof -i :11434

# Kill existing process if needed
kill -9 <PID>

# Restart Ollama
ollama serve
```

**Model Download Fails:**
```bash
# Check internet connectivity
curl -I https://ollama.ai

# Check disk space (models are large)
df -h

# Retry download
ollama pull mistral
```

**API Requests Timeout:**
- Ensure Ollama server is running: `curl http://localhost:11434/api/version`
- Check server logs: `tail -f /tmp/ollama.log` (if using launchd)
- Increase timeout in your application code
- Consider using a smaller model for faster responses

**Out of Memory Errors:**
- Use a smaller model: `ollama pull llama3.2:1b`
- Close other applications to free up RAM
- Mistral requires ~8GB RAM minimum

**Slow Generation:**
- Ensure you're not running other heavy processes
- Consider using GPU acceleration if available
- Use a smaller model for faster responses
- Reduce the `num_ctx` parameter to use less context

#### Integration with Worker

The AI processing worker will use Ollama as follows:

```typescript
// Generate summary
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'mistral',
    prompt: `Summarize this sermon transcript:\n\n${transcript}`,
    stream: false
  })
});

const data = await response.json();
const summary = data.response;
```

#### Configuration

The Ollama server configuration can be customized via environment variables:

```bash
# Change the default port (default: 11434)
export OLLAMA_HOST=0.0.0.0:8080

# Set number of parallel requests (default: 1)
export OLLAMA_NUM_PARALLEL=4

# Set model cache directory (default: ~/.ollama/models)
export OLLAMA_MODELS=/path/to/models
```

For the Sermon Queue Processor, the default configuration is sufficient.

### 4. yt-dlp and ffmpeg Installation

yt-dlp is used to download audio from video URLs (supports YouTube, Vimeo, and 1000+ platforms). ffmpeg and ffprobe are used for audio validation and processing.

#### macOS Installation

**Option 1: Using pip (Recommended for macOS 12 and older)**

```bash
# Install yt-dlp via pip
python3 -m pip install yt-dlp

# Verify installation
python3 -m yt_dlp --version
# Expected output: 2026.03.17 (or higher)
```

**Option 2: Using Homebrew (macOS 13+)**

```bash
# Install yt-dlp via Homebrew
brew install yt-dlp

# Verify installation
yt-dlp --version
```

**Installing ffmpeg and ffprobe on macOS:**

For macOS 12 and older where Homebrew may have compatibility issues, use pre-built binaries:

```bash
# Download and install ffmpeg
curl -L https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -o /tmp/ffmpeg.zip
unzip -o /tmp/ffmpeg.zip -d /tmp/
sudo mv /tmp/ffmpeg /usr/local/bin/
chmod +x /usr/local/bin/ffmpeg

# Download and install ffprobe
curl -L https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip -o /tmp/ffprobe.zip
unzip -o /tmp/ffprobe.zip -d /tmp/
sudo mv /tmp/ffprobe /usr/local/bin/
chmod +x /usr/local/bin/ffprobe

# Verify installations
ffmpeg -version
ffprobe -version
```

For macOS 13+ with Homebrew:

```bash
# Install ffmpeg (includes ffprobe)
brew install ffmpeg

# Verify installations
ffmpeg -version
ffprobe -version
```

#### Ubuntu/Debian Installation

```bash
# Install yt-dlp
sudo apt-get update
sudo apt-get install python3-pip
python3 -m pip install yt-dlp

# Install ffmpeg and ffprobe
sudo apt-get install ffmpeg

# Verify installations
python3 -m yt_dlp --version
ffmpeg -version
ffprobe -version
```

#### Testing yt-dlp

Test yt-dlp with a sample YouTube video to ensure it works correctly:

```bash
# Test audio extraction
python3 -m yt_dlp --extract-audio --audio-format m4a --audio-quality 0 \
  --output "/tmp/test_audio.%(ext)s" --no-playlist \
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Verify the audio file was created
ls -lh /tmp/test_audio.m4a

# Test ffprobe validation
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 /tmp/test_audio.m4a

# Clean up test file
rm /tmp/test_audio.m4a
```

Expected output:
- yt-dlp should download and convert the audio successfully
- ffprobe should display the audio duration in seconds (e.g., `213.043000`)

#### Important Notes

1. **yt-dlp as Python Module**: If yt-dlp is installed via pip and not available in PATH, use `python3 -m yt_dlp` instead of `yt-dlp` command.

2. **Audio Format**: The system prefers m4a format for better quality and compatibility, with mp3 as fallback.

3. **Temporary Directory**: Ensure the temporary audio directory (default: `/tmp/sermon-audio`) has sufficient space and write permissions.

4. **Video Duration Limit**: The system rejects videos longer than 3 hours to prevent excessive processing time and disk usage.

5. **Download Timeout**: Audio extraction has a 10-minute timeout to prevent indefinite downloads.

#### Troubleshooting

**yt-dlp command not found:**
```bash
# Use Python module syntax instead
python3 -m yt_dlp --version
```

**ffmpeg/ffprobe not found after installation:**
```bash
# Check if binaries are in PATH
which ffmpeg
which ffprobe

# If not found, verify installation location
ls -la /usr/local/bin/ffmpeg
ls -la /usr/local/bin/ffprobe
```

**Permission denied errors:**
```bash
# Ensure binaries are executable
sudo chmod +x /usr/local/bin/ffmpeg
sudo chmod +x /usr/local/bin/ffprobe
```

**yt-dlp download failures:**
- Ensure you have a stable internet connection
- Some videos may be region-blocked or private
- Check yt-dlp logs for specific error messages
- Update yt-dlp to the latest version: `python3 -m pip install --upgrade yt-dlp`

## Environment Configuration

Copy `.env.example` to `.env.local` (development) or `.env` (production) and fill in the required values.

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Example | Description |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `OLLAMA_ENDPOINT` | `http://localhost:11434` | Ollama API endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase service role key |

### Queue Processor Variables

| Variable | Default | Description |
|---|---|---|
| `ENABLE_QUEUE_PROCESSOR` | `false` | Feature flag — set to `true` to enable |
| `OLLAMA_MODEL` | `mistral` | Ollama model for AI processing |
| `WHISPER_MODEL` | `base` | Whisper model size (tiny/base/small/medium/large) |
| `WORKER_CONCURRENCY` | `1` | Concurrent jobs per worker process |
| `JOB_TIMEOUT_MS` | `3600000` | Max job duration in ms (default: 60 min) |
| `RATE_LIMIT_PER_HOUR` | `10` | Max job submissions per user per hour |
| `TEMP_AUDIO_DIR` | `/tmp/sermon-audio` | Temporary directory for audio files |

### Example Configuration

```bash
# ─── Supabase ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ─── Queue Processor ─────────────────────────────────────────────────────────
ENABLE_QUEUE_PROCESSOR=true
REDIS_URL=redis://localhost:6379
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=mistral
WHISPER_MODEL=base
WORKER_CONCURRENCY=1
JOB_TIMEOUT_MS=3600000
RATE_LIMIT_PER_HOUR=10
TEMP_AUDIO_DIR=/tmp/sermon-audio
```

### Creating the Temporary Audio Directory

The worker needs a writable directory for temporary audio files:

```bash
mkdir -p /tmp/sermon-audio
chmod 755 /tmp/sermon-audio
```

## Worker Process Deployment

The Sermon Queue Processor worker is a separate Node.js process that consumes jobs from the BullMQ queue and executes the sermon processing pipeline (audio extraction → transcription → AI summarization → SEO generation).

### Prerequisites

Before starting the worker, ensure:

1. Redis is running and accessible (see [Redis Installation](#1-redis-installation-and-configuration))
2. Ollama is running with the Mistral model downloaded (see [Ollama Installation](#3-ollama-installation))
3. yt-dlp and ffmpeg are installed (see [yt-dlp and ffmpeg Installation](#4-yt-dlp-and-ffmpeg-installation))
4. Python virtual environment is set up with faster-whisper (see [Python and Whisper Installation](#2-python-and-whisper-installation))
5. Environment variables are configured (see [Environment Configuration](#environment-configuration))

### Starting the Worker

#### Development Mode

For development, use the `worker:dev` script which automatically restarts the worker when source files change:

```bash
npm run worker:dev
```

#### Production Mode

For production, use the `worker` script:

```bash
npm run worker
```

Expected startup output:
```
[Worker] Sermon processor worker started
[Worker] Concurrency: 1
[Worker] Lock duration: 3600000ms
[Worker] Stalled interval: 60000ms
```

The worker will then wait for jobs to arrive in the queue and process them automatically.

### Worker Configuration

The worker behaviour is controlled by environment variables:

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `WORKER_CONCURRENCY` | `1` | Number of jobs processed in parallel |
| `OLLAMA_ENDPOINT` | `http://localhost:11434` | Ollama API endpoint |
| `WHISPER_MODEL` | `base` | Whisper model size (tiny/base/small/medium/large) |

To increase throughput, raise `WORKER_CONCURRENCY`:

```bash
WORKER_CONCURRENCY=3 npm run worker
```

### Running Multiple Workers (Horizontal Scaling)

You can run multiple worker processes in separate terminals (or on separate machines) to increase throughput. Each worker will independently consume jobs from the shared Redis queue:

```bash
# Terminal 1
WORKER_CONCURRENCY=2 npm run worker

# Terminal 2
WORKER_CONCURRENCY=2 npm run worker
```

BullMQ handles job locking automatically — each job is processed by exactly one worker.

### Running as a Background Service

#### macOS (launchd)

Create a launch agent plist file:

```bash
cat > ~/Library/LaunchAgents/com.kdc.sermon-worker.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kdc.sermon-worker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npm</string>
        <string>run</string>
        <string>worker</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/kingdom-deliverance</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/sermon-worker.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/sermon-worker.error.log</string>
</dict>
</plist>
EOF

# Load the launch agent
launchctl load ~/Library/LaunchAgents/com.kdc.sermon-worker.plist

# Verify it's running
launchctl list | grep sermon-worker
```

#### Ubuntu/Debian (systemd)

Create a systemd service file:

```bash
sudo tee /etc/systemd/system/sermon-worker.service << 'EOF'
[Unit]
Description=KDC Sermon Queue Processor Worker
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/kingdom-deliverance
ExecStart=/usr/bin/npm run worker
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable sermon-worker
sudo systemctl start sermon-worker

# Check status
sudo systemctl status sermon-worker

# View logs
sudo journalctl -u sermon-worker -f
```

### Graceful Shutdown

The worker handles `SIGTERM` and `SIGINT` signals gracefully. It will finish processing the current job before exiting:

```bash
# Send SIGTERM to gracefully stop the worker
kill -SIGTERM <worker_pid>

# Or press Ctrl+C in the terminal running the worker
```

Expected shutdown output:
```
[Worker] SIGTERM received. Gracefully shutting down...
```

### Verifying Worker Operation

To confirm the worker is processing jobs correctly:

1. **Check worker logs** for `[Worker] Job <id> completed successfully` messages.
2. **Submit a test job** via the sermon form in the admin UI and watch the worker logs.
3. **Use the health check endpoint** (once deployed): `GET /api/health/queue`

### Troubleshooting

**Worker exits immediately:**
- Check that `REDIS_URL` is set and Redis is reachable: `redis-cli ping`
- Check that all required environment variables are configured

**Jobs stuck in "waiting" state:**
- Ensure at least one worker process is running
- Check worker logs for connection errors

**Worker crashes mid-job:**
- BullMQ will automatically detect the stalled job (within 1 minute) and re-queue it for retry
- Check worker logs for the error message

**Slow processing:**
- Increase `WORKER_CONCURRENCY` to process more jobs in parallel
- Run additional worker processes on separate machines
- Use a faster Whisper model (`tiny` instead of `base`) for quicker transcription

## Health Checks and Monitoring

### Health Check Script

Run the bundled health check script to verify all dependencies are operational:

```bash
bash scripts/health-check.sh
```

The script checks:
1. **Redis** — `redis-cli ping` (uses `$REDIS_URL` if set, otherwise `localhost:6379`)
2. **Ollama** — `curl -sf $OLLAMA_ENDPOINT/api/tags`
3. **faster-whisper** — `python3 -c "import faster_whisper; print('OK')"`
4. **yt-dlp** — `yt-dlp --version`

Example output when all checks pass:

```
============================================
  Sermon Queue Processor — Health Check
============================================

1. Checking Redis connectivity...
  [PASS] Redis (ping)

2. Checking Ollama availability...
  [PASS] Ollama (http://localhost:11434/api/tags)

3. Checking faster-whisper installation...
  [PASS] faster-whisper (python3 import)

4. Checking yt-dlp installation...
  [PASS] yt-dlp (--version)

============================================
  Result: ALL CHECKS PASSED
============================================
```

The script exits with code `0` if all checks pass, or code `1` if any check fails. This makes it suitable for use in CI/CD pipelines and container health checks.

### Queue Health API Endpoint

```
GET /api/health/queue
```

Returns a JSON object with the status of all queue components:

```json
{
  "status": "healthy",
  "redis": "connected",
  "ollama": "available",
  "workers": {
    "active": 3,
    "activeJobs": 1
  },
  "queue": {
    "waiting": 5,
    "active": 1,
    "failed": 0
  }
}
```

### Queue Metrics API Endpoint

```
GET /api/metrics/queue
```

Returns processing statistics:

```json
{
  "lastHour": {
    "processed": 12,
    "failed": 1,
    "successRate": 0.917
  },
  "lastDay": {
    "processed": 87,
    "failed": 3,
    "successRate": 0.966,
    "averageProcessingTimeMs": 245000
  }
}
```

### Monitoring Checklist

| Metric | Healthy Range | Action if Outside Range |
|---|---|---|
| Queue length (waiting) | < 50 | Add more worker processes |
| Failed jobs (last hour) | < 5 | Investigate worker logs |
| Active workers | ≥ 1 | Start worker: `npm run worker` |
| Redis connection | Connected | Check Redis service |
| Ollama response | Available | Check Ollama service |

## Troubleshooting

### Redis Connection Issues

If you encounter Redis connection errors:

1. **Check if Redis is running:**
   ```bash
   # macOS
   brew services list | grep redis
   
   # Ubuntu/Debian
   sudo systemctl status redis-server
   ```

2. **Check Redis logs:**
   ```bash
   # macOS
   tail -f /usr/local/var/log/redis.log
   
   # Ubuntu/Debian
   sudo journalctl -u redis-server -f
   ```

3. **Test connectivity:**
   ```bash
   redis-cli ping
   ```

4. **Verify configuration:**
   ```bash
   redis-cli CONFIG GET appendonly
   redis-cli CONFIG GET appendfsync
   ```

### Redis Persistence Issues

If jobs are not persisting across restarts:

1. **Verify AOF is enabled:**
   ```bash
   redis-cli CONFIG GET appendonly
   # Should return "yes"
   ```

2. **Check AOF file location:**
   ```bash
   redis-cli CONFIG GET dir
   # Shows the directory where AOF file is stored
   ```

3. **Verify AOF file exists:**
   ```bash
   # macOS
   ls -la /usr/local/var/db/redis/appendonly.aof
   
   # Ubuntu/Debian
   ls -la /var/lib/redis/appendonly.aof
   ```

## Security Considerations

### Redis Security

1. **Bind to localhost only** (default):
   ```conf
   bind 127.0.0.1 ::1
   ```

2. **Set a password** (recommended for production):
   ```conf
   requirepass your_secure_password_here
   ```
   
   Then update your `REDIS_URL` environment variable:
   ```bash
   REDIS_URL=redis://:your_secure_password_here@localhost:6379
   ```

3. **Disable dangerous commands** (optional):
   ```conf
   rename-command FLUSHDB ""
   rename-command FLUSHALL ""
   rename-command CONFIG ""
   ```

## Performance Tuning

### Redis Performance

1. **Increase max memory** (if needed):
   ```conf
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   ```

2. **Adjust AOF rewrite settings** (for large workloads):
   ```conf
   auto-aof-rewrite-percentage 100
   auto-aof-rewrite-min-size 64mb
   ```

## Backup and Recovery

### Redis Backup

1. **Manual backup:**
   ```bash
   redis-cli BGSAVE
   ```

2. **Automated backups:**
   ```bash
   # Add to crontab
   0 2 * * * redis-cli BGSAVE
   ```

3. **Backup AOF file:**
   ```bash
   # macOS
   cp /usr/local/var/db/redis/appendonly.aof /path/to/backup/
   
   # Ubuntu/Debian
   sudo cp /var/lib/redis/appendonly.aof /path/to/backup/
   ```

### Redis Recovery

1. **Stop Redis:**
   ```bash
   # macOS
   brew services stop redis
   
   # Ubuntu/Debian
   sudo systemctl stop redis-server
   ```

2. **Restore AOF file:**
   ```bash
   # macOS
   cp /path/to/backup/appendonly.aof /usr/local/var/db/redis/
   
   # Ubuntu/Debian
   sudo cp /path/to/backup/appendonly.aof /var/lib/redis/
   ```

3. **Start Redis:**
   ```bash
   # macOS
   brew services start redis
   
   # Ubuntu/Debian
   sudo systemctl start redis-server
   ```

## Next Steps

After completing the infrastructure setup:

1. ✅ Redis installed and configured with AOF persistence
2. ✅ yt-dlp and ffmpeg installed and tested
3. ✅ Python virtual environment created and faster-whisper installed (Task 4.1)
4. ✅ Ollama installed and Mistral model downloaded (Task 5.1)
5. ⏳ Configure environment variables (Task 1.4)
6. ✅ Deploy worker processes (Task 7.6)

## Support

For issues or questions:

- Check the [Troubleshooting](#troubleshooting) section
- Review Redis logs for error messages
- Verify all configuration settings match this guide
- Ensure Redis version is 6.0 or higher
- For faster-whisper issues, check the Python and Whisper Installation section

---

**Last Updated**: May 4, 2025
**Python Version**: 3.10.12
**faster-whisper Version**: 1.2.1
**yt-dlp Version**: 2026.03.17
**ffmpeg Version**: 8.1.1
**Ollama Version**: 0.23.0
**Mistral Model**: 4.4GB (7B parameters)
**Deployment Status**: ✅ Redis Configured | ✅ yt-dlp & ffmpeg Installed | ✅ faster-whisper Installed | ✅ Ollama & Mistral Installed
