import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Inspect user_credits
  const { data: credits, error: cErr } = await supabase
    .from('user_credits')
    .select('*')
    .limit(10)

  if (cErr) {
    console.error('user_credits error:', cErr.message)
  } else {
    console.log('user_credits rows:')
    console.table(credits)
  }

  // Inspect credit_transactions
  const { data: txns, error: tErr } = await supabase
    .from('credit_transactions')
    .select('*')
    .limit(10)

  if (tErr) {
    console.error('credit_transactions error:', tErr.message)
  } else {
    console.log('credit_transactions rows:')
    console.table(txns)
  }

  // List auth users
  const { data: authData } = await supabase.auth.admin.listUsers()
  console.log('\nAuth Users:')
  console.table(authData?.users?.map(u => ({ id: u.id, email: u.email })))
}

main()
