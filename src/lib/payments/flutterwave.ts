export async function initiateFlutterwavePayment(data: {
  amount: number
  currency: string
  email: string
  name: string
  tx_ref: string
  redirect_url: string
}) {
  const secretKey = process.env.FLW_SECRET_KEY

  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: data.tx_ref,
      amount: data.amount,
      currency: data.currency,
      redirect_url: data.redirect_url,
      customer: {
        email: data.email,
        name: data.name,
      },
      customizations: {
        title: 'Kingdom Deliverance Store',
        logo: 'https://kdcuganda.org/logo.png', // Fallback
      },
    }),
  })

  return response.json()
}

export async function verifyFlutterwavePayment(transactionId: string) {
  const secretKey = process.env.FLW_SECRET_KEY

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  })

  return response.json()
}
