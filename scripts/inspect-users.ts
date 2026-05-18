import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase URL or Service Role Key in environment!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  console.log('Fetching users and profiles...')
  
  // Fetch profiles
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, name, role, created_at')
  
  if (pError) {
    console.error('Error fetching profiles:', pError)
    process.exit(1)
  }
  
  console.log('Profiles registered in the database:')
  console.table(profiles)
}

main()
