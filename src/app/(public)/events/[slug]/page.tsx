import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, ExternalLink, Clock, Share2, Mail, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("title,description").eq("slug", params.slug).single();
  if (!event) return { title: "Event Not Found" };
  return { title: `${event.title} | KDC Uganda Events`, description: event.description ?? undefined };
}

export const revalidate = 3600;

export default async function EventDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("*").eq("slug", params.slug).single();
  if (!event) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#0a121f] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 px-4 max-w-7xl mx-auto text-white text-center">
          <Link href="/events" className="inline-flex items-center gap-2 text-[#eab308] hover:underline text-sm font-semibold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to All Events
          </Link>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 text-[#eab308] text-xs font-bold uppercase tracking-widest">
              {event.status === "upcoming" ? "Upcoming Event" : event.status === "ongoing" ? "Happening Now" : "Past Event"}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif leading-tight">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60 pt-4 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#eab308]" /> 
                {format(new Date(event.date), "MMMM d, yyyy")}
              </span>
              {event.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#eab308]" /> 
                  {event.location.split(',')[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container px-4 max-w-7xl mx-auto -mt-10 mb-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Description & Content */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1 h-6 bg-[#eab308] rounded-full" />
                  <h2 className="text-2xl font-bold font-serif text-[#0a121f]">Event Overview</h2>
                </div>
                
                {event.description && (
                  <p className="text-xl text-gray-600 leading-relaxed font-medium">
                    {event.description}
                  </p>
                )}

                {event.content && (
                  <div 
                    className="prose prose-lg max-w-none prose-headings:text-[#0a121f] prose-p:text-gray-600 prose-a:text-[#eab308] pt-8 border-t border-gray-50" 
                    dangerouslySetInnerHTML={{ __html: event.content }} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            
            {/* Event Info Card */}
            <div className="bg-[#0a121f] text-white p-8 rounded-3xl shadow-xl shadow-[#0a121f]/10">
              <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                <Info className="w-5 h-5 text-[#eab308]" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Event Logistics</h3>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-[#eab308]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">When</p>
                    <p className="font-bold text-white leading-tight">
                      {format(new Date(event.date), "MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-white/60 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {format(new Date(event.date), "h:mm a")}
                    </p>
                    {event.end_date && (
                      <p className="text-xs text-white/40 mt-1">to {format(new Date(event.end_date), "MMMM d, yyyy")}</p>
                    )}
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#eab308]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Where</p>
                      <p className="font-bold text-white leading-tight">{event.location}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-10 space-y-4">
                {event.registration_url && (
                  <Button asChild className="w-full bg-[#eab308] hover:bg-[#eab308]/90 text-[#0a121f] h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#eab308]/10">
                    <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                      Secure Your Seat <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:border-white/20 h-14 rounded-2xl text-white font-bold transition-all">
                  <Link href="/contact">Inquire More Info</Link>
                </Button>
              </div>
            </div>

            {/* Share Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Share2 className="w-5 h-5 text-[#eab308]" />
                <h3 className="text-sm font-bold text-[#0a121f] uppercase tracking-widest">Invite Others</h3>
              </div>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">
                Be a blessing to someone today. Invite your family and friends to this event by sharing it on social media.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#0a121f]">Facebook</span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-[#1DA1F2] group-hover:text-white transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#0a121f]">Twitter</span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-[#D44638] group-hover:text-white transition-all duration-300">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#0a121f]">Email</span>
                </button>
              </div>
            </div>

            {/* Support KDC */}
            <div className="bg-gradient-to-br from-[#0a121f] to-[#1a2b4b] p-8 rounded-3xl text-white relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#eab308] opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
              <h4 className="text-xl font-bold mb-3 relative z-10">Support the Ministry</h4>
              <p className="text-sm text-white/60 mb-6 leading-relaxed relative z-10">
                Your seeds and offerings help us organize these life-transforming encounters.
              </p>
              <Button asChild className="w-full bg-white/10 hover:bg-white text-white hover:text-[#0a121f] border border-white/10 rounded-2xl font-bold transition-all relative z-10">
                <Link href="/give">Give Online</Link>
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
