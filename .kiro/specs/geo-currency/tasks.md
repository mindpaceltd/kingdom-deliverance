# Implementation Plan: geo-currency

## Overview

Implement a server-driven currency system that replaces the hardcoded `RATE = 3800` / `UGX` logic in `product-card.tsx` and `checkout/page.tsx`. The work proceeds in four phases: (1) the server-only `ExchangeRateService`, (2) the `CurrencyProvider` context, (3) updating the public layout to wire geo-detection and the provider together, and (4) migrating `ProductCard` and `CheckoutPage` to consume the context.

## Tasks

- [x] 1. Create `ExchangeRateService` — `src/lib/services/exchange-rates.ts`
  - [x] 1.1 Scaffold the module with `'server-only'` guard, constants, and types
    - Add `import 'server-only'` at the top of the file
    - Export `SUPPORTED_CURRENCIES` tuple and `SupportedCurrency` union type
    - Export `FALLBACK_RATES` constant: `UGX=3800, KES=130, TZS=2600, RWF=1250, NGN=1600, GHS=15, ZAR=18, GBP=0.79, EUR=0.92, USD=1`
    - Define internal `RateCache` interface with `rates: Record<string, number>` and `fetchedAt: string`
    - _Requirements: 3.1, 8.1, 8.2_

  - [x] 1.2 Implement `getExchangeRates()` — cache read path
    - Query `site_settings` for `key = 'exchange_rates_cache'` using the Supabase server client
    - Parse the JSON value as `RateCache`; if `fetchedAt` is within 24 hours, return `rates`
    - _Requirements: 2.1, 2.2_

  - [x] 1.3 Implement `getExchangeRates()` — API fetch and cache write path
    - If cache is absent or stale, `fetch` from `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`
    - Extract only the `SUPPORTED_CURRENCIES` subset from the API response
    - Upsert `{ key: 'exchange_rates_cache', value: JSON.stringify({ rates, fetchedAt }) }` into `site_settings`
    - _Requirements: 2.3, 2.4_

  - [x] 1.4 Implement error handling and fallback logic in `getExchangeRates()`
    - If `EXCHANGE_RATE_API_KEY` is not set: log a warning and return `FALLBACK_RATES`
    - If Supabase cache query fails: proceed to API fetch and log the error
    - If API fetch fails: return stale cache if available, else return `FALLBACK_RATES`
    - If API response is missing a supported currency: fill missing keys from `FALLBACK_RATES`
    - If cache upsert fails: log the error but still return the freshly fetched rates
    - _Requirements: 2.5, 3.2, 8.3_

  - [ ]* 1.5 Write property test for `getExchangeRates()` — Property 3: cache TTL (fresh)
    - **Property 3: Cache TTL — rates are fresh when cache is young**
    - Generate: timestamp within `[now - 23h59m, now]`; assert `getExchangeRates()` returns cached rates and the mock HTTP client is never called
    - Tag: `// Feature: geo-currency, Property 3: Cache TTL (fresh)`
    - Place in `src/__tests__/property/geo-currency.property.test.ts`
    - **Validates: Requirements 2.2**

  - [ ]* 1.6 Write property test for `getExchangeRates()` — Property 4: cache TTL (stale)
    - **Property 4: Cache TTL — stale cache triggers refresh**
    - Generate: timestamp within `[epoch, now - 24h]`; assert `getExchangeRates()` calls the mock HTTP client exactly once
    - Tag: `// Feature: geo-currency, Property 4: Cache TTL (stale)`
    - **Validates: Requirements 2.3**

  - [ ]* 1.7 Write property test for `getExchangeRates()` — Property 5: returned rates completeness
    - **Property 5: Returned rates always contain all supported currencies**
    - Generate: one of three scenarios (cache hit, API success, API failure with no cache)
    - Assert: result contains all 10 `SUPPORTED_CURRENCIES` keys with numeric values
    - Tag: `// Feature: geo-currency, Property 5: Returned rates completeness`
    - **Validates: Requirements 2.6, 3.1**

