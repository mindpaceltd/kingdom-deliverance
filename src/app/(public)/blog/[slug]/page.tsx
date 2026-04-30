import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { User, Clock, Eye, Mail, Send, ArrowLeft, ArrowRight, BookOpen, Link2 } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { incrementPostViews, autoPublishScheduled } from "@/lib/actions/posts";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("title, excerpt, featured_image, meta_title, meta_description, slug")
    .eq("slug", params.slug)
    .single();

  if (!data) return { title: "Post Not Found" };

  const title = data.meta_title || data.title;
  const description = data.meta_description || data.excerpt || "Read this post on KDC Uganda.";
  const url = `https://kdcuganda.org/blog/${data.slug}`;
  const image = data.featured_image ||
    `https://kdcuganda.org/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description.slice(0, 100))}`;

  return {
    title: `${title} | KDC Uganda`,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Kingdom Deliverance Centre Uganda",
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export const revalidate = 3600;

function readTime(html: string | null): string {
  if (!html) return "1 min read";
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function extractHeadings(html: string | null): { id: string; text: string; level: number }[] {
  if (!html) return [];
  const results: { id: string; text: string; level: number }[] = [];
  const re = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(html)) !== null) {
    results.push({
      id: `heading-${i}`,
      text: m[2].replace(/<[^>]*>/g, ""),
      level: parseInt(m[1]),
    });
    i++;
  }
  return results;
}

function injectHeadingIds(html: string | null): string {
  if (!html) return "";
  let i = 0;
  return html.replace(/<h([23])([^>]*)>/gi, (_, level, attrs) => {
    return `<h${level}${attrs} id="heading-${i++}">`;
  });
}

