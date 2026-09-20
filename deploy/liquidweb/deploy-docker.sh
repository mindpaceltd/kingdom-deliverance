#!/usr/bin/env bash
# Liquid Web VPS deploy via Docker Compose
# Usage:
#   cd /var/www/kdcuganda.org
#   bash deploy/liquidweb/deploy-docker.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$APP_DIR"

if [ ! -f .env.production ]; then
  echo "Create .env.production from .env.liquidweb.example first."
  exit 1
fi

echo "==> Building and starting stack"
docker compose -f docker-compose.liquidweb.yml --env-file .env.production up -d --build web redis

echo "==> Status"
docker compose -f docker-compose.liquidweb.yml ps

echo "==> Health"
sleep 5
curl -sf http://127.0.0.1:3005/ >/dev/null && echo "OK" || echo "WARN: not ready — docker compose logs -f web"

echo "Optional worker: docker compose -f docker-compose.liquidweb.yml --profile workers up -d worker"
echo "Install host crontab from deploy/liquidweb/crontab"
