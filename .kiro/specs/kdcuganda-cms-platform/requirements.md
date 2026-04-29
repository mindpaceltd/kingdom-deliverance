# Requirements Document

## Introduction

This document covers the requirements for completing the Kingdom Deliverance Centre Uganda (KDC Uganda) website CMS platform — Phases 2 through 5. Phase 1 (the public-facing website) is already complete. The remaining work transforms the scaffolded admin shell into a fully functional Content Management System backed by a self-hosted Supabase instance, then adds dynamic public UX features and prepares the application for production deployment on a VPS.

The system is a Next.js 14 App Router application using Supabase (self-hosted) for the database, authentication, and file storage, styled with Tailwind CSS and shadcn/ui.

---

## Glossary

- **CMS**: Content Management System — the admin interface at `/admin` used to manage all church content.
- **Admin_Shell**: The authenticated Next.js layout and routing structure under `/admin`.
- **Auth_Middleware**: The existing `src/middleware.ts` that intercepts requests to `/admin` routes.
- **Supabase_Client**: The browser-side Supabase client created via `createClient()` in `src/lib/supabase/client.ts`.
- **Supabase_Server**: The server-side Supabase client created via `createClient()` in `src/lib/supabase/server.ts`.
- **Admin_Client**: The service-role Supabase client created via `createAdminClient()` — bypasses RLS; used only in Server Actions and API routes.
- **RLS**: Row Level Security — Supabase/PostgreSQL policies that restrict data access per authenticated role.
- **Role**: A user's permission level. Valid values: `admin`, `editor`, `author`, `member` (defined in `profiles.role`).
- **CRUD_Manager**: An admin page providing Create, Read, Update, and Delete operations for a content type.
- **Media_Library**: The admin interface and Supabase Storage bucket for uploading and managing church media assets.
- **Slug**: A URL-safe, unique string identifier for a content record (e.g., `power-of-faith-troubled-times`).
- **Server_Action**: A Next.js 14 server-side async function used for form submissions and mutations.
- **Rich_Text_Editor**: A WYSIWYG editor component used for authoring post and sermon content in the admin.
- **Site_Settings**: Key-value configuration rows in the `site_settings` table controlling branding, social links, contact info, and streaming URLs.
- **Seed_Data**: Initial database records inserted to make the application functional immediately after schema migration.
- **Storage_Bucket**: A Supabase Storage container (e.g., `media`) holding uploaded files.
- **Revalidation**: Next.js ISR cache invalidation triggered after a content mutation.
- **Public_Route**: Any page outside `/admin` accessible without authentication.
- **Dynamic_Route**: A Next.js page using a `[slug]` parameter to render content fetched from the database.

---

## Requirements

### Requirement 1: Authenticated Admin Shell

**User Story:** As a church administrator, I want a secure, role-aware admin shell, so that only authorised staff can access and manage church content.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any `/admin` route other than `/admin/login`, THE Auth_Middleware SHALL redirect the user to `/admin/login` with the original path preserved in a `redirectTo` query parameter.
2. WHEN an authenticated user navigates to `/admin/login`, THE Auth_Middleware SHALL redirect the user to `/admin`.
3. WHEN a user submits valid credentials on the login page, THE Supabase_Client SHALL authenticate the user via `signInWithPassword` and redirect to the `redirectTo` path or `/admin`.
4. IF authentication fails, THEN THE Admin_Shell SHALL display the error message returned by Supabase without exposing internal details.
5. WHEN an authenticated user clicks the Logout button, THE Admin_Shell SHALL call `supabase.auth.signOut()`, clear the session, and redirect the user to `/admin/login`.
6. THE Admin_Shell SHALL display the authenticated user's name and avatar (or initials fallback) in the header on every admin page.
7. WHEN a session expires, THE Auth_Middleware SHALL redirect the user to `/admin/login` preserving the current path.

---

### Requirement 2: Role-Based Authorization

**User Story:** As a system administrator, I want role-based access control enforced in the UI and on the server, so that editors and authors cannot perform actions reserved for admins.

#### Acceptance Criteria

