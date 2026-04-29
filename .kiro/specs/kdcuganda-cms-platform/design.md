# Design Document — KDC Uganda CMS Platform

## Overview

The Kingdom Deliverance Centre Uganda CMS Platform is a full-stack content management system built on Next.js 14 App Router with Supabase (cloud-hosted at `wuqhrjczlolhiaihosei.supabase.co`) as the backend. Phase 1 (public-facing website) is complete. This design covers Phases 2–5: the authenticated admin shell, all CRUD managers, media library, dynamic public routes, search, and production hardening.

The system follows a clear separation between:
- **Public routes** — statically generated / ISR, read-only, no auth required
- **Admin routes** — dynamically rendered, auth-gated, role-aware, mutate via Server Actions

---

## Architecture

### High-Level System Diagram

```
Browser
  │
  ├─ Public Pages (/blog, /sermons, /events, /ministries, ...)
  │     └─ Next.js RSC (ISR, revalidate=3600)
  │           └─ Supabase Server Client (anon key, RLS enforced)
  │
  ├─ Admin Pages (/admin/*)
  │     ├─ middleware.ts  ──► auth guard (getUser, redirect)
  │     ├─ Admin Layout (RSC, fetches profile + role)
  │     ├─ CRUD Manager Pages (RSC + Client Components)
  │     └─ Server Actions  ──► Supabase Server/Admin Client
  │
  └─ /admin/login
        └─ Client Component (signInWithPassword via browser client)

Supabase Cloud (wuqhrjczlolhiaihosei.supabase.co)
  ├─ Auth (JWT sessions, cookie-based via @supabase/ssr)
  ├─ Postgres (RLS policies per table/role)
  └─ Storage (media bucket, public read)
```

### Request Lifecycle — Admin Route

```
Request → middleware.ts
  → supabase.auth.getUser()
  → [no user]  → redirect /admin/login?redirectTo=<path>
  → [user]     → NextResponse.next() (with refreshed cookies)
      → Admin Layout (RSC)
          → createClient() [server]
          → SELECT * FROM profiles WHERE id = auth.uid()
          → pass { user, profile, role } via React context
              → Page Component (RSC or Client)
                  → Server Action (mutation)
                      → verify role from profiles
                      → execute query (server client or admin client)
                      → revalidatePath(...)
                      → return { success } | { error }
```

### Auth Flow Diagram

```
[Login Page]
  User submits email + password
  → createClient() [browser]
  → supabase.auth.signInWithPassword({ email, password })
  → [error]   → display error.message in UI
  → [success] → router.push(redirectTo || '/admin')
               → middleware refreshes session cookie on next request

[Session Expiry]
  middleware.ts calls getUser() → null
  → redirect /admin/login?redirectTo=<current-path>

[Logout]
  Client calls supabase.auth.signOut()
  → session cookie cleared
  → router.push('/admin/login')
```

---

## Components and Interfaces

### Admin Shell Layout (`src/app/admin/layout.tsx`)

The layout is a React Server Component that:
1. Creates a server Supabase client and calls `getUser()`
2. Fetches the `profiles` row for the authenticated user
3. Wraps children in an `AdminContext` provider with `{ user, profile, role }`
4. Renders the sidebar, header, and mobile drawer

```
AdminLayout (RSC)
  ├─ AdminContext.Provider  { user, profile, role }
  ├─ AdminSidebar (Client Component — handles active link highlighting)
  │     ├─ Logo / brand
  │     ├─ Nav links (role-filtered: Users + Settings hidden for non-admin)
  │     └─ Logout button (calls signOut, redirects)
  ├─ MobileDrawer (Sheet from shadcn/ui, triggered by hamburger)
  └─ AdminHeader
        ├─ Page title (dynamic)
        ├─ UserAvatar (name + initials fallback)
        └─ Notification badge (unread inbox count)
```

**Role-aware nav filtering:**
```typescript
const adminOnlyLinks = ['/admin/users', '/admin/settings']
// filtered out when role !== 'admin'
```

### Context: `src/lib/admin-context.tsx`

```typescript
interface AdminContextValue {
  user: User                  // from supabase.auth.getUser()
  profile: Profile            // from profiles table
  role: UserRole              // 'admin' | 'editor' | 'author' | 'member'
}
export const AdminContext = createContext<AdminContextValue>(...)
export const useAdmin = () => useContext(AdminContext)
```

