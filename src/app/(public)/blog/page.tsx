import Link from 'next/link'
import { ArrowRight, BookOpen, Search, Clock, Send } from 'lucide-react'
import type { Metadata } from 'next'
import { getBlogHeroUrl } from '@/lib/seo/page-hero'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'
import { pageKeywords } from '@/lib/seo/brand-keywords'
import { BLOG_CATEGORIES, buildBlogHref, categoryLabel } from '@/lib/blog/catalog'
import {
  getBlogCategoryCounts,
  getBlogPosts,
  getBlogTagsWithCounts,
  getPopularBlogPosts,
  POSTS_PER_PAGE,
} from '@/lib/blog/queries'
import { BlogPostImage } from '@/components/blog/blog-post-image'
import { formatSafeDate } from '@/lib/media-url'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: 'Blog & News',
    description:
      'Faith-building teachings, ministry updates, and news from Kingdom Deliverance Centre Uganda — Bishop Climate Wiseman and the KDC leadership team.',
    path: '/blog',
    keywords: pageKeywords('blog'),
    ogType: 'blog',
  })
}

export const revalidate = 3600

function readTime(html: string | null): string {
  if (!html) return '1 min read'
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  const mins = Math.max(1, Math.round(words / 200))
  return `${mins} min read`
}

interface Props {
  searchParams: { page?: string; q?: string; category?: string; tag?: string; type?: string }
}

