/** Kampala coordinates for Kingdom Deliverance Centre (Kosovo–Lungujja area). */
export const KDC_KAMPALA_GEO = {
  latitude: 0.3136,
  longitude: 32.5825,
} as const

export interface ParsedPostalAddress {
  streetAddress?: string
  addressLocality: string
  addressRegion?: string
  postalCode?: string
  addressCountry: string
}

const DEFAULT_LOCALITY = 'Kampala'
const DEFAULT_REGION = 'Central Region'
const DEFAULT_COUNTRY = 'UG'
const DEFAULT_STREET = 'KDC Centre, Kosovo–Lungujja'

/**
 * Parse a free-text address from CMS/settings into Schema.org PostalAddress fields.
 */
export function parseChurchPostalAddress(raw?: string | null): ParsedPostalAddress {
  const text = raw?.trim()
  if (!text) {
    return {
      streetAddress: DEFAULT_STREET,
      addressLocality: DEFAULT_LOCALITY,
      addressRegion: DEFAULT_REGION,
      addressCountry: DEFAULT_COUNTRY,
    }
  }

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 1) {
    const parts = lines[0].split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      return {
        streetAddress: parts.slice(0, -1).join(', ') || DEFAULT_STREET,
        addressLocality: parts[parts.length - 1] || DEFAULT_LOCALITY,
        addressRegion: DEFAULT_REGION,
        addressCountry: DEFAULT_COUNTRY,
      }
    }
    return {
      streetAddress: lines[0],
      addressLocality: DEFAULT_LOCALITY,
      addressRegion: DEFAULT_REGION,
      addressCountry: DEFAULT_COUNTRY,
    }
  }

  const localityLine = lines[lines.length - 1]
  const streetLines = lines.slice(0, -1)

  return {
    streetAddress: streetLines.join(', ') || DEFAULT_STREET,
    addressLocality: localityLine.replace(/,?\s*Uganda$/i, '').trim() || DEFAULT_LOCALITY,
    addressRegion: DEFAULT_REGION,
    addressCountry: DEFAULT_COUNTRY,
  }
}