- [x] 2. Implement `detectCurrency` helper — inline in public layout
  - [x] 2.1 Define `COUNTRY_CURRENCY_MAP` and `detectCurrency` function
    - Add the static `COUNTRY_CURRENCY_MAP` constant covering all 17 country-to-currency mappings from Requirement 1.2
    - Implement `detectCurrency(countryCode: string | null): string` — returns the mapped currency or `'USD'` for unknown/null inputs
    - Co-locate both in `src/app/(public)/layout.tsx` (not a separate file)
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 2.2 Write property test for `detectCurrency` — Property 1: CountryCurrencyMap completeness
    - **Property 1: CountryCurrencyMap completeness**
    - Generate: random key from `Object.keys(COUNTRY_CURRENCY_MAP)`; assert `detectCurrency(key) === COUNTRY_CURRENCY_MAP[key]`
    - Tag: `// Feature: geo-currency, Property 1: CountryCurrencyMap completeness`
    - Place in `src/__tests__/property/geo-currency.property.test.ts`
    - **Validates: Requirements 1.2**

  - [ ]* 2.3 Write property test for `detectCurrency` — Property 2: unknown country defaults to USD
    - **Property 2: Unknown country defaults to USD**
    - Generate: arbitrary string not in `COUNTRY_CURRENCY_MAP` (including empty string, numbers-as-strings, Unicode, `null`)
    - Assert: `detectCurrency(input) === 'USD'`
    - Tag: `// Feature: geo-currency, Property 2: Unknown country defaults to USD`
    - **Validates: Requirements 1.3**

- [x] 3. Create `CurrencyProvider` and `useCurrency` — `src/lib/currency-context.tsx`
  - [x] 3.1 Define `CurrencyContextValue` interface and create the context
    - Export `CurrencyContextValue` with `currency`, `rate`, `rates`, `setCurrency`, and `formatPrice`
    - Create the React context with `createContext`
    - Export `useCurrency()` hook that throws if used outside the provider
    - _Requirements: 4.2_

  - [x] 3.2 Implement `CurrencyProvider` with priority resolution and `mounted` guard
    - Accept `detectedCurrency: string` and `rates: Record<string, number>` as props
    - On mount, resolve initial currency: `localStorage.kdc_currency` (if valid `SupportedCurrency`) → `detectedCurrency` → `'USD'`
    - Wrap `localStorage` access in a try/catch to handle SSR and private browsing
    - Use a `mounted` state guard so price-displaying elements render a placeholder until hydrated
    - _Requirements: 4.1, 4.3, 4.6, 7.1, 7.2_

  - [x] 3.3 Implement `setCurrency` and `formatPrice`
    - `setCurrency(code)`: update state and write `localStorage.setItem('kdc_currency', code)`
    - `formatPrice(usdPrice)`: use `Intl.NumberFormat` with `style: 'currency'` and the active currency; multiply by `rates[activeCurrency] ?? 1`
    - Guard against `rate === 0` or `NaN` with `|| 1`
    - _Requirements: 4.5, 5.2, 6.4_

  - [ ]* 3.4 Write property test for `CurrencyProvider` — Property 6: currency priority resolution
    - **Property 6: Currency priority resolution**
    - Generate: `(localStorageValue: string | null, detectedCurrency: string)`; assert resolved currency follows the documented priority order
    - Tag: `// Feature: geo-currency, Property 6: Currency priority resolution`
    - **Validates: Requirements 4.3**

  - [ ]* 3.5 Write property test for `CurrencyProvider` — Property 7: setCurrency round-trip
    - **Property 7: setCurrency round-trip**
    - Generate: random element from `SUPPORTED_CURRENCIES`; after `setCurrency(code)`, assert `context.currency === code` and `localStorage.getItem('kdc_currency') === code`
    - Tag: `// Feature: geo-currency, Property 7: setCurrency round-trip`
    - **Validates: Requirements 4.5**

  - [ ]* 3.6 Write property test for `CurrencyProvider` — Property 8: price conversion correctness
    - **Property 8: Price conversion correctness**
    - Generate: `(usdPrice: number ≥ 0, currency: SupportedCurrency)`; assert `formatPrice(usdPrice)` output contains the numeric value `usdPrice * rates[currency]` formatted correctly via `Intl.NumberFormat`
    - Tag: `// Feature: geo-currency, Property 8: Price conversion correctness`
    - **Validates: Requirements 5.2, 6.4**

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update `PublicLayout` to wire geo-detection and `CurrencyProvider`
  - [x] 5.1 Convert `src/app/(public)/layout.tsx` to an `async` Server Component
    - Add `import { headers } from 'next/headers'`
    - Add `import { getExchangeRates } from '@/lib/services/exchange-rates'`
    - Add `import { CurrencyProvider } from '@/lib/currency-context'`
    - Make the function `async`, call `headers().get('x-vercel-ip-country')`, pass to `detectCurrency`, and `await getExchangeRates()`
    - Wrap children with `<CurrencyProvider detectedCurrency={detectedCurrency} rates={rates}>` inside the existing `<CartProvider>`
    - _Requirements: 1.1, 1.4, 4.4_

  - [ ]* 5.2 Write unit tests for the updated public layout
    - Test that `CurrencyProvider` receives the geo-detected currency when the header is present
    - Test that `CurrencyProvider` receives `'USD'` when the header is absent
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 6. Migrate `ProductCard` to use `CurrencyContext`
  - [x] 6.1 Remove hardcoded rate and replace with `useCurrency()`
    - Delete `const RATE = 3800` and the `priceUGX` / `regularUGX` variables
    - Add `const { formatPrice } = useCurrency()`
    - Replace `UGX {priceUGX.toLocaleString()}` with `{formatPrice(displayPrice)}` in both grid and list views
    - Replace the hardcoded `regularUGX` display with `{formatPrice(product.regular_price_usd || product.price_usd)}`
    - Apply `suppressHydrationWarning` to price-displaying `<span>` elements
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Write unit tests for `ProductCard` price rendering
    - Test that the component renders the formatted price from context (not a hardcoded UGX value)
    - Test that both sale price and regular price are shown in the active currency when a discount exists
    - Test that the component re-renders when `CurrencyContext` currency changes
    - _Requirements: 5.1, 5.4, 5.5_

