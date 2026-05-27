/** USD base amounts are stored in the database; display uses these rates at checkout. */
export const USD_TO_UGX = 3800

export type ShopAdminCurrency = 'USD' | 'UGX'

export function usdToDisplayAmount(usd: number, currency: ShopAdminCurrency): number {
  if (currency === 'UGX') return Math.round(usd * USD_TO_UGX)
  return usd
}

export function displayAmountToUsd(amount: number, currency: ShopAdminCurrency): number {
  if (currency === 'UGX') return Math.round((amount / USD_TO_UGX) * 100) / 100
  return amount
}

export function formatShippingRate(usd: number): string {
  const ugx = Math.round(usd * USD_TO_UGX)
  return `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd)} · ${new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(ugx)}`
}