1. THE Admin_Shell SHALL fetch the authenticated user's `role` from the `profiles` table on every admin page load using Supabase_Server.
2. WHEN a user with role `author` attempts to access `/admin/users` or `/admin/settings`, THE Admin_Shell SHALL render a "Not Authorised" message and SHALL NOT render the page content.
3. WHEN a user with role `editor` or `author` views a CRUD_Manager, THE Admin_Shell SHALL hide delete controls for records they do not own.
4. THE Admin_Shell SHALL hide the Users and Settings sidebar links for users whose role is not `admin`.
5. WHEN a Server_Action receives a mutation request, THE Server_Action SHALL verify the caller's role from the `profiles` table before executing the database operation.
6. IF a Server_Action receives a request from a user whose role does not permit the operation, THEN THE Server_Action SHALL return an error response with HTTP status 403.

---

### Requirement 3: Posts CRUD Manager

**User Story:** As an editor or admin, I want to create, edit, publish, and delete blog posts and news articles, so that the church website always has fresh written content.

#### Acceptance Criteria

1. THE Posts_Manager SHALL display a paginated table of all posts showing title, type, status, author name, and last-updated date.
2. WHEN an admin or editor opens the post creation form, THE Posts_Manager SHALL provide fields for: title, slug (auto-generated from title, editable), excerpt, content (Rich_Text_Editor), featured image (Media_Library picker), type (`blog` or `news`), and status (`draft` or `published`).
3. WHEN a user edits the title field, THE Posts_Manager SHALL automatically update the slug field by converting the title to lowercase, replacing spaces with hyphens, and removing non-alphanumeric characters, unless the user has manually edited the slug.
4. WHEN a post is saved with status `published` and no `published_at` value exists, THE Server_Action SHALL set `published_at` to the current UTC timestamp.
5. WHEN a post is saved, THE Server_Action SHALL call `revalidatePath('/blog')` and `revalidatePath('/blog/[slug]')` to invalidate the public cache.
6. IF a slug already exists in the `posts` table, THEN THE Server_Action SHALL return a validation error and SHALL NOT insert a duplicate record.
7. WHEN an admin or editor deletes a post, THE Server_Action SHALL soft-archive the record by setting `status = 'archived'` rather than performing a hard delete.
8. WHILE a post has `status = 'draft'`, THE Public_Route `/blog` SHALL NOT display the post to unauthenticated visitors.

---

### Requirement 4: Sermons CRUD Manager

**User Story:** As an editor or admin, I want to manage sermon records including video and audio links, so that the congregation can access messages online.

#### Acceptance Criteria

1. THE Sermons_Manager SHALL display a paginated table of all sermons showing title, preacher, series, date, and status.
2. WHEN an admin or editor opens the sermon creation form, THE Sermons_Manager SHALL provide fields for: title, slug (auto-generated, editable), description, content (Rich_Text_Editor), video URL, audio URL, thumbnail (Media_Library picker), preacher, series, date, duration in minutes, and status (`draft` or `published`).
3. WHEN a video URL is entered, THE Sermons_Manager SHALL validate that the URL matches a YouTube, Vimeo, or direct video file pattern and SHALL display an inline error if the pattern does not match.
4. WHEN a sermon is saved, THE Server_Action SHALL call `revalidatePath('/sermons')` and `revalidatePath('/sermons/[slug]')`.
5. IF a slug already exists in the `sermons` table, THEN THE Server_Action SHALL return a validation error and SHALL NOT insert a duplicate record.
6. THE Sermons_Manager SHALL support filtering the table by preacher name, series, and date range without a full page reload.

---

### Requirement 5: Events CRUD Manager

**User Story:** As an editor or admin, I want to create and manage church events, so that the congregation is informed about upcoming programs.

#### Acceptance Criteria

