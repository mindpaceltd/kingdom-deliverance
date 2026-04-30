import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Headphones, Calendar, User, ArrowLeft, Clock, Play, Share2, Mail, BookOpen, Layers } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from("sermons").select("title,description").eq("slug", params.slug).single();
  if (!data) return { title: "Sermon Not Found" };
  return { title: `${data.title} | KDC Uganda Sermons`, description: data.description ?? undefined };
}

export const revalidate = 3600;

export default async function SermonDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: sermon } = await supabase.from("sermons").select("*").eq("slug", params.slug).single();
  if (!sermon) notFound();

  const { data: related } = await supabase
    .from("sermons")
    .select("id,title,slug,preacher,date,series")
    .eq("status", "published")
    .neq("id", sermon.id)
    .limit(4)
    .order("date", { ascending: false });

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero / Header Section */}
      <section className="relative pt-32 pb-20 bg-[#0a121f] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 px-4 max-w-7xl mx-auto text-white text-center">
          <Link href="/sermons" className="inline-flex items-center gap-2 text-[#eab308] hover:underline text-sm font-semibold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to All Sermons
          </Link>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {sermon.series && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 text-[#eab308] text-xs font-bold uppercase tracking-widest">
                <Layers className="w-3.5 h-3.5" />
                {sermon.series}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif leading-tight">
              {sermon.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60 pt-4">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#eab308]" /> 
                <span className="font-semibold text-white/90">{sermon.preacher}</span>
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#eab308]" /> 
                {format(new Date(sermon.date), "MMMM d, yyyy")}
              </span>
              {sermon.duration_minutes && (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#eab308]" /> 
                  {sermon.duration_minutes} min
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container px-4 max-w-7xl mx-auto -mt-10 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Media & Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Video Player Container */}
            {sermon.video_url && (
              <div className="relative group bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-video">
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

            {/* Audio Player Container */}
            {sermon.audio_url && (
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#0a121f] flex items-center justify-center shrink-0 shadow-lg shadow-[#0a121f]/20">
                  <Headphones className="w-8 h-8 text-[#eab308]" />
                </div>
                <div className="flex-1 w-full space-y-4 text-center md:text-left">
                  <div>
                    <h3 className="font-bold text-[#0a121f] text-lg">Listen to Audio</h3>
                    <p className="text-sm text-gray-500">Download or stream the audio version of this message</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <audio src={sermon.audio_url} controls className="flex-1 w-full h-10" />
                    <Button asChild variant="outline" size="sm" className="rounded-full border-gray-200">
                      <a href={sermon.audio_url} download className="flex items-center gap-2">
                        Download <Play className="w-3.5 h-3.5 rotate-90" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* About the Sermon */}
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1 h-6 bg-[#eab308] rounded-full" />
                  <h2 className="text-2xl font-bold font-serif text-[#0a121f]">About This Message</h2>
                </div>
                
                {sermon.description && (
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {sermon.description}
                  </p>
                )}

                {sermon.content && (
                  <div 
                    className="prose prose-lg max-w-none prose-headings:text-[#0a121f] prose-p:text-gray-600 prose-a:text-[#eab308] pt-4 border-t border-gray-50" 
                    dangerouslySetInnerHTML={{ __html: sermon.content }} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            
            {/* Preacher Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden bg-gray-50 border-2 border-[#eab308]/20 p-1">
                <div className="w-full h-full rounded-full bg-[#0a121f] flex items-center justify-center">
                  <User className="w-12 h-12 text-[#eab308]/50" />
                </div>
              </div>
              <h4 className="text-xs font-bold text-[#eab308] uppercase tracking-[0.2em] mb-1">Preacher</h4>
              <h3 className="text-xl font-bold text-[#0a121f]">{sermon.preacher}</h3>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                Experience the powerful Word of God as delivered through the leadership of KDC Uganda.
              </p>
              <div className="flex justify-center gap-4 mt-6">
                <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-[#eab308] hover:text-white transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></button>
                <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-[#eab308] hover:text-white transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></button>
                <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-[#eab308] hover:text-white transition-all"><Mail className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Series Card */}
            {sermon.series && (
              <div className="bg-[#0a121f] p-8 rounded-2xl text-white">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <Layers className="w-5 h-5 text-[#eab308]" />
                  <h4 className="text-sm font-bold uppercase tracking-wider">Sermon Series</h4>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{sermon.series}</h3>
                <p className="text-sm text-white/60 mb-6 leading-relaxed">
                  Explore other messages from this powerful collection of teachings.
                </p>
                <Button asChild className="w-full bg-[#eab308] hover:bg-[#eab308]/90 text-[#0a121f] font-bold rounded-xl">
                  <Link href={`/sermons?series=${encodeURIComponent(sermon.series)}`}>View Entire Series</Link>
                </Button>
              </div>
            )}

            {/* Newsletter / Stay Connected */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Share2 className="w-5 h-5 text-[#eab308]" />
                <h4 className="text-sm font-bold text-[#0a121f] uppercase tracking-wider">Spread the Word</h4>
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Help spread the Gospel by sharing this message with your friends and family.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-xl border-gray-100 hover:bg-[#eab308] hover:text-white transition-all">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook
                </Button>
                <Button variant="outline" className="rounded-xl border-gray-100 hover:bg-[#eab308] hover:text-white transition-all">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Twitter
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* More Messages Section */}
      {related && related.length > 0 && (
        <section className="bg-white py-20 border-t border-gray-100">
          <div className="container px-4 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-widest">
                  <Play className="w-3 h-3" /> Latest
                </div>
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-[#0a121f]">Related Messages</h2>
              </div>
              <Link href="/sermons" className="text-[#eab308] font-bold text-sm hover:underline flex items-center gap-2">
                Browse All Sermons <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map((s) => (
                <Link key={s.id} href={`/sermons/${s.slug}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="relative aspect-video bg-[#0a121f] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a121f] via-transparent to-transparent opacity-60" />
                    <Play className="w-12 h-12 text-white/20 group-hover:text-[#eab308] group-hover:scale-110 transition-all duration-500" />
                    {s.series && (
                      <span className="absolute top-3 left-3 bg-[#eab308] text-[#0a121f] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                        {s.series}
                      </span>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors line-clamp-2 min-h-[3rem]">
                      {s.title}
                    </h3>
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {s.preacher.split(' ').pop()}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(s.date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
