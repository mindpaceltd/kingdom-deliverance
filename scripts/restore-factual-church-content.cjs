const fs = require('node:fs');
const Module = require('node:module');
require('@next/env').loadEnvConfig(process.cwd());
const ts = require('typescript');
const scorer = new Module(process.cwd() + '/seo-scorer.cjs');
scorer.filename = process.cwd() + '/seo-scorer.cjs';
scorer._compile(ts.transpileModule(fs.readFileSync('src/lib/seo-scorer.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, scorer.filename);
const { computeSeoScore } = scorer.exports;
const { createClient } = require('@supabase/supabase-js');
async function main() {
 const posts = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
 const about = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
 if (posts.length !== 5 || new Set(posts.map(p => p.slug)).size !== 5) throw Error('Expected five article replacements');
 const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
 const { data: beforePosts, error } = await db.from('posts').select('id,slug,title,excerpt,content,meta_title,meta_description,focus_keyword,featured_image,seo_score').in('slug', posts.map(p => p.slug)).eq('status', 'published');
 const { data: beforeAbout, error: pageError } = await db.from('pages').select('id,slug,content_json').eq('slug', 'about').eq('status', 'published').single();
 if (error || pageError) throw error || pageError;
 if (beforePosts.length !== 5) throw Error('Article set mismatch');
 for (const post of posts) {
  const old = beforePosts.find(p => p.slug === post.slug);
  const score = computeSeoScore({ focusKeyword: post.focus_keyword, seoTitle: post.meta_title, metaDescription: post.meta_description, content: post.content, slug: post.slug, featuredImage: old.featured_image });
  if (score.score !== 100) throw Error(JSON.stringify({ slug: post.slug, ...score }));
 }
 const backup = '/root/kdc-release-backups/factual-church-content-' + Date.now();
 fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
 fs.writeFileSync(backup + '/before.json', JSON.stringify({ posts: beforePosts, page: beforeAbout }, null, 2), { mode: 0o600 });
 if (process.argv[4] !== '--apply') { console.log('Validated five article replacements at 100/100 and About content.'); return; }
 const done = [];
 try {
  for (const post of posts) {
   const old = beforePosts.find(p => p.slug === post.slug);
   const { slug, ...patch } = post;
   const { data, error } = await db.from('posts').update({ ...patch, seo_score: 100 }).eq('id', old.id).eq('content', old.content).select('id');
   if (error || data?.length !== 1) throw error || Error('Concurrent article edit');
   done.push(old);
  }
  const { data, error } = await db.from('pages').update({ content_json: about }).eq('id', beforeAbout.id).eq('content_json', JSON.stringify(beforeAbout.content_json)).select('id');
  if (error || data?.length !== 1) throw error || Error('Concurrent About edit');
  console.log(JSON.stringify({ updatedArticles: done.length, aboutUpdated: true, backup }));
 } catch (error) {
  for (const old of done) { const { id, slug, featured_image, ...patch } = old; const r = await db.from('posts').update(patch).eq('id', id); if (r.error) console.error('Rollback needs review:', id, r.error.message); }
  throw error;
 }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
