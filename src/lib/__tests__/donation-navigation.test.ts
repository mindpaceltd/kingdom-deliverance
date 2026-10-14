import { describe, it, expect } from 'vitest';
import { donationFromUsd, donationRate, formatDonation } from '../donation-currency';
import { isNavigationActive } from '../navigation-active';
const rates = { UGX: 3800, USD: 1, GBP: 0.79, EUR: 0.92, KES: 130, RWF: 1250 };
describe('donation currency changes', () => {
  it('converts the same gift and presets from UGX into the chosen currency', () => {
    const usd = 500000 / donationRate('UGX', rates);
    expect(donationFromUsd(usd, 'USD', rates)).toBe(131.58);
    expect(donationFromUsd(usd, 'GBP', rates)).toBe(103.95);
    expect(donationFromUsd(usd, 'EUR', rates)).toBe(121.05);
    expect(donationFromUsd(usd, 'UGX', rates)).toBe(500000);
    expect(formatDonation(donationFromUsd(usd, 'USD', rates), 'USD')).toContain('131.58');
  });
  it('preserves the original gift through repeated currency switches', () => {
    const usd = 10000 / rates.UGX;
    for (let i = 0; i < 20; i++) {
      donationFromUsd(usd, 'GBP', rates);
      donationFromUsd(usd, 'USD', rates);
      expect(donationFromUsd(usd, 'UGX', rates)).toBe(10000);
    }
  });
  it('respects whole-unit currencies and rejects invalid rates', () => {
    expect(donationFromUsd(10.555, 'RWF', rates)).toBe(13194);
    expect(() => donationRate('GBP', { GBP: 0 })).toThrow();
    expect(() => donationRate('USD', { USD: NaN })).toThrow();
  });
});
describe('active navigation', () => {
  it('matches nested detail pages, descendants and trailing slashes', () => {
    for (const [path, href] of [['/sermons/message', '/sermons'], ['/events/event', '/events'], ['/ministries/youth', '/ministries'], ['/blog/article', '/blog'], ['/shop/book', '/shop'], ['/testimonies/story', '/testimonies'], ['/donations/success', '/donations'], ['/about/', '/about']]) expect(isNavigationActive(path, href)).toBe(true);
  });
  it('highlights Home only at the root and avoids prefix collisions', () => {
    expect(isNavigationActive('/', '/')).toBe(true);
    expect(isNavigationActive('/about', '/')).toBe(false);
    expect(isNavigationActive('/shopper', '/shop')).toBe(false);
    expect(isNavigationActive('/blogger', '/blog')).toBe(false);
  });
  it('keeps giving and shop navigation active for related routes', () => {
    expect(isNavigationActive('/give', '/donations')).toBe(true);
    expect(isNavigationActive('/checkout', '/shop')).toBe(true);
  });
});
