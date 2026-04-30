import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events | Kingdom Deliverance Centre Uganda",
  description: "Upcoming church events, conferences, outreaches and special services at Kingdom Deliverance Centre Uganda.",
};

export const revalidate = 3600;

export default async function EventsPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("status", ["upcoming", "ongoing"])
    .order("date", { ascending: true });

  const { data: pastEvents } = await supabase
    .from("events")
    .select("*")
    .eq("status", "past")
    .order("date", { ascending: false })
    .limit(4);

  const featured = events?.find((e) => e.is_featured);
  const upcoming = events?.filter((e) => !e.is_featured) ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero */}
      <section className="relative pt-40 pb-24 text-white overflow-hidden bg-[#0a121f]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-8">
            <Sparkles className="w-3.5 h-3.5" /> What&apos;s Happening
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Upcoming <span className="text-[#eab308]">Events</span>
          </h1>
          <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-[#eab308] to-yellow-500" />
          <p className="mt-8 text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Join our vibrant community for powerful services, life-changing conferences, and special programs designed for your spiritual growth.
          </p>
        </div>
      </section>

      {/* Featured Event Section */}
      {featured && (
        <section className="py-20 relative z-20 -mt-10">
          <div className="container px-4 max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 lg:flex min-h-[450px]">
              {/* Left Side: Info */}
              <div className="lg:w-3/5 p-8 md:p-14 flex flex-col justify-center space-y-6">
                <div className="flex items-center gap-2 text-[#eab308]">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Featured Event</span>
                </div>
                <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#0a121f] leading-tight">
                  {featured.title}
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
                  {featured.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-gray-100 flex items-center justify-center text-[#eab308] group-hover:bg-[#eab308] group-hover:text-white transition-all">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                      <p className="text-sm font-bold text-[#0a121f]">{format(new Date(featured.date), "EEEE, MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  
                  {featured.location && (
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-gray-100 flex items-center justify-center text-[#eab308] group-hover:bg-[#eab308] group-hover:text-white transition-all">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                        <p className="text-sm font-bold text-[#0a121f]">{featured.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <Button asChild className="bg-[#0a121f] hover:bg-black text-white h-14 px-10 rounded-2xl font-bold transition-all shadow-xl shadow-[#0a121f]/20">
                    <Link href={`/events/${featured.slug}`}>
                      Reserve Your Spot <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Side: Visual Date Display */}
              <div className="lg:w-2/5 bg-[#0a121f] flex items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#eab308] blur-[120px] rounded-full -mr-32 -mt-32" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#eab308] blur-[120px] rounded-full -ml-32 -mb-32 opacity-40" />
                </div>
                <div className="relative text-center space-y-2 z-10">
                  <div className="text-9xl font-serif font-black text-[#eab308] tracking-tighter leading-none">
                    {format(new Date(featured.date), "dd")}
                  </div>
                  <div className="text-2xl font-bold text-white tracking-[0.2em] uppercase">
                    {format(new Date(featured.date), "MMMM")}
                  </div>
                  <div className="text-white/40 font-medium tracking-[0.4em] uppercase text-sm mt-4">
                    {format(new Date(featured.date), "yyyy")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events Grid */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-3">
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#0a121f]">
                {upcoming.length > 0 ? "Upcoming Schedule" : "All Events"}
              </h2>
              <div className="h-1 w-20 rounded-full bg-[#eab308]" />
            </div>
            {upcoming.length > 0 && (
              <p className="text-gray-400 font-medium italic">
                {upcoming.length} event{upcoming.length !== 1 ? "s" : ""} currently scheduled
              </p>
            )}
          </div>

          {upcoming.length === 0 && !featured ? (
            <div className="text-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-2xl font-bold text-[#0a121f] mb-2">No upcoming events</h3>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                We are currently planning more life-changing encounters. Check back soon or subscribe to our newsletter to stay updated.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      {pastEvents && pastEvents.length > 0 && (
        <section className="py-24 bg-white border-t border-gray-50">
          <div className="container px-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-0.5 bg-gray-200" />
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-400">Past Highlights</h2>
              <div className="flex-1 h-0.5 bg-gray-50" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pastEvents.map((event) => (
                <div key={event.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-[#eab308] uppercase tracking-[0.2em]">{format(new Date(event.date), "MMMM yyyy")}</p>
                    <div className="w-2 h-2 rounded-full bg-gray-200 group-hover:bg-[#eab308] transition-colors" />
                  </div>
                  <h3 className="font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors line-clamp-2 min-h-[3rem]">{event.title}</h3>
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {format(new Date(event.date), "MMMM d, yyyy")}
                    </p>
                    {event.location && (
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function EventCard({ event }: { event: { id: string, slug: string, title: string, description: string | null, date: string, location: string | null } }) {
  return (
    <Link href={`/events/${event.slug}`} className="group block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-50">
      <div className="relative p-8 space-y-6">
        {/* Date Badge */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col text-center bg-[#0a121f] rounded-2xl px-5 py-3 shadow-lg shadow-[#0a121f]/10 group-hover:bg-[#eab308] transition-all duration-500">
            <span className="font-serif text-2xl font-black text-[#eab308] group-hover:text-[#0a121f] transition-colors">{format(new Date(event.date), "dd")}</span>
            <span className="text-[10px] font-black text-white group-hover:text-[#0a121f] uppercase tracking-widest transition-colors">{format(new Date(event.date), "MMM")}</span>
          </div>
          <div className="p-2 rounded-full bg-gray-50 text-gray-300 group-hover:bg-[#eab308]/10 group-hover:text-[#eab308] transition-all">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors line-clamp-2 leading-tight">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        {/* Footer Info */}
        <div className="pt-6 border-t border-gray-50 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#eab308]" />
            {format(new Date(event.date), "h:mm a")}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#eab308]" />
              {event.location.split(',')[0]}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