### CRUD Manager Pattern

Every content manager (Posts, Sermons, Events, Ministries) follows the same structure:

```
/admin/[resource]/page.tsx  (RSC — fetches initial list)
  └─ ResourceManager (Client Component)
        ├─ DataTable
        │     ├─ columns config (title, status, date, actions)
        │     ├─ pagination controls
        │     └─ filter bar (search input + dropdowns)
        ├─ ResourceForm (Dialog/Sheet)
        │     ├─ controlled inputs (title, slug, status, ...)
        │     ├─ SlugInput (auto-generates from title, manually overridable)
        │     ├─ RichTextEditor (Tiptap)
        │     └─ MediaPicker (modal, returns URL)
        └─ DeleteConfirmDialog
```

**Shared components:**
- `src/components/admin/data-table.tsx` — generic table with pagination
- `src/components/admin/resource-form.tsx` — generic form shell (Dialog + Sheet)
- `src/components/admin/slug-input.tsx` — title-to-slug auto-generation
- `src/components/admin/rich-text-editor.tsx` — Tiptap wrapper
- `src/components/admin/media-picker.tsx` — modal media selector
- `src/components/admin/status-badge.tsx` — coloured status pill

### Media Library

```
/admin/media/page.tsx  (RSC)
  └─ MediaLibrary (Client Component)
        ├─ UploadZone (drag-and-drop, file input)
        │     ├─ accepts: image/*, audio/mpeg, audio/mp4, video/mp4, application/pdf
        │     └─ max size: 50 MB (validated client-side before upload)
        ├─ TypeFilter (tabs: All | Images | Audio | Video | Documents)
        ├─ MediaGrid
        │     └─ MediaCard (thumbnail, filename, type, date, delete button)
        └─ MediaPickerModal (reused from content forms)
```

**Upload flow:**
1. User selects/drops file → client validates type + size
2. `supabase.storage.from('media').upload(path, file)` via browser client
3. `getPublicUrl(path)` to get the CDN URL
4. Server Action `createMediaRecord({ filename, url, type, mime_type, size_bytes })` inserts into `media` table

### Key Shared Public Components

- `src/components/layout/navbar.tsx` — public nav with search trigger
- `src/components/layout/footer.tsx` — public footer
- `src/components/search/search-modal.tsx` — full-screen search overlay
- `src/components/content/sermon-card.tsx` — sermon listing card
- `src/components/content/post-card.tsx` — blog post card
- `src/components/content/event-card.tsx` — event card
- `src/components/content/video-player.tsx` — YouTube/Vimeo embed + HTML5 fallback
- `src/components/content/audio-player.tsx` — HTML5 audio element
- `src/components/content/related-content.tsx` — "Related" section (3 items)

---

## Data Models

### TypeScript Types (`src/lib/types.ts` — extended)

```typescript
export type UserRole = 'admin' | 'editor' | 'author' | 'member'

export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  role: UserRole
  phone: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  featured_image: string | null
  author_id: string | null
  type: 'blog' | 'news'
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'name' | 'avatar_url'>
}

export interface Sermon {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  video_url: string | null
  audio_url: string | null
  thumbnail_url: string | null
  preacher: string
  series: string | null
  date: string
  duration_minutes: number | null
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  date: string
  end_date: string | null
  location: string | null
  image_url: string | null
  is_featured: boolean
  registration_url: string | null
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface Ministry {
  id: string
  name: string
  slug: string
  description: string | null
  content: string | null
  leader: string | null
  meeting_time: string | null
  image_url: string | null
  icon: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MediaAsset {
  id: string
  filename: string
  url: string
  type: 'image' | 'video' | 'audio' | 'document'
  mime_type: string | null
  size_bytes: number | null
  alt_text: string | null
  caption: string | null
  uploaded_by: string | null
  bucket: string
  created_at: string
}

export interface SiteSetting {
  key: string
  value: string | null
  updated_at: string
}

export interface GalleryItem {
  id: string
  title: string | null
  description: string | null
  image_url: string
  album: string
  display_order: number
  created_at: string
}
```

### Database ERD (Text)

