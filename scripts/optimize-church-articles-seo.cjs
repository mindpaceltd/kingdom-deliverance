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
 if (posts.length !== 5 || new Set(posts.map(p => p.slug)).size !== 5) throw Error('Expected five unique articles');
 const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
 const fields = 'id,slug,title,content,meta_title,meta_description,focus_keyword,featured_image,seo_score';
 const { data: before, error } = await db.from('posts').select(fields).in('slug', posts.map(p => p.slug));
 if (error) throw error;
 if (before.length !== 5) throw Error('Expected five existing articles');
 for (const post of posts) {
  const result = computeSeoScore({ focusKeyword: post.focus_keyword, seoTitle: post.meta_title, metaDescription: post.meta_description, content: post.content, slug: post.slug, featuredImage: post.featured_image });
  if (result.score !== 100) throw Error(JSON.stringify({ slug: post.slug, ...result }));
  console.log(JSON.stringify({ slug: post.slug, ...result }));
 }
 if (process.argv[3] !== '--apply') return;
 const backup = '/root/kdc-release-backups/blog-seo-' + Date.now();
 fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
 fs.writeFileSync(backup + '/before.json', JSON.stringify(before, null, 2), { mode: 0o600 });
 for (const post of posts) {
  const old = before.find(p => p.slug === post.slug);
  const patch = { content: post.content, meta_title: post.meta_title, meta_description: post.meta_description, focus_keyword: post.focus_keyword, seo_score: 100 };
  const { data, error } = await db.from('posts').update(patch).eq('id', old.id).eq('content', old.content).eq('meta_title', old.meta_title).select(fields);
  if (error || data?.length !== 1) throw error || Error('Article changed during update; inspect backup: ' + backup);
 }
 const { data: after, error: verifyError } = await db.from('posts').select(fields).in('slug', posts.map(p => p.slug));
 if (verifyError) throw verifyError;
 for (const post of after) {
  const result = computeSeoScore({ focusKeyword: post.focus_keyword, seoTitle: post.meta_title, metaDescription: post.meta_description, content: post.content, slug: post.slug, featuredImage: post.featured_image });
  if (result.score !== 100 || post.seo_score !== 100) throw Error('Verification failed: ' + post.slug);
 }
 console.log(JSON.stringify({ verified: after.length, score: 100, backup }));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
