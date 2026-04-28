import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & News | Kingdom Deliverance Centre Uganda",
  description: "Read the latest news, teachings, devotionals, and updates from Kingdom Deliverance Centre Uganda.",
};

export const revalidate = 3600;

export default async function BlogPage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(name)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const featured = posts?.[0];
  const rest = posts?.slice(1) ?? [];

  return (
    <div className="flex flex-col">
      <section className="relative py-40 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[#0d1b3e]" />
        <div className="container relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
            News &amp; Teachings
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">Blog &amp; Updates</h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/90 text-lg md:text-xl max-w-xl mx-auto">
            Stay connected with the latest news, devotionals, and insights from our church family.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container px-4">
          {!posts || posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl">No posts published yet.</p>
              <p className="mt-2">Check back soon for news, teachings, and updates!</p>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Featured */}
              {featured && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pb-16 border-b border-primary/10">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl overflow-hidden">
                    {featured.featured_image ? (
                      <img src={featured.featured_image} alt={featured.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-20 h-20 text-primary/20" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-5">
                    <span className="text-xs border border-accent/40 text-accent rounded-full px-3 py-1 font-semibold uppercase tracking-wider">
                      {featured.type === "news" ? "News" : "Blog Post"}
                    </span>
                    <h2 className="font-serif text-4xl font-bold text-primary leading-tight">{featured.title}</h2>
                    {featured.excerpt && <p className="text-primary/70 leading-relaxed text-lg">{featured.excerpt}</p>}
                    <div className="text-sm text-muted-foreground">
                      {featured.profiles?.name && <span>By {featured.profiles.name} · </span>}
                      {featured.published_at && format(new Date(featured.published_at), "MMMM d, yyyy")}
                    </div>
                    <Link href={`/blog/${featured.slug}`} className="inline-flex items-center gap-2 text-accent font-semibold hover:underline">
                      Read Article <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rest.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group block bg-white rounded-2xl overflow-hidden border border-primary/10 shadow hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                      {post.featured_image ? (
                        <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-primary/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <span className="text-xs text-accent font-semibold uppercase tracking-wider">{post.type}</span>
                      <h3 className="font-serif text-xl font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">{post.title}</h3>
                      {post.excerpt && <p className="text-sm text-primary/70 line-clamp-3 leading-relaxed">{post.excerpt}</p>}
                      <p className="text-xs text-muted-foreground">
                        {post.profiles?.name && `${post.profiles.name} · `}
                        {post.published_at && format(new Date(post.published_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
