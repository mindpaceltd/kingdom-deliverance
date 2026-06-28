import { createClient } from '@/lib/supabase/server';
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowRight, BookOpen, Search, Clock, Send } from "lucide-react";
import type { Metadata } from "next";
import { getBlogHeroUrl } from "@/lib/seo/page-hero";
import { buildListPageMetadata } from "@/lib/seo/list-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: "Blog & News",
    description:
      "Faith-building teachings, ministry updates, and news from Kingdom Deliverance Centre Uganda — Bishop Climate Wiseman and the KDC leadership team.",
    path: "/blog",
    keywords:
      "KDC Uganda blog, Christian teachings Uganda, church news Kampala, Bishop Climate teachings, faith blog Uganda",
    ogType: "blog",
  });
}

export const revalidate = 3600;

function readTime(html: string | null): string {
  if (!html) return "1 min read";
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function isHeic(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.heic') || lower.endsWith('.heif');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function profileName(profiles: any): string | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) return profiles[0]?.name ?? null;
  return profiles.name ?? null;
}

const POSTS_PER_PAGE = 10;

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
    .select("id, title, slug, published_at, views, featured_image")
    .eq("status", "published")
    .order("views", { ascending: false })
    .limit(5);

  // Categories with counts (Mocked for UI, ideally from a view or aggregation)
  const categories = [
    { label: "All Posts", value: "", count: count || 0 },
    { label: "Sermons", value: "sermons", count: 24 },
    { label: "Teachings", value: "teachings", count: 18 },
    { label: "Testimonies", value: "testimonies", count: 15 },
    { label: "Ministry News", value: "news", count: 12 },
    { label: "Bishop Insights", value: "bishop", count: 10 },
  ];

  const tags = ["Faith", "Prayer", "Prophecy", "Deliverance", "Healing", "Miracles", "Kingdom", "Bible", "Wisdom", "Leadership"];

  const heroUrl = await getBlogHeroUrl(featured?.featured_image);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* ------------------------------------------------------------------ */}
      {/* HERO SECTION                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative flex min-h-[320px] items-center overflow-hidden py-24 md:h-[450px] md:py-0">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroUrl}')` }}
          role="img"
          aria-label="Blog hero background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b3e]/90 via-[#0d1b3e]/75 to-[#0d1b3e]/95" />
        <div className="container relative z-10 px-4 max-w-7xl mx-auto text-white text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-[#eab308]">Blog & News</h1>
          <p className="text-sm sm:text-base md:text-xl text-white/80 max-w-2xl mx-auto mb-6 md:mb-10 leading-relaxed">
            Insights, teachings, and updates to inspire your faith and transform your life.
          </p>

          <form method="GET" className="max-w-xl mx-auto">
            <div className="relative flex shadow-2xl">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                name="q"
                defaultValue={query}
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-3 md:py-4 rounded-l-lg bg-white text-gray-900 focus:outline-none text-sm md:text-base"
              />
              <button
                type="submit"
                className="px-6 py-3 md:px-8 md:py-4 bg-[#0a121f] text-white font-semibold rounded-r-lg hover:bg-black transition-colors text-sm md:text-base whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CATEGORY NAV                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="container px-4 max-w-7xl mx-auto -mt-8 relative z-20">
        <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={`/blog${cat.value ? `?type=${cat.value}` : ""}`}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  typeFilter === cat.value
                    ? "bg-[#eab308] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="container px-4 max-w-7xl mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Featured Post */}
            {featured && (
              <article className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative aspect-[4/3] md:aspect-auto">
                    {featured.featured_image ? (
                      <Image
                        src={featured.featured_image}
                        alt={featured.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        unoptimized={isHeic(featured.featured_image)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#eab308] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex flex-col justify-center space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[#eab308] text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-[#eab308]/10 rounded">
                        {featured.type || "Bishop Insights"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {featured.published_at && format(new Date(featured.published_at), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-[#0a121f] leading-tight">
                      <Link href={`/blog/${featured.slug}`} className="hover:text-[#eab308] transition-colors">
                        {featured.title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 leading-relaxed line-clamp-3">
                      {featured.excerpt || "Discover the life, calling, and global impact of this visionary leader..."}
                    </p>
                    <div>
                      <Link
                        href={`/blog/${featured.slug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#0a121f] text-white text-sm font-semibold rounded-lg hover:bg-black transition-all"
                      >
                        Read Full Article <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Grid Posts */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-8">
              {grid.map((post) => (
                <article key={post.id} className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                  <Link href={`/blog/${post.slug}`} className="relative aspect-video block overflow-hidden">
                    {post.featured_image ? (
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                        unoptimized={isHeic(post.featured_image)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 md:w-12 md:h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4">
                      <span className="bg-[#eab308] text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                        {post.type || "Sermons"}
                      </span>
                    </div>
                  </Link>
                  <div className="p-3 md:p-6 flex flex-col flex-1 space-y-2 md:space-y-3">
                    <h3 className="text-sm md:text-lg font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-1.5 md:gap-0 text-[9px] md:text-[11px] text-gray-400 font-medium pt-2 md:pt-4 border-t border-gray-50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="truncate max-w-[80px] md:max-w-none">{post.published_at && format(new Date(post.published_at), "MMM d, yyyy")}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        {readTime(post.content)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 pt-12">
                {[...Array(totalPages)].map((_, i) => (
                  <Link
                    key={i + 1}
                    href={`/blog?page=${i + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                      page === i + 1
                        ? "bg-[#0a121f] text-white"
                        : "bg-white text-gray-500 border border-gray-100 hover:border-[#eab308] hover:text-[#eab308]"
                    }`}
                  >
                    {i + 1}
                  </Link>
                ))}
                <Link
                  href={`/blog?page=${Math.min(totalPages, page + 1)}`}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-lg text-sm font-semibold text-gray-500 hover:text-[#eab308] transition-all ml-2"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Link>
              </nav>
            )}
          </div>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4 space-y-10">
            
            {/* Search */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-bold text-[#0a121f] uppercase tracking-wider mb-4">Search</h4>
              <form method="GET" className="relative">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search articles..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#eab308]"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0a121f] text-white rounded flex items-center justify-center hover:bg-black transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-bold text-[#0a121f] uppercase tracking-wider mb-4">Categories</h4>
              <ul className="space-y-3">
                {categories.slice(1).map((cat) => (
                  <li key={cat.label}>
                    <Link
                      href={`/blog?type=${cat.value}`}
                      className="flex items-center justify-between group"
                    >
                      <span className="text-sm text-gray-600 group-hover:text-[#eab308] transition-colors">{cat.label}</span>
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{cat.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Posts */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-bold text-[#0a121f] uppercase tracking-wider mb-6">Popular Posts</h4>
              <div className="space-y-6">
                {popular?.map((p) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="flex gap-4 group">
                    <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={p.featured_image || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80"}
                        alt={p.title}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        unoptimized={isHeic(p.featured_image)}
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h5 className="text-sm font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors line-clamp-2 leading-snug">
                        {p.title}
                      </h5>
                      <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tight">
                        {p.published_at && format(new Date(p.published_at), "MMMM d, yyyy")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-bold text-[#0a121f] uppercase tracking-wider mb-4">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?q=${tag}`}
                    className="text-[11px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded border border-gray-100 hover:bg-[#eab308] hover:text-white hover:border-[#eab308] transition-all"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Stay Connected */}
            <div className="bg-[#0a121f] p-8 rounded-xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BookOpen className="w-24 h-24 rotate-12" />
              </div>
              <h4 className="text-lg font-bold mb-2">Stay Connected</h4>
              <p className="text-white/60 text-xs mb-6 leading-relaxed">
                Get the latest teachings, updates, and event information.
              </p>
              <form className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg text-sm focus:outline-none"
                  />
                  <Send className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <button className="w-full bg-[#eab308] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#d4a007] transition-colors">
                  Subscribe Now
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
