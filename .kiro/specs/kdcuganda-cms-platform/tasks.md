# Implementation Plan: KDC Uganda CMS Platform (Phases 2–5)

## Overview

Implement the full CMS platform on top of the existing Next.js 14 / Supabase scaffold. Each task builds on the previous, starting with the foundation layer (env, types, DAL) and ending with production hardening. The Supabase cloud project is already live and the schema is migrated.

---

## Tasks

- [x] 1. Foundation — env validation, extended types, DAL, next.config
  - [x] 1.1 Create `src/lib/env.ts` with startup validation
    - Validate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    - Throw descriptive error naming the missing variable; export `env` object
    - Import `env.ts` in `src/lib/supabase/server.ts` so validation runs at server startup
    - _Requirements: 19.1, 19.2, 19.3_

  - [x] 1.2 Write property test for env validation (Property 15)
    - **Property 15: Env validation identifies each missing variable**
    - **Validates: Requirements 19.2**
    - Install `fast-check` as a dev dependency; configure test runner (vitest)
    - Tag: `// Feature: kdcuganda-cms-platform, Property 15`

  - [x] 1.3 Extend `src/lib/types.ts` with full design types
    - Replace stub types with complete `Profile`, `Post`, `Sermon`, `Event`, `Ministry`, `MediaAsset`, `SiteSetting`, `GalleryItem`, `Donation`, `PrayerRequest`, `ContactSubmission` interfaces
    - Add `UserRole` type; ensure all fields match the DB schema
    - _Requirements: 11.1_

  - [x] 1.4 Add `generateSlug` and `validateVideoUrl` and `validateFileSize` utilities to `src/lib/utils.ts`
    - `generateSlug(title)`: lowercase, strip non-alphanumeric, collapse hyphens, trim
    - `validateVideoUrl(url)`: returns `'valid' | 'invalid'` based on YouTube/Vimeo/direct-video patterns
    - `validateFileSize(bytes)`: returns `true` if `<= 52_428_800`, `false` otherwise
    - _Requirements: 3.3, 4.3, 7.4_

  - [x] 1.5 Write property tests for slug generation and utilities (Properties 6, 9, 10)
    - **Property 6: Slug generation is deterministic and URL-safe** — Validates: Requirements 3.3
    - **Property 9: Video URL validator correctly classifies URLs** — Validates: Requirements 4.3
    - **Property 10: File size validator enforces 50 MB boundary** — Validates: Requirements 7.4
    - Tag: `// Feature: kdcuganda-cms-platform, Property 6 / 9 / 10`

  - [x] 1.6 Create `src/lib/supabase/queries.ts` — Data Access Layer
    - Implement all DAL functions: `getPosts`, `getPostBySlug`, `getSermons`, `getSermonBySlug`, `getSermonFilters`, `getEvents`, `getEventBySlug`, `getMinistries`, `getMinistryBySlug`, `getSiteSettings`, `getGallery`, `searchContent`
    - All functions use `createClient()` from `server.ts`; never throw — catch errors, log, return `null`/`[]`
    - `getSermons` supports `preacher`, `series`, `from`, `to`, `page`, `pageSize` opts with `count: 'exact'`
    - `searchContent` uses `ilike` on title + description/excerpt across posts, sermons, events; returns empty sets for queries < 2 chars
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 16.2, 16.5_

  - [x] 1.7 Write property tests for DAL null-safety (Properties 11, 12, 13, 14)
    - **Property 11: DAL getBy* functions return null for unknown slugs** — Validates: Requirements 11.2
    - **Property 12: DAL functions never throw on Supabase errors** — Validates: Requirements 11.5
    - **Property 13: Search results always match the query string** — Validates: Requirements 16.2
    - **Property 14: Short search queries produce no database calls** — Validates: Requirements 16.5
    - Tag: `// Feature: kdcuganda-cms-platform, Property 11 / 12 / 13 / 14`

  - [x] 1.8 Update `next.config.mjs` image remote patterns
    - Add `wuqhrjczlolhiaihosei.supabase.co` and `images.unsplash.com` to `remotePatterns`
    - _Requirements: 20.3_

