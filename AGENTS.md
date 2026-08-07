# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 14 (App Router) app — "Kingdom Deliverance Centre Uganda", a church website + admin CMS + e-commerce store. Scripts live in `package.json`; the optional sermon-AI queue config is documented in `src/lib/config/README.md`.

### Services / how to run
- **Web app (the product):** `npm run dev` serves on **port 3005** (not 3000 as the stock `README.md` says). Lint/test/build/start commands are in `package.json` (`lint`, `test`, `build`, `start`).
- **Backend:** hosted **Supabase** (Postgres + auth + storage); no local DB to start. Working credentials are committed in `.env.vercel.production`. Dev reads `.env.local` (gitignored), which already contains the Supabase + Cloudflare R2 values copied from `.env.vercel.production`. If `.env.local` is missing on a fresh VM, recreate it from `.env.vercel.production` (and set `NEXT_PUBLIC_SITE_URL=http://localhost:3005`).
- **Sermon-AI queue (optional, OFF by default via `ENABLE_QUEUE_PROCESSOR=false`):** only this feature needs Redis + the worker (`npm run worker`) + Ollama/Gemini + Python `faster-whisper` (`pip install -r requirements.txt`). The core site, admin, and shop run fine without any of it. `docker-compose.yml` brings up redis/ollama/workers but NOT the app or DB.

### Gotchas
- **Never run `npm run build` while `npm run dev` is running** (and vice-versa): they share the `.next/` directory, so a concurrent build corrupts the dev server's chunks and the site renders blank with 404s for static assets. Stop the other process and `rm -rf .next` before switching between build and dev.
- A clean `npm run build` only succeeds when the dev server is stopped; if you see `DYNAMIC_SERVER_USAGE` / "Export encountered errors" for routes like `/contact`, it's almost always caused by a concurrent dev server, not a real build break.
- Pre-existing repo state (not an environment problem): `npm run lint` reports many `@typescript-eslint` errors, and `npm test` has ~25 failing tests (a `next/cache` mock issue in slug/sitemap tests) while 877 pass. Don't treat these as setup regressions.
- Optional integrations (Gemini, SMTP email, Exchange Rate API, Pesapal, Google OAuth) are unset; features degrade gracefully (e.g. exchange rates fall back, contact-form email is skipped) and the DB write still succeeds.
