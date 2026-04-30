import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, User, Clock, Eye, Tag, ChevronRight, Download, Globe, Mail } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { incrementPostViews, autoPublishScheduled } from "@/lib/actions/posts";

interface Props { params: { slug: string } }

// ---------------------------------------------------------------------------
// Metadata + OG tags
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Share buttons (reusable)
// ---------------------------------------------------------------------------

function ShareButtons({ url, title }: { url: string; title: string }) {
  const enc = encodeURIComponent;
  const btn = "inline-flex items-center justify-center w-9 h-9 rounded-full text-white transition-colors";
  return (
    <>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className={`${btn} bg-blue-600 hover:bg-blue-700`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
      </a>
      <a href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className={`${btn} bg-black hover:bg-zinc-800`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href={`https://wa.me/?text=${enc(title + " " + url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" className={`${btn} bg-green-500 hover:bg-green-600`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <a href={url} aria-label="Copy link" className={`${btn} bg-amber-500 hover:bg-amber-600`} title="Copy link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </a>
    </>
  );
}

function ShareRow({ url, title }: { url: string; title: string }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-semibold text-foreground">Share this post:</span>
      <ShareButtons url={url} title={title} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

  // Safely handle profiles which may be array or object from Supabase join
  const profiles = post.profiles as any;
  const authorName: string = Array.isArray(profiles) ? profiles[0]?.name : profiles?.name;
  const authorAvatar: string | null = Array.isArray(profiles) ? profiles[0]?.avatar_url : profiles?.avatar_url;
  const authorBio: string | null = Array.isArray(profiles) ? profiles[0]?.bio : profiles?.bio;

  // Track view
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? undefined;
  const userAgent = headersList.get("user-agent") ?? undefined;
  void incrementPostViews(params.slug, `/blog/${params.slug}`, ip, userAgent);

  // Related posts (4 for grid) + post tags in parallel
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

  // Fetch tag names
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

  // JSON-LD structured data
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col">

        {/* ============================================================== */}
        {/* HERO — dark 2-column layout                                      */}
        {/* ============================================================== */}
        <section className="bg-[#1a1a2e] text-white">
          <div className="container px-4 max-w-7xl mx-auto py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Left column */}
              <div className="flex flex-col">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white/50 flex items-center gap-1.5 flex-wrap">
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                  <ChevronRight className="w-3 h-3" />
                  <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-white/70 line-clamp-1">{post.title}</span>
                </nav>

                {/* Category badge — yellow pill */}
                <span className="inline-block self-start mb-4 text-xs font-bold tracking-widest uppercase bg-accent text-[#1a1a2e] rounded-full px-4 py-1.5">
                  {post.type === "news" ? "News" : "Blog Post"}
                </span>

                {/* Title */}
                <h1 className="font-serif text-3xl md:text-4xl xl:text-5xl font-bold leading-tight mb-6 text-white">
                  {post.title}
                </h1>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
                  {authorName && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-white/80">{authorName}</span>
                    </span>
                  )}
                  {post.published_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-accent shrink-0" />
                      {format(new Date(post.published_at), "MMMM d, yyyy")}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    {rt}
                  </span>
                  {(post.views ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-accent shrink-0" />
                      {(post.views ?? 0).toLocaleString()} views
                    </span>
                  )}
                </div>
              </div>

              {/* Right column — featured image */}
              {post.featured_image ? (
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={post.featured_image}
                    alt={post.meta_title || post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              ) : (
                <div className="hidden lg:flex w-full aspect-[4/3] rounded-2xl bg-white/5 items-center justify-center">
                  <User className="w-20 h-20 text-white/10" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SHARE ROW — white bar below hero                                 */}
        {/* ============================================================== */}
        <div className="bg-white border-b border-border shadow-sm">
          <div className="container px-4 max-w-7xl mx-auto py-4">
            <ShareRow url={postUrl} title={post.title} />
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN CONTENT + SIDEBAR                                           */}
        {/* ============================================================== */}
        <section className="py-12 bg-white">
          <div className="container px-4 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">

              {/* -------------------------------------------------------- */}
              {/* LEFT — Article                                             */}
              {/* -------------------------------------------------------- */}
              <article className="flex-1 min-w-0">

                {/* Lead quote block */}
                {post.excerpt && (
                  <blockquote className="border-l-4 border-accent bg-accent/8 rounded-r-xl px-6 py-5 mb-10 italic text-lg text-primary/80 leading-relaxed font-light">
                    {post.excerpt}
                  </blockquote>
                )}

                {/* Article body */}
                {contentWithIds ? (
                  <div
                    className="prose prose-lg prose-slate max-w-none
                      prose-headings:font-serif prose-headings:text-primary
                      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                      prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-xl prose-img:shadow-md
                      prose-blockquote:border-accent prose-blockquote:bg-accent/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                      prose-strong:text-primary
                      prose-li:marker:text-accent
                      leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: contentWithIds }}
                  />
                ) : (
                  <p className="text-muted-foreground">Content coming soon.</p>
                )}

                {/* Read Full Article button — scrolls to author box */}
                <div className="flex justify-center my-10">
                  <a
                    href="#author-box"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#1a1a2e] text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Read Full Article ↓
                  </a>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                    {tags.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={`/blog?q=${encodeURIComponent(tag.name)}`}
                        className="text-xs font-medium bg-muted text-foreground hover:bg-accent/20 transition-colors rounded-full px-3 py-1"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Author box */}
                <div id="author-box" className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 flex gap-5 items-start">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border-2 border-accent/30">
                    {authorAvatar ? (
                      <Image src={authorAvatar} alt={authorName ?? "Author"} width={64} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <User className="w-8 h-8 text-primary/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">About the Author</p>
                    <p className="font-bold text-primary text-lg leading-tight">{authorName || "Kingdom Deliverance Centre Uganda"}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {authorBio || "Spreading faith, transformation, and community impact across Uganda and the world through the power of the Gospel."}
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <a href="https://facebook.com/kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                      </a>
                      <a href="https://youtube.com/@kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                      </a>
                      <a href="https://instagram.com/kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path fill="none" stroke="white" strokeWidth="2" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line fill="none" stroke="white" strokeWidth="2" x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Mobile share */}
                <div className="lg:hidden mt-10 pt-6 border-t border-border">
                  <ShareRow url={postUrl} title={post.title} />
                </div>
              </article>

              {/* -------------------------------------------------------- */}
              {/* RIGHT — Sidebar (~280px)                                   */}
              {/* -------------------------------------------------------- */}
              <aside className="w-full lg:w-72 xl:w-80 shrink-0">
                <div className="lg:sticky lg:top-24 space-y-6">

                  {/* Author card */}
                  <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
                    <h3 className="font-bold text-primary text-base mb-4">
                      About {authorName ? `Dr ${authorName.split(" ").slice(-1)[0]}` : "the Author"}
                    </h3>
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-primary/10 border border-border shrink-0">
                        {authorAvatar ? (
                          <Image src={authorAvatar} alt={authorName ?? "Author"} width={80} height={80} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-10 h-10 text-primary/30" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-primary text-sm">{authorName || "Kingdom Deliverance Centre Uganda"}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Global Prophetic Leader, Founder, Visionary | Author | Mentor
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <a href="https://facebook.com/kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        </a>
                        <a href="https://youtube.com/@kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                        </a>
                        <a href="https://instagram.com/kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path fill="none" stroke="white" strokeWidth="2" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line fill="none" stroke="white" strokeWidth="2" x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        </a>
                        <a href="https://kdcuganda.org" target="_blank" rel="noopener noreferrer" aria-label="Website" className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/80 transition-colors">
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Table of Contents */}
                  {headings.length > 1 && (
                    <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-5 rounded-full bg-accent" />
                        <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Table of Contents</h3>
                      </div>
                      <nav aria-label="Table of contents">
                        <ol className="space-y-2">
                          {headings.map((h, idx) => (
                            <li key={h.id} className={`flex items-start gap-2.5 ${h.level === 3 ? "pl-5" : ""}`}>
                              <span className="text-xs font-bold text-accent shrink-0 mt-0.5 tabular-nums">
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <a
                                href={`#${h.id}`}
                                className="text-sm text-foreground/70 hover:text-accent transition-colors line-clamp-2 leading-snug"
                              >
                                {h.text}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </nav>
                    </div>
                  )}

                  {/* Popular Tags */}
                  {tags.length > 0 && (
                    <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-5 rounded-full bg-accent" />
                        <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Popular Tags</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Link
                            key={tag.slug}
                            href={`/blog?q=${encodeURIComponent(tag.name)}`}
                            className="text-xs font-medium bg-muted text-foreground hover:bg-accent/20 hover:text-accent transition-colors rounded-full px-3 py-1.5"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sidebar share */}
                  <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-5 rounded-full bg-accent" />
                      <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Share this post</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ShareButtons url={postUrl} title={post.title} />
                    </div>
                  </div>

                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* RELATED POSTS — "You May Also Like" 4-column grid                */}
        {/* ============================================================== */}
        {related.length > 0 && (
          <section className="py-16 bg-muted/40">
            <div className="container px-4 max-w-7xl mx-auto">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-8">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((p) => (
                  <article key={p.id} className="group bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                    <Link href={`/blog/${p.slug}`} className="block relative aspect-[4/3] bg-primary/5 overflow-hidden">
                      {p.featured_image ? (
                        <Image
                          src={p.featured_image}
                          alt={p.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-primary/20" />
                        </div>
                      )}
                      {/* Category badge overlay */}
                      <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest bg-accent text-[#1a1a2e] rounded-full px-2.5 py-1">
                        {(p as any).type === "news" ? "News" : "Blog"}
                      </span>
                    </Link>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug text-sm">
                        <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                      </h3>
                      {p.published_at && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(p.published_at), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {readTime(null)}
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* FOOTER CTA — Stay Connected (dark, envelope icon)               */}
        {/* ============================================================== */}
        <section className="py-20 bg-[#1a1a2e] text-white">
          <div className="container px-4 max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/20 mb-2">
              <Mail className="w-7 h-7 text-accent" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">
              Stay Connected
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Get the latest teachings, news, and updates from Kingdom Deliverance Centre Uganda delivered straight to your inbox.
            </p>
            <form
              action="/api/subscribe"
              method="POST"
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email address"
                className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="px-7 py-3 rounded-full bg-accent text-[#1a1a2e] font-bold text-sm hover:bg-accent/90 transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>

      </div>
    </>
  );
}
