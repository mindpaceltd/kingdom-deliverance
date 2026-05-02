import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Headphones, Calendar, User, ArrowLeft, Clock, Eye } from "lucide-react";
import type { Metadata } from "next";
import { incrementSermonViews } from "@/lib/actions/event-views";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sermons")
    .select("title, description, meta_title, meta_description")
    .eq("slug", params.slug)
    .single();

  if (!data) return { title: "Sermon Not Found" };

  return {
    title: data.meta_title || `${data.title} | KDC Uganda Sermons`,
    description: data.meta_description || data.description || undefined,
  };
}

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export default async function SermonDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: sermon } = await supabase
    .from("sermons")
    .select("*, sermon_series(name)")
    .eq("slug", params.slug)
    .single();

  if (!sermon) notFound();

  // Track view (fire-and-forget, don't block render)
  void incrementSermonViews(sermon.id);

  const { data: related } = await supabase
    .from("sermons")
    .select("id,title,slug,preacher,date,series")
    .eq("status", "published")
    .neq("id", sermon.id)
    .limit(3)
    .order("date", { ascending: false });

  return (
    <div className="flex flex-col">
      <section className="py-24 bg-primary text-white">
        <div className="container px-4 max-w-4xl mx-auto">
          <Link href="/sermons" className="inline-flex items-center gap-2 text-white/60 hover:text-accent text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Sermons
          </Link>
          {(sermon.sermon_series?.name || sermon.series) && (
            <p className="text-accent font-semibold text-sm tracking-wider uppercase mb-3">
              {sermon.sermon_series?.name || sermon.series}
            </p>
          )}
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">{sermon.title}</h1>
          <div className="flex flex-wrap gap-5 mt-6 text-white/70 text-sm">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-accent" />{sermon.preacher}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-accent" />{format(new Date(sermon.date), "MMMM d, yyyy")}</span>
            {sermon.duration_minutes && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" />{sermon.duration_minutes} min</span>}
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-accent" />{(sermon.views || 0).toLocaleString()} views</span>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container px-4 max-w-4xl mx-auto space-y-10">
          {/* Video Player */}
          {sermon.video_url && (
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
              {sermon.video_url.includes("youtube") || sermon.video_url.includes("youtu.be") ? (
                <iframe
                  src={sermon.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={sermon.video_url} controls className="w-full h-full" />
              )}
            </div>
          )}

          {/* Audio Player */}
          {sermon.audio_url && (
            <div className="bg-muted rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Headphones className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary">{sermon.title}</p>
                <audio src={sermon.audio_url} controls className="w-full mt-2" />
              </div>
            </div>
          )}

          {/* Description */}
          {sermon.description && (
            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-primary">About This Message</h2>
              <p className="text-primary/80 leading-relaxed text-lg">{sermon.description}</p>
            </div>
          )}

          {/* Content */}
          {sermon.content && (
            <div className="prose prose-purple max-w-none" dangerouslySetInnerHTML={{ __html: sermon.content }} />
          )}

          {/* Related */}
          {related && related.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-6">More Messages</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((s) => (
                  <Link key={s.id} href={`/sermons/${s.slug}`} className="group block bg-muted rounded-xl p-5 hover:bg-accent/10 transition-colors">
                    {s.series && <p className="text-accent text-xs font-semibold mb-1">{s.series}</p>}
                    <h3 className="font-semibold text-primary group-hover:text-accent transition-colors line-clamp-2">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2">{s.preacher} · {format(new Date(s.date), "MMM d, yyyy")}</p>
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
