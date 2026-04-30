import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, User, Clock, Eye, Tag, ChevronRight } from "lucide-react";
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

// Extract H2/H3 headings from HTML for table of contents
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

// Inject IDs into headings for anchor links
function injectHeadingIds(html: string | null): string {
  if (!html) return "";
  let i = 0;
  return html.replace(/<h([23])([^>]*)>/gi, (_, level, attrs) => {
    return `<h${level}${attrs} id="heading-${i++}">`;
  });
}

// ---------------------------------------------------------------------------
// Share buttons (client island)
// ---------------------------------------------------------------------------

function ShareButtons({ url, title }: { url: string; title: string }) {
  const enc = encodeURIComponent;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Share</p>
      <a
        href={`https://wa.me/?text=${enc(title + " " + url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
        title="Share on WhatsApp"
        aria-label="Share on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:bg-zinc-800 transition-colors"
        title="Share on X / Twitter"
        aria-label="Share on X"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
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

  // Track view
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? undefined;
  const userAgent = headersList.get("user-agent") ?? undefined;
  void incrementPostViews(params.slug, `/blog/${params.slug}`, ip, userAgent);

  // Related posts + post tags in parallel
  const [relatedResult, tagsResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, slug, excerpt, featured_image, published_at")
      .eq("status", "published")
      .eq("type", post.type)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3),
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
      name: post.profiles?.name || "Kingdom Deliverance Centre Uganda",
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
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col">
        {/* ---------------------------------------------------------------- */}
        {/* HERO / TITLE AREA                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-primary text-white py-16">
          <div className="container px-4 max-w-4xl mx-auto">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/50 flex items-center gap-1.5 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/80 line-clamp-1">{post.title}</span>
            </nav>

            <span className="inline-block mb-4 text-xs font-bold tracking-widest uppercase text-accent border border-accent/50 rounded-full px-3 py-1">
              {post.type === "news" ? "News" : "Blog Post"}
            </span>

            <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-5">
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/65">
              {post.profiles?.name && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-accent" />
                  {post.profiles.name}
                </span>
              )}
              {post.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-accent" />
                  {format(new Date(post.published_at), "MMMM d, yyyy")}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-accent" />
                {rt}
              </span>
              {post.views > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-accent" />
                  {post.views.toLocaleString()} views
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* FEATURED IMAGE                                                    */}
        {/* ---------------------------------------------------------------- */}
        {post.featured_image && (
          <div className="relative aspect-[16/9] max-h-[520px] overflow-hidden bg-muted">
            <Image
              src={post.featured_image}
              alt={post.meta_title || post.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* MAIN CONTENT + SIDEBAR                                            */}
        {/* ---------------------------------------------------------------- */}
        <section className="py-12 bg-white">
          <div className="container px-4 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12">

              {/* Left: sticky share bar (desktop) */}
              <div className="hidden lg:flex flex-col items-center pt-2 w-12 shrink-0">
                <div className="sticky top-24">
                  <ShareButtons url={postUrl} title={post.title} />
                </div>
              </div>

              {/* Center: article content */}
              <article className="flex-1 min-w-0 max-w-3xl">
                {/* Excerpt / lead */}
                {post.excerpt && (
                  <p className="text-xl text-primary/70 leading-relaxed mb-8 font-light border-l-4 border-accent pl-5">
                    {post.excerpt}
                  </p>
                )}

                {/* Content */}
                {contentWithIds ? (
                  <div
                    className="prose prose-lg prose-purple max-w-none
                      prose-headings:font-serif prose-headings:text-primary
                      prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-xl prose-img:shadow-md
                      prose-blockquote:border-accent prose-blockquote:bg-accent/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                      prose-strong:text-primary
                      leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: contentWithIds }}
                  />
                ) : (
                  <p className="text-muted-foreground">Content coming soon.</p>
                )}

                {/* Mobile share */}
                <div className="lg:hidden mt-10 pt-6 border-t border-primary/10">
                  <p className="text-sm font-semibold text-primary mb-3">Share this post</p>
                  <div className="flex gap-3">
                    <ShareButtons url={postUrl} title={post.title} />
                  </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-primary/10 flex flex-wrap items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {tags.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={`/blog?q=${encodeURIComponent(tag.name)}`}
                        className="text-xs font-medium bg-primary/5 text-primary hover:bg-primary/10 transition-colors rounded-full px-3 py-1"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Author box */}
                <div className="mt-10 rounded-2xl border border-primary/10 bg-primary/3 p-6 flex gap-5 items-start">
                  <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {post.profiles?.avatar_url ? (
                      <Image src={post.profiles.avatar_url} alt={post.profiles.name ?? ""} width={56} height={56} className="object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-primary/40" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">About the Author</p>
                    <p className="font-semibold text-primary">{post.profiles?.name || "Kingdom Deliverance Centre Uganda"}</p>
                    <p className="text-sm text-primary/65 mt-1 leading-relaxed">
                      {post.profiles?.bio || "Spreading faith, transformation, and community impact across Uganda and the world through the power of the Gospel."}
                    </p>
                  </div>
                </div>
              </article>

              {/* Right sidebar */}
              <aside className="w-full lg:w-64 shrink-0 space-y-6">
                {/* Table of Contents */}
                {headings.length > 2 && (
                  <div className="sticky top-24 rounded-xl border border-primary/10 p-5 space-y-3">
                    <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Contents</h3>
                    <nav aria-label="Table of contents">
                      <ul className="space-y-1.5">
                        {headings.map((h) => (
                          <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
                            <a
                              href={`#${h.id}`}
                              className="text-sm text-primary/65 hover:text-accent transition-colors line-clamp-2 leading-snug block"
                            >
                              {h.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                )}

                {/* Post info */}
                <div className="rounded-xl border border-primary/10 p-5 space-y-3 text-sm">
                  <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Post Info</h3>
                  <div className="space-y-2 text-primary/65">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent shrink-0" />
                      {post.published_at ? format(new Date(post.published_at), "MMMM d, yyyy") : "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent shrink-0" />
                      {rt}
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-accent shrink-0" />
                      {(post.views ?? 0).toLocaleString()} views
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* RELATED POSTS                                                     */}
        {/* ---------------------------------------------------------------- */}
        {related.length > 0 && (
          <section className="py-16 bg-muted/40">
            <div className="container px-4 max-w-5xl mx-auto">
              <h2 className="font-serif text-2xl font-bold text-primary mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((p) => (
                  <article key={p.id} className="group bg-white rounded-2xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                    <Link href={`/blog/${p.slug}`} className="block aspect-[16/9] bg-primary/5 overflow-hidden relative">
                      {p.featured_image ? (
                        <Image
                          src={p.featured_image}
                          alt={p.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-primary/20" />
                        </div>
                      )}
                    </Link>
                    <div className="p-5 space-y-2">
                      <h3 className="font-semibold text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                        <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                      </h3>
                      {p.excerpt && <p className="text-sm text-primary/65 line-clamp-2">{p.excerpt}</p>}
                      {p.published_at && (
                        <p className="text-xs text-muted-foreground">{format(new Date(p.published_at), "MMM d, yyyy")}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CTA                                                               */}
        {/* ---------------------------------------------------------------- */}
        <section className="py-20 bg-primary text-white text-center">
          <div className="container px-4 max-w-2xl mx-auto space-y-6">
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              Join Kingdom Deliverance Centre Uganda
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              Experience powerful teaching and transformation. Be part of a community
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
    </>
  );
}
