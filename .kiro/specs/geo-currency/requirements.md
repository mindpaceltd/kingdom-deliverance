# Requirements Document

## Introduction

The geo-currency feature automatically detects a visitor's country from Vercel's geo headers and displays all product prices in the visitor's local currency. Exchange rates are fetched once per day from exchangerate-api.com and cached in the Supabase `site_settings` table to stay within the free-tier request limit. A React `CurrencyContext` propagates the detected currency and a `formatPrice` helper throughout the app. Users can still override the currency manually on the checkout page.

This feature replaces the current hardcoded UGX/3800-rate logic in `product-card.tsx` and the static `CURRENCIES` array in `checkout/page.tsx` with a single, consistent currency system.

## Glossary

- **CurrencyContext**: A React context that provides the active currency code, the USD exchange rate, and a `formatPrice` helper to all client components.
- **CurrencyProvider**: The React context provider component that wraps the public layout and initialises `CurrencyContext`.
- **ExchangeRateService**: The server-side module responsible for fetching rates from exchangerate-api.com and reading/writing the cache in Supabase.
- **GeoDetector**: The server-side logic (middleware or Server Component) that reads the `x-vercel-ip-country` header and maps it to a currency code.
- **CountryCurrencyMap**: The static mapping from ISO 3166-1 alpha-2 country codes to ISO 4217 currency codes used by the GeoDetector.
- **RateCache**: The JSON value stored in the `site_settings` table under the key `exchange_rates_cache`, containing rates and a timestamp.
- **DetectedCurrency**: The currency code resolved by the GeoDetector before the page renders, passed to the CurrencyProvider as an initial value.
- **formatPrice**: A utility function that formats a USD price into a localised string for a given currency code and exchange rate.
- **SupportedCurrency**: One of the ten explicitly supported currency codes: UGX, KES, TZS, RWF, NGN, GHS, ZAR, GBP, EUR, USD.

---

## Requirements

### Requirement 1: Country-to-Currency Detection

**User Story:** As a visitor from any supported country, I want prices shown in my local currency automatically, so that I can understand costs without manual conversion.

#### Acceptance Criteria

1. THE GeoDetector SHALL read the `x-vercel-ip-country` request header to determine the visitor's country code.
2. THE GeoDetector SHALL apply the CountryCurrencyMap: `UG→UGX`, `KE→KES`, `TZ→TZS`, `RW→RWF`, `NG→NGN`, `GH→GHS`, `ZA→ZAR`, `GB→GBP`, `US→USD`, `FR→EUR`, `DE→EUR`, `IT→EUR`, `ES→EUR`, `NL→EUR`, `BE→EUR`, `PT→EUR`, `AT→EUR`.
3. IF the country code is absent or not present in the CountryCurrencyMap, THEN THE GeoDetector SHALL default to `USD`.
4. THE GeoDetector SHALL pass the DetectedCurrency to the CurrencyProvider as the initial currency value before the first client render.

---

### Requirement 2: Exchange Rate Fetching and Caching

**User Story:** As a site operator, I want exchange rates fetched at most once per day, so that the free-tier API limit of 1,500 requests per month is not exceeded.

#### Acceptance Criteria

1. WHEN the ExchangeRateService is invoked, THE ExchangeRateService SHALL first query the `site_settings` table for a row with `key = 'exchange_rates_cache'`.
2. IF a valid RateCache exists and its timestamp is less than 24 hours old, THEN THE ExchangeRateService SHALL return the cached rates without calling the external API.
3. IF no valid RateCache exists or the cached timestamp is 24 hours or older, THEN THE ExchangeRateService SHALL fetch fresh rates from `https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD`.
4. WHEN fresh rates are fetched successfully, THE ExchangeRateService SHALL upsert the RateCache into `site_settings` with `key = 'exchange_rates_cache'` and a value containing the rates object and the current UTC timestamp.
5. IF the external API call fails, THEN THE ExchangeRateService SHALL return the most recently cached rates if available, or fall back to the hardcoded default rates defined in Requirement 3.
6. THE ExchangeRateService SHALL expose rates for all nine SupportedCurrency codes.

---

### Requirement 3: Hardcoded Fallback Rates

**User Story:** As a site operator, I want the site to display reasonable prices even when the exchange rate API is unreachable, so that the shop remains functional during outages.

#### Acceptance Criteria

1. THE ExchangeRateService SHALL define hardcoded fallback rates relative to USD: `UGX=3800`, `KES=130`, `TZS=2600`, `RWF=1250`, `NGN=1600`, `GHS=15`, `ZAR=18`, `GBP=0.79`, `EUR=0.92`, `USD=1`.
2. WHEN the external API is unavailable and no RateCache exists, THE ExchangeRateService SHALL use the hardcoded fallback rates.

