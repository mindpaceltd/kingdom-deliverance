import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User } from "lucide-react";
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
  // Use featured image if available, otherwise generate a dynamic OG image
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
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
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

export default async function BlogPostPage({ params }: Props) {
  // Auto-publish any scheduled posts whose time has arrived (Requirement 10.1)
  await autoPublishScheduled();

  const supabase = createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles(name, avatar_url)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  // Track page view server-side with IP and user-agent for bot filtering and throttling (Requirement 9.1)
  const headersList = headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    undefined;
  const userAgent = headersList.get("user-agent") ?? undefined;
  void incrementPostViews(params.slug, `/blog/${params.slug}`, ip, userAgent);

  const { data: related } = await supabase
    .from("posts")
    .select("id,title,slug,excerpt,published_at")
    .eq("status", "published")
    .eq("type", post.type)
    .neq("id", post.id)
    .limit(3)
    .order("published_at", { ascending: false });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-24 bg-primary text-white">
        <div className="container px-4 max-w-4xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-white/60 hover:text-accent text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
          <span className="inline-block mb-4 text-xs font-bold tracking-widest uppercase text-accent border border-accent/50 rounded-full px-3 py-1">
            {post.type === "news" ? "News" : "Blog Post"}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">{post.title}</h1>
          <div className="flex flex-wrap gap-5 mt-6 text-white/70 text-sm">
            {post.profiles?.name && (
              <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-accent" />{post.profiles.name}</span>
            )}
            {post.published_at && (
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-accent" />{format(new Date(post.published_at), "MMMM d, yyyy")}</span>
            )}
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative aspect-[21/9] max-h-96 overflow-hidden bg-muted">
          <Image src={post.featured_image} alt={post.title} fill className="object-cover" sizes="100vw" />
        </div>
      )}

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="container px-4 max-w-3xl mx-auto">
          {post.excerpt && (
            <p className="text-xl text-primary/70 leading-relaxed mb-8 font-light border-l-4 border-accent pl-6">{post.excerpt}</p>
          )}
          {post.content ? (
            <div
              className="prose prose-purple prose-lg max-w-none prose-headings:font-serif prose-a:text-accent"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <p className="text-muted-foreground">Content coming soon.</p>
          )}
        </div>
      </section>

      {/* Related Posts */}
      {related && related.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="container px-4 max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-bold text-primary mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group block bg-white rounded-xl p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-primary group-hover:text-accent transition-colors line-clamp-2">{p.title}</h3>
                  {p.excerpt && <p className="text-sm text-primary/70 mt-2 line-clamp-2">{p.excerpt}</p>}
                  {p.published_at && <p className="text-xs text-muted-foreground mt-3">{format(new Date(p.published_at), "MMM d, yyyy")}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
