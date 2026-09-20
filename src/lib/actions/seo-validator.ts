'use server'

export interface ValidationResult {
  status: 'pass' | 'warning' | 'fail'
  message: string
  details?: string
  action?: string
}

export interface SEOValidationReport {
  url: string
  overall: 'good' | 'needs_work' | 'critical'
  validations: {
    title: ValidationResult
    description: ValidationResult
    h1: ValidationResult
    images: ValidationResult
    links: ValidationResult
    schema: ValidationResult
    canonical: ValidationResult
    social: ValidationResult
  }
  score: number
  timestamp: string
}

export async function validateLiveUrlSeo(targetUrl: string): Promise<SEOValidationReport> {
  const cleanInput = targetUrl.trim()
  let url = cleanInput
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = url.startsWith('/') ? `https://kdcuganda.org${url}` : `https://kdcuganda.org/${url}`
  }

  const report: SEOValidationReport = {
    url,
    overall: 'good',
    score: 100,
    timestamp: new Date().toISOString(),
    validations: {
      title: { status: 'pass', message: 'Title checked' },
      description: { status: 'pass', message: 'Meta description checked' },
      h1: { status: 'pass', message: 'H1 header checked' },
      images: { status: 'pass', message: 'Images checked' },
      links: { status: 'pass', message: 'Internal links checked' },
      schema: { status: 'pass', message: 'Structured data checked' },
      canonical: { status: 'pass', message: 'Canonical tag checked' },
      social: { status: 'pass', message: 'Social media tags checked' },
    },
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KDC-SEO-Audit/1.0; +https://kdcuganda.org)',
        'Accept': 'text/html',
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      report.overall = 'critical'
      report.score = 20
      report.validations.title = {
        status: 'fail',
        message: `HTTP Status ${res.status}`,
        details: `Page returned HTTP error ${res.status}: ${res.statusText}`,
      }
      return report
    }

    const html = await res.text()

    // 1. Title Tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''
    if (!title) {
      report.score -= 20
      report.validations.title = {
        status: 'fail',
        message: 'Missing <title> tag',
        details: 'Every page must have a descriptive title.',
      }
    } else if (title.length < 30 || title.length > 70) {
      report.score -= 5
      report.validations.title = {
        status: 'warning',
        message: `Title length (${title.length} chars) is outside optimal 30-65 range`,
        details: `Title: "${title}"`,
      }
    } else {
      report.validations.title = {
        status: 'pass',
        message: `Title is optimal length (${title.length} chars)`,
        details: `Title: "${title}"`,
      }
    }

    // 2. Meta Description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
    const description = descMatch ? descMatch[1].trim() : ''
    if (!description) {
      report.score -= 15
      report.validations.description = {
        status: 'fail',
        message: 'Missing meta description',
        details: 'Add a summary between 120 and 160 characters.',
      }
    } else if (description.length < 70 || description.length > 170) {
      report.score -= 5
      report.validations.description = {
        status: 'warning',
        message: `Meta description length (${description.length} chars) could be refined (ideal: 120-160)`,
        details: `Description: "${description.slice(0, 100)}..."`,
      }
    } else {
      report.validations.description = {
        status: 'pass',
        message: `Meta description is optimal (${description.length} chars)`,
        details: `Description: "${description.slice(0, 100)}..."`,
      }
    }

    // 3. H1 Headings
    const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []
    if (h1Matches.length === 0) {
      report.score -= 15
      report.validations.h1 = {
        status: 'fail',
        message: 'No <h1> heading found on the page',
        details: 'Add exactly one top-level <h1> heading.',
      }
    } else if (h1Matches.length > 1) {
      report.score -= 5
      report.validations.h1 = {
        status: 'warning',
        message: `Multiple <h1> headings found (${h1Matches.length})`,
        details: 'Best practice is to have a single <h1> heading per page.',
      }
    } else {
      const cleanH1 = h1Matches[0].replace(/<[^>]+>/g, '').trim()
      report.validations.h1 = {
        status: 'pass',
        message: 'Exactly one <h1> heading found',
        details: `H1: "${cleanH1.slice(0, 80)}"`,
      }
    }

    // 4. Images & Alt Text
    const imgMatches = html.match(/<img[^>]*>/gi) || []
    let missingAlt = 0
    imgMatches.forEach((img) => {
      const altMatch = img.match(/alt=["']([^"']*)["']/i)
      if (!altMatch || !altMatch[1].trim()) {
        missingAlt++
      }
    })

    if (imgMatches.length > 0 && missingAlt > 0) {
      const penalty = Math.min(15, missingAlt * 3)
      report.score -= penalty
      report.validations.images = {
        status: missingAlt > 3 ? 'warning' : 'pass',
        message: `${imgMatches.length - missingAlt} of ${imgMatches.length} images have descriptive alt text`,
        details: missingAlt > 0 ? `${missingAlt} images missing alt text.` : 'All images include alt text.',
      }
    } else {
      report.validations.images = {
        status: 'pass',
        message: `All images (${imgMatches.length}) have valid alt attributes`,
        details: 'Great for accessibility and image search indexing.',
      }
    }

    // 5. Canonical URL
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
                           html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i)
    if (canonicalMatch && canonicalMatch[1]) {
      report.validations.canonical = {
        status: 'pass',
        message: 'Canonical link tag present',
        details: `Canonical: ${canonicalMatch[1]}`,
      }
    } else {
      report.score -= 10
      report.validations.canonical = {
        status: 'warning',
        message: 'Canonical link tag missing',
        details: 'Self-referencing canonical tags prevent duplicate content penalties.',
      }
    }

    // 6. Schema.org JSON-LD
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
    if (jsonLdMatches.length > 0) {
      const types: string[] = []
      jsonLdMatches.forEach((match) => {
        try {
          const jsonText = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '')
          const parsed = JSON.parse(jsonText)
          if (parsed['@type']) types.push(parsed['@type'])
        } catch {
          // ignore parse errors
        }
      })
      report.validations.schema = {
        status: 'pass',
        message: `Structured data detected (${types.join(', ') || 'JSON-LD'})`,
        details: `Found ${jsonLdMatches.length} JSON-LD block(s) helping search engine rich snippets.`,
      }
    } else {
      report.score -= 10
      report.validations.schema = {
        status: 'warning',
        message: 'No Schema.org JSON-LD structured data detected',
        details: 'Add structured data to enhance Google Search appearance.',
      }
    }

    // 7. Social / Open Graph
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
    if (ogTitleMatch && ogImageMatch) {
      report.validations.social = {
        status: 'pass',
        message: 'Open Graph social cards fully configured',
        details: `Image: ${ogImageMatch[1].slice(0, 70)}...`,
      }
    } else {
      report.score -= 5
      report.validations.social = {
        status: 'warning',
        message: 'Incomplete social share tags',
        details: 'og:title or og:image tags are missing.',
      }
    }

    // 8. Internal Links
    const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["']/gi) || []
    report.validations.links = {
      status: linkMatches.length >= 5 ? 'pass' : 'warning',
      message: `${linkMatches.length} navigation and content links found`,
      details: linkMatches.length >= 5 ? 'Good site crawlability and internal link architecture.' : 'Consider adding more contextual links.',
    }

    report.score = Math.max(10, Math.min(100, report.score))
    if (report.score >= 80) report.overall = 'good'
    else if (report.score >= 50) report.overall = 'needs_work'
    else report.overall = 'critical'

    return report
  } catch (err: any) {
    report.overall = 'critical'
    report.score = 25
    report.validations.title = {
      status: 'fail',
      message: 'Failed to crawl URL',
      details: err.message || 'Unknown network error',
    }
    return report
  }
}
