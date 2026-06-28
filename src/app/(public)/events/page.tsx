import { createClient } from '@/lib/supabase/server';
import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { EventImage } from "@/components/content/event-image";
import { formatSafeDate } from "@/lib/media-url";
import { getEventsHeroUrl } from "@/lib/seo/page-hero";
import { buildListPageMetadata } from "@/lib/seo/list-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: "Church Events",
    description:
      "Upcoming church events, conferences, outreaches, and special services at Kingdom Deliverance Centre Uganda in Kampala.",
    path: "/events",
    keywords:
      "KDC Uganda events, church events Kampala, Christian conferences Uganda, Fire Service Kampala, church outreach Uganda",
    ogType: "event",
  });
}

export const revalidate = 3600;

export default async function EventsPage() {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("status", ["upcoming", "ongoing", "published"])
    .gte("date", now)
    .order("date", { ascending: true });

  const { data: pastEvents } = await supabase
    .from("events")
    .select("*")
    .or(`status.eq.past,and(status.eq.published,date.lt.${now})`)
    .order("date", { ascending: false })
    .limit(8);

  const featured = events?.find((e) => e.is_featured);
  const upcoming = events?.filter((e) => !e.is_featured) ?? [];
  const heroUrl = await getEventsHeroUrl(events ?? []);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative py-20 md:py-36 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url('${heroUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b3e]/90 via-[#0d1b3e]/75 to-[#0d1b3e]/95" />
        <div className="container relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
            <Calendar className="w-4 h-4" />
            What&apos;s Happening
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight">
            Upcoming Events
          </h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/80 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Join us for powerful services, conferences, outreaches and special
            programs.
          </p>
        </div>
      </section>

      {/* ── Featured Event ── */}
      {featured && (
        <section className="py-16 bg-gradient-to-b from-primary/5 to-white border-b">
          <div className="container px-4">
            <div className="flex items-center gap-3 mb-8">
              <Star className="w-5 h-5 text-accent fill-accent" />
              <h2 className="font-serif text-2xl font-bold text-primary">
                Featured Event
              </h2>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-primary/10 md:grid md:grid-cols-5">
              {/* Left — info */}
              <div className="md:col-span-3 bg-gradient-to-br from-primary via-primary/95 to-purple-900 p-10 md:p-14 flex flex-col justify-center text-white">
                <span className="inline-flex items-center gap-1.5 mb-5 text-xs font-bold tracking-widest uppercase text-accent border border-accent/40 rounded-full px-3 py-1 w-fit">
                  <Star className="w-3 h-3 fill-accent" /> Featured
                </span>
                <h3 className="font-serif text-3xl md:text-4xl font-bold leading-tight text-accent">
                  {featured.title}
                </h3>
                {featured.description && (
                  <p className="mt-4 text-white/75 leading-relaxed text-base md:text-lg">
                    {featured.description}
                  </p>
                )}
                <div className="mt-8 space-y-2.5 text-sm text-white/65">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-accent shrink-0" />
                    {formatSafeDate(featured.date, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    {formatSafeDate(featured.date, "h:mm a")}
                    {featured.end_date &&
                      ` – ${formatSafeDate(featured.end_date, "h:mm a")}`}
                  </div>
                  {featured.location && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-accent shrink-0" />
                      {featured.location}
                    </div>
                  )}
                </div>
                <Button
                  asChild
                  className="mt-10 bg-accent text-primary hover:bg-accent/90 w-fit font-bold px-6"
                >
                  <Link href={`/events/${featured.slug}`}>
                    View Details <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Right — image or date display */}
              <div className="md:col-span-2 min-h-56 relative overflow-hidden flex flex-col items-center justify-center">
                {featured.image_url ? (
                  <>
                    <EventImage
                      src={featured.image_url}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Date overlay */}
                    <div className="relative z-10 bg-black/50 backdrop-blur-sm rounded-2xl px-8 py-6 text-center">
                      <div className="text-7xl font-serif font-black text-white leading-none">
                        {formatSafeDate(featured.date, "dd")}
                      </div>
                      <div className="text-xl font-bold text-accent mt-1">
                        {formatSafeDate(featured.date, "MMMM yyyy")}
                      </div>
                      <div className="mt-1 text-sm text-white/70 font-medium">
                        {formatSafeDate(featured.date, "EEEE")}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-br from-accent/15 via-accent/5 to-white w-full h-full flex items-center justify-center p-10">
                    <div className="text-center">
                      <div className="text-8xl font-serif font-black text-primary leading-none">
                        {formatSafeDate(featured.date, "dd")}
                      </div>
                      <div className="text-2xl font-bold text-accent mt-2">
                        {formatSafeDate(featured.date, "MMMM yyyy")}
                      </div>
                      <div className="mt-3 text-sm text-primary/50 font-medium">
                        {formatSafeDate(featured.date, "EEEE")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Upcoming Events Grid ── */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <h2 className="font-serif text-3xl font-bold text-primary mb-10">
            {upcoming.length > 0 ? "More Upcoming Events" : "Upcoming Events"}
          </h2>

          {upcoming.length === 0 && !featured ? (
            <div className="text-center py-24 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-semibold">No upcoming events right now.</p>
              <p className="mt-2 text-sm">
                Check back soon — something amazing is always being planned!
              </p>
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

      {/* ── Past Events ── */}
      {pastEvents && pastEvents.length > 0 && (
        <section className="py-20 bg-muted/40">
          <div className="container px-4">
            <h2 className="font-serif text-3xl font-bold text-primary mb-10">
              Past Events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group bg-white rounded-2xl p-5 border border-primary/8 hover:border-accent/30 hover:shadow-md transition-all"
                >
                  <p className="text-xs text-muted-foreground font-medium">
                    {formatSafeDate(event.date, "MMMM d, yyyy")}
                  </p>
                  <h3 className="font-semibold text-primary mt-1.5 line-clamp-2 group-hover:text-accent transition-colors text-sm leading-snug">
                    {event.title}
                  </h3>
                  {event.location && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {event.location}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function EventCard({
  event,
}: {
  event: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    date: string;
    end_date: string | null;
    location: string | null;
    image_url: string | null;
  };
}) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
    >
      {/* Image or gradient banner */}
      {event.image_url ? (
        <div className="h-44 overflow-hidden">
          <EventImage
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-3 bg-gradient-to-r from-primary to-accent" />
      )}

      <div className="flex-1 p-6 space-y-4">
        {/* Date badge + title */}
        <div className="flex items-start gap-4">
          <div className="text-center bg-primary/5 rounded-xl px-3 py-2 min-w-[56px] shrink-0 border border-primary/10">
            <div className="font-serif text-2xl font-black text-primary leading-none">
              {formatSafeDate(event.date, "dd")}
            </div>
            <div className="text-[10px] font-bold text-accent uppercase tracking-wide mt-0.5">
              {formatSafeDate(event.date, "MMM")}
            </div>
          </div>
          <h3 className="font-serif text-lg font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug pt-1">
            {event.title}
          </h3>
        </div>

        {event.description && (
          <p className="text-sm text-primary/65 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" />
            {formatSafeDate(event.date, "h:mm a")}
            {event.end_date &&
              ` – ${formatSafeDate(event.end_date, "h:mm a")}`}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {event.location}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-accent text-sm font-semibold group-hover:gap-2 transition-all">
          Learn More <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}
