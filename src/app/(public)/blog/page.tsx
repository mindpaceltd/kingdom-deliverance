import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowRight, BookOpen, Search, Clock, Eye } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Teachings | Kingdom Deliverance Centre Uganda",
  description:
    "Insights, sermons, devotionals, and updates from Kingdom Deliverance Centre Uganda. Grow in faith through powerful teachings and community stories.",
  openGraph: {
    title: "Blog & Teachings | KDC Uganda",
    description: "Insights, sermons, devotionals, and updates from Kingdom Deliverance Centre Uganda.",
    url: "https://kdcuganda.org/blog",
    type: "website",
  },
};

export const revalidate = 3600;

// Estimate read time from HTML content
function readTime(html: string | null): string {
  if (!html) return "1 min read";
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

// Supabase returns joined relations as array or object depending on cardinality
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function profileName(profiles: any): string | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) return profiles[0]?.name ?? null;
  return profiles.name ?? null;
}

const POSTS_PER_PAGE = 9;

interface Props {
  searchParams: { page?: string; q?: string; type?: string };
}

export default async function BlogPage({ searchParams }: Props) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const query = searchParams.q?.trim() ?? "";
  const typeFilter = searchParams.type ?? "";

  // Build query
  let dbQuery = supabase
    .from("posts")
    .select("id, title, slug, excerpt, featured_image, type, published_at, views, content, profiles(name)", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (query) dbQuery = dbQuery.ilike("title", `%${query}%`);
  if (typeFilter && typeFilter !== "all") dbQuery = dbQuery.eq("type", typeFilter);

  const from = (page - 1) * POSTS_PER_PAGE;
  dbQuery = dbQuery.range(from, from + POSTS_PER_PAGE - 1);

  const { data: posts, count } = await dbQuery;
  const totalPages = Math.ceil((count ?? 0) / POSTS_PER_PAGE);

  // Featured = first post on page 1 with no filters
  const isDefaultView = !query && !typeFilter && page === 1;
  const featured = isDefaultView ? posts?.[0] : null;
  const grid = isDefaultView ? (posts?.slice(1) ?? []) : (posts ?? []);

  // Popular posts for sidebar
  const { data: popular } = await supabase
    .from("posts")
    .select("id, title, slug, published_at, views")
    .eq("status", "published")
    .order("views", { ascending: false })
    .limit(5);

  // Recent posts for sidebar
  const { data: recent } = await supabase
    .from("posts")
    .select("id, title, slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-primary text-white py-20">
        <div className="container px-4 max-w-5xl mx-auto">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/50">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-white font-medium">Blog</li>
            </ol>
          </nav>

          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            Blog &amp; Teachings
          </h1>
          <p className="text-white/75 text-lg max-w-2xl mb-8 leading-relaxed">
            Insights, sermons, devotionals, and updates from Kingdom Deliverance Centre Uganda.
            Grow in faith through powerful teachings, community stories, and prophetic messages
            that transform lives across Uganda and beyond.
          </p>

          {/* Search + filter row */}
          <form method="GET" className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search posts…"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>
            <select
              name="type"
              defaultValue={typeFilter}
              className="px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Categories</option>
              <option value="blog">Blog Posts</option>
              <option value="news">News</option>
            </select>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-accent text-primary font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 bg-white">
        <div className="container px-4 max-w-7xl mx-auto">
          {!posts || posts.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-semibold">
                {query ? `No posts found for "${query}"` : "No posts published yet."}
              </p>
              <p className="mt-2 text-sm">
                {query ? (
                  <Link href="/blog" className="text-accent hover:underline">Clear search</Link>
                ) : "Check back soon for news, teachings, and updates!"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Main column */}
              <div className="flex-1 min-w-0 space-y-12">

                {/* -------------------------------------------------------- */}
                {/* FEATURED POST                                             */}
                {/* -------------------------------------------------------- */}
                {featured && (
                  <article className="group grid grid-cols-1 md:grid-cols-2 gap-8 items-center pb-12 border-b border-primary/10">
                    <Link href={`/blog/${featured.slug}`} className="block aspect-[16/9] rounded-2xl overflow-hidden bg-primary/5 relative">
                      {featured.featured_image ? (
                        <Image
                          src={featured.featured_image}
                          alt={featured.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-primary/20" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-accent text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        Featured
                      </span>
                    </Link>
                    <div className="space-y-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent border border-accent/30 rounded-full px-3 py-1">
                        {featured.type === "news" ? "News" : "Blog Post"}
                      </span>
                      <h2 className="font-serif text-3xl font-bold text-primary leading-tight group-hover:text-accent transition-colors">
                        <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                      </h2>
                      {featured.excerpt && (
                        <p className="text-primary/70 leading-relaxed line-clamp-3">{featured.excerpt}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {profileName(featured.profiles) && <span>By {profileName(featured.profiles)}</span>}
                        {featured.published_at && (
                          <span>{format(new Date(featured.published_at), "MMM d, yyyy")}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{readTime(featured.content)}
                        </span>
                        {featured.views > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />{featured.views.toLocaleString()} views
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/blog/${featured.slug}`}
                        className="inline-flex items-center gap-2 text-accent font-semibold hover:underline text-sm"
                      >
                        Read Article <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </article>
                )}

                {/* -------------------------------------------------------- */}
                {/* POSTS GRID                                                */}
                {/* -------------------------------------------------------- */}
                {grid.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {grid.map((post) => (
                      <article key={post.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                        <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] bg-primary/5 overflow-hidden relative">
                          {post.featured_image ? (
                            <Image
                              src={post.featured_image}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-10 h-10 text-primary/20" />
                            </div>
                          )}
                        </Link>
                        <div className="flex flex-col flex-1 p-5 space-y-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                            {post.type === "news" ? "News" : "Blog"}
                          </span>
                          <h3 className="font-serif text-lg font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-primary/65 line-clamp-2 leading-relaxed flex-1">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-primary/5">
                            <span>
                              {post.published_at && format(new Date(post.published_at), "MMM d, yyyy")}
                            </span>                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{readTime(post.content)}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* PAGINATION                                                */}
                {/* -------------------------------------------------------- */}
                {totalPages > 1 && (
                  <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-4">
                    {page > 1 && (
                      <Link
                        href={`/blog?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}`}
                        className="px-4 py-2 rounded-lg border border-primary/20 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                      >
                        ← Previous
                      </Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Link
                        key={p}
                        href={`/blog?page=${p}${query ? `&q=${encodeURIComponent(query)}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}`}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-primary text-white"
                            : "border border-primary/20 text-primary hover:bg-primary/5"
                        }`}
                      >
                        {p}
                      </Link>
                    ))}
                    {page < totalPages && (
                      <Link
                        href={`/blog?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}`}
                        className="px-4 py-2 rounded-lg border border-primary/20 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                      >
                        Next →
                      </Link>
                    )}
                  </nav>
                )}
              </div>

              {/* ---------------------------------------------------------- */}
              {/* SIDEBAR                                                      */}
              {/* ---------------------------------------------------------- */}
              <aside className="w-full lg:w-72 shrink-0 space-y-8">
                {/* Search */}
                <div className="rounded-xl border border-primary/10 p-5 space-y-3">
                  <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Search</h3>
                  <form method="GET">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        name="q"
                        defaultValue={query}
                        placeholder="Search posts…"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </form>
                </div>

                {/* Categories */}
                <div className="rounded-xl border border-primary/10 p-5 space-y-3">
                  <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Categories</h3>
                  <ul className="space-y-1.5">
                    {[
                      { label: "All Posts", value: "" },
                      { label: "Blog Posts", value: "blog" },
                      { label: "News", value: "news" },
                    ].map((cat) => (
                      <li key={cat.value}>
                        <Link
                          href={`/blog${cat.value ? `?type=${cat.value}` : ""}`}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            typeFilter === cat.value
                              ? "bg-primary text-white font-medium"
                              : "text-primary/70 hover:bg-primary/5 hover:text-primary"
                          }`}
                        >
                          {cat.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Popular Posts */}
                {popular && popular.length > 0 && (
                  <div className="rounded-xl border border-primary/10 p-5 space-y-3">
                    <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Popular Posts</h3>
                    <ul className="space-y-3">
                      {popular.map((p, i) => (
                        <li key={p.id} className="flex gap-3 items-start">
                          <span className="text-2xl font-bold text-primary/10 leading-none w-6 shrink-0">{i + 1}</span>
                          <div>
                            <Link href={`/blog/${p.slug}`} className="text-sm font-medium text-primary hover:text-accent transition-colors line-clamp-2 leading-snug">
                              {p.title}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Eye className="w-3 h-3" />{(p.views ?? 0).toLocaleString()} views
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recent Posts */}
                {recent && recent.length > 0 && (
                  <div className="rounded-xl border border-primary/10 p-5 space-y-3">
                    <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Recent Posts</h3>
                    <ul className="space-y-3">
                      {recent.map((p) => (
                        <li key={p.id}>
                          <Link href={`/blog/${p.slug}`} className="text-sm font-medium text-primary hover:text-accent transition-colors line-clamp-2 leading-snug block">
                            {p.title}
                          </Link>
                          {p.published_at && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(p.published_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER CTA                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 bg-primary text-white text-center">
        <div className="container px-4 max-w-2xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl md:text-4xl font-bold">
            Join Kingdom Deliverance Centre Uganda
          </h2>
          <p className="text-white/75 text-lg leading-relaxed">
            Experience powerful teaching, healing, and transformation. Be part of a community
            that is changing lives across Uganda and the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-accent text-primary font-bold hover:bg-accent/90 transition-colors"
            >
              Visit Church
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
