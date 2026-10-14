/** Rates are units of the selected currency per US dollar. */
export function donationRate(currency: string, rates: Record<string, number>): number {
  const rate = rates[currency];
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Currency rate unavailable. Please choose another currency.');
  return rate;
}

export function donationDigits(currency: string): number {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

export function donationFromUsd(usd: number, currency: string, rates: Record<string, number>): number {
  return Number((usd * donationRate(currency, rates)).toFixed(donationDigits(currency)));
}

export function formatDonation(amount: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: donationDigits(currency) }).format(amount);
}
