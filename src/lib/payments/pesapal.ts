function getPesapalUrl(mode?: string): string {
  const m = mode || process.env.PESAPAL_MODE || 'live'
  return m === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/apiV3'
}

/**
 * Get a Pesapal auth token.
 * Accepts credentials directly (from DB settings) or falls back to env vars.
 */
export async function getPesapalAuthToken(
  consumerKey?: string,
  consumerSecret?: string,
  mode?: string
): Promise<string> {
  const key = consumerKey || process.env.PESAPAL_CONSUMER_KEY
  const secret = consumerSecret || process.env.PESAPAL_CONSUMER_SECRET

  if (!key || !secret) {
    throw new Error(
      'Pesapal credentials are not configured. Please add Consumer Key and Consumer Secret in Settings → Payments.'
    )
  }

  const url = getPesapalUrl(mode)

  const response = await fetch(`${url}/api/Auth/RegisterInteraction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      consumer_key: key,
      consumer_secret: secret,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Pesapal auth failed (${response.status}): ${body.slice(0, 200)}`)
  }

  const data = await response.json()

  if (!data.token) {
    throw new Error(
      `Pesapal auth returned no token. Check your Consumer Key and Secret in Settings → Payments. Response: ${JSON.stringify(data).slice(0, 200)}`
    )
  }

  return data.token
}

export async function registerPesapalIPN(token: string, mode?: string) {
  const url = getPesapalUrl(mode)
  const response = await fetch(`${url}/api/URLRegister/RegisterIPN`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/pesapal-ipn`,
      ipn_notification_type: 'GET',
    }),
  })

  return response.json()
}

export async function initiatePesapalPayment(
  data: {
    id: string
    amount: number
    currency: string
    description: string
    callback_url: string
    notification_id: string
    billing_address: {
      email_address: string
      phone_number: string
      first_name: string
      last_name: string
    }
  },
  token: string,
  mode?: string
) {
  if (!data.notification_id) {
    throw new Error(
      'Pesapal IPN ID is not configured. Please register an IPN URL in your Pesapal dashboard and save the ID in Settings → Payments.'
    )
  }

  const url = getPesapalUrl(mode)

  const response = await fetch(`${url}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      callback_url: data.callback_url,
      notification_id: data.notification_id,
      billing_address: data.billing_address,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Pesapal order submission failed (${response.status}): ${body.slice(0, 200)}`)
  }

  return response.json()
}

export async function getPesapalTransactionStatus(
  orderTrackingId: string,
  token: string,
  mode?: string
) {
  const url = getPesapalUrl(mode)
  const response = await fetch(
    `${url}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  )

  return response.json()
}
