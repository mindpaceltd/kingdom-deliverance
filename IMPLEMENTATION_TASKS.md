# Kingdom Deliverance Centre Uganda - Implementation Tasks

This project will be delivered in phases, starting with frontend stabilization and UX completion.

## Phase 1 - Frontend First (In Progress)

- [x] Review current Next.js app structure and existing pages
- [x] Confirm theme direction (gold, white, deep purple) and typography baseline
- [x] Identify missing public route(s) and navigation gaps
- [x] Add `Gallery` public page to complete the core website routes
- [x] Improve top navigation and footer quick links coverage
- [x] Fix hero CTA routing consistency (`Watch Live` -> `/live`)
- [x] Start frontend quality pass (image optimization/accessibility improvements)
- [ ] Add reusable section primitives for cleaner public page composition
- [ ] Add loading/empty states consistency across all public content pages
- [ ] Add SEO metadata consistency (Open Graph/Twitter metadata for all public pages)
- [ ] Add responsive QA pass for mobile, tablet, desktop

## Phase 2 - CMS Foundations

- [ ] Implement authenticated admin shell with protected routes
- [ ] Build role-based authorization guards (Admin, Editor, Author)
- [ ] Build content managers:
  - [ ] Posts manager (CRUD)
  - [ ] Sermons manager (CRUD)
  - [ ] Events manager (CRUD)
  - [ ] Ministries manager (CRUD)
  - [ ] Pages manager (JSON section editor)
- [ ] Build media library with drag-and-drop uploads (Supabase Storage)
- [ ] Build user management UI and role assignment
- [ ] Build settings module (branding, socials, contact info, streaming links)

## Phase 3 - Supabase Data + Security

- [ ] Finalize schema and migration scripts for all required tables
- [ ] Add seed data for ministries, events, sermons, posts, pages
- [ ] Implement RLS policies for each table and each role
- [ ] Add storage bucket policies and upload permissions
- [ ] Add server-side data access utilities for App Router
- [ ] Verify auth flows (login/logout/session refresh) and role claims

## Phase 4 - Dynamic UX Features

- [ ] Dynamic post and sermon detail routes
- [ ] Search across posts/sermons/events
- [ ] Filtering (e.g., sermons by preacher/date)
- [ ] Pagination or infinite scrolling for large collections
- [ ] Featured content sections driven by CMS page config
- [ ] Realtime updates for selected admin/public modules (if needed)

## Phase 5 - Production Readiness

- [ ] Environment variable validation and production-safe defaults
- [ ] Performance optimization pass (images, caching, revalidate strategy)
- [ ] Accessibility audit (forms, contrast, keyboard navigation, semantics)
- [ ] Deployment guide for VPS (InMotion): build, process manager, reverse proxy, SSL
- [ ] Backup and rollback notes for Supabase self-hosted stack
- [ ] Final QA checklist and smoke tests