```
auth.users (Supabase managed)
  │ id (UUID PK)
  │
  └──< profiles
         id (UUID PK, FK → auth.users.id)
         name, avatar_url, role, phone, bio
         created_at, updated_at

profiles ──< posts
  author_id (FK → profiles.id, nullable)
  id, title, slug (UNIQUE), content, excerpt
  featured_image, type, status, published_at
  created_at, updated_at

profiles ──< media
  uploaded_by (FK → profiles.id, nullable)
  id, filename, url, type, mime_type
  size_bytes, alt_text, caption, bucket
  created_at

sermons (standalone)
  id, title, slug (UNIQUE), description, content
  video_url, audio_url, thumbnail_url
  preacher, series, date, duration_minutes, status
  created_at, updated_at

events (standalone)
  id, title, slug (UNIQUE), description, content
  date, end_date, location, image_url
  is_featured, registration_url, status
  created_at, updated_at

ministries (standalone)
  id, name, slug (UNIQUE), description, content
  leader, meeting_time, image_url, icon
  display_order, is_active
  created_at, updated_at

gallery (standalone)
  id, title, description, image_url
  album, display_order, created_at

site_settings (key-value)
  key (TEXT PK), value, updated_at

donations (standalone)
  id, donor_name, donor_email, amount, currency
  method, reference, notes, is_anonymous, status
  created_at

prayer_requests (standalone)
  id, name, email, request
  is_anonymous, is_reviewed, created_at

contact_submissions (standalone)
  id, name, email, phone, subject, message
  is_read, created_at
```

---

## Data Access Layer (`src/lib/supabase/queries.ts`)

All functions use `createClient()` from `server.ts` (anon key + RLS). They never throw — errors are caught, logged, and `null` / `[]` is returned.

```typescript
// Posts
export async function getPosts(opts?: { type?: 'blog'|'news', limit?: number }): Promise<Post[]>
export async function getPostBySlug(slug: string): Promise<Post | null>

// Sermons
export async function getSermons(opts?: {
  preacher?: string, series?: string,
  from?: string, to?: string,
  page?: number, pageSize?: number
}): Promise<{ data: Sermon[], count: number }>
export async function getSermonBySlug(slug: string): Promise<Sermon | null>
export async function getSermonFilters(): Promise<{ preachers: string[], series: string[] }>

// Events
export async function getEvents(opts?: { featured?: boolean, status?: string }): Promise<Event[]>
export async function getEventBySlug(slug: string): Promise<Event | null>

// Ministries
export async function getMinistries(activeOnly?: boolean): Promise<Ministry[]>
export async function getMinistryBySlug(slug: string): Promise<Ministry | null>

// Site Settings
export async function getSiteSettings(): Promise<Record<string, string>>

// Gallery
export async function getGallery(album?: string): Promise<GalleryItem[]>

// Search
export async function searchContent(query: string): Promise<{
  posts: Post[], sermons: Sermon[], events: Event[]
}>
```

**Error handling pattern:**
```typescript
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) {
    console.error('[getPostBySlug]', error.message)
    return null
  }
  return data
}
```

---

## Server Actions (`src/lib/actions/`)

All Server Actions follow this pattern:

```typescript
'use server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function verifyRole(minRole: UserRole[]): Promise<Profile> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !minRole.includes(profile.role))
    throw new Error('Forbidden') // caller returns 403
  return profile
}
```

**Action files:**
- `src/lib/actions/posts.ts` — createPost, updatePost, deletePost (archive)
- `src/lib/actions/sermons.ts` — createSermon, updateSermon, deleteSermon
- `src/lib/actions/events.ts` — createEvent, updateEvent, deleteEvent
- `src/lib/actions/ministries.ts` — createMinistry, updateMinistry, reorderMinistries
- `src/lib/actions/media.ts` — createMediaRecord, deleteMedia
- `src/lib/actions/users.ts` — inviteUser, updateUserRole, deactivateUser
- `src/lib/actions/settings.ts` — saveSettings
- `src/lib/actions/inbox.ts` — markContactRead, markPrayerReviewed
- `src/lib/actions/gallery.ts` — createGalleryItem, deleteGalleryItem, reorderGallery

**Revalidation map:**
| Action | revalidatePath calls |
|--------|---------------------|
| post save/delete | `/blog`, `/blog/[slug]`, `/` |
| sermon save/delete | `/sermons`, `/sermons/[slug]`, `/` |
| event save/delete | `/events`, `/events/[slug]`, `/` |
| ministry save/delete | `/ministries`, `/ministries/[slug]` |
| settings save | `/`, `/contact` |
| gallery save/delete | `/gallery` |

