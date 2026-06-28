import { createClient } from '@/lib/supabase/server';
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, User, Clock, Eye, ChevronRight, Download, Globe, Mail } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { incrementPostViews } from "@/lib/actions/post-views";
import { autoPublishScheduled } from "@/lib/actions/post-utils";
import { createSocialImageMetadata, stripHtmlExcerpt } from "@/lib/seo-image-utils";
import { createCanonicalMetadata } from "@/lib/seo/canonical-utils";
import { getOrgOgImageUrl, getSiteName } from "@/lib/seo/site-branding";
import { BreadcrumbSchema, generateBreadcrumbs } from "@/components/seo/breadcrumb-schema";

interface Props { params: { slug: string } }

// ---------------------------------------------------------------------------
// Metadata + OG tags
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const [postResult, orgOgImage, siteName] = await Promise.all([
    supabase
      .from("posts")
      .select("title, excerpt, featured_image, meta_title, meta_description, slug")
      .eq("slug", params.slug)
      .single(),
    getOrgOgImageUrl(),
    getSiteName(),
  ]);

  const data = postResult.data;
  if (!data) return { title: "Post Not Found" };

  const ogTitle = data.meta_title?.trim() || data.title;
  const excerpt =
    data.meta_description?.trim() ||
    data.excerpt?.trim() ||
    stripHtmlExcerpt(data.excerpt, 160) ||
    "Read this post on Kingdom Deliverance Centre Uganda.";
  const pageUrl = `https://kdcuganda.org/blog/${data.slug}`;
  const socialImage = createSocialImageMetadata(
    ogTitle,
    excerpt,
    data.featured_image,
    "blog",
    orgOgImage
  );

  return {
    title: ogTitle,
    description: excerpt,
    ...createCanonicalMetadata(`/blog/${data.slug}`),
    openGraph: {
      title: ogTitle,
      description: excerpt,
      url: pageUrl,
      siteName,
      type: "article",
      locale: "en_UG",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: excerpt,
      images: [socialImage.url],
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

function fixExternalLinks(html: string | null): string {
  if (!html) return "";
  return html.replace(
    /href=["'](instagram\.com|facebook\.com|twitter\.com|youtube\.com|x\.com|tiktok\.com|linkedin\.com)([^\s"']*)["']/gi,
    'href="https://$1$2"'
  );
}

// ---------------------------------------------------------------------------
// Share buttons
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
      <span className="text-sm text-gray-500">Share this post:</span>
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const cleanContent = fixExternalLinks(post.content);
  const contentWithIds = injectHeadingIds(cleanContent);
  const rt = readTime(post.content);
  const isLongContent = (post.content?.length ?? 0) > 1500;

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
      <BreadcrumbSchema items={generateBreadcrumbs('blog', post.title, post.slug)} />

      <div className="flex flex-col min-h-screen">

        {/* ================================================================ */}
        {/* HERO SECTION                                                     */}
        {/* ================================================================ */}
        <section className="relative w-full min-h-[40vh] lg:min-h-[60vh] flex items-center overflow-hidden bg-[#0a1428]">
          {/* Background Image */}
          {post.featured_image && (
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={post.featured_image}
                alt={post.meta_title || post.title}
                fill
                priority
                className="object-cover object-center lg:object-[center_right]"
                sizes="100vw"
                unoptimized={post.featured_image.toLowerCase().endsWith('.heic') || post.featured_image.toLowerCase().endsWith('.heif')}
              />
              {/* Overlay: Solid dark on mobile, Gradient on desktop */}
              <div className="absolute inset-0 bg-[#0a1428]/85 lg:bg-transparent lg:bg-gradient-to-r lg:from-[#0a1428] lg:from-30% lg:via-[#0a1428]/60 lg:via-55% lg:to-transparent" />
            </div>
          )}

          {/* Content Container */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 lg:pt-40 lg:pb-24">
            <div className="w-full lg:w-3/5 flex flex-col items-start gap-5 lg:gap-6">
              
              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="text-sm text-gray-400 flex items-center gap-2 flex-wrap">
                <Link href="/" className="hover:text-gray-200 transition-colors">Home</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/blog" className="hover:text-gray-200 transition-colors">Blog</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gray-300 line-clamp-1">{post.title}</span>
              </nav>

              {/* Category badge */}
              <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#eab308] text-[#0a121f] text-xs font-bold tracking-widest uppercase shadow-sm">
                {post.type === "news" ? "NEWS" : post.type === "biography" ? "BIOGRAPHY" : "BLOG POST"}
              </span>

              {/* Title */}
              <h1 className="text-white font-bold leading-tight text-2xl md:text-3xl xl:text-4xl drop-shadow-md">
                {post.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm text-gray-300 mt-2">
                {authorName && (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#eab308]" />
                    <span className="text-white font-medium">{authorName}</span>
                  </span>
                )}
                {post.published_at && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#eab308]" />
                    {format(new Date(post.published_at), "MMMM d, yyyy")}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#eab308]" />
                  {rt}
                </span>
                {(post.views ?? 0) > 0 && (
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#eab308]" />
                    {(post.views ?? 0).toLocaleString()} views
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SHARE BAR — white, full-width                                     */}
        {/* ================================================================ */}
        <div className="bg-white border-b border-gray-100 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ShareRow url={postUrl} title={post.title} />
          </div>
        </div>

        {/* ================================================================ */}
        {/* MAIN CONTENT + SIDEBAR                                            */}
        {/* ================================================================ */}
        <section className="py-10 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">

              {/* ---------------------------------------------------------- */}
              {/* LEFT — Article (flex-1, no max-width cap)                   */}
              {/* ---------------------------------------------------------- */}
              <article className="flex-1 min-w-0">

                {/* Lead quote block */}
                {post.excerpt && (
                  <blockquote className="border-l-4 border-amber-400 bg-amber-50 rounded-r-xl px-6 py-5 mb-10 italic text-lg text-gray-700 leading-relaxed font-light">
                    {post.excerpt}
                  </blockquote>
                )}

                {/* Article body */}
                {contentWithIds ? (
                  <div
                    className="prose prose-lg prose-slate max-w-none
                      prose-headings:font-bold prose-headings:text-gray-900
                      prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
                      prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-base
                      prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-xl prose-img:shadow-md
                      prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic
                      prose-strong:text-gray-900 prose-strong:font-bold
                      prose-ul:space-y-1 prose-li:text-gray-700
                      prose-li:marker:text-amber-500
                      leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: contentWithIds }}
                  />
                ) : (
                  <p className="text-muted-foreground">Content coming soon.</p>
                )}

                {/* Read Full Article button — only shown for long content */}
                {isLongContent && (
                  <div className="flex justify-center my-10">
                    <a
                      href="#author-box"
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      Read Full Article
                    </a>
                  </div>
                )}

                {/* Author box */}
                <div id="author-box" className="mt-12 rounded-2xl border border-border bg-gray-50 p-6 flex gap-5 items-start">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border-2 border-amber-400/40">
                    {authorAvatar ? (
                      <Image src={authorAvatar} alt={authorName ?? "Author"} width={64} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <User className="w-8 h-8 text-primary/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">About the Author</p>
                    <p className="font-bold text-primary text-lg leading-tight">{authorName || "Kingdom Deliverance Centre Uganda"}</p>
                    {authorBio ? (
                      <div
                        className="prose prose-sm prose-neutral dark:prose-invert mt-2 max-w-none text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: authorBio }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        Spreading faith, transformation, and community impact across Uganda and
                        the world through the power of the Gospel.
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-4">
                      <a href="https://facebook.com/kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors">
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

              {/* ---------------------------------------------------------- */}
              {/* RIGHT — Sidebar (w-72)                                       */}
              {/* ---------------------------------------------------------- */}
              <aside className="w-full lg:w-64 shrink-0">
                <div className="lg:sticky lg:top-24 space-y-6">

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="font-bold text-gray-900 text-base mb-4">
                      About {authorName || "the Author"}
                    </h3>
                    <div className="flex items-start gap-3">
                      {/* Image on LEFT */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        {authorAvatar ? (
                          <Image src={authorAvatar} alt={authorName ?? "Author"} width={80} height={80} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      {/* Text on RIGHT */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">Global Prophetic Leader</p>
                        <p className="text-xs text-gray-500 mt-0.5">Founder, Kingdom Temple</p>
                        <p className="text-xs text-amber-600 font-medium mt-1">Visionary | Author | Mentor</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <a href="https://facebook.com/kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                          </a>
                          <a href="https://youtube.com/@kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                          </a>
                          <a href="https://instagram.com/kdcuganda" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path fill="none" stroke="white" strokeWidth="2" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line fill="none" stroke="white" strokeWidth="2" x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                          </a>
                          <a href="https://kdcuganda.org" target="_blank" rel="noopener noreferrer" aria-label="Website" className="w-6 h-6 rounded-full bg-[#0a121f] flex items-center justify-center text-white hover:bg-[#0a121f]/80 transition-colors">
                            <Globe className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table of Contents — dark card */}
                  {headings.length > 1 && (
                    <div className="rounded-xl bg-[#0a121f] text-white p-6">
                      <div className="mb-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Table of Contents</h3>
                        <div className="mt-1.5 h-0.5 w-10 bg-amber-400 rounded-full" />
                      </div>
                      <nav aria-label="Table of contents">
                        <ol className="space-y-2.5">
                          {headings.map((h, idx) => (
                            <li key={h.id} className={`flex items-start gap-2.5 ${h.level === 3 ? "pl-5" : ""}`}>
                              <span className="text-xs font-bold text-amber-400 shrink-0 mt-0.5 tabular-nums">
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <a
                                href={`#${h.id}`}
                                className="text-sm text-white/70 hover:text-amber-400 transition-colors line-clamp-2 leading-snug"
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
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-5 rounded-full bg-amber-400" />
                        <h3 className="font-bold text-primary text-sm uppercase tracking-wider">Popular Tags</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Link
                            key={tag.slug}
                            href={`/blog?q=${encodeURIComponent(tag.name)}`}
                            className="text-xs font-medium bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700 transition-colors rounded-full px-3 py-1.5"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SHARE ROW — below main content                                    */}
        {/* ================================================================ */}
        <div className="bg-white border-t border-gray-100 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ShareRow url={postUrl} title={post.title} />
          </div>
        </div>

        {/* ================================================================ */}
        {/* RELATED POSTS — "You May Also Like" 4-column grid                 */}
        {/* ================================================================ */}
        {related.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-bold text-2xl md:text-3xl text-gray-900 mb-8">You May Also Like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {related.map((p) => (
                  <article key={p.id} className="group bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                    <Link href={`/blog/${p.slug}`} className="block relative aspect-[4/3] bg-primary/5 overflow-hidden">
                      {p.featured_image ? (
                        <Image
                          src={p.featured_image}
                          alt={p.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                          unoptimized={p.featured_image.toLowerCase().endsWith('.heic') || p.featured_image.toLowerCase().endsWith('.heif')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <User className="w-6 h-6 md:w-8 md:h-8 text-primary/20" />
                        </div>
                      )}
                      {/* Category badge overlay */}
                      <span className="absolute top-2 left-2 md:top-3 md:left-3 text-[8px] md:text-[10px] font-bold uppercase tracking-widest bg-amber-400 text-[#1a1a2e] rounded-full px-1.5 py-0.5 md:px-2.5 md:py-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(p as any).type === "news" ? "NEWS" : (p as any).type === "biography" ? "BIOGRAPHY" : "BLOG"}
                      </span>
                    </Link>
                    <div className="p-3 md:p-4 space-y-1.5 md:space-y-2">
                      <h3 className="font-semibold text-primary group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug text-xs md:text-sm">
                        <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                      </h3>
                      {p.published_at && (
                        <div className="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-3 text-[9px] md:text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="truncate max-w-[80px] md:max-w-none">{format(new Date(p.published_at), "MMM d, yyyy")}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {readTime((p as any).content ?? null)}
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

        {/* ================================================================ */}
        {/* NEWSLETTER CTA — dark bg, horizontal layout                       */}
        {/* ================================================================ */}
        <section className="py-12 bg-[#0a121f] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Left: icon + text */}
              <div className="flex items-start gap-5 flex-1">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-400/20 shrink-0">
                  <Mail className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">Stay Connected</h2>
                  <p className="text-white/70 mt-1 text-sm leading-relaxed max-w-sm">
                    Get the latest teachings, news, and updates from Kingdom Deliverance Centre Uganda delivered straight to your inbox.
                  </p>
                </div>
              </div>
              {/* Right: email input + button */}
              <form
                action="/api/subscribe"
                method="POST"
                className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:min-w-[380px]"
              >
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email address"
                  className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full bg-amber-400 text-[#1a1a2e] font-bold text-sm hover:bg-amber-300 transition-colors shrink-0"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
