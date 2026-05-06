'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { spendCredits } from './credits'
import { revalidatePath } from 'next/cache'

export interface FireServiceSubmitData {
  firstName: string
  lastName: string
  email: string
  country: string
  phone: string
  attendance: string
  focusAreas: string[]
  details: string
  paymentMethod: 'credits' | 'vow' | 'pesapal'
  selectedSeed: number
}

export async function submitFireServiceRequest(data: FireServiceSubmitData) {
  const adminClient = createAdminClient()

  try {
    // 1. If using credits, attempt to spend them first
    if (data.paymentMethod === 'credits') {
      const spendResult = await spendCredits({
        email: data.email,
        amount: data.selectedSeed,
        type: 'spend',
        referenceId: `FIRE-SERVICE-${Date.now()}`
      })

      if (!spendResult.success) {
        return { success: false, error: spendResult.error }
      }
    }

    // 2. Create the request in the database
    const { data: request, error: requestError } = await adminClient
      .from('fire_service_requests')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        country: data.country,
        phone: data.phone,
        attendance_mode: data.attendance,
        prayer_focus_areas: data.focusAreas,
        prayer_request_details: data.details,
        credits_used: data.paymentMethod === 'credits' ? data.selectedSeed : null,
        payment_method: data.paymentMethod,
        status: data.paymentMethod === 'vow' ? 'pending' : 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (requestError) {
      console.error('[submitFireServiceRequest] DB Error:', requestError)
      return { success: false, error: 'Failed to save your request. Please try again.' }
    }

    revalidatePath('/fire-service')
    return { success: true, requestId: request.id }
  } catch (err: any) {
    console.error('[submitFireServiceRequest] Unexpected error:', err)
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}