export default async function BlogPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const query = searchParams.q?.trim() ?? ''
  const category = searchParams.category ?? searchParams.type ?? ''

  const [{ posts, total }, categoryCounts, popular, tagCounts] = await Promise.all([
    getBlogPosts({ page, q: query || undefined, category: category || undefined, tag: searchParams.tag }),
    getBlogCategoryCounts(),
    getPopularBlogPosts(5),
    getBlogTagsWithCounts(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))
  const isDefaultView = !query && !category && !searchParams.tag && page === 1
  const featured = isDefaultView ? posts[0] : null
  const grid = isDefaultView ? posts.slice(1) : posts

  const categories = BLOG_CATEGORIES.map((cat) => ({
    ...cat,
    count: categoryCounts[cat.value] ?? 0,
  }))

  const heroUrl = await getBlogHeroUrl(featured?.featured_image)
  const activeTag = searchParams.tag

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <section className="relative flex min-h-[320px] items-center overflow-hidden py-24 md:h-[450px] md:py-0">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroUrl}')` }}
          role="img"
          aria-label="Blog hero background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b3e]/90 via-[#0d1b3e]/75 to-[#0d1b3e]/95" />
        <div className="container relative z-10 mx-auto max-w-7xl px-4 text-center text-white">
          <h1 className="mb-4 text-4xl font-bold text-[#eab308] sm:text-5xl md:text-6xl">Blog & News</h1>
          <p className="mx-auto mb-6 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base md:mb-10 md:text-xl">
            Insights, teachings, and updates to inspire your faith and transform your life.
          </p>

          <form method="GET" className="mx-auto max-w-xl">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}
            <div className="relative flex shadow-2xl">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="q"
                defaultValue={query}
                placeholder="Search articles..."
                className="w-full rounded-l-lg bg-white py-3 pl-12 pr-4 text-sm text-gray-900 focus:outline-none md:py-4 md:text-base"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded-r-lg bg-[#0a121f] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black md:px-8 md:py-4 md:text-base"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="container relative z-20 mx-auto -mt-8 max-w-7xl px-4">
        <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-md">
          <div className="flex min-w-max items-center gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={buildBlogHref({ category: cat.value || undefined, q: query || undefined, tag: activeTag })}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all sm:px-6 ${
                  category === cat.value
                    ? 'bg-[#eab308] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.label}
                {cat.value ? (
                  <span className="ml-1.5 text-[11px] opacity-80">({cat.count})</span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
          <p>
            {total === 0 ? (
              'No articles found'
            ) : (
              <>
                Showing{' '}
                <span className="font-semibold text-[#0a121f]">
                  {total === 0 ? 0 : (page - 1) * POSTS_PER_PAGE + 1}–
                  {Math.min(page * POSTS_PER_PAGE, total)}
                </span>{' '}
                of <span className="font-semibold text-[#0a121f]">{total}</span> articles
              </>
            )}
          </p>
          {(query || category || activeTag) && (
            <Link href="/blog" className="text-[#eab308] hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            {featured && (
              <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative aspect-[4/3] md:aspect-auto min-h-[220px]">
                    <BlogPostImage
                      src={featured.featured_image}
                      alt={featured.title}
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute left-4 top-4">
                      <span className="rounded bg-[#eab308] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center space-y-4 p-8">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span className="rounded bg-[#eab308]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#eab308]">
                        {categoryLabel(featured.category ?? featured.type)}
                      </span>
                      <span aria-hidden>·</span>
                      <time dateTime={featured.published_at ?? undefined}>
                        {formatSafeDate(featured.published_at, 'MMMM d, yyyy')}
                      </time>
                    </div>
                    <h2 className="text-3xl font-bold leading-tight text-[#0a121f]">
                      <Link href={`/blog/${featured.slug}`} className="transition-colors hover:text-[#eab308]">
                        {featured.title}
                      </Link>
                    </h2>
                    <p className="line-clamp-3 leading-relaxed text-gray-600">
                      {featured.excerpt || 'Read the full article on Kingdom Deliverance Centre Uganda.'}
                    </p>
                    <div>
                      <Link
                        href={`/blog/${featured.slug}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0a121f] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-black"
                      >
                        Read Full Article <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {grid.length === 0 && !featured ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-lg font-semibold text-[#0a121f]">No articles match your filters</p>
                <p className="mt-2 text-sm text-gray-500">Try another category or search term.</p>
                <Link
                  href="/blog"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#eab308] hover:underline"
                >
                  View all posts <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {grid.map((post) => (
                  <article
                    key={post.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                  >
                    <Link href={`/blog/${post.slug}`} className="relative block aspect-video overflow-hidden">
                      <BlogPostImage
                        src={post.featured_image}
                        alt={post.title}
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        iconClassName="h-10 w-10"
                      />
                      <div className="absolute bottom-3 left-3">
                        <span className="rounded bg-[#eab308] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                          {categoryLabel(post.category ?? post.type)}
                        </span>
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col space-y-3 p-5">
                      <h3 className="line-clamp-2 text-lg font-bold text-[#0a121f] transition-colors group-hover:text-[#eab308]">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-gray-500">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between border-t border-gray-50 pt-3 text-[11px] font-medium text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatSafeDate(post.published_at, 'MMM d, yyyy')}
                        </span>
                        <span>{readTime(post.content)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="flex flex-wrap items-center justify-center gap-2 pt-8">
                {[...Array(totalPages)].map((_, i) => (
                  <Link
                    key={i + 1}
                    href={buildBlogHref({
                      page: i + 1,
                      q: query || undefined,
                      category: category || undefined,
                      tag: activeTag,
                    })}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                      page === i + 1
                        ? 'bg-[#0a121f] text-white'
                        : 'border border-gray-100 bg-white text-gray-500 hover:border-[#eab308] hover:text-[#eab308]'
                    }`}
                  >
                    {i + 1}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <aside className="space-y-10 lg:col-span-4">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#0a121f]">Search</h4>
              <form method="GET" className="relative">
                {category ? <input type="hidden" name="category" value={category} /> : null}
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search articles..."
                  className="w-full rounded-lg border border-gray-100 bg-gray-50 py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#eab308]"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded bg-[#0a121f] text-white hover:bg-black"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#0a121f]">Categories</h4>
              <ul className="space-y-3">
                {categories.slice(1).map((cat) => (
                  <li key={cat.label}>
                    <Link
                      href={buildBlogHref({ category: cat.value || undefined })}
                      className="group flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600 transition-colors group-hover:text-[#eab308]">
                        {cat.label}
                      </span>
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-bold text-gray-400">
                        {cat.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#0a121f]">Popular Posts</h4>
              <div className="space-y-6">
                {popular.map((p) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group flex gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <BlogPostImage
                        src={p.featured_image}
                        alt={p.title}
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        sizes="64px"
                        iconClassName="h-6 w-6"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h5 className="line-clamp-2 text-sm font-bold leading-snug text-[#0a121f] transition-colors group-hover:text-[#eab308]">
                        {p.title}
                      </h5>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-tight text-gray-400">
                        {formatSafeDate(p.published_at, 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {tagCounts.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#0a121f]">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {tagCounts.slice(0, 12).map((tag) => (
                    <Link
                      key={tag.slug}
                      href={buildBlogHref({ tag: tag.slug, category: category || undefined, q: query || undefined })}
                      className={`rounded border px-3 py-1.5 text-[11px] font-bold transition-all ${
                        activeTag === tag.slug
                          ? 'border-[#eab308] bg-[#eab308] text-white'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-[#eab308] hover:bg-[#eab308] hover:text-white'
                      }`}
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="relative overflow-hidden rounded-xl bg-[#0a121f] p-8 text-white">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <BookOpen className="h-24 w-24 rotate-12" />
              </div>
              <h4 className="mb-2 text-lg font-bold">Stay Connected</h4>
              <p className="mb-6 text-xs leading-relaxed text-white/60">
                Get the latest teachings, updates, and event information.
              </p>
              <form className="space-y-3" action="/contact">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full rounded-lg bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#eab308] py-3 text-sm font-bold text-white transition-colors hover:bg-[#d4a007]"
                >
                  Subscribe Now
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