export default async function BlogPostPage({ params }: Props) {
  await autoPublishScheduled();

  const supabase = createClient();
  const [postResult, headersList] = await Promise.all([
    supabase
      .from("posts")
      .select("*, profiles(name, avatar_url, bio)")
      .eq("slug", params.slug)
      .eq("status", "published")
      .single(),
    Promise.resolve(headers()),
  ]);

  const post = postResult.data;
  if (!post) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profiles = post.profiles as any;
  const authorName: string = Array.isArray(profiles) ? profiles[0]?.name : profiles?.name;
  const authorAvatar: string | null = Array.isArray(profiles) ? profiles[0]?.avatar_url : profiles?.avatar_url;
  const authorBio: string | null = Array.isArray(profiles) ? profiles[0]?.bio : profiles?.bio;

  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? undefined;
  const userAgent = headersList.get("user-agent") ?? undefined;
  void incrementPostViews(params.slug, `/blog/${params.slug}`, ip, userAgent);

  const [relatedResult, tagsResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, slug, excerpt, featured_image, published_at, type")
      .eq("status", "published")
      .eq("type", post.type)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(4),
    supabase
      .from("post_tags")
      .select("tag_id")
      .eq("post_id", post.id),
  ]);

  const related = relatedResult.data ?? [];

  let tags: { name: string; slug: string }[] = [];
  if (tagsResult.data && tagsResult.data.length > 0) {
    const tagIds = tagsResult.data.map((r) => r.tag_id);
    const { data: tagData } = await supabase
      .from("tags")
      .select("name, slug")
      .in("id", tagIds);
    tags = tagData ?? [];
  }

  const postUrl = `https://kdcuganda.org/blog/${post.slug}`;
  const headings = extractHeadings(post.content);
  const contentWithIds = injectHeadingIds(post.content);
  const rt = readTime(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "",
    image: post.featured_image || `https://kdcuganda.org/og?title=${encodeURIComponent(post.title)}`,
    author: {
      "@type": "Organization",
      name: authorName || "Kingdom Deliverance Centre Uganda",
    },
    publisher: {
      "@type": "Organization",
      name: "Kingdom Deliverance Centre Uganda",
      url: "https://kdcuganda.org",
    },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    url: postUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative h-[400px] lg:h-[500px] flex items-center overflow-hidden">
        {post.featured_image ? (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[#0a121f]" />
        )}
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="container relative z-10 px-4 max-w-7xl mx-auto text-white">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#eab308] mb-6 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-[#eab308] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
                {post.type || "Bishop Insights"}
              </span>
              <span className="text-xs text-white/70">
                {post.published_at && format(new Date(post.published_at), "MMMM d, yyyy")}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/60 pt-4">
              <span className="flex items-center gap-2"><User className="w-4 h-4 text-[#eab308]" /> {authorName}</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#eab308]" /> {rt}</span>
              <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-[#eab308]" /> {(post.views || 0).toLocaleString()} Views</span>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Share Bar */}
      <div className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="container px-4 max-w-7xl mx-auto py-3 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-semibold text-gray-600">Share this post:</span>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on X / Twitter"
            className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(post.title + " " + postUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
          <a
            href={postUrl}
            aria-label="Copy link"
            className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white hover:bg-amber-600 transition-colors"
          >
            <Link2 className="w-4 h-4" />
          </a>
        </div>
      </div>

      <main className="container px-4 max-w-7xl mx-auto py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          
          {/* Main Content — 2 columns */}
          <div className="lg:col-span-2">
            <article className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100">
              {post.excerpt && (
                <div className="text-lg md:text-xl text-gray-600 font-light italic leading-relaxed mb-10 border-l-4 border-[#eab308] pl-6 bg-amber-50/30 py-4 rounded-r-xl">
                  {post.excerpt}
                </div>
              )}

              <div
                className="prose prose-lg prose-slate max-w-none
                  prose-headings:font-bold prose-headings:text-[#0a121f] prose-headings:mt-10 prose-headings:mb-5
                  prose-h2:text-3xl prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-4
                  prose-h3:text-2xl
                  prose-p:text-gray-700 prose-p:leading-[1.8] prose-p:mb-5 prose-p:text-base
                  prose-a:text-[#eab308] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-[#0a121f] prose-strong:font-bold
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-li:text-gray-700 prose-li:leading-relaxed
                  prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                  prose-blockquote:border-l-4 prose-blockquote:border-[#eab308] prose-blockquote:bg-amber-50 prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:my-8
                  prose-img:rounded-xl prose-img:shadow-lg prose-img:my-10
                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-gray-800
                  prose-pre:bg-gray-900 prose-pre:text-gray-100"
                dangerouslySetInnerHTML={{ __html: contentWithIds || "" }}
              />

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/blog?q=${tag.name}`}
                      className="text-xs font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 hover:bg-[#eab308] hover:text-white transition-all"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </article>

            {/* Author Box */}
            <div className="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden border-2 border-[#eab308]/20">
                {authorAvatar ? (
                  <Image src={authorAvatar} alt={authorName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center"><User className="w-10 h-10 text-gray-300" /></div>
                )}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#eab308] uppercase tracking-widest">About the Author</h4>
                <h3 className="text-2xl font-bold text-[#0a121f]">{authorName}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xl">
                  {authorBio || "Discover the life, calling, and global impact of this visionary leader, committed to transforming lives through the power of the Gospel."}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                  <Link href="#" className="text-gray-400 hover:text-[#eab308] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-[#eab308] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-[#eab308] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar — 1 column, sticky */}
          <aside className="lg:col-span-1 space-y-8">
            <div className="lg:sticky lg:top-8 lg:self-start space-y-8">
            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="bg-[#0a121f] p-8 rounded-xl text-white">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-6 pb-2 border-b border-white/10">Table of Contents</h4>
                <nav className="space-y-4">
                  {headings.map((h, i) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`block text-sm transition-colors hover:text-[#eab308] ${h.level === 3 ? "pl-4 opacity-70" : "font-bold opacity-90"}`}
                    >
                      <span className="text-[#eab308] mr-2">{(i + 1).toString().padStart(2, '0')}.</span>
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Newsletter */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-bold text-[#0a121f] uppercase tracking-wider mb-2">Stay Connected</h4>
              <p className="text-xs text-gray-500 mb-6">Get the latest teachings, updates, and event information.</p>
              <form className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full bg-gray-50 text-gray-900 px-4 py-3 rounded-lg text-sm border border-gray-100 focus:outline-none focus:ring-1 focus:ring-[#eab308]"
                  />
                  <Send className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <button className="w-full bg-[#0a121f] text-white py-3 rounded-lg text-sm font-bold hover:bg-black transition-colors">
                  Subscribe Now
                </button>
              </form>
            </div>

            {/* Share Post */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <h4 className="text-sm font-bold text-[#0a121f] uppercase tracking-wider mb-6">Share this Post</h4>
              <div className="flex justify-center gap-4">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#eab308] hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X / Twitter" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#eab308] hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(postUrl)}`} aria-label="Share via Email" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#eab308] hover:text-white transition-all">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="bg-white py-20 border-t border-gray-100">
          <div className="container px-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-[#0a121f]">You May Also Like</h2>
              <Link href="/blog" className="text-[#eab308] font-bold text-sm hover:underline flex items-center gap-2">
                View All Posts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map((p) => (
                <article key={p.id} className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <Link href={`/blog/${p.slug}`} className="relative aspect-[16/10] block overflow-hidden">
                    {p.featured_image ? (
                      <Image src={p.featured_image} alt={p.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center"><BookOpen className="w-12 h-12 text-gray-300" /></div>
                    )}
                  </Link>
                  <div className="p-6 space-y-3">
                    <h3 className="text-base font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors line-clamp-2">
                      <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                      <span>{p.published_at && format(new Date(p.published_at), "MMM d, yyyy")}</span>
                      <span>{readTime(p.excerpt ?? null)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
