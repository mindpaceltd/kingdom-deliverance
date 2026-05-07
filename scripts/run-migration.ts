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

async function runMigration() {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260507160000_create_organization_images_storage.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log('Applying migration...')
  
  // Try using the exec_sql RPC mentioned in smoke tests
  const { data, error } = await supabase.rpc('exec_sql', { sql })

  if (error) {
    console.error('Error applying migration via RPC:', error)
    
    // If RPC fails, it might be because the SQL is too large or RPC doesn't exist
    // However, migrations usually need to be run as a single block or multiple calls.
    // Since I can't run raw SQL directly via supabase-js without an RPC, 
    // I will try to split the SQL by statements if possible, but many statements are complex.
    
    console.log('\nTip: If exec_sql RPC does not exist, you can create it in the Supabase SQL Editor:')
    console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
  } else {
    console.log('Migration applied successfully!')
  }
}

runMigration()