- [x] 2. Checkpoint — Foundation complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Auth — admin context, layout rebuild, middleware cleanup
  - [x] 3.1 Create `src/lib/admin-context.tsx`
    - Define `AdminContextValue` interface `{ user, profile, role }`
    - Export `AdminContext`, `AdminProvider`, and `useAdmin` hook
    - _Requirements: 12.3_

  - [x] 3.2 Rebuild `src/app/admin/layout.tsx` as RSC with auth + context
    - Call `createClient()`, `getUser()`, fetch `profiles` row server-side
    - Redirect to `/admin/login` if no user (belt-and-suspenders alongside middleware)
    - Wrap children in `AdminProvider`; render `AdminSidebar`, `MobileDrawer`, `AdminHeader`
    - _Requirements: 1.6, 2.1, 12.3_

  - [x] 3.3 Create `src/components/admin/admin-sidebar.tsx` (Client Component)
    - Render nav links; filter out `/admin/users` and `/admin/settings` when `role !== 'admin'`
    - Highlight active link using `usePathname`
    - Logout button calls `supabase.auth.signOut()` then `router.push('/admin/login')`
    - _Requirements: 1.5, 2.4_

  - [x] 3.4 Create `src/components/admin/admin-header.tsx` (Client Component)
    - Display page title, `UserAvatar` (image or initials fallback), unread inbox count badge
    - Mobile hamburger triggers `MobileDrawer` (shadcn Sheet)
    - _Requirements: 1.6_

  - [x] 3.5 Write property test for UserAvatar initials fallback (Property 3)
    - **Property 3: User header renders correct initials fallback**
    - **Validates: Requirements 1.6**
    - Tag: `// Feature: kdcuganda-cms-platform, Property 3`

  - [x] 3.6 Verify and clean up `src/middleware.ts`
    - Confirm `getUser()` is called, session cookies are refreshed on response, and `redirectTo` param is set correctly
    - No changes needed if already correct; add inline comments documenting the flow
    - _Requirements: 1.1, 1.7, 12.1, 12.2_

  - [x] 3.7 Write property test for middleware auth redirect (Property 1)
    - **Property 1: Auth middleware redirects all unauthenticated admin requests**
    - **Validates: Requirements 1.1, 1.7**
    - Tag: `// Feature: kdcuganda-cms-platform, Property 1`

  - [x] 3.8 Write property test for login error display (Property 2)
    - **Property 2: Auth error messages are displayed as-is**
    - **Validates: Requirements 1.4**
    - Tag: `// Feature: kdcuganda-cms-platform, Property 2`

- [x] 4. Shared admin components
  - [x] 4.1 Create `src/components/admin/data-table.tsx`
    - Generic table accepting `columns` config and `data` array props
    - Built-in pagination controls (previous/next + page numbers), search input, and filter slot
    - Uses shadcn `Table` primitives
    - _Requirements: 3.1, 4.1, 5.1, 6.1_

  - [x] 4.2 Create `src/components/admin/slug-input.tsx`
    - Accepts `title` prop; auto-generates slug via `generateSlug`; allows manual override
    - Once manually edited, stops auto-updating from title changes
    - _Requirements: 3.3, 4.2, 5.2, 6.2_

  - [x] 4.3 Create `src/components/admin/rich-text-editor.tsx`
    - Tiptap wrapper (already installed) with StarterKit; outputs HTML string
    - Toolbar: bold, italic, headings, lists, blockquote, link
    - _Requirements: 3.2, 4.2, 5.2, 6.2_

  - [x] 4.4 Create `src/components/admin/media-picker.tsx`
    - Modal (shadcn Dialog) showing media grid + upload zone
    - On asset select, calls `onSelect(url)` callback and closes modal
    - _Requirements: 7.5_

  - [x] 4.5 Create `src/components/admin/status-badge.tsx`
    - Coloured pill for `draft` / `published` / `archived` / `upcoming` / `ongoing` / `past` / `cancelled`
    - _Requirements: 3.1, 5.1_

