import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
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
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-28 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop')" }} />
        <div className="container relative z-10 text-center px-4">
          <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent/50 text-accent font-medium text-sm tracking-wider uppercase mb-6">
            What&apos;s Happening
          </span>
          <h1 className="font-serif text-5xl md:text-6xl font-bold">Upcoming Events</h1>
          <p className="text-white/80 text-lg mt-4 max-w-xl mx-auto">
            Join us for powerful services, conferences, outreaches and special programs.
          </p>
        </div>
      </section>

      {/* Featured Event */}
      {featured && (
        <section className="py-16 bg-accent/5 border-b">
          <div className="container px-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-accent/20 md:flex">
              <div className="md:w-1/2 bg-gradient-to-br from-primary to-purple-900 p-10 flex flex-col justify-center text-white">
                <span className="inline-block mb-4 text-xs font-bold tracking-widest uppercase text-accent border border-accent/50 rounded-full px-3 py-1 w-fit">⭐ Featured Event</span>
                <h2 className="font-serif text-3xl font-bold leading-tight">{featured.title}</h2>
                <p className="mt-4 text-white/80 leading-relaxed">{featured.description}</p>
                <div className="mt-6 space-y-2 text-sm text-white/70">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" />{format(new Date(featured.date), "EEEE, MMMM d, yyyy")}</div>
                  {featured.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" />{featured.location}</div>}
                </div>
                <Button asChild className="mt-8 bg-accent text-primary hover:bg-accent/90 w-fit">
                  <Link href={`/events/${featured.slug}`}>View Details <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
              <div className="md:w-1/2 min-h-64 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center p-10">
                <div className="text-center space-y-2">
                  <div className="text-7xl font-serif font-bold text-primary">{format(new Date(featured.date), "dd")}</div>
                  <div className="text-2xl font-semibold text-accent">{format(new Date(featured.date), "MMMM yyyy")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Upcoming Events */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <h2 className="font-serif text-3xl font-bold text-primary mb-10">
            {upcoming.length > 0 ? "More Upcoming Events" : "Upcoming Events"}
          </h2>

          {upcoming.length === 0 && !featured ? (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl">No upcoming events at this time.</p>
              <p className="mt-2">Check back soon — something amazing is always being planned!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      {pastEvents && pastEvents.length > 0 && (
        <section className="py-20 bg-muted">
          <div className="container px-4">
            <h2 className="font-serif text-3xl font-bold text-primary mb-10">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pastEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-xl p-5 opacity-75 hover:opacity-100 transition-opacity">
                  <p className="text-xs text-muted-foreground">{format(new Date(event.date), "MMMM d, yyyy")}</p>
                  <h3 className="font-semibold text-primary mt-1 line-clamp-2">{event.title}</h3>
                  {event.location && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</p>}
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
    <Link href={`/events/${event.slug}`} className="group block bg-white rounded-2xl overflow-hidden border border-primary/10 shadow hover:shadow-lg transition-all hover:-translate-y-1">
      <div className="h-3 bg-gradient-to-r from-primary to-accent" />
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="text-center bg-primary/5 rounded-xl px-4 py-2 min-w-[60px]">
            <div className="font-serif text-2xl font-bold text-primary">{format(new Date(event.date), "dd")}</div>
            <div className="text-xs font-semibold text-accent uppercase">{format(new Date(event.date), "MMM")}</div>
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">{event.title}</h3>
          </div>
        </div>
        {event.description && <p className="text-sm text-primary/70 line-clamp-3 leading-relaxed">{event.description}</p>}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{format(new Date(event.date), "h:mm a")}</div>
          {event.location && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{event.location}</div>}
        </div>
        <div className="text-accent text-sm font-semibold group-hover:underline flex items-center gap-1">
          Learn More <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}
