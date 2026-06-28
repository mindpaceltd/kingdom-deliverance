import { createClient } from '@supabase/supabase-js'
import { getFireServiceSchedule } from '../src/lib/fire-service-schedule'

const schedule = getFireServiceSchedule()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
)

async function main() {
  const { data: pages } = await supabase.from('pages').select('id, slug, content_json').in('slug', ['home', ''])
  for (const page of pages ?? []) {
    const content = { ...(page.content_json ?? {}) }
    content.home = { ...(content.home ?? {}), fireCtaTitle: '🔥 The Fire Service 🔥' }
    await supabase.from('pages').update({ content_json: content }).eq('id', page.id)
    console.log('Updated homepage fire CTA for slug=', page.slug || '(empty)')
  }

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('slug', 'fire-service-night-of-prayer-deliverance-kdc')
    .maybeSingle()

  if (event) {
    await supabase.from('events').update({
      date: schedule.startIso,
      end_date: schedule.endIso,
      description: `🔥 Fire Service – ${schedule.formattedDate}\n\nSome battles only break in the place of fire. Bring your case before the Fire Altar tonight and let God intervene with power, deliverance, and answers.`,
      content: `<p>🔥 THE FIRE SERVICE 🔥<br>${schedule.formattedDate}<br>⏰ Time: ${schedule.formattedTime}</p><p>There are situations that will not change until they are brought into the place of prayer and fire. Join us for a powerful night at the Fire Altar as we seek God for deliverance, breakthroughs, restoration, healing, and divine intervention.</p><p>Come with your prayer requests, burdens, and expectations. Every stubborn matter must respond by fire.</p><p>“Submit your case to the Fire Altar tonight.”</p><p>📍 Kingdom Deliverance Center (KDC)</p>`,
      status: 'upcoming',
    }).eq('id', event.id)
    console.log('Synced fire service event to', schedule.formattedDate)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
