/**
 * Print Contact page CMS row + site_settings + resolved public fields.
 * Usage: npx tsx scripts/inspect-contact-page.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { parsePageContent } from '../src/lib/cms/page-content'
import { resolveContactPage } from '../src/lib/cms/contact-page-defaults'

const envFile = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) {
  const envConfig = dotenv.parse(fs.readFileSync(envFile))
  for (const k in envConfig) process.env[k] = envConfig[k]
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  const [pageRes, settingsRes, heroRes] = await Promise.all([
    supabase.from('pages').select('*').eq('slug', 'contact').maybeSingle(),
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['address', 'contact_phone', 'contact_email', 'contact_phones_json']),
    supabase
      .from('organization_images')
      .select('url')
      .eq('type', 'hero')
      .eq('is_active', true)
      .maybeSingle(),
  ])

  console.log('\n=== pages.slug = contact ===\n')
  console.log(JSON.stringify(pageRes.data, null, 2))
  if (pageRes.error) console.error(pageRes.error)

  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.key, r.value]))
  console.log('\n=== site_settings (contact-related) ===\n')
  console.log(JSON.stringify(settings, null, 2))

  const cms = pageRes.data?.content_json ? parsePageContent(pageRes.data.content_json) : null
  const resolved = resolveContactPage(cms, settings, heroRes.data?.url ?? null)

  console.log('\n=== resolved (public /contact) ===\n')
  console.log(JSON.stringify(resolved, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
