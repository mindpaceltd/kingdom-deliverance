const PESAPAL_URL =
  process.env.PESAPAL_MODE === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/apiV3'

export async function getPesapalAuthToken(): Promise<string> {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET

  if (!consumerKey || !consumerSecret) {
    throw new Error('Pesapal credentials are not configured (PESAPAL_CONSUMER_KEY / PESAPAL_CONSUMER_SECRET)')
  }

  const response = await fetch(`${PESAPAL_URL}/api/Auth/RegisterInteraction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Pesapal auth failed (${response.status}): ${body.slice(0, 200)}`)
  }

  const data = await response.json()

  if (!data.token) {
    throw new Error(`Pesapal auth returned no token: ${JSON.stringify(data).slice(0, 200)}`)
  }

  return data.token
}

export async function registerPesapalIPN(token: string) {
  const response = await fetch(`${PESAPAL_URL}/api/URLRegister/RegisterIPN`, {
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
  token: string
) {
  if (!data.notification_id) {
    throw new Error('PESAPAL_IPN_ID environment variable is not set')
  }

  const response = await fetch(`${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`, {
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

export async function getPesapalTransactionStatus(orderTrackingId: string, token: string) {
  const response = await fetch(
    `${PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
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
