import { createClient } from '@/lib/supabase/server';
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { createSocialImageMetadata, stripHtmlExcerpt } from "@/lib/seo-image-utils";
import { createCanonicalMetadata } from "@/lib/seo/canonical-utils";
import { getOrgLogoUrl, getOrgOgImageUrl, getSiteName } from "@/lib/seo/site-branding";
import { BreadcrumbSchema, generateBreadcrumbs } from "@/components/seo/breadcrumb-schema";
import { EventSchema } from "@/components/seo/event-schema";
import { incrementEventViews } from "@/lib/actions/event-views";
import { withFireServiceSchedule } from "@/lib/events/resolve-fire-service-event";
import { EventImage } from "@/components/content/event-image";
import { ShareButtons } from "@/components/content/share-buttons";
import { formatSafeDate, normalizeMediaUrl, toValidDate } from "@/lib/media-url";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const [eventResult, orgOgImage, siteName] = await Promise.all([
    supabase
      .from("events")
      .select("title, description, meta_title, meta_description, image_url, slug")
      .eq("slug", params.slug)
      .single(),
    getOrgOgImageUrl(),
    getSiteName(),
  ]);

  const event = eventResult.data;
  if (!event) return { title: "Event Not Found" };

  const ogTitle = event.meta_title || event.title;
  const excerpt =
    event.meta_description?.trim() ||
    stripHtmlExcerpt(event.description, 160) ||
    "Join us for this upcoming event at Kingdom Deliverance Centre Uganda.";
  const socialImage = createSocialImageMetadata(
    ogTitle,
    excerpt,
    event.image_url,
    "event",
    orgOgImage
  );

  const pageUrl = `https://kdcuganda.org/events/${event.slug}`;

  return {
    title: `${ogTitle} | KDC Uganda Events`,
    description: excerpt,
    ...createCanonicalMetadata(`/events/${event.slug}`),
    openGraph: {
      title: ogTitle,
      description: excerpt,
      url: pageUrl,
      siteName,
      type: "website",
      locale: "en_US",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: excerpt,
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
  const [eventResult, orgOgImage, orgLogoUrl, siteName] = await Promise.all([
    supabase.from("events").select("*").eq("slug", params.slug).maybeSingle(),
    getOrgOgImageUrl(),
    getOrgLogoUrl(),
    getSiteName(),
  ]);

  const { data: event, error } = eventResult;

  if (error) {
    console.error('[EventDetailPage] Fetch failed:', error.message)
  }

  if (!event) notFound();

  const displayEvent = withFireServiceSchedule(event);

  incrementEventViews(displayEvent.id).catch(console.error);

  const imageUrl = normalizeMediaUrl(displayEvent.image_url)
  const statusLabel = eventStatusLabel(displayEvent)
  const excerpt =
    displayEvent.meta_description?.trim() ||
    stripHtmlExcerpt(displayEvent.description, 200) ||
    ""
  const eventUrl = `https://kdcuganda.org/events/${displayEvent.slug}`
  const shareImage = createSocialImageMetadata(
    displayEvent.meta_title || displayEvent.title,
    excerpt || stripHtmlExcerpt(displayEvent.description, 160) || displayEvent.title,
    displayEvent.image_url,
    "event",
    orgOgImage
  )

  return (
    <>
      <BreadcrumbSchema items={generateBreadcrumbs('event', displayEvent.title, displayEvent.slug)} />
      <EventSchema
        title={displayEvent.meta_title || displayEvent.title}
        description={excerpt || displayEvent.title}
        slug={displayEvent.slug}
        startDate={displayEvent.date}
        endDate={displayEvent.end_date}
        location={displayEvent.location}
        imageUrl={shareImage.url}
        orgName={siteName}
        orgLogoUrl={orgLogoUrl}
      />
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
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">{displayEvent.title}</h1>
            <div className="flex flex-wrap gap-6 mt-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                {formatSafeDate(displayEvent.date, "EEEE, MMMM d, yyyy")}
              </div>
              {displayEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />{displayEvent.location}
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
                {excerpt && (
                  <p className="text-lg font-medium leading-relaxed text-primary/90">{excerpt}</p>
                )}
                {displayEvent.description && displayEvent.description !== excerpt && (
                  <p className="text-primary/80 leading-relaxed text-lg">{displayEvent.description}</p>
                )}
                {!displayEvent.description && !excerpt && (
                  <p className="text-primary/70 leading-relaxed">
                    Join us at {siteName} for this special gathering.
                  </p>
                )}
                {displayEvent.content && (
                  <div className="prose prose-purple max-w-none" dangerouslySetInnerHTML={{ __html: displayEvent.content }} />
                )}
              </div>
              <div className="space-y-6">
                <div className="rounded-2xl border border-primary/10 bg-muted/50 p-5">
                  <ShareButtons
                    url={eventUrl}
                    title={displayEvent.meta_title || displayEvent.title}
                    text={excerpt || displayEvent.title}
                    label="Share"
                    className="flex-col items-start gap-2"
                  />
                </div>
                <div className="bg-muted rounded-2xl p-6 space-y-4">
                  <h3 className="font-serif text-lg font-bold text-primary">Event Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 text-primary/70">
                      <Calendar className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-primary">Date</p>
                        <p>{formatSafeDate(displayEvent.date, "MMMM d, yyyy • h:mm a")}</p>
                        {displayEvent.end_date && (
                          <p>Ends: {formatSafeDate(displayEvent.end_date, "MMMM d, yyyy • h:mm a")}</p>
                        )}
                      </div>
                    </div>
                    {displayEvent.location && (
                      <div className="flex items-start gap-3 text-primary/70">
                        <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-primary">Location</p>
                          <p>{displayEvent.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {displayEvent.registration_url && (
                  <Button asChild className="w-full bg-accent text-primary hover:bg-accent/90">
                    <a href={displayEvent.registration_url} target="_blank" rel="noopener noreferrer">
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
