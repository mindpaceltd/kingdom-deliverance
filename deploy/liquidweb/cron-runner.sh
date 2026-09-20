#!/bin/sh
# Invokes KDC cron API routes (replaces Vercel Cron on Liquid Web).
# Used by host crontab OR the compose `cron` service.
set -eu

APP_URL="${APP_URL:-http://127.0.0.1:3005}"
SECRET="${CRON_SECRET:-${DM_CRON_SECRET:-}}"

if [ -z "$SECRET" ]; then
  echo "[cron] CRON_SECRET not set — aborting $1" >&2
  exit 1
fi

JOB="${1:-}"
case "$JOB" in
  growth) PATH_URI="/api/digital-ministry/cron/growth" ;;
  competitors-capture) PATH_URI="/api/digital-ministry/cron/competitors/capture" ;;
  competitors-report) PATH_URI="/api/digital-ministry/cron/competitors/report" ;;
  sermons-publish) PATH_URI="/api/sermons/cron/publish" ;;
  *)
    echo "Usage: $0 {growth|competitors-capture|competitors-report|sermons-publish}" >&2
    exit 2
    ;;
esac

echo "[cron] $(date -u +%Y-%m-%dT%H:%M:%SZ) GET ${PATH_URI}"
curl -fsS -X GET \
  -H "Authorization: Bearer ${SECRET}" \
  "${APP_URL}${PATH_URI}"
echo
