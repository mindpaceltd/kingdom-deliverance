#!/usr/bin/env bash
# Health check script for Sermon Queue Processor dependencies
# Checks Redis, Ollama, faster-whisper, and yt-dlp

PASS=0
FAIL=1
overall_status=$PASS

# ─────────────────────────────────────────────────────────────────────────────
# Helper: print result
# ─────────────────────────────────────────────────────────────────────────────
check_result() {
  local name="$1"
  local status="$2"
  if [ "$status" -eq 0 ]; then
    echo "  [PASS] $name"
  else
    echo "  [FAIL] $name"
    overall_status=$FAIL
  fi
}

echo ""
echo "============================================"
echo "  Sermon Queue Processor — Health Check"
echo "============================================"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 1. Redis connectivity
# ─────────────────────────────────────────────────────────────────────────────
echo "1. Checking Redis connectivity..."

redis_status=$FAIL
if [ -n "${REDIS_URL:-}" ]; then
  # Try connecting via REDIS_URL
  redis_result=$(redis-cli -u "$REDIS_URL" ping 2>/dev/null)
else
  # Fallback to default localhost
  redis_result=$(redis-cli ping 2>/dev/null)
fi

if [ "$redis_result" = "PONG" ]; then
  redis_status=$PASS
fi

check_result "Redis (ping)" "$redis_status"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Ollama availability
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "2. Checking Ollama availability..."

ollama_endpoint="${OLLAMA_ENDPOINT:-http://localhost:11434}"
ollama_status=$FAIL

curl -sf "${ollama_endpoint}/api/tags" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  ollama_status=$PASS
fi

check_result "Ollama (${ollama_endpoint}/api/tags)" "$ollama_status"

# ─────────────────────────────────────────────────────────────────────────────
# 3. faster-whisper Python library
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "3. Checking faster-whisper installation..."

whisper_status=$FAIL
whisper_result=$(python3 -c "import faster_whisper; print('OK')" 2>/dev/null)
if [ "$whisper_result" = "OK" ]; then
  whisper_status=$PASS
fi

check_result "faster-whisper (python3 import)" "$whisper_status"

# ─────────────────────────────────────────────────────────────────────────────
# 4. yt-dlp
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "4. Checking yt-dlp installation..."

ytdlp_status=$FAIL

# Try direct command first, then python module
if yt-dlp --version > /dev/null 2>&1; then
  ytdlp_status=$PASS
elif python3 -m yt_dlp --version > /dev/null 2>&1; then
  ytdlp_status=$PASS
fi

check_result "yt-dlp (--version)" "$ytdlp_status"

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
if [ "$overall_status" -eq 0 ]; then
  echo "  Result: ALL CHECKS PASSED"
else
  echo "  Result: ONE OR MORE CHECKS FAILED"
fi
echo "============================================"
echo ""

exit "$overall_status"
