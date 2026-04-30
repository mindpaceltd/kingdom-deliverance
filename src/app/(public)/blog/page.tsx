import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowRight, BookOpen, Search, Clock, Eye, Send, MapPin, Phone, Mail, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & News | Kingdom Deliverance Centre Uganda",
  description:
    "Insights, teachings, and updates to inspire your faith and transform your life.",
  openGraph: {
    title: "Blog & News | KDC Uganda",
    description: "Insights, teachings, and updates to inspire your faith and transform your life.",
    url: "https://kdcuganda.org/blog",
    type: "website",
  },
};

export const revalidate = 3600;

function readTime(html: string | null): string {
  if (!html) return "1 min read";
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
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

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* ------------------------------------------------------------------ */}
      {/* HERO SECTION                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative h-[450px] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80"
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="container relative z-10 px-4 max-w-7xl mx-auto text-white text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Blog & News</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Insights, teachings, and updates to inspire your faith and transform your life.
          </p>

          <form method="GET" className="max-w-2xl mx-auto">
            <div className="relative flex shadow-2xl">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                name="q"
                defaultValue={query}
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-4 rounded-l-lg bg-white text-gray-900 focus:outline-none"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-[#0a121f] text-white font-semibold rounded-r-lg hover:bg-black transition-colors"
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {grid.map((post) => (
                <article key={post.id} className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                  <Link href={`/blog/${post.slug}`} className="relative aspect-[16/10] block overflow-hidden">
                    {post.featured_image ? (
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-[#eab308] text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                        {post.type || "Sermons"}
                      </span>
                    </div>
                  </Link>
                  <div className="p-6 flex flex-col flex-1 space-y-3">
                    <h3 className="text-lg font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium pt-4 border-t border-gray-50">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {post.published_at && format(new Date(post.published_at), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
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
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
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

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM CTA                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-[#0a121f] py-16">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="bg-[#0a121f] border border-white/10 rounded-2xl p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-[#eab308]" />
            
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-[#eab308]/10 rounded-2xl flex items-center justify-center shrink-0">
                <BookOpen className="w-8 h-8 text-[#eab308]" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Join Kingdom Deliverance Centre Uganda
                </h2>
                <p className="text-white/60 text-sm max-w-xl">
                  Experience powerful worship, life-changing teachings, and a community that supports your spiritual journey.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <Link
                href="/about"
                className="w-full sm:w-auto px-10 py-4 bg-[#eab308] text-white font-bold rounded-lg hover:bg-[#d4a007] transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" /> Visit Church
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-10 py-4 border border-white/20 text-white font-bold rounded-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER                                                              */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-[#0a121f] text-white pt-20 pb-10 border-t border-white/5">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#eab308] rounded-lg" />
                <span className="font-bold text-lg leading-tight uppercase tracking-tighter">
                  Kingdom Deliverance<br/><span className="text-[#eab308]">Centre Uganda</span>
                </span>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                Spreading faith, transforming lives, and impacting communities through the power of God&apos;s Word.
              </p>
              <div className="flex items-center gap-4">
                <Link href="#" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#eab308] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></Link>
                <Link href="#" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#eab308] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></Link>
                <Link href="#" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#eab308] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></Link>
                <Link href="#" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#eab308] transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Quick Links</h4>
              <ul className="space-y-4 text-xs text-white/50">
                <li><Link href="/about" className="hover:text-[#eab308] transition-colors">About Us</Link></li>
                <li><Link href="/ministries" className="hover:text-[#eab308] transition-colors">Ministries</Link></li>
                <li><Link href="/sermons" className="hover:text-[#eab308] transition-colors">Sermons</Link></li>
                <li><Link href="/events" className="hover:text-[#eab308] transition-colors">Events</Link></li>
                <li><Link href="/gallery" className="hover:text-[#eab308] transition-colors">Gallery</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Resources</h4>
              <ul className="space-y-4 text-xs text-white/50">
                <li><Link href="/blog" className="hover:text-[#eab308] transition-colors">Blog</Link></li>
                <li><Link href="/testimonies" className="hover:text-[#eab308] transition-colors">Testimonies</Link></li>
                <li><Link href="/books" className="hover:text-[#eab308] transition-colors">Books</Link></li>
                <li><Link href="/donations" className="hover:text-[#eab308] transition-colors">Give Online</Link></li>
                <li><Link href="/contact" className="hover:text-[#eab308] transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Contact Info</h4>
              <ul className="space-y-4 text-xs text-white/50">
                <li className="flex gap-3"><MapPin className="w-4 h-4 text-[#eab308]" /> Kampala, Uganda</li>
                <li className="flex gap-3"><Phone className="w-4 h-4 text-[#eab308]" /> +256 700 123 456</li>
                <li className="flex gap-3"><Mail className="w-4 h-4 text-[#eab308]" /> info@kdcuganda.org</li>
                <li className="flex gap-3"><Globe className="w-4 h-4 text-[#eab308]" /> www.kdcuganda.org</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-10 border-t border-white/5 text-center text-[10px] text-white/30 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} Kingdom Deliverance Centre Uganda. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
