# Deploy Kingdom Deliverance to Liquid Web

This app is a **Next.js 14** site that talks to **Supabase** (hosted) and **Cloudflare R2**. Liquid Web replaces Vercel for the Node runtime, reverse proxy, and cron.

## Recommended product

**Liquid Web Cloud VPS or Dedicated** (Ubuntu 22.04/24.04) with:

- Node.js 20
- Nginx
- PM2 **or** Docker
- Host crontab (replaces `vercel.json` crons)

Managed “Cloud Sites” / shared hosting is a poor fit — you need a long-running Node process.

## What changed in the repo for Liquid Web

| File | Purpose |
|------|---------|
| `next.config.mjs` | `output: 'standalone'` for smaller production runtime |
| `Dockerfile` | Production web image |
| `docker-compose.liquidweb.yml` | Web + Redis (+ optional worker profile) |
| `ecosystem.config.js` | PM2 (standalone-aware) |
| `deploy/liquidweb/nginx.conf` | Reverse proxy → `127.0.0.1:3005` |
| `deploy/liquidweb/crontab` | Cron jobs (sermon publish every 5m; other daily/weekly jobs) |
| `deploy/liquidweb/cron-runner.sh` | Calls cron API routes with `CRON_SECRET` |
| `deploy/liquidweb/deploy.sh` | PM2 deploy |
| `deploy/liquidweb/deploy-docker.sh` | Docker deploy |
| `.env.liquidweb.example` | Production env template |

Supabase stays on Supabase Cloud — you do **not** need Postgres on Liquid Web unless you choose to self-host later.

---

## Path A — PM2 (simplest)

### 1. Server packages

```bash
sudo apt update
sudo apt install -y nginx git curl build-essential
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

### 2. App directory

```bash
sudo mkdir -p /var/www/kdcuganda.org
sudo chown "$USER":"$USER" /var/www/kdcuganda.org
cd /var/www/kdcuganda.org
git clone https://github.com/mindpaceltd/kingdom-deliverance.git .
cp .env.liquidweb.example .env.production
nano .env.production   # fill secrets (copy from Vercel / .env.local)
```

Generate a cron secret if needed:

```bash
openssl rand -hex 32   # paste into CRON_SECRET=
```

### 3. Build & start

```bash
chmod +x deploy/liquidweb/*.sh deploy/liquidweb/cron-runner.sh
bash deploy/liquidweb/deploy.sh
pm2 startup    # run the printed systemd command
pm2 save
```

### 4. Nginx + TLS

```bash
sudo cp deploy/liquidweb/nginx.conf /etc/nginx/sites-available/kdcuganda.org
sudo ln -sf /etc/nginx/sites-available/kdcuganda.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kdcuganda.org -d www.kdcuganda.org
```

Point DNS A/AAAA records for `kdcuganda.org` to the Liquid Web server IP (and update Cloudflare if used as DNS-only or orange-cloud carefully).

### 5. Cron (replaces Vercel)

```bash
sudo cp deploy/liquidweb/crontab /etc/cron.d/kdc
sudo chmod 644 /etc/cron.d/kdc
sudo touch /var/log/kdc-cron.log
# Test one job:
set -a && . ./.env.production && set +a
APP_URL=http://127.0.0.1:3005 bash deploy/liquidweb/cron-runner.sh competitors-capture
```

Jobs:

| Schedule (UTC) | Job |
|----------------|-----|
| `0 5 * * *` | Competitor capture |
| `0 6 * * *` | Growth Coach |
| `0 7 * * *` | Sermon publish |
| `0 7 * * 1` | Competitor weekly report |

---

## Path B — Docker Compose

```bash
cd /var/www/kdcuganda.org
cp .env.liquidweb.example .env.production
# edit .env.production — set REDIS_URL=redis://redis:6379 when using compose
bash deploy/liquidweb/deploy-docker.sh
# Nginx still proxies to 127.0.0.1:3005 (compose publishes that port)
# Install host crontab the same as Path A
```

Optional sermon worker:

```bash
ENABLE_QUEUE_PROCESSOR=true docker compose -f docker-compose.liquidweb.yml --profile workers up -d worker
```

---

## Cutover checklist (from Vercel)

1. [ ] `.env.production` has all keys currently on Vercel (Supabase, R2, Gemini, Meta, Google, `CRON_SECRET`)
2. [ ] OAuth redirect URIs still use `https://kdcuganda.org/api/.../callback` (no change if domain stays)
3. [ ] Pesapal/PayPal IPN/return URLs still point at `kdcuganda.org`
4. [ ] DNS switched to Liquid Web IP; Cloudflare SSL mode compatible (Full if proxied)
5. [ ] Cron tested once manually; Monday report email recipients set in DM Settings
6. [ ] Pause or remove Vercel production domain / git auto-deploy to avoid split-brain
7. [ ] `pm2 status` or `docker compose ps` healthy; homepage + admin login work

---

## Ops cheatsheet

```bash
# PM2
pm2 logs kingdom-deliverance
pm2 restart kingdom-deliverance
bash deploy/liquidweb/deploy.sh

# Docker
docker compose -f docker-compose.liquidweb.yml logs -f web
docker compose -f docker-compose.liquidweb.yml restart web

# Cron log
tail -f /var/log/kdc-cron.log
```

## RAM / sizing notes

- Next.js build needs ~2–4 GB RAM; use a VPS with at least **4 GB** (8 GB preferred if you also run Redis + worker).
- If `npm run build` OOMs, add swap or build on CI and rsync `.next` to the server.

## What stays off Liquid Web

- **Supabase** Auth/DB/Storage policies — keep cloud project
- **R2** media — keep Cloudflare
- **SMTP** — still from `site_settings` (or swap to Liquid Web mail later)

## Support

After the first successful deploy, set `NEXT_PUBLIC_SITE_URL=https://kdcuganda.org` and confirm sitemap/SEO still resolve to the canonical domain (not an IP or `.liquidweb` hostname).