- [x] 5. Media Library
  - [x] 5.1 Create Server Action `src/lib/actions/media.ts`
    - `createMediaRecord(payload)` — inserts into `media` table; requires `editor` or `admin` role
    - `deleteMedia(id)` — removes Storage file and deletes `media` row; requires `admin` role
    - _Requirements: 7.3, 7.6_

  - [x] 5.2 Create `src/components/admin/upload-zone.tsx`
    - Drag-and-drop + click-to-select; validates MIME type and size (≤ 50 MB) client-side before upload
    - Uploads via `supabase.storage.from('media').upload(path, file)` using browser client
    - Calls `createMediaRecord` Server Action after successful upload
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 5.3 Rebuild `src/app/admin/media/page.tsx` as full Media Library
    - RSC fetches initial media list; renders `MediaLibrary` Client Component
    - `MediaLibrary` includes `UploadZone`, type filter tabs (All / Images / Audio / Video / Documents), `MediaGrid` with `MediaCard` items
    - Delete button on each card calls `deleteMedia` action with confirmation dialog
    - _Requirements: 7.1, 7.2, 7.6, 7.7_

- [x] 6. Posts CRUD Manager
  - [x] 6.1 Create Server Actions `src/lib/actions/posts.ts`
    - `createPost(data)` — inserts post; sets `published_at` if status is `published`; requires `editor`/`admin`
    - `updatePost(id, data)` — updates post; sets `published_at` on first publish; requires `editor`/`admin`
    - `deletePost(id)` — soft-archives (`status = 'archived'`); requires `editor`/`admin`
    - All actions call `revalidatePath('/blog')`, `revalidatePath('/blog/[slug]')`, `revalidatePath('/')`
    - Return `{ error: 'Slug already exists' }` on unique constraint violation
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

  - [x] 6.2 Write property test for Server Action role enforcement (Property 5)
    - **Property 5: Server Actions enforce role authorization**
    - **Validates: Requirements 2.5, 2.6**
    - Tag: `// Feature: kdcuganda-cms-platform, Property 5`

  - [x] 6.3 Write property test for slug uniqueness enforcement (Property 7)
    - **Property 7: Slug uniqueness is enforced across content tables**
    - **Validates: Requirements 3.6, 4.5, 5.5**
    - Tag: `// Feature: kdcuganda-cms-platform, Property 7`

  - [x] 6.4 Build `src/app/admin/posts/page.tsx` — Posts Manager
    - RSC fetches all posts (including archived); renders `PostsManager` Client Component
    - `PostsManager` uses `DataTable` with columns: title, type, status badge, author, updated date, actions
    - "New Post" button opens `PostForm` in a Sheet
    - Edit/delete actions per row (delete hidden for non-owned records when role is `editor`/`author`)
    - _Requirements: 3.1, 3.2, 3.7, 2.3_

  - [x] 6.5 Build `PostForm` component (within posts manager or `src/components/admin/posts/`)
    - Fields: title, `SlugInput`, excerpt, `RichTextEditor` (content), `MediaPicker` (featured image), type select, status select
    - On submit calls `createPost` or `updatePost`; displays inline error on slug collision
    - _Requirements: 3.2, 3.3, 3.6_

  - [x] 6.6 Write property test for draft post visibility (Property 8)
    - **Property 8: Draft posts are invisible to public queries**
    - **Validates: Requirements 3.8**
    - Tag: `// Feature: kdcuganda-cms-platform, Property 8`