1. THE Events_Manager SHALL display a table of all events showing title, date, location, featured flag, and status.
2. WHEN an admin or editor opens the event creation form, THE Events_Manager SHALL provide fields for: title, slug (auto-generated, editable), description, content (Rich_Text_Editor), start date/time, end date/time (optional), location, event image (Media_Library picker), featured toggle, registration URL (optional), and status (`upcoming`, `ongoing`, `past`, or `cancelled`).
3. WHEN an event's start date passes the current UTC time and the status is `upcoming`, THE Server_Action SHALL allow an admin to manually update the status to `past`.
4. WHEN an event is saved, THE Server_Action SHALL call `revalidatePath('/events')` and `revalidatePath('/events/[slug]')`.
5. IF a slug already exists in the `events` table, THEN THE Server_Action SHALL return a validation error and SHALL NOT insert a duplicate record.

---

### Requirement 6: Ministries CRUD Manager

**User Story:** As an admin, I want to manage ministry records, so that the public Ministries page reflects the current structure of the church.

#### Acceptance Criteria

1. THE Ministries_Manager SHALL display all ministries in a sortable list showing name, leader, active status, and display order.
2. WHEN an admin opens the ministry creation form, THE Ministries_Manager SHALL provide fields for: name, slug (auto-generated, editable), description, content (Rich_Text_Editor), leader name, meeting time, image (Media_Library picker), icon name, display order, and active toggle.
3. WHEN an admin reorders ministries using drag-and-drop, THE Server_Action SHALL update the `display_order` field for all affected records in a single transaction.
4. WHEN a ministry's `is_active` field is set to `false`, THE Public_Route `/ministries` SHALL NOT display the ministry to unauthenticated visitors.
5. WHEN a ministry is saved, THE Server_Action SHALL call `revalidatePath('/ministries')`.

---

### Requirement 7: Media Library

**User Story:** As an editor or admin, I want to upload and manage media assets, so that images and files are available for use across all content types.

#### Acceptance Criteria

1. THE Media_Library SHALL display all uploaded assets in a grid view showing thumbnail, filename, type, and upload date.
2. WHEN a user drags files onto the Media_Library upload zone or clicks to select files, THE Media_Library SHALL accept files of type `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `audio/mpeg`, `audio/mp4`, `video/mp4`, and `application/pdf`.
3. WHEN a file is uploaded, THE Media_Library SHALL upload the file to the `media` Supabase Storage bucket and insert a record into the `media` table containing: `filename`, `url`, `type`, `mime_type`, `size_bytes`, and `uploaded_by`.
4. IF a file exceeds 50 MB, THEN THE Media_Library SHALL reject the upload and display an error message stating the size limit.
5. WHEN a content editor opens a Media_Library picker from a form field, THE Media_Library SHALL display a modal allowing the user to select an existing asset or upload a new one, and SHALL return the selected asset's URL to the calling form field.
6. WHEN an admin deletes a media record, THE Server_Action SHALL remove the file from the Storage_Bucket and delete the record from the `media` table.
7. THE Media_Library SHALL support filtering assets by type (`image`, `audio`, `video`, `document`).

---

### Requirement 8: User Management

**User Story:** As an admin, I want to invite users and assign roles, so that church staff can access the CMS with appropriate permissions.

#### Acceptance Criteria

1. THE Users_Manager SHALL display a table of all profiles showing name, email, role, and account creation date.
2. WHEN an admin submits the invite form with a valid email address, THE Server_Action SHALL call `supabase.auth.admin.inviteUserByEmail` using the Admin_Client and create a corresponding `profiles` row with the specified role.
3. WHEN an admin changes a user's role using the role selector, THE Server_Action SHALL update the `role` field in the `profiles` table for that user.
4. IF an admin attempts to change their own role, THEN THE Server_Action SHALL return an error and SHALL NOT update the record.
5. WHEN an admin deactivates a user, THE Server_Action SHALL call `supabase.auth.admin.deleteUser` using the Admin_Client and delete the corresponding `profiles` row.
6. THE Users_Manager SHALL be accessible only to users with role `admin`.

---

### Requirement 9: Site Settings Module

**User Story:** As an admin, I want to manage site-wide configuration from a single page, so that branding, contact details, and streaming links stay current without a code deployment.

#### Acceptance Criteria

1. THE Settings_Module SHALL render a form pre-populated with the current values from the `site_settings` table for the following keys: `site_name`, `tagline`, `contact_email`, `contact_phone`, `address`, `facebook_url`, `youtube_url`, `twitter_url`, `instagram_url`, `service_times`, `live_stream_url`, and `donation_instructions`.
2. WHEN an admin submits the settings form, THE Server_Action SHALL perform an upsert on the `site_settings` table for each modified key.
3. WHEN settings are saved, THE Server_Action SHALL call `revalidatePath('/')` and `revalidatePath('/contact')` to refresh cached public pages.
4. THE Settings_Module SHALL be accessible only to users with role `admin`.

---

### Requirement 10: Database Schema and Migrations

**User Story:** As a developer, I want a complete, runnable migration script, so that the Supabase database can be initialised or reset reliably.

#### Acceptance Criteria

1. THE Migration_Script SHALL be a single SQL file at `supabase/schema.sql` that can be executed idempotently (using `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `ON CONFLICT DO NOTHING`).
2. THE Migration_Script SHALL define all tables: `profiles`, `site_settings`, `posts`, `sermons`, `events`, `ministries`, `media`, `gallery`, `donations`, `prayer_requests`, and `contact_submissions`.
3. THE Migration_Script SHALL define RLS policies for every table covering SELECT, INSERT, UPDATE, and DELETE operations for each applicable role.
4. THE Migration_Script SHALL define the `handle_new_user` trigger that auto-creates a `profiles` row on `auth.users` insert.
5. THE Migration_Script SHALL include seed data for `ministries`, `sermons`, `events`, and `site_settings`.
6. THE Migration_Script SHALL create a `media` Storage bucket with a public read policy and an authenticated-user write policy.