---

### Requirement 4: CurrencyContext and CurrencyProvider

**User Story:** As a developer, I want a single CurrencyContext that all components can consume, so that currency state is consistent across the entire page without prop drilling.

#### Acceptance Criteria

1. THE CurrencyProvider SHALL accept a `defaultCurrency` prop (the DetectedCurrency) and use it as the initial currency state.
2. THE CurrencyContext SHALL expose: `currency` (string, ISO 4217 code), `rate` (number, USD multiplier), `setCurrency` (function to override the currency), and `formatPrice` (function that converts a USD price to the active currency and formats it as a localised string).
3. THE CurrencyProvider SHALL resolve the initial currency using this priority order: **(1) localStorage `kdc_currency` key** (user's previous manual selection) → **(2) DetectedCurrency** from the Vercel geo header → **(3) `USD`** as the final fallback.
4. THE CurrencyProvider SHALL be placed in the public layout so that all public pages share the same context instance.
5. WHEN `setCurrency` is called with a valid SupportedCurrency code, THE CurrencyContext SHALL update `currency` and `rate` to reflect the new selection AND persist the choice to `localStorage` under the key `kdc_currency`.
6. THE CurrencyProvider SHALL use the `suppressHydrationWarning` attribute or a mounted-state pattern on price-displaying elements to prevent React hydration errors caused by server/client currency differences.

---

### Requirement 5: Product Card Price Display

**User Story:** As a shopper, I want product prices on the shop listing page to appear in my detected local currency, so that I can compare prices without manual conversion.

#### Acceptance Criteria

1. THE ProductCard SHALL consume CurrencyContext to obtain `currency`, `rate`, and `formatPrice`.
2. WHEN rendering a product price, THE ProductCard SHALL multiply the USD price by `rate` and format it using `formatPrice`.
3. THE ProductCard SHALL remove the hardcoded `RATE = 3800` constant and the hardcoded `UGX` currency label.
4. WHEN a product has a sale price, THE ProductCard SHALL display both the sale price and the regular price in the active currency.
5. WHEN the CurrencyContext currency changes, THE ProductCard SHALL re-render with the updated price without a page reload.

---

### Requirement 6: Checkout Page Currency Integration

**User Story:** As a shopper, I want the checkout page to pre-select my detected currency, so that I do not have to manually change it before paying.

#### Acceptance Criteria

1. THE CheckoutPage SHALL read the initial currency from CurrencyContext (which already resolves localStorage → geo → USD priority) instead of defaulting to the hardcoded `'UGX'` string.
2. THE CheckoutPage SHALL populate its currency selector with all nine SupportedCurrency codes and their live rates from CurrencyContext.
3. WHEN a user selects a different currency in the checkout selector, THE CheckoutPage SHALL call `setCurrency` on CurrencyContext so that the change propagates to all other components.
4. THE CheckoutPage SHALL use the `rate` from CurrencyContext to compute converted subtotals, shipping costs, and order totals.
5. THE CheckoutPage SHALL continue to allow manual currency override by the user after the initial auto-selection.

---

### Requirement 7: No Hydration Errors

**User Story:** As a developer, I want the currency feature to render without React hydration mismatches, so that the app does not produce console errors or broken UI on first load.

#### Acceptance Criteria

1. THE CurrencyProvider SHALL pass the server-resolved DetectedCurrency as the initial value so that the server-rendered HTML and the first client render agree on the currency.
2. WHEN a price element cannot be guaranteed to match between server and client render, THE System SHALL apply `suppressHydrationWarning` to that element or use a `mounted` state guard that renders a placeholder until the client is hydrated.
3. THE System SHALL not use `Math.random()`, `Date.now()`, or other non-deterministic values during the initial server render of price elements.

---

### Requirement 8: API Key Security

**User Story:** As a site operator, I want the exchange rate API key stored as an environment variable, so that it is not exposed in client-side code or version control.

#### Acceptance Criteria

1. THE ExchangeRateService SHALL read the API key exclusively from the `EXCHANGE_RATE_API_KEY` server-side environment variable.
2. THE ExchangeRateService SHALL only be called from server-side code (Server Components, Route Handlers, or middleware).
3. IF the `EXCHANGE_RATE_API_KEY` environment variable is not set, THEN THE ExchangeRateService SHALL log a warning and use the hardcoded fallback rates defined in Requirement 3.
