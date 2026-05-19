import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load env from .env.local
const envFile = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) {
  const envConfig = dotenv.parse(fs.readFileSync(envFile))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const tables = [
  'profiles',
  'site_settings',
  'posts',
  'sermons',
  'events',
  'ministries',
  'media',
  'products',
  'orders',
  'order_items'
]

async function check() {
  console.log('Connecting to:', SUPABASE_URL)
  
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`❌ Table [${table}] error or does not exist:`, error.message)
    } else {
      console.log(`✅ Table [${table}] exists with ${count} rows.`)
    }
  }
}

check()
