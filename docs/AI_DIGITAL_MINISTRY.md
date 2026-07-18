# AI Digital Ministry Platform

Integrated into the existing KDC Uganda admin at `/admin/digital-ministry`.

This is **not** a separate SaaS. It reuses:

- Supabase auth + `profiles` roles (`admin` / `editor` / `author`)
- Admin shell, nav, and mobile drawer
- Google Analytics / Search Console OAuth (`/admin/analytics`)
- Media library + R2
- Sermon AI (Gemini sync + Whisper/Ollama queue)
- Post / sermon SEO panels
- Gemini content generation (`src/lib/actions/ai.ts`)

## Phase 1 (shipped)

- Database schema (`supabase/migrations/20260718220000_digital_ministry_platform.sql`)
- Sidebar section **AI Digital Ministry** with full module navigation
- Live **Dashboard** KPIs from site data (sermons, posts, prayer, inbox, media, testimonies)
- Data-backed **AI Summary** (deterministic until Growth Coach jobs persist reports)
- **Social Accounts** catalog with publish-capability labels (official API strategy)
- Module shells: Studio, Calendar, Campaigns, AI Writer, Sermon Studio, Analytics, Competitors, Community, SEO, Website Analytics, Growth Coach, Reports, Settings
- Per-platform account detail routes (Facebook, YouTube, TikTok, X, LinkedIn, Instagram)
- Staff RBAC via `requireStaff()` on the section layout

## Phase 2 (shipped)

- AES-GCM token encryption (`DM_TOKEN_ENCRYPTION_KEY` or service role key) → `dm_social_accounts.token_encrypted`
- **YouTube / Google**: extended OAuth scopes (`youtube.readonly`, `yt-analytics.readonly`); callback syncs channel metadata into `dm_social_accounts`
- **Meta**: `/api/meta/auth` + `/api/meta/callback` — Pages + linked Instagram Business accounts
- Social Accounts UI: Connect / Reconnect / Disconnect / YouTube Sync + flash messages
- Platform detail pages for Facebook, Instagram, YouTube show live connection health

### Env (Phase 2)

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Optional dedicated key; otherwise SUPABASE_SERVICE_ROLE_KEY is hashed for AES
DM_TOKEN_ENCRYPTION_KEY=

META_APP_ID=
META_APP_SECRET=
# Redirect URI in Meta app: https://kdcuganda.org/api/meta/callback
# (and localhost equivalent for local dev)
```

Google redirect remains `/api/google/callback` (same as Admin → Analytics). Reconnect from Digital Ministry to grant YouTube scopes if an older token lacked them.

## Phase 3 (shipped)

- **Content Studio** list + editor at `/admin/digital-ministry/studio` → `dm_posts`
- Per-platform rows in `dm_post_publications` (auto Facebook when Meta connected; otherwise `manual_required`)
- Schedule → `dm_calendar_entries` + **Content Calendar** month view
- AI rewrite / AI Writer briefs → Gemini → drafts + `dm_ai_generations` log
- Publish now / Mark published for manual platforms (X, YouTube captions, etc.)

## Apply migration

```bash
# Local / linked Supabase project
npx supabase db push
# or run the SQL in the Supabase SQL editor
```

## Roadmap (next phases)

| Phase | Focus |
|------|--------|
| 2 | ✅ Meta Graph OAuth + YouTube sync into `dm_social_accounts` |
| 3 | ✅ Content Studio editor + schedule → `dm_posts` / `dm_post_publications` |
| 4 | Sermon Studio pipeline → clip segments + multi-format generation |
| 5 | Growth Coach daily job (Gemini) writing `dm_growth_reports` |
| 6 | Competitor snapshots (public APIs / RSS only) |
| 7 | Community comment sync + AI draft replies |
| 8 | Unified analytics charts + report exports |

## API principles

- Prefer official APIs (YouTube, Meta, GA, Search Console, GBP, TikTok where available).
- Where write APIs are restricted (e.g. X): drafts + analytics + **manual publish** with clear UI.
- Never scrape private data or violate platform ToS.
- Never give generic AI advice — always ground in KDC metrics and content.

## Key paths

| Path | Role |
|------|------|
| `src/app/admin/digital-ministry/` | App routes |
| `src/components/admin/digital-ministry/` | UI kit + subnav |
| `src/lib/digital-ministry/` | Types + dashboard data |
| `supabase/migrations/20260718220000_digital_ministry_platform.sql` | Schema |
