import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const settings = [
  { key: 'mission', value: 'to set the captives free' },
  { key: 'vision', value: 'to cultivate a community that is wealthy healthy and wise' },
  { key: 'founder_name', value: 'Bishop Climate Wiseman Irungu' },
  { key: 'founder_bio', value: 'Pastor Clear from UK, Kingdom Temple' },
  { key: 'service_times', value: 'Wednesday: 6:00 PM - 10:00 PM\nFriday: 6:00 PM - 10:00 PM\nSunday: 10:00 AM' }
]

async function updateSettings() {
  console.log('Updating site settings...')
  for (const s of settings) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: s.key, value: s.value }, { onConflict: 'key' })
    
    if (error) {
      console.error(`Error updating ${s.key}:`, error.message)
    } else {
      console.log(`Updated ${s.key}`)
    }
  }
}

updateSettings()