- [x] 7. Sermons CRUD Manager
  - [x] 7.1 Create Server Actions `src/lib/actions/sermons.ts`
    - `createSermon`, `updateSermon`, `deleteSermon` — require `editor`/`admin`
    - Revalidate `/sermons`, `/sermons/[slug]`, `/`
    - Return slug collision error on unique constraint violation
    - _Requirements: 4.4, 4.5_

  - [x] 7.2 Build `src/app/admin/sermons/page.tsx` — Sermons Manager
    - RSC fetches all sermons; renders `SermonsManager` Client Component
    - `DataTable` columns: title, preacher, series, date, status badge, actions
    - Filter bar: preacher dropdown, series dropdown, date range — updates table without page reload
    - _Requirements: 4.1, 4.6_

  - [x] 7.3 Build `SermonForm` component
    - Fields: title, `SlugInput`, description, `RichTextEditor`, video URL (with inline validation via `validateVideoUrl`), audio URL, `MediaPicker` (thumbnail), preacher, series, date, duration, status
    - _Requirements: 4.2, 4.3_

- [x] 8. Events CRUD Manager
  - [x] 8.1 Create Server Actions `src/lib/actions/events.ts`
    - `createEvent`, `updateEvent`, `deleteEvent` — require `editor`/`admin`
    - Revalidate `/events`, `/events/[slug]`, `/`
    - Return slug collision error on unique constraint violation
    - _Requirements: 5.4, 5.5_

  - [x] 8.2 Build `src/app/admin/events/page.tsx` — Events Manager
    - RSC fetches all events; renders `EventsManager` Client Component
    - `DataTable` columns: title, date, location, featured flag, status badge, actions
    - _Requirements: 5.1_

  - [x] 8.3 Build `EventForm` component
    - Fields: title, `SlugInput`, description, `RichTextEditor`, start date/time, end date/time, location, `MediaPicker` (image), featured toggle, registration URL, status select
    - _Requirements: 5.2_

- [x] 9. Ministries CRUD Manager
  - [x] 9.1 Create Server Actions `src/lib/actions/ministries.ts`
    - `createMinistry`, `updateMinistry`, `reorderMinistries` (batch `display_order` update in single transaction)
    - Require `admin` role for all operations
    - Revalidate `/ministries`, `/ministries/[slug]`
    - _Requirements: 6.3, 6.5_

  - [x] 9.2 Build `src/app/admin/ministries/page.tsx` — Ministries Manager (add route if missing)
    - RSC fetches all ministries ordered by `display_order`; renders `MinistriesManager` Client Component
    - Sortable list with drag-and-drop reorder (calls `reorderMinistries` on drop)
    - Columns: name, leader, active status, display order, actions
    - _Requirements: 6.1, 6.3_

  - [x] 9.3 Build `MinistryForm` component
    - Fields: name, `SlugInput`, description, `RichTextEditor`, leader, meeting time, `MediaPicker` (image), icon name, display order, active toggle
    - _Requirements: 6.2_

- [x] 10. Checkpoint — All CRUD managers complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Users Manager + Settings + Inbox
  - [x] 11.1 Create Server Actions `src/lib/actions/users.ts`
    - `inviteUser(email, role)` — calls `supabase.auth.admin.inviteUserByEmail` via Admin_Client; creates `profiles` row
    - `updateUserRole(userId, role)` — updates `profiles.role`; returns error if `userId === currentUser.id`
    - `deactivateUser(userId)` — calls `supabase.auth.admin.deleteUser` + deletes `profiles` row
    - All require `admin` role
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [x] 11.2 Build `src/app/admin/users/page.tsx` — Users Manager
    - RSC checks role; renders "Not Authorised" if not `admin`
    - `DataTable` columns: name, email, role selector (inline), created date, deactivate button
    - Invite form (email + role) calls `inviteUser`
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

  - [x] 11.3 Create Server Action `src/lib/actions/settings.ts`
    - `saveSettings(data)` — upserts all `site_settings` keys; requires `admin` role
    - Revalidates `/` and `/contact`
    - _Requirements: 9.2, 9.3_

  - [x] 11.4 Build `src/app/admin/settings/page.tsx` — Settings Module
    - RSC checks role; renders "Not Authorised" if not `admin`
    - Fetches current `site_settings`; renders form pre-populated with all 12 keys
    - On submit calls `saveSettings`
    - _Requirements: 9.1, 9.4_

  - [x] 11.5 Create Server Actions `src/lib/actions/inbox.ts`
    - `markContactRead(id)` — sets `is_read = true` on `contact_submissions`
    - `markPrayerReviewed(id)` — sets `is_reviewed = true` on `prayer_requests`
    - Require `admin` or `editor` role
    - _Requirements: 22.4_

  - [x] 11.6 Build `src/app/admin/inbox/page.tsx` — Inbox
    - RSC fetches unread contact submissions and unreviewed prayer requests
    - Two tabs: Contact Submissions (name, email, subject, message, date, mark-read button) and Prayer Requests (name/Anonymous, request, date, mark-reviewed button)
    - Add `/admin/inbox` link to `AdminSidebar`
    - _Requirements: 22.1, 22.2, 22.3, 22.5_

  - [x] 11.7 Write property test for delete control visibility (Property 4)
    - **Property 4: Delete controls hidden for non-owned records**
    - **Validates: Requirements 2.3**
    - Tag: `// Feature: kdcuganda-cms-platform, Property 4`

