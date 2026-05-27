'use server'

import { createClient } from '@/lib/supabase/server'

export async function incrementProductViews(productId: string): Promise<void> {
  if (!productId) return

  const supabase = createClient()
  const { error } = await supabase.rpc('increment_product_views', {
    p_product_id: productId,
  })

  if (error) {
    console.error('[incrementProductViews]', error.message)
  }
}
