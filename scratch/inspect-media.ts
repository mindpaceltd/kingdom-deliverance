import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  console.log('Connecting to Supabase at:', SUPABASE_URL)
  const { data: media, error } = await supabase.from('media').select('*')
  if (error) {
    console.error('Error fetching media:', error)
    return
  }

  console.log(`Found ${media?.length || 0} media items.`)
  for (const item of media || []) {
    console.log(`- ID: ${item.id}, Name: ${item.name}, File Name: ${item.file_name}, URL: ${item.url}`)
  }
}

run()