- [x] 12. Gallery Manager
  - [x] 12.1 Create Server Actions `src/lib/actions/gallery.ts`
    - `createGalleryItem`, `deleteGalleryItem`, `reorderGallery`
    - Require `editor`/`admin`; revalidate `/gallery`
    - _Requirements: 23.2, 23.3, 23.4, 23.5_

  - [x] 12.2 Build `src/app/admin/gallery/page.tsx` — Gallery Manager (add route)
    - RSC fetches all gallery items; renders `GalleryManager` Client Component
    - Grid view with thumbnail, title, album, display order; upload via `UploadZone`; delete with confirmation; drag-to-reorder
    - Add `/admin/gallery` link to `AdminSidebar`
    - _Requirements: 23.1_

- [x] 13. Dynamic public routes — Blog, Sermons, Events, Ministries
  - [x] 13.1 Implement `src/app/blog/[slug]/page.tsx`
    - Export `revalidate = 3600` and `generateMetadata`
    - Fetch post via `getPostBySlug`; call `notFound()` if null
    - Render title, author, published date, featured image (`<Image>`), excerpt, HTML content
    - Fetch and render up to 3 related posts (same type, ordered by `published_at` desc)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 13.2 Implement `src/app/sermons/[slug]/page.tsx`
    - Export `revalidate = 3600` and `generateMetadata`
    - Fetch sermon via `getSermonBySlug`; call `notFound()` if null
    - Render `VideoPlayer` (YouTube/Vimeo iframe or `<video>`) and `AudioPlayer` (`<audio>`) based on URL type
    - Render up to 3 related sermons ordered by `date` desc
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [x] 13.3 Create `src/components/content/video-player.tsx`
    - Detect YouTube/Vimeo via regex; render `<iframe>` for embeds, `<video>` for direct files
    - _Requirements: 14.3, 14.4_

  - [x] 13.4 Create `src/components/content/audio-player.tsx`
    - Render HTML5 `<audio controls>` element
    - _Requirements: 14.5_

  - [x] 13.5 Implement `src/app/events/[slug]/page.tsx`
    - Export `revalidate = 3600` and `generateMetadata`
    - Fetch event via `getEventBySlug`; call `notFound()` if null
    - Render title, `StatusBadge`, start/end dates, location, description, HTML content
    - Render "Register Now" button (new tab) when `registration_url` is present
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 13.6 Implement `src/app/ministries/[slug]/page.tsx`
    - Export `revalidate = 3600` and `generateMetadata`
    - Fetch ministry via `getMinistryBySlug`; call `notFound()` if null
    - Render name, leader, meeting time, image, description, HTML content
    - _Requirements: 6.4_

