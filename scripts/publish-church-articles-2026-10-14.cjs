const fs = require('node:fs');
const path = require('node:path');
require('@next/env').loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const file = process.argv[2];
  const mode = process.argv[3] || '--check';
  const articles = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (articles.length !== 5 || new Set(articles.map(p => p.slug)).size !== 5) throw Error('Exactly five unique articles required.');
  for (const post of articles) {
    const words = post.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (!/^[a-z0-9-]+$/.test(post.slug) || words < 300 || /<script|\son\w+=|javascript:/i.test(post.content)) throw Error('Article validation failed: ' + post.slug);
    if (!post.featured_image.startsWith('https://pub-6299bd19a8614368b611590ccf05ac14.r2.dev/images/')) throw Error('Expected existing public KDC image.');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw Error('Publishing credential not configured.');
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const slugs = articles.map(p => p.slug);
  const { data: existing, error: lookupError } = await db.from('posts').select('id,slug').in('slug', slugs);
  if (lookupError) throw lookupError;
  if (existing?.length) throw Error('Existing article slugs found; no content changed.');
  console.log('Validated five original articles; no duplicate slugs.');
  if (mode !== '--publish') return;
  const now = new Date();
  if (new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala' }).format(now) !== '2026-10-14') throw Error('Review the publication date before running on another day.');
  const records = articles.map((post, index) => ({ ...post, author_id: null, status: 'published', published_at: new Date(now.getTime() - index * 1000).toISOString(), deleted_at: null }));
  const backup = path.join('/root/kdc-release-backups', 'church-articles-' + Date.now());
  fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(backup, 'requested-articles.json'), JSON.stringify(records, null, 2), { mode: 0o600 });
  const { data: inserted, error } = await db.from('posts').insert(records).select('id,slug,title');
  if (error) throw error;
  fs.writeFileSync(path.join(backup, 'published-articles.json'), JSON.stringify(inserted, null, 2), { mode: 0o600 });
  if (inserted?.length !== 5) throw Error('Unexpected publish response; inspect manifest before retrying.');
  console.log(JSON.stringify({ published: inserted, manifest: backup }));
}
main().catch(error => { console.error(error.message || error); process.exitCode = 1; });
