# Full-site SEO release — 14 October 2026

Deployed to https://kdcuganda.org. This is a technical SEO audit, not a Google ranking or Lighthouse score.

- All 489 sitemap URLs passed all 16 automated checks: successful response, title, description, canonical, Open Graph title/description/image/URL, Twitter card/image, one H1, image alt attributes, language, viewport, indexability and valid JSON-LD.
- No duplicate titles or descriptions in the sitemap crawl.
- All 430 unique social-preview images returned a successful image response.
- HTTP and www now permanently redirect to HTTPS on kdcuganda.org, preserving paths and query parameters.
- Shop, Blog and Sermons pagination now has separate canonical URLs and page titles. Search/filter combinations use noindex and a clean collection canonical.
- Admin, account access, cart and checkout noindex metadata verified live.
- Sitemap excludes deleted records, includes the recurring Fire Service, preserves past published event URLs, and omits invented modification dates.
- Church schema uses the supplied logo and weekly Sunday/Wednesday hours. Monthly Fire Service is described by its actual Event date. Unverified coordinate, founding-date and placeholder phone fallbacks removed.
- Approved factual replacements published for Home, About, FAQ and five older articles. All ten published blog articles now have a stored SEO score of 100; the five rewritten articles were validated with the actual scorer before publication.
- 24 SEO regression tests, targeted lint and production build passed. Live smoke checks passed with a rollback backup retained.

The audit checks technical implementation. Search rankings, Google indexing, Core Web Vitals, and rich-result eligibility are not guaranteed by these checks. Search Console verification/submission was not performed in this release.

Reference: [Google Search developer guidance](https://developers.google.com/search/docs/fundamentals/get-started-developers).
