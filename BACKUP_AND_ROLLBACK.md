# Backup and Rollback Notes

## Database Backup (Supabase/Postgres)

Run from a trusted machine with network access to your database:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --file "backup_$(date +%F_%H%M).dump"
```

Recommended cadence:
- Daily automated backup
- Pre-release backup
- Pre-migration backup

## Database Restore

Restore to a staging environment first:

```bash
pg_restore --clean --if-exists --no-owner --dbname "$STAGING_DATABASE_URL" backup_file.dump
```

Production restore should be done only in an approved incident window.

## Application Rollback

1. Identify previous stable commit/tag.
2. Checkout that commit on server clone.
3. Reinstall and rebuild:

```bash
npm ci
npm run build
pm2 restart kingdom-deliverance
```

## Post-Rollback Validation

- Home page loads
- Sermons/events/blog pages load
- `/admin` redirects to `/admin/login` when signed out
- Authenticated admin can access CMS dashboard
- `npm run smoke` passes against deployed URL