---

## Dynamic Public Routes

### Pattern (same for blog, sermons, events)

```typescript
// src/app/blog/[slug]/page.tsx
import { getPostBySlug, getPosts } from '@/lib/supabase/queries'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}
  return { title: post.title, description: post.excerpt }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()
  // render post...
}
```

### Video Player Logic (`src/components/content/video-player.tsx`)

```typescript
function VideoPlayer({ url }: { url: string }) {
  const isYouTube = /youtube\.com|youtu\.be/.test(url)
  const isVimeo = /vimeo\.com/.test(url)
  if (isYouTube || isVimeo) return <iframe src={embedUrl(url)} ... />
  return <video src={url} controls ... />
}
```

---

## Search & Filtering

### URL-Based Filter State

Filters are stored in URL search params so they are shareable and bookmarkable. The pattern uses Next.js `useRouter` + `useSearchParams` on the client, with the RSC reading `searchParams` prop for initial server render.

```
/sermons?preacher=Bishop+Climate+Wiseman&series=Faith+Series&page=2
```

**Client-side filter update:**
```typescript
function updateFilter(key: string, value: string) {
  const params = new URLSearchParams(searchParams.toString())
  value ? params.set(key, value) : params.delete(key)
  params.delete('page') // reset pagination on filter change
  router.push(`?${params.toString()}`)
}
```

### Supabase Query Building

```typescript
let query = supabase.from('sermons').select('*', { count: 'exact' })
  .eq('status', 'published')
  .order('date', { ascending: false })

if (preacher) query = query.eq('preacher', preacher)
if (series)   query = query.eq('series', series)
if (from)     query = query.gte('date', from)
if (to)       query = query.lte('date', to)

const { data, count } = await query.range(offset, offset + pageSize - 1)
```

### Search Implementation

```typescript
// ilike on title + description, union across tables
const [posts, sermons, events] = await Promise.all([
  supabase.from('posts').select('id,title,slug,excerpt')
    .eq('status','published')
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`),
  supabase.from('sermons').select('id,title,slug,description')
    .eq('status','published')
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`),
  supabase.from('events').select('id,title,slug,description')
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`),
])
```

---

## Slug Generation Utility

```typescript
// src/lib/utils.ts (addition)
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric (keep spaces/hyphens)
    .trim()
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
}
```

---

## Environment & Config

### Env Validation (`src/lib/env.ts`)

```typescript
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `[env] Missing required environment variable: ${key}. ` +
      `Check your .env.local file.`
    )
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
}
```

### `next.config.mjs` Image Domains

```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'images.unsplash.com' },
    { protocol: 'https', hostname: 'wuqhrjczlolhiaihosei.supabase.co' },
  ],
},
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Unauthenticated admin request | middleware redirects to `/admin/login?redirectTo=<path>` |
| Insufficient role in Server Action | return `{ error: 'Forbidden', status: 403 }` |
| Slug collision on insert | Server Action returns `{ error: 'Slug already exists' }` |
| DAL query error | log server-side, return `null` / `[]` |
| Missing env var | throw at startup with descriptive message |
| File too large (>50MB) | client-side rejection before upload attempt |
| notFound slug on public route | call Next.js `notFound()` → 404 page |
| Supabase auth error on login | display `error.message` in login form |
| Search query < 2 chars | no DB query, show empty state |

---

## Testing Strategy

### Unit Tests

Focus on pure functions and isolated logic:
- `generateSlug(title)` — slug transformation rules
- `validateVideoUrl(url)` — YouTube/Vimeo/direct URL pattern matching
- `validateFileSize(bytes)` — 50MB boundary
- `env.ts` validation — missing/empty variable detection
- `VideoPlayer` component — correct element rendered per URL type
- `UserAvatar` component — initials fallback logic

### Property-Based Tests

Use **fast-check** (TypeScript-native PBT library) with minimum 100 iterations per property.

Tag format: `// Feature: kdcuganda-cms-platform, Property N: <property_text>`

Each correctness property below maps to one property-based test.

### Integration Tests