---

### Requirement 11: Server-Side Data Access Utilities

**User Story:** As a developer, I want typed server-side data access functions, so that public pages fetch content consistently and safely.

#### Acceptance Criteria

1. THE Data_Access_Layer SHALL expose typed async functions for: `getPosts`, `getPostBySlug`, `getSermons`, `getSermonBySlug`, `getEvents`, `getEventBySlug`, `getMinistries`, `getMinistryBySlug`, `getSiteSettings`, and `getGallery`.
2. WHEN a `getBy*` function is called with a slug that does not exist, THE Data_Access_Layer SHALL return `null`.
3. THE Data_Access_Layer SHALL use Supabase_Server for all queries and SHALL NOT expose the Admin_Client to public routes.
4. THE Data_Access_Layer functions SHALL be located in `src/lib/supabase/queries.ts`.
5. WHEN a Data_Access_Layer function encounters a Supabase error, THE Data_Access_Layer SHALL log the error server-side and return `null` or an empty array rather than throwing.

---

### Requirement 12: Auth Flows and Session Management

**User Story:** As a developer, I want robust auth flows, so that sessions are refreshed correctly and role claims are always current.

#### Acceptance Criteria

1. THE Auth_Middleware SHALL call `supabase.auth.getUser()` on every request to `/admin` routes to validate the session token.
2. WHEN a Supabase session token is near expiry, THE Auth_Middleware SHALL allow the Supabase SSR library to refresh the token and set updated cookies on the response.
3. THE Admin_Shell layout SHALL fetch the user's `profiles` row server-side and pass the role to child components via a React context or prop.
4. WHEN a user's role is changed by an admin, THE change SHALL take effect on the affected user's next page load without requiring a re-login.

---

### Requirement 13: Dynamic Blog Detail Routes

**User Story:** As a site visitor, I want to read individual blog posts at their own URL, so that I can share and bookmark specific articles.

#### Acceptance Criteria

1. WHEN a visitor navigates to `/blog/[slug]`, THE Dynamic_Route SHALL fetch the post from the `posts` table using Supabase_Server and render the full content.
2. IF the slug does not match a published post, THEN THE Dynamic_Route SHALL call Next.js `notFound()` to render the 404 page.
3. THE Dynamic_Route SHALL render the post's title, author name, published date, featured image (if present), excerpt, and HTML content.
4. THE Dynamic_Route SHALL display up to 3 related posts of the same type ordered by `published_at` descending.
5. THE Dynamic_Route SHALL export `revalidate = 3600` for ISR caching.
6. THE Dynamic_Route SHALL export `generateMetadata` returning `title` and `description` from the post record.

