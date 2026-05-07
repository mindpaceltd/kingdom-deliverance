import { createClient } from '@/lib/supabase/server';
import Image from "next/image";
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
    .select("title, description, meta_title, meta_description, thumbnail_url, slug")
    .eq("slug", params.slug)
    .single();

  if (!data) return { title: "Sermon Not Found" };

  const title = data.meta_title || `${data.title} | KDC Uganda Sermons`;
  const description = data.meta_description || data.description || "Watch and listen to powerful sermons from Kingdom Deliverance Centre Uganda.";
  const url = `https://kdcuganda.org/sermons/${data.slug}`;
  
  // Use thumbnail if it's a stable hosted URL (not a dynamic generation URL)
  // Fall back to our branded OG image generator
  const isStableImage = data.thumbnail_url && 
    !data.thumbnail_url.includes('pollinations.ai') &&
    (data.thumbnail_url.startsWith('https://') || data.thumbnail_url.startsWith('http://'));
  const image = isStableImage 
    ? data.thumbnail_url 
    : `https://kdcuganda.org/og?title=${encodeURIComponent(data.title)}&description=${encodeURIComponent((data.description || '').slice(0, 100))}`;

  return {
    title,
    description,
    openGraph: {
      title: data.meta_title || data.title,
      description,
      url,
      siteName: "Kingdom Deliverance Centre Uganda",
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: data.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: data.meta_title || data.title,
      description,
      images: [image],
    },
  };
}

export const revalidate = 3600;

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
      <section className="relative py-24 text-white bg-primary overflow-hidden">
        {sermon.thumbnail_url && (
          <div className="absolute inset-0 z-0">
            <Image 
              src={sermon.thumbnail_url}
              alt=""
              fill
              className="object-cover object-center opacity-50"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
          </div>
        )}
        <div className="relative z-10 container px-4 max-w-4xl mx-auto text-center flex flex-col items-center">
          <Link href="/sermons" className="inline-flex items-center gap-2 text-white/60 hover:text-accent text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Sermons
          </Link>
          {(sermon.sermon_series?.name || sermon.series) && (
            <p className="text-accent font-semibold text-sm tracking-wider uppercase mb-3">
              {sermon.sermon_series?.name || sermon.series}
            </p>
          )}
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight text-accent">{sermon.title}</h1>
          <div className="flex flex-wrap justify-center gap-5 mt-6 text-white/70 text-sm">
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
