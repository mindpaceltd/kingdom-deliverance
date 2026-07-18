# AI Digital Ministry Platform

Integrated into the existing KDC Uganda admin at `/admin/digital-ministry`.

This is **not** a separate SaaS. It reuses:

- Supabase auth + `profiles` roles (`admin` / `editor` / `author`)
- Admin shell, nav, and mobile drawer
- Google Analytics / Search Console OAuth (`/admin/analytics`)
- Media library + R2
- Sermon AI (Gemini sync + Whisper/Ollama queue)
- Post / sermon SEO panels
- Gemini content generation (`src/lib/actions/ai.ts` + `src/lib/digital-ministry/gemini.ts`)

## Phases 1–8 (shipped)

| Phase | Status | What shipped |
|------|--------|----------------|
| 1 | ✅ | Schema, nav, dashboard KPIs, module shells |
| 2 | ✅ | YouTube/Google + Meta OAuth → encrypted `dm_social_accounts` |
| 3 | ✅ | Content Studio + calendar + AI Writer drafts |
| 4 | ✅ | Sermon Studio packs → `dm_sermon_segments` + push to Studio |
| 5 | ✅ | Growth Coach Gemini reports + cron endpoint |
| 6 | ✅ | Competitors + public RSS/website snapshots + AI compare |
| 7 | ✅ | Community inbox sync (contact/prayer) + AI draft replies |
| 8 | ✅ | Analytics charts/snapshots + CSV reports |

Also wired: Campaigns, SEO audits, Settings health, Website analytics KPIs.

**Completion pass:** Manual connect for every platform (TikTok/X/LinkedIn/etc.), no “coming soon” stubs, Growth Coach open tasks, dashboard donations/leads/conversions + GA snapshot enrichment.

### Env

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DM_TOKEN_ENCRYPTION_KEY=   # optional
META_APP_ID=               # can wait until end of rollout
META_APP_SECRET=
GEMINI_API_KEY=            # required for AI modules
CRON_SECRET=               # or DM_CRON_SECRET for Growth Coach cron
```

- Google callback: `/api/google/callback`
- Meta callback: `/api/meta/callback`
- Growth cron: `GET/POST /api/digital-ministry/cron/growth` with `Authorization: Bearer $CRON_SECRET`

## Apply migration

```bash
npx supabase db push
```

## API principles

- Prefer official APIs (YouTube, Meta, GA, Search Console).
- Where write APIs are restricted: drafts + **manual publish**.
- Competitor intel: public RSS / website only — no private scraping.
- AI always grounded in KDC metrics and sermon/post content.

## Key paths

| Path | Role |
|------|------|
| `src/app/admin/digital-ministry/` | App routes |
| `src/components/admin/digital-ministry/` | UI kit + module clients |
| `src/lib/digital-ministry/` | Server actions + Gemini helper |
| `src/app/api/digital-ministry/cron/growth/` | Daily coach job |
| `supabase/migrations/20260718220000_digital_ministry_platform.sql` | Schema |
