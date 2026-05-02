import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

import { incrementEventViews } from "@/lib/actions/event-views";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title, description, meta_title, meta_description")
    .eq("slug", params.slug)
    .single();
    
  if (!event) return { title: "Event Not Found" };
  
  return { 
    title: event.meta_title || `${event.title} | KDC Uganda Events`, 
    description: event.meta_description || event.description || undefined 
  };
}

export const revalidate = 3600;

export default async function EventDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("*").eq("slug", params.slug).single();
  if (!event) notFound();

  // Background increment views
  incrementEventViews(event.id).catch(console.error);

  return (
    <div className="flex flex-col">
      <section className="py-28 bg-primary text-white relative overflow-hidden">
        <div className="container relative z-10 px-4 max-w-4xl mx-auto">
          <Link href="/events" className="inline-flex items-center gap-2 text-white/60 hover:text-accent text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <div className="inline-block mb-4 text-xs font-bold tracking-widest uppercase text-accent border border-accent/50 rounded-full px-3 py-1">
            {event.status === 'trash' ? 'Unavailable' :
             new Date(event.date) > new Date() ? 'Upcoming' :
             event.end_date && new Date(event.end_date) > new Date() ? 'Ongoing' : 'Past Event'}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">{event.title}</h1>
          <div className="flex flex-wrap gap-6 mt-6 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {event.description && <p className="text-primary/80 leading-relaxed text-lg">{event.description}</p>}
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
                      <p>{format(new Date(event.date), "MMMM d, yyyy • h:mm a")}</p>
                      {event.end_date && <p>Ends: {format(new Date(event.end_date), "MMMM d, yyyy")}</p>}
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
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
