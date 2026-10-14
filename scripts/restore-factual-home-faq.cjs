const fs = require('node:fs');
require('@next/env').loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');
async function main() {
 const pages = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
 if (pages.length !== 2 || pages.map(p => p.slug).sort().join(',') !== 'faq,home') throw Error('Only home and faq are allowed');
 const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
 const { data: before, error } = await db.from('pages').select('id,slug,content_json').in('slug', ['home', 'faq']).eq('status', 'published');
 if (error || before?.length !== 2) throw error || Error('Expected published home and FAQ');
 const backup = '/root/kdc-release-backups/factual-home-faq-' + Date.now();
 fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
 fs.writeFileSync(backup + '/before.json', JSON.stringify(before, null, 2), { mode: 0o600 });
 if (process.argv[3] !== '--apply') return;
 const done = [];
 try {
  for (const page of pages) {
   const old = before.find(p => p.slug === page.slug);
   const { data, error } = await db.from('pages').update({ content_json: page.content_json }).eq('id', old.id).eq('content_json', JSON.stringify(old.content_json)).select('id');
   if (error || data?.length !== 1) throw error || Error('Concurrent page edit: ' + page.slug);
   done.push(old);
  }
 } catch (error) {
  for (const old of done) { const r = await db.from('pages').update({ content_json: old.content_json }).eq('id', old.id); if (r.error) console.error('Rollback needs review:', old.slug); }
  throw error;
 }
 console.log(JSON.stringify({ updated: done.map(p => p.slug), backup }));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
