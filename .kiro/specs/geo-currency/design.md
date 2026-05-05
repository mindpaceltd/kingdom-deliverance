# Design Document: geo-currency

## Overview

The geo-currency feature replaces the hardcoded `RATE = 3800` / `UGX` logic scattered across `product-card.tsx` and `checkout/page.tsx` with a unified, server-driven currency system. On every public page load, a server component reads the `x-vercel-ip-country` header, maps it to an ISO 4217 currency code, and passes that code as a prop to a client-side `CurrencyProvider`. The provider resolves the final currency using a three-level priority (localStorage override → geo-detected → USD fallback) and exposes `currency`, `rate`, `setCurrency`, and `formatPrice` via React context to all public components.

Exchange rates are fetched from [exchangerate-api.com](https://www.exchangerate-api.com/) at most once per 24 hours and cached as JSON in the existing `site_settings` Supabase table. This keeps the feature within the free-tier limit of 1,500 requests/month while ensuring prices stay reasonably current.

### Key Design Decisions

1. **Server-only exchange rate module** — `ExchangeRateService` is marked `'server-only'` so it can never be bundled into the client, keeping the API key out of the browser.
2. **Supabase `site_settings` as cache store** — reuses the existing key-value table rather than introducing a new table or Redis dependency.
3. **Public layout as the geo-detection boundary** — `src/app/(public)/layout.tsx` is already a Server Component and wraps all public pages, making it the natural place to read headers and initialise the provider.
4. **localStorage priority over geo** — a user who manually selects a currency on checkout should not have their choice overridden on the next page load.
5. **`suppressHydrationWarning` + `mounted` guard** — the server renders with the geo-detected currency; the client may immediately switch to a localStorage value. Price elements use `suppressHydrationWarning` to silence the expected one-render mismatch.

---

## Architecture

```mermaid
flowchart TD
    subgraph Server["Server (Next.js RSC)"]
        A[Public Layout RSC\nsrc/app/(public)/layout.tsx] -->|reads x-vercel-ip-country header| B[GeoDetector\ninline in layout]
        B -->|country code| C[CountryCurrencyMap\nstatic lookup]
        C -->|detectedCurrency| D[ExchangeRateService\nsrc/lib/services/exchange-rates.ts]
        D -->|query cache| E[(Supabase\nsite_settings)]
        E -->|cache hit < 24h| D
        D -->|cache miss / stale| F[exchangerate-api.com]
        F -->|fresh rates| D
        D -->|upsert cache| E
        D -->|rates object| A
    end

    subgraph Client["Client (React)"]
        A -->|detectedCurrency + rates prop| G[CurrencyProvider\nsrc/lib/currency-context.tsx]
        G -->|reads kdc_currency| H[(localStorage)]
        G -->|currency, rate, setCurrency, formatPrice| I[CurrencyContext]
        I --> J[ProductCard]
        I --> K[CheckoutPage]
        K -->|setCurrency → writes kdc_currency| H
    end
```

### Data Flow Summary

1. Request arrives → public layout RSC reads `x-vercel-ip-country`.
2. `GeoDetector` maps country → currency code (`detectedCurrency`).
3. `ExchangeRateService` returns a `Record<string, number>` of rates (from cache or API).
4. Layout renders `<CurrencyProvider detectedCurrency={...} rates={...}>`.
5. On the client, `CurrencyProvider` checks `localStorage.kdc_currency` first; if present and valid, it wins.
6. All child components consume `useCurrency()` for prices.
7. When the user changes currency on checkout, `setCurrency` updates context state and writes to `localStorage`.

---

## Components and Interfaces

### 1. `ExchangeRateService` — `src/lib/services/exchange-rates.ts`

Server-only module. Marked with `import 'server-only'` at the top.

```typescript
// Public API
export async function getExchangeRates(): Promise<Record<string, number>>

// Internal types
interface RateCache {
  rates: Record<string, number>
  fetchedAt: string // ISO 8601 UTC timestamp
}

// Constants
export const SUPPORTED_CURRENCIES = [
  'UGX', 'KES', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR', 'GBP', 'EUR', 'USD'
] as const

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]

export const FALLBACK_RATES: Record<string, number> = {
  UGX: 3800, KES: 130, TZS: 2600, RWF: 1250,
  NGN: 1600, GHS: 15, ZAR: 18, GBP: 0.79, EUR: 0.92, USD: 1,
}
```

**Logic:**
1. Query `site_settings` for `key = 'exchange_rates_cache'`.
2. Parse the JSON value as `RateCache`. If `fetchedAt` is within 24 hours, return `rates`.
3. Otherwise, `fetch` from `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`.
4. Extract only the `SUPPORTED_CURRENCIES` subset from the API response.
5. Upsert `{ key: 'exchange_rates_cache', value: JSON.stringify({ rates, fetchedAt }) }` into `site_settings`.
6. On any error: return stale cache if available, else `FALLBACK_RATES`.

### 2. `GeoDetector` — inline in public layout

Not a separate file; a small pure function co-located in the layout:

```typescript
// src/app/(public)/layout.tsx (server component)
import { headers } from 'next/headers'

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  UG: 'UGX', KE: 'KES', TZ: 'TZS', RW: 'RWF',
  NG: 'NGN', GH: 'GHS', ZA: 'ZAR', GB: 'GBP', US: 'USD',
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', PT: 'EUR', AT: 'EUR',
}

function detectCurrency(countryCode: string | null): string {
  if (!countryCode) return 'USD'
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? 'USD'
}
```

The layout calls `headers().get('x-vercel-ip-country')` and passes the result to `detectCurrency`.

### 3. `CurrencyContext` — `src/lib/currency-context.tsx`

Client component (`'use client'`).

```typescript
interface CurrencyContextValue {
  currency: string                          // ISO 4217 code
  rate: number                              // USD multiplier
  rates: Record<string, number>             // full rates map
  setCurrency: (code: string) => void       // persists to localStorage
  formatPrice: (usdPrice: number) => string // formats in active currency
}

// Provider props
interface CurrencyProviderProps {
  children: React.ReactNode
  detectedCurrency: string          // from server geo-detection
  rates: Record<string, number>     // from ExchangeRateService
}

export function CurrencyProvider({ children, detectedCurrency, rates }: CurrencyProviderProps)
export function useCurrency(): CurrencyContextValue
```

**Priority resolution (runs once on mount):**
```
localStorage.getItem('kdc_currency') → if valid SupportedCurrency → use it
else detectedCurrency                → if non-empty string         → use it
else 'USD'
```

**`setCurrency` implementation:**
```typescript
const setCurrency = (code: string) => {
  setActiveCurrency(code)
  localStorage.setItem('kdc_currency', code)
}
```

**`formatPrice` implementation:**
```typescript
const formatPrice = (usdPrice: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: activeCurrency })
    .format(usdPrice * (rates[activeCurrency] ?? 1))
```

### 4. Updated `PublicLayout` — `src/app/(public)/layout.tsx`

Converted to an `async` Server Component:

```typescript
import { headers } from 'next/headers'
import { getExchangeRates } from '@/lib/services/exchange-rates'
import { CurrencyProvider } from '@/lib/currency-context'

export default async function PublicLayout({ children }) {
  const countryCode = headers().get('x-vercel-ip-country')
  const detectedCurrency = detectCurrency(countryCode)
  const rates = await getExchangeRates()

  return (
    <CartProvider>
      <CurrencyProvider detectedCurrency={detectedCurrency} rates={rates}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </CurrencyProvider>
    </CartProvider>
  )
}
```

### 5. Updated `ProductCard` — `src/components/shop/product-card.tsx`

- Remove `const RATE = 3800` and all hardcoded `UGX` strings.
- Add `const { formatPrice } = useCurrency()`.
- Replace `UGX ${priceUGX.toLocaleString()}` with `{formatPrice(displayPrice)}`.

### 6. Updated `CheckoutPage` — `src/app/(public)/checkout/page.tsx`

- Remove the static `CURRENCIES` array.
- Replace `const [currency, setCurrency] = useState('UGX')` with `const { currency, rate, rates, setCurrency } = useCurrency()`.
- Build the currency selector from `SUPPORTED_CURRENCIES` and the `rates` object from context.
- Replace `currentRate` lookups with `rate` from context.
- Call `setCurrency(value)` from context when the user changes the selector (this persists to localStorage automatically).

---

## Data Models

### `RateCache` (stored in `site_settings.value` as JSON)

```typescript
interface RateCache {
  rates: Record<string, number>  // e.g. { UGX: 3812.5, KES: 131.2, ... }
  fetchedAt: string              // ISO 8601 UTC, e.g. "2025-01-15T10:30:00.000Z"
}
```

Stored as:
```sql
-- site_settings row
key   = 'exchange_rates_cache'
value = '{"rates":{"UGX":3812,"KES":131,...},"fetchedAt":"2025-01-15T10:30:00.000Z"}'
```

### `CountryCurrencyMap` (static, compile-time constant)

```typescript
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // East Africa
  UG: 'UGX', KE: 'KES', TZ: 'TZS', RW: 'RWF',
  // West Africa
  NG: 'NGN', GH: 'GHS',
  // Southern Africa
  ZA: 'ZAR',
  // English-speaking
  GB: 'GBP', US: 'USD',
  // Eurozone
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', PT: 'EUR', AT: 'EUR',
}
```

### `SupportedCurrency` (union type)

```typescript
export const SUPPORTED_CURRENCIES = [
  'UGX', 'KES', 'TZS', 'RWF', 'NGN', 'GHS', 'ZAR', 'GBP', 'EUR', 'USD'
] as const
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]
```

### Environment Variables

| Variable | Side | Description |
|---|---|---|
| `EXCHANGE_RATE_API_KEY` | Server-only | API key for exchangerate-api.com |
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Supabase project URL (existing) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both | Supabase anon key (existing) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CountryCurrencyMap completeness

*For any* country code present in the `CountryCurrencyMap`, `detectCurrency(code)` SHALL return the corresponding ISO 4217 currency code defined in the map.

**Validates: Requirements 1.2**

### Property 2: Unknown country defaults to USD

*For any* string that is not a key in the `CountryCurrencyMap` (including `null`, empty string, or arbitrary unknown codes), `detectCurrency(input)` SHALL return `'USD'`.

**Validates: Requirements 1.3**

> **Property Reflection:** Properties 1 and 2 together cover the full input space of `detectCurrency`. They are not redundant — Property 1 covers the "known code" path and Property 2 covers the "unknown/absent" path. Both are needed.

### Property 3: Cache TTL — rates are fresh when cache is young

*For any* `RateCache` whose `fetchedAt` timestamp is strictly less than 24 hours before the current time, `getExchangeRates()` SHALL return the cached rates and SHALL NOT make an outbound HTTP request to the exchange rate API.

**Validates: Requirements 2.2**

### Property 4: Cache TTL — stale cache triggers refresh

*For any* `RateCache` whose `fetchedAt` timestamp is 24 hours or more before the current time, `getExchangeRates()` SHALL call the external API to fetch fresh rates.

**Validates: Requirements 2.3**

> **Property Reflection:** Properties 3 and 4 are complementary halves of the same TTL invariant. They cannot be merged because they assert opposite behaviors (no API call vs. API call). Both are necessary.

### Property 5: Returned rates always contain all supported currencies

*For any* execution path through `getExchangeRates()` — whether the result comes from a cache hit, a fresh API fetch, or the hardcoded fallback — the returned `Record<string, number>` SHALL contain a numeric entry for every code in `SUPPORTED_CURRENCIES` (`UGX`, `KES`, `TZS`, `RWF`, `NGN`, `GHS`, `ZAR`, `GBP`, `EUR`, `USD`).

**Validates: Requirements 2.6, 3.1**

### Property 6: Currency priority resolution

*For any* combination of `(localStorageValue, detectedCurrency)` passed to `CurrencyProvider`, the resolved initial currency SHALL follow the priority order: if `localStorageValue` is a valid `SupportedCurrency`, use it; else if `detectedCurrency` is non-empty, use it; else use `'USD'`.

**Validates: Requirements 4.3**

### Property 7: setCurrency round-trip

*For any* valid `SupportedCurrency` code `c`, after calling `setCurrency(c)`, the `CurrencyContext` value of `currency` SHALL equal `c` AND `localStorage.getItem('kdc_currency')` SHALL equal `c`.

**Validates: Requirements 4.5**

### Property 8: Price conversion correctness

*For any* USD price `p` and any active exchange rate `r`, `formatPrice(p)` SHALL produce a string that represents the numeric value `p * r` formatted in the active currency using `Intl.NumberFormat`.

**Validates: Requirements 5.2, 6.4**

> **Property Reflection:** Properties 6 and 7 are distinct — Property 6 tests the *initial* resolution logic (a pure function of inputs), while Property 7 tests the *mutation* path (setCurrency side effects). Property 8 is independent of both. No redundancy found.

---

## Error Handling

### ExchangeRateService

| Scenario | Behaviour |
|---|---|
| API key not set (`EXCHANGE_RATE_API_KEY` missing) | Log warning, return `FALLBACK_RATES` |
| Supabase cache query fails | Proceed to API fetch; log error |
| API fetch fails (network error, 4xx, 5xx) | Return stale cache if available; else return `FALLBACK_RATES` |
| API response missing a supported currency | Fill missing keys from `FALLBACK_RATES` |
| Cache upsert fails | Log error; still return the freshly fetched rates to the caller |

### GeoDetector

| Scenario | Behaviour |
|---|---|
| `x-vercel-ip-country` header absent | Default to `'USD'` |
| Header value not in `CountryCurrencyMap` | Default to `'USD'` |

### CurrencyProvider

| Scenario | Behaviour |
|---|---|
| `localStorage` unavailable (SSR, private browsing) | Catch the access error; fall through to `detectedCurrency` |
| `localStorage.kdc_currency` contains an invalid code | Treat as absent; fall through to `detectedCurrency` |
| `rates` prop missing a key for the active currency | Fall back to rate `1` (treat as USD-equivalent) |

### Checkout Page

| Scenario | Behaviour |
|---|---|
| Context `rate` is `0` or `NaN` | Guard with `|| 1` before multiplication |
| User selects a currency not in `rates` | Disable the option or show a warning |

---

## Testing Strategy

### Unit Tests

Focus on pure functions and isolated component behaviour with concrete examples:

- `detectCurrency(code)` — all 17 mapped country codes, plus unknown codes and `null`
- `FALLBACK_RATES` — verify exact values for all 10 currencies
- `ExchangeRateService` — cache hit path, cache miss path, API failure with stale cache, API failure with no cache, missing API key
- `CurrencyProvider` — initial priority resolution (localStorage wins, geo wins, USD fallback), `setCurrency` updates state and localStorage
- `ProductCard` — renders correct price when context changes
- `CheckoutPage` — initial currency from context, `setCurrency` called on selector change, totals computed from context rate

### Property-Based Tests

This feature is well-suited for property-based testing because it contains several pure functions whose correctness must hold across a wide input space. The recommended library is **[fast-check](https://fast-check.dev/)** (TypeScript-native, works with Jest/Vitest).

Each property test must run a minimum of **100 iterations**.

Tag format: `// Feature: geo-currency, Property N: <property text>`

**Property 1 — CountryCurrencyMap completeness**
Generate: random key from `Object.keys(COUNTRY_CURRENCY_MAP)`
Assert: `detectCurrency(key) === COUNTRY_CURRENCY_MAP[key]`

**Property 2 — Unknown country defaults to USD**
Generate: arbitrary string not in `COUNTRY_CURRENCY_MAP` (including empty string, numbers-as-strings, Unicode)
Assert: `detectCurrency(input) === 'USD'`

**Property 3 — Cache TTL (fresh)**
Generate: timestamp within `[now - 23h59m, now]`
Assert: `getExchangeRates()` returns cached rates; mock HTTP client is never called

**Property 4 — Cache TTL (stale)**
Generate: timestamp within `[epoch, now - 24h]`
Assert: `getExchangeRates()` calls the mock HTTP client exactly once

**Property 5 — Returned rates completeness**
Generate: one of three scenarios (cache hit, API success, API failure)
Assert: result contains all 10 `SUPPORTED_CURRENCIES` keys with numeric values

**Property 6 — Currency priority resolution**
Generate: `(localStorageValue: string | null, detectedCurrency: string)`
Assert: resolved currency follows the documented priority order

**Property 7 — setCurrency round-trip**
Generate: random element from `SUPPORTED_CURRENCIES`
Assert: after `setCurrency(code)`, `context.currency === code` and `localStorage.getItem('kdc_currency') === code`

**Property 8 — Price conversion correctness**
Generate: `(usdPrice: number ≥ 0, currency: SupportedCurrency)`
Assert: `formatPrice(usdPrice)` output contains the numeric value `usdPrice * rates[currency]` formatted correctly

### Integration Tests

- Public layout renders with `CurrencyProvider` receiving the geo-detected currency
- `getExchangeRates()` reads from and writes to the real Supabase `site_settings` table (use a test project or a seeded local Supabase instance)
- End-to-end: visiting `/shop` with a mocked `x-vercel-ip-country: KE` header shows prices in KES

### What Is Not Property-Tested

- Hydration behaviour (`suppressHydrationWarning`) — verified by code review and snapshot tests
- `server-only` import guard — verified by build-time bundler check
- Supabase upsert side effects — verified by integration tests with 1-2 examples