---

### Requirement 14: Dynamic Sermon Detail Routes

**User Story:** As a site visitor, I want to watch or listen to individual sermons at their own URL, so that I can access specific messages easily.

#### Acceptance Criteria

1. WHEN a visitor navigates to `/sermons/[slug]`, THE Dynamic_Route SHALL fetch the sermon from the `sermons` table using Supabase_Server and render the full detail page.
2. IF the slug does not match a published sermon, THEN THE Dynamic_Route SHALL call Next.js `notFound()`.
3. WHEN the sermon record contains a YouTube or Vimeo URL in `video_url`, THE Dynamic_Route SHALL render an embedded iframe player.
4. WHEN the sermon record contains a direct video file URL in `video_url`, THE Dynamic_Route SHALL render an HTML5 `<video>` element.
5. WHEN the sermon record contains a value in `audio_url`, THE Dynamic_Route SHALL render an HTML5 `<audio>` element.
6. THE Dynamic_Route SHALL display up to 3 related sermons ordered by `date` descending.
7. THE Dynamic_Route SHALL export `revalidate = 3600` and `generateMetadata`.

---

### Requirement 15: Dynamic Event Detail Routes

**User Story:** As a site visitor, I want to view full details for a church event, so that I know when, where, and how to attend or register.

#### Acceptance Criteria

1. WHEN a visitor navigates to `/events/[slug]`, THE Dynamic_Route SHALL fetch the event from the `events` table using Supabase_Server and render the full detail page.
2. IF the slug does not match an event record, THEN THE Dynamic_Route SHALL call Next.js `notFound()`.
3. THE Dynamic_Route SHALL display the event title, status badge, start date/time, end date/time (if present), location, description, and HTML content.
4. WHEN the event record contains a `registration_url`, THE Dynamic_Route SHALL render a "Register Now" button linking to that URL in a new tab.
5. THE Dynamic_Route SHALL export `revalidate = 3600` and `generateMetadata`.

---

### Requirement 16: Search

**User Story:** As a site visitor, I want to search across posts, sermons, and events, so that I can quickly find relevant content.

#### Acceptance Criteria

1. THE Search_Feature SHALL be accessible via a search input in the public site navigation.
2. WHEN a user submits a search query of at least 2 characters, THE Search_Feature SHALL query the `posts`, `sermons`, and `events` tables using Supabase full-text search or `ilike` pattern matching on title and description fields.
3. THE Search_Feature SHALL display results grouped by content type (Posts, Sermons, Events) with title, excerpt/description, and a link to the detail page.
4. IF no results are found, THEN THE Search_Feature SHALL display a "No results found" message.
5. WHEN a search query is fewer than 2 characters, THE Search_Feature SHALL NOT submit a query to the database.

---

### Requirement 17: Sermon Filtering and Pagination

**User Story:** As a site visitor, I want to filter sermons by preacher, series, and date, so that I can find messages relevant to my needs.

#### Acceptance Criteria

1. THE Sermons_Page SHALL display filter controls for: preacher (dropdown populated from distinct `preacher` values), series (dropdown populated from distinct `series` values), and date range (start date, end date).
2. WHEN a filter is applied, THE Sermons_Page SHALL update the URL query parameters and re-fetch sermons matching all active filters without a full page reload.
3. THE Sermons_Page SHALL display sermons in pages of 12 records ordered by `date` descending.
4. WHEN the total number of matching sermons exceeds 12, THE Sermons_Page SHALL render pagination controls showing previous/next and page number buttons.
5. WHEN a filter is cleared, THE Sermons_Page SHALL reset to the unfiltered first page.

---

### Requirement 18: Featured Content Sections

**User Story:** As an admin, I want to mark content as featured, so that highlighted posts, sermons, and events appear prominently on the home page.

#### Acceptance Criteria

