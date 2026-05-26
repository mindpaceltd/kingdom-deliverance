import { createClient } from '@/lib/supabase/server';
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { createSocialImageMetadata } from "@/lib/seo-image-utils";
import { createCanonicalMetadata } from "@/lib/seo/canonical-utils";
import { BreadcrumbSchema, generateBreadcrumbs } from "@/components/seo/breadcrumb-schema";
import { incrementEventViews } from "@/lib/actions/event-views";
import { EventImage } from "@/components/content/event-image";
import { formatSafeDate, normalizeMediaUrl, toValidDate } from "@/lib/media-url";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title, description, meta_title, meta_description, image_url, slug")
    .eq("slug", params.slug)
    .single();
    
  if (!event) return { title: "Event Not Found" };

  const title = event.meta_title || `${event.title} | KDC Uganda Events`;
  const description = event.meta_description || event.description || "Join us for this upcoming event at Kingdom Deliverance Centre Uganda.";
  const socialImage = createSocialImageMetadata(
    event.title,
    description,
    normalizeMediaUrl(event.image_url),
    'event'
  );

  return {
    title,
    description,
    ...createCanonicalMetadata(`/events/${event.slug}`),
    openGraph: {
      title: event.meta_title || event.title,
      description,
      url: `https://kdcuganda.org/events/${event.slug}`,
      siteName: "Kingdom Deliverance Centre Uganda",
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: event.meta_title || event.title,
      description,
      images: [socialImage.url],
    },
  };
}

export const revalidate = 3600;

function eventStatusLabel(event: { date: string; end_date?: string | null; status?: string }) {
  const now = new Date()
  const start = toValidDate(event.date)
  const end = toValidDate(event.end_date ?? undefined)

  if (event.status === 'trash') return 'Unavailable'
  if (start && start > now) return 'Upcoming'
  if (end && end > now) return 'Ongoing'
  if (start && start <= now && (!end || end <= now)) return 'Past Event'
  return 'Upcoming'
}

export default async function EventDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) {
    console.error('[EventDetailPage] Fetch failed:', error.message)
  }

  if (!event) notFound();

  incrementEventViews(event.id).catch(console.error);

  const imageUrl = normalizeMediaUrl(event.image_url)
  const statusLabel = eventStatusLabel(event)

  return (
    <>
      <BreadcrumbSchema items={generateBreadcrumbs('event', event.title, event.slug)} />
      <div className="flex flex-col">
        <section className="py-28 bg-primary text-white relative overflow-hidden">
          {imageUrl && (
            <div className="absolute inset-0">
              <EventImage
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover opacity-40"
                fallbackClassName="hidden"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/90 to-primary" />
            </div>
          )}
          <div className="container relative z-10 px-4 max-w-4xl mx-auto">
            <Link href="/events" className="inline-flex items-center gap-2 text-white/60 hover:text-accent text-sm mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </Link>
            <div className="inline-block mb-4 text-xs font-bold tracking-widest uppercase text-accent border border-accent/50 rounded-full px-3 py-1">
              {statusLabel}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">{event.title}</h1>
            <div className="flex flex-wrap gap-6 mt-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                {formatSafeDate(event.date, "EEEE, MMMM d, yyyy")}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />{event.location}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container px-4 max-w-4xl mx-auto">
            {imageUrl && (
              <div className="mb-10 rounded-2xl overflow-hidden border border-primary/10 shadow-lg aspect-[21/9] relative">
                <EventImage
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                {event.description && (
                  <p className="text-primary/80 leading-relaxed text-lg">{event.description}</p>
                )}
                {event.content && (
                  <div className="prose prose-purple max-w-none" dangerouslySetInnerHTML={{ __html: event.content }} />
                )}
              </div>
              <div className="space-y-6">
                <div className="bg-muted rounded-2xl p-6 space-y-4">
                  <h3 className="font-serif text-lg font-bold text-primary">Event Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 text-primary/70">
                      <Calendar className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-primary">Date</p>
                        <p>{formatSafeDate(event.date, "MMMM d, yyyy • h:mm a")}</p>
                        {event.end_date && (
                          <p>Ends: {formatSafeDate(event.end_date, "MMMM d, yyyy • h:mm a")}</p>
                        )}
                      </div>
                    </div>
                    {event.location && (
                      <div className="flex items-start gap-3 text-primary/70">
                        <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-primary">Location</p>
                          <p>{event.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {event.registration_url && (
                  <Button asChild className="w-full bg-accent text-primary hover:bg-accent/90">
                    <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                      Register Now <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full border-primary text-primary">
                  <Link href="/fire-service">Submit Fire List</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-primary text-primary">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