- [x] 7. Migrate `CheckoutPage` to use `CurrencyContext`
  - [x] 7.1 Replace local currency state with `useCurrency()` context
    - Remove the static `CURRENCIES` array
    - Remove `const [currency, setCurrency] = useState('UGX')`
    - Add `const { currency, rate, rates, setCurrency } = useCurrency()`
    - Build the currency selector `<SelectItem>` list from `SUPPORTED_CURRENCIES` and the `rates` object from context
    - Replace `currentRate` lookups with `rate` from context
    - Call `setCurrency(value)` from context in the `onValueChange` handler (this persists to localStorage automatically)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.2 Write unit tests for `CheckoutPage` currency integration
    - Test that the initial currency comes from context (not hardcoded `'UGX'`)
    - Test that the currency selector is populated from `SUPPORTED_CURRENCIES`
    - Test that selecting a currency calls `setCurrency` from context
    - Test that order totals are computed using `rate` from context
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Add `EXCHANGE_RATE_API_KEY` to environment configuration
  - [x] 8.1 Update `src/lib/env.ts` to validate the server-side `EXCHANGE_RATE_API_KEY` variable
    - Add `EXCHANGE_RATE_API_KEY` to the server-side env schema (not `NEXT_PUBLIC_`)
    - Update `.env.example` with a placeholder entry for `EXCHANGE_RATE_API_KEY`
    - _Requirements: 8.1, 8.2_

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (already in the project) and belong in `src/__tests__/property/geo-currency.property.test.ts`
- The `'server-only'` import in `exchange-rates.ts` is enforced at build time — no runtime check needed
- The `mounted` guard in `CurrencyProvider` is the primary defence against hydration mismatches; `suppressHydrationWarning` is a secondary safety net on individual price elements
