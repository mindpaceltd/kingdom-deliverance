#!/usr/bin/env bash
# Liquid Web VPS deploy (PM2 path — no Docker required)
# Usage on the server:
#   cd /var/www/kdcuganda.org
#   git pull
#   bash deploy/liquidweb/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$APP_DIR"

echo "==> App dir: $APP_DIR"

if [ ! -f .env.production ] && [ ! -f .env.local ] && [ ! -f .env ]; then
  echo "Missing env file. Copy .env.liquidweb.example → .env.production and fill secrets."
  exit 1
fi

# Prefer .env.production for production deploys
if [ -f .env.production ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.production
  set +a
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building Next.js (standalone)"
npm run build

# Standalone needs public + static copied beside server.js for some setups;
# Next already emits them under .next/standalone when configured correctly.
if [ -d .next/standalone ]; then
  mkdir -p .next/standalone/.next
  cp -R public .next/standalone/public 2>/dev/null || true
  cp -R .next/static .next/standalone/.next/static 2>/dev/null || true
fi

mkdir -p logs

echo "==> Restarting PM2"
if command -v pm2 >/dev/null 2>&1; then
  APP_DIR="$APP_DIR" PORT="${PORT:-3005}" pm2 startOrReload ecosystem.config.js --only kingdom-deliverance --update-env
  pm2 save
else
  echo "PM2 not found. Install: npm i -g pm2 && pm2 startup"
  exit 1
fi

echo "==> Health check"
sleep 3
if curl -sf "http://127.0.0.1:${PORT:-3005}/" >/dev/null; then
  echo "OK — app responding on :${PORT:-3005}"
else
  echo "WARN — app not responding yet. Check: pm2 logs kingdom-deliverance"
fi

echo "Done. Ensure Nginx proxies to 127.0.0.1:${PORT:-3005} and crontab is installed."
