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

## Phase 1 (shipped in this scaffold)

- Database schema (`supabase/migrations/20260718220000_digital_ministry_platform.sql`)
- Sidebar section **AI Digital Ministry** with full module navigation
- Live **Dashboard** KPIs from site data (sermons, posts, prayer, inbox, media, testimonies)
- Data-backed **AI Summary** (deterministic until Growth Coach jobs persist reports)
- **Social Accounts** catalog with publish-capability labels (official API strategy)
- Module shells: Studio, Calendar, Campaigns, AI Writer, Sermon Studio, Analytics, Competitors, Community, SEO, Website Analytics, Growth Coach, Reports, Settings
- Per-platform account detail routes (Facebook, YouTube, TikTok, X, LinkedIn, Instagram)
- Staff RBAC via `requireStaff()` on the section layout

## Apply migration

```bash
# Local / linked Supabase project
npx supabase db push
# or run the SQL in the Supabase SQL editor
```

## Roadmap (next phases)

| Phase | Focus |
|------|--------|
| 2 | Meta Graph OAuth + YouTube publish/analytics sync into `dm_social_accounts` |
| 3 | Content Studio editor + schedule → `dm_posts` / `dm_post_publications` |
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