- [x] 14. Sermons listing page — filtering and pagination
  - [x] 14.1 Rebuild `src/app/sermons/page.tsx` with filter + pagination
    - RSC reads `searchParams` (preacher, series, from, to, page); calls `getSermons` with opts
    - Renders `SermonsPageClient` with filter controls and `SermonCard` grid (12 per page)
    - _Requirements: 17.1, 17.3_

  - [x] 14.2 Create `src/components/content/sermon-card.tsx`
    - Displays thumbnail, title, preacher, series, date, duration; links to `/sermons/[slug]`
    - _Requirements: 17.3_

  - [x] 14.3 Build filter controls and pagination in `SermonsPageClient`
    - Preacher and series dropdowns populated from `getSermonFilters()`
    - Date range inputs; filter changes update URL params via `router.push` and reset page to 1
    - Pagination controls (prev/next + page numbers) when total > 12
    - _Requirements: 17.1, 17.2, 17.4, 17.5_

- [x] 15. Search modal
  - [x] 15.1 Create `src/components/search/search-modal.tsx`
    - Full-screen overlay triggered from navbar; controlled by `open` state
    - Debounced input (300 ms); calls `searchContent` when query ≥ 2 chars; shows empty state for < 2 chars
    - Results grouped by type (Posts, Sermons, Events) with title, excerpt, and link
    - "No results found" message when all result arrays are empty
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 15.2 Wire search trigger into public navbar
    - Add search icon button to `src/components/layout/navbar.tsx` that opens `SearchModal`
    - _Requirements: 16.1_

- [x] 16. Home page dynamic sections
  - [x] 16.1 Update `src/app/page.tsx` to fetch and render dynamic sections
    - Export `revalidate = 3600`
    - Fetch: latest published sermon, up to 3 featured upcoming events (fallback to next 3 upcoming), up to 3 latest published posts
    - Pass data to existing section components or create `FeaturedSermonSection`, `UpcomingEventsSection`, `LatestPostsSection`
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [x] 16.2 Create `src/components/content/post-card.tsx` and `src/components/content/event-card.tsx`
    - `PostCard`: featured image, title, excerpt, author, date, link to `/blog/[slug]`
    - `EventCard`: image, title, date, location, status badge, link to `/events/[slug]`
    - _Requirements: 18.2, 18.3_

- [x] 17. Checkpoint — All public routes and home page complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Property-based tests — remaining properties
  - [x] 18.1 Write property test for slug uniqueness (Property 7 — integration)
    - **Property 7: Slug uniqueness is enforced across content tables**
    - **Validates: Requirements 3.6, 4.5, 5.5**
    - Tag: `// Feature: kdcuganda-cms-platform, Property 7`

  - [x] 18.2 Write property test for draft post RLS (Property 8 — integration)
    - **Property 8: Draft posts are invisible to public queries**
    - **Validates: Requirements 3.8**
    - Tag: `// Feature: kdcuganda-cms-platform, Property 8`

- [x] 19. Production hardening
  - [x] 19.1 Replace all `<img>` tags on public pages with Next.js `<Image>` component
    - Audit `src/app` and `src/components` for raw `<img>` elements; replace with `<Image>` and add `alt` attributes
    - _Requirements: 20.1, 21.2_

  - [x] 19.2 Verify `revalidate` exports on all public listing and detail pages
    - Confirm `export const revalidate = 3600` is present on `/blog`, `/sermons`, `/events`, `/ministries`, `/gallery`, and all `[slug]` pages
    - _Requirements: 20.2_

  - [x] 19.3 Accessibility pass on admin forms and public pages
    - Ensure all form inputs have `<label>` elements; all interactive elements have visible focus indicators; heading hierarchy is logical
    - _Requirements: 21.1, 21.3, 21.4_

  - [x] 19.4 Dashboard stats — wire admin dashboard to live data
    - Update `src/app/admin/page.tsx` to fetch real counts (posts, sermons, upcoming events, profiles) via DAL/server client
    - Replace hardcoded placeholder values with live data
    - _Requirements: 2.1_

- [x] 20. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` with minimum 100 iterations; tag format: `// Feature: kdcuganda-cms-platform, Property N`
- All Server Actions call `verifyRole` before any DB mutation and return `{ error }` on failure
- The Supabase cloud project is live — integration tests can run against the real DB using the service role key
- Admin pages use dynamic rendering (no `revalidate` export); public pages use `revalidate = 3600`
- `createAdminClient()` is only used in Server Actions and never imported in client components