1. THE Home_Page SHALL display a "Featured Sermon" section showing the most recently published sermon with `status = 'published'`.
2. THE Home_Page SHALL display an "Upcoming Events" section showing up to 3 events with `is_featured = true` and `status = 'upcoming'` ordered by `date` ascending.
3. THE Home_Page SHALL display a "Latest Posts" section showing up to 3 posts with `status = 'published'` ordered by `published_at` descending.
4. WHEN no featured events exist, THE Home_Page SHALL display the next 3 upcoming events regardless of the `is_featured` flag.
5. THE Home_Page sections SHALL use `revalidate = 3600` so content updates appear within 1 hour of a CMS save.

---

### Requirement 19: Environment Variable Validation

**User Story:** As a developer, I want environment variables validated at startup, so that misconfigured deployments fail fast with a clear error rather than silently at runtime.

#### Acceptance Criteria

1. THE Application SHALL validate the presence of `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` at build time or application startup.
2. IF any required environment variable is missing or empty, THEN THE Application SHALL throw an error with a descriptive message identifying the missing variable and SHALL NOT start.
3. THE Application SHALL expose a `src/lib/env.ts` module that exports validated environment variables for use throughout the codebase.

---

### Requirement 20: Performance Optimisation

**User Story:** As a site visitor, I want pages to load quickly, so that I have a smooth browsing experience on mobile and desktop.

#### Acceptance Criteria

1. THE Application SHALL use Next.js `<Image>` component for all images on public pages to enable automatic format conversion and lazy loading.
2. THE Application SHALL set `revalidate` values on all public Dynamic_Routes and listing pages to enable ISR caching.
3. THE Application SHALL configure `next.config.mjs` with the Supabase Storage hostname in `images.remotePatterns` to allow optimised image delivery.
4. THE Admin_Shell pages SHALL NOT be statically generated and SHALL use dynamic rendering to ensure fresh data.

---

### Requirement 21: Accessibility

**User Story:** As a site visitor with accessibility needs, I want the website to be navigable and readable, so that I can access church content regardless of ability.

#### Acceptance Criteria

1. THE Application SHALL ensure all interactive elements (buttons, links, form inputs) have visible focus indicators.
2. THE Application SHALL ensure all images rendered via `<img>` or `<Image>` have non-empty `alt` attributes.
3. THE Application SHALL ensure all form inputs in the admin and public contact/donation forms have associated `<label>` elements.
4. THE Application SHALL ensure heading levels (h1–h6) follow a logical hierarchy on every page.
5. THE Application SHALL ensure colour contrast ratios for body text meet a minimum ratio of 4.5:1 against their background.

---

### Requirement 22: Contact and Prayer Request Inbox

**User Story:** As an admin or editor, I want to view contact form submissions and prayer requests in the admin, so that the church can respond to the congregation.

#### Acceptance Criteria

1. THE Admin_Shell SHALL include an Inbox section accessible at `/admin/inbox` showing unread contact submissions and prayer requests.
2. THE Inbox SHALL display contact submissions with: name, email, subject, message, and submission date.
3. THE Inbox SHALL display prayer requests with: name (or "Anonymous"), request text, and submission date.
4. WHEN an admin marks a contact submission as read, THE Server_Action SHALL set `is_read = true` on the `contact_submissions` record.
5. THE Inbox SHALL be accessible to users with role `admin` or `editor`.

---

### Requirement 23: Gallery Manager

**User Story:** As an editor or admin, I want to manage the photo gallery, so that the public Gallery page displays current church photos.

#### Acceptance Criteria

1. THE Gallery_Manager SHALL display all gallery images in a grid showing thumbnail, title, album, and display order.
2. WHEN an admin or editor uploads images to the gallery, THE Server_Action SHALL insert records into the `gallery` table with `image_url`, `title`, `description`, `album`, and `display_order`.
3. WHEN an admin or editor deletes a gallery image, THE Server_Action SHALL delete the record from the `gallery` table and remove the file from the Storage_Bucket.
4. WHEN an admin reorders gallery images, THE Server_Action SHALL update `display_order` for all affected records.
5. WHEN gallery records are saved or deleted, THE Server_Action SHALL call `revalidatePath('/gallery')`.
