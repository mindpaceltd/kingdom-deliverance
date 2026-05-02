const PESAPAL_URL = process.env.PESAPAL_MODE === 'live' 
  ? 'https://pay.pesapal.com/v3' 
  : 'https://cybqa.pesapal.com/apiV3'

export async function getPesapalAuthToken() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET

  const response = await fetch(`${PESAPAL_URL}/api/Auth/RegisterInteraction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret
    })
  })

  const data = await response.json()
  return data.token
}

export async function registerPesapalIPN(token: string) {
  const response = await fetch(`${PESAPAL_URL}/api/URLRegister/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/pesapal-ipn`,
      ipn_notification_type: 'GET'
    })
  })

  return response.json()
}

export async function initiatePesapalPayment(data: {
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
}, token: string) {
  const response = await fetch(`${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      callback_url: data.callback_url,
      notification_id: data.notification_id,
      billing_address: data.billing_address
    })
  })

  return response.json()
}

export async function getPesapalTransactionStatus(orderTrackingId: string, token: string) {
  const response = await fetch(`${PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })

  return response.json()
}
