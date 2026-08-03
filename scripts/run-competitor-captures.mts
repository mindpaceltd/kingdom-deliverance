/**
 * One-off: capture all active competitors.
 * Usage: npx tsx scripts/run-competitor-captures.mts
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { runCompetitorCapture } from '../src/lib/digital-ministry/competitor-intelligence/capture-engine'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: comps, error } = await admin
  .from('dm_competitors')
  .select('id, name')
  .eq('is_active', true)
  .is('deleted_at', null)

if (error) throw error

console.log(`Capturing ${comps?.length ?? 0} competitors…`)

for (const c of comps ?? []) {
  console.log(`\n>>> ${c.name}`)
  try {
    const r = await runCompetitorCapture(admin, c.id, { discover: true })
    console.log({
      content: r.contentCount,
      videos: r.videoCount,
      website: r.websitePosts,
      steps: r.steps.map((s) => `${s.platform}:${s.status}`),
    })
  } catch (e) {
    console.error('FAIL', c.name, e instanceof Error ? e.message : e)
  }
}

console.log('\nDone.')
