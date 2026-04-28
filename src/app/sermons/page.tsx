import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { Play, Headphones, Calendar, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sermons | Kingdom Deliverance Centre Uganda",
  description: "Watch and listen to powerful messages from Bishop Climate Wiseman and the KDC Uganda leadership team.",
};

export const revalidate = 3600;

export default async function SermonsPage() {
  const supabase = createClient();
  const { data: sermons } = await supabase
    .from("sermons")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: false });

  const featured = sermons?.[0];
  const rest = sermons?.slice(1) ?? [];

  const series = Array.from(new Set(sermons?.map((s) => s.series).filter(Boolean) ?? []));

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-40 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=2000&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
            The Word of God
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">Sermons &amp; Messages</h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/90 text-lg md:text-xl max-w-xl mx-auto">
            Be transformed by the power of God&apos;s Word. Watch, listen, and be blessed.
          </p>
        </div>
      </section>

      {/* Featured Sermon */}
      {featured && (
        <section className="py-16 bg-white border-b">
          <div className="container px-4">
            <h2 className="font-serif text-2xl font-bold text-primary mb-8 flex items-center gap-3">
              <span className="w-2 h-8 bg-accent rounded-full inline-block" />
              Latest Message
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-purple-900/60 flex items-center justify-center">
                  <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                  </div>
                </div>
                {featured.thumbnail_url && (
                  <img src={featured.thumbnail_url} alt={featured.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="space-y-5">
                {featured.series && (
                  <span className="text-accent text-sm font-semibold tracking-wider uppercase">{featured.series}</span>
                )}
                <h3 className="font-serif text-3xl font-bold text-primary leading-tight">{featured.title}</h3>
                {featured.description && (
                  <p className="text-primary/70 leading-relaxed text-lg">{featured.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-accent" />{featured.preacher}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-accent" />{format(new Date(featured.date), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  {featured.video_url && (
                    <Button asChild className="bg-accent text-primary hover:bg-accent/90">
                      <a href={featured.video_url} target="_blank" rel="noopener noreferrer">
                        <Play className="w-4 h-4 mr-2" /> Watch Now
                      </a>
                    </Button>
                  )}
                  {featured.audio_url && (
                    <Button asChild variant="outline" className="border-primary text-primary">
                      <a href={featured.audio_url} target="_blank" rel="noopener noreferrer">
                        <Headphones className="w-4 h-4 mr-2" /> Listen
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="ghost" className="text-primary">
                    <Link href={`/sermons/${featured.slug}`}>Full Details <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sermon Grid */}
      <section className="py-20 bg-muted">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <h2 className="font-serif text-3xl font-bold text-primary">All Sermons</h2>
            <div className="flex flex-wrap gap-3">
              {series.slice(0, 4).map((s) => (
                <span key={s} className="text-xs border border-primary/20 rounded-full px-3 py-1 text-primary/60 cursor-pointer hover:border-accent hover:text-accent transition-colors">{s}</span>
              ))}
            </div>
          </div>

          {rest.length === 0 && !featured ? (
            <div className="text-center py-20 text-muted-foreground">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl">No sermons available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((sermon) => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SermonCard({ sermon }: { sermon: { id: string, slug: string, title: string, description: string | null, preacher: string, date: string, series: string | null, video_url: string | null, audio_url: string | null } }) {
  return (
    <Link href={`/sermons/${sermon.slug}`} className="group block bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition-all hover:-translate-y-1">
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/40 relative flex items-center justify-center">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-accent transition-colors">
          <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
        </div>
        {sermon.series && (
          <span className="absolute top-3 left-3 text-xs bg-accent text-primary font-semibold px-2 py-0.5 rounded-full">{sermon.series}</span>
        )}
      </div>
      <div className="p-5 space-y-3">
        <h3 className="font-serif text-lg font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">{sermon.title}</h3>
        {sermon.description && (
          <p className="text-sm text-primary/70 line-clamp-2 leading-relaxed">{sermon.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{sermon.preacher}</span>
          <span>{format(new Date(sermon.date), "MMM d, yyyy")}</span>
        </div>
        <div className="flex gap-2">
          {sermon.video_url && <span className="flex items-center gap-1 text-xs text-accent font-medium"><Play className="w-3 h-3" /> Video</span>}
          {sermon.audio_url && <span className="flex items-center gap-1 text-xs text-primary/60 font-medium"><Headphones className="w-3 h-3" /> Audio</span>}
        </div>
      </div>
    </Link>
  );
}
