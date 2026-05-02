const PAYPAL_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${PAYPAL_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  return data.access_token
}

export async function initiatePayPalPayment(data: {
  orderId: string
  amount: number
  currency: string
  description: string
  returnUrl: string
  cancelUrl: string
}) {
  try {
    const accessToken = await getPayPalAccessToken()

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: data.orderId,
        amount: {
          currency_code: data.currency,
          value: data.amount.toFixed(2)
        },
        description: data.description
      }],
      application_context: {
        return_url: data.returnUrl,
        cancel_url: data.cancelUrl,
        brand_name: 'Kingdom Deliverance Store',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW'
      }
    }

    const response = await fetch(`${PAYPAL_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    const result = await response.json()

    if (response.ok && result.id) {
      // Find the approval URL
      const approvalLink = result.links?.find((link: any) => link.rel === 'approve')?.href

      return {
        success: true,
        orderId: result.id,
        paymentUrl: approvalLink
      }
    }

    return {
      success: false,
      error: result.message || 'Failed to create PayPal order'
    }
  } catch (error) {
    console.error('PayPal payment initiation error:', error)
    return {
      success: false,
      error: 'Failed to initiate PayPal payment'
    }
  }
}

export async function capturePayPalPayment(orderId: string) {
  try {
    const accessToken = await getPayPalAccessToken()

    const response = await fetch(`${PAYPAL_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    const result = await response.json()

    if (response.ok && result.status === 'COMPLETED') {
      return {
        success: true,
        transactionId: result.purchase_units[0].payments.captures[0].id,
        amount: result.purchase_units[0].payments.captures[0].amount
      }
    }

    return {
      success: false,
      error: result.message || 'Payment capture failed'
    }
  } catch (error) {
    console.error('PayPal payment capture error:', error)
    return {
      success: false,
      error: 'Failed to capture PayPal payment'
    }
  }
}

export async function getPayPalOrderDetails(orderId: string) {
  try {
    const accessToken = await getPayPalAccessToken()

    const response = await fetch(`${PAYPAL_URL}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    const result = await response.json()

    if (response.ok) {
      return {
        success: true,
        order: result
      }
    }

    return {
      success: false,
      error: result.message || 'Failed to get order details'
    }
  } catch (error) {
    console.error('PayPal order details error:', error)
    return {
      success: false,
      error: 'Failed to get PayPal order details'
    }
  }
}