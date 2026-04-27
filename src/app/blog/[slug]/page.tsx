import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User } from "lucide-react";
import type { Metadata } from "next";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from("posts").select("title,excerpt").eq("slug", params.slug).single();
  if (!data) return { title: "Post Not Found" };
  return { title: `${data.title} | KDC Uganda Blog`, description: data.excerpt ?? undefined };
}

export const revalidate = 3600;

export default async function BlogPostPage({ params }: Props) {
  const supabase = createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles(name, avatar_url)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

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
        <div className="aspect-[21/9] max-h-96 overflow-hidden bg-muted">
          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
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
