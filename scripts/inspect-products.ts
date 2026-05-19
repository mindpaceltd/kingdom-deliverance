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

async function inspect() {
  const { data, error } = await supabase.from('products').select('*')
  if (error) {
    console.error('Error fetching products:', error)
  } else if (data) {
    console.log(`Fetched ${data.length} products:`)
    data.forEach(p => {
      console.log(`- ID: ${p.id}`)
      console.log(`  Name: ${p.name}`)
      console.log(`  Image/Cover URL: ${p.images || p.image_url || p.cover_url || p.image || p.cover}`)
      console.log(`  Raw Product Object Keys:`, Object.keys(p))
    })
  }
}

inspect()