- Admin page load fetches correct profile row
- Server Actions reject unauthorized roles (example per role)
- Supabase RLS: draft posts not returned by anon client
- Media upload inserts record with correct fields

### Smoke Tests

- All required env vars present in CI environment
- Supabase connection reachable at startup

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Auth middleware redirects all unauthenticated admin requests

*For any* `/admin/*` path (excluding `/admin/login`), when the request carries no valid session, the middleware SHALL redirect to `/admin/login` with a `redirectTo` query parameter equal to the original path.

**Validates: Requirements 1.1, 1.7**

### Property 2: Auth error messages are displayed as-is

*For any* error message string returned by Supabase `signInWithPassword`, the login form SHALL render that exact string in the error UI without modification, truncation, or exposure of stack traces or internal identifiers.

**Validates: Requirements 1.4**

### Property 3: User header renders correct initials fallback

*For any* user profile object (with or without `avatar_url`, with any non-empty `name` string), the admin header SHALL render either the avatar image or the first letter(s) of the name as an initials fallback — never a blank or broken element.

**Validates: Requirements 1.6**

### Property 4: Delete controls hidden for non-owned records

*For any* CRUD manager rendered with role `editor` or `author`, and *for any* content record whose `author_id` does not match the current user's id, the delete control for that record SHALL NOT be present in the rendered output.

**Validates: Requirements 2.3**

### Property 5: Server Actions enforce role authorization

*For any* Server Action that mutates content, calling it with a session whose profile role is below the required minimum SHALL return a Forbidden error and SHALL NOT execute the database mutation.

**Validates: Requirements 2.5, 2.6**

### Property 6: Slug generation is deterministic and URL-safe

*For any* title string, `generateSlug(title)` SHALL return a string that: (a) is lowercase, (b) contains only characters matching `[a-z0-9-]`, (c) has no leading or trailing hyphens, and (d) has no consecutive hyphens.

**Validates: Requirements 3.3**

### Property 7: Slug uniqueness is enforced across content tables

*For any* slug string that already exists in a content table (posts, sermons, or events), attempting to insert a new record with the same slug SHALL return a validation error and the record count in that table SHALL remain unchanged.

**Validates: Requirements 3.6, 4.5, 5.5**

### Property 8: Draft posts are invisible to public queries

*For any* post record with `status = 'draft'`, querying the `posts` table via the anon Supabase client (RLS enforced) SHALL NOT return that record.

**Validates: Requirements 3.8**

### Property 9: Video URL validator correctly classifies URLs

*For any* URL string, the video URL validator SHALL return `valid` if and only if the URL matches a YouTube pattern (`youtube.com/watch`, `youtu.be/`), a Vimeo pattern (`vimeo.com/`), or a direct video file extension (`.mp4`, `.webm`, `.ogg`), and SHALL return `invalid` for all other strings.

**Validates: Requirements 4.3**

### Property 10: File size validator enforces 50 MB boundary

*For any* file size in bytes, the upload validator SHALL accept the file if `size_bytes <= 52_428_800` (50 MB) and SHALL reject it with a descriptive error message if `size_bytes > 52_428_800`.

**Validates: Requirements 7.4**

### Property 11: DAL getBy* functions return null for unknown slugs

*For any* slug string that does not exist in the corresponding database table, every `getBy*` function in the Data Access Layer SHALL return `null` without throwing.

**Validates: Requirements 11.2**

### Property 12: DAL functions never throw on Supabase errors

*For any* Supabase client error (network error, query error, RLS rejection), every Data Access Layer function SHALL return `null` or `[]` and SHALL NOT propagate the exception to the caller.

**Validates: Requirements 11.5**

### Property 13: Search results always match the query string

*For any* search query of 2 or more characters, every result returned by `searchContent` SHALL have the query string present (case-insensitive) in either the `title` or `description`/`excerpt` field of the result.

**Validates: Requirements 16.2**

### Property 14: Short search queries produce no database calls

*For any* search query string of length 0 or 1, the search handler SHALL NOT invoke any Supabase query and SHALL return empty result sets for all content types.

**Validates: Requirements 16.5**

### Property 15: Env validation identifies each missing variable

*For any* subset of the three required environment variables that is absent or empty, the `env.ts` module SHALL throw an error whose message contains the exact name of the missing variable.

**Validates: Requirements 19.2**
