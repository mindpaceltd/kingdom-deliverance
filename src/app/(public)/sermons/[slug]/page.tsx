import { createClient } from '@/lib/supabase/server';
import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Headphones, Calendar, User, ArrowLeft, Clock, Eye } from "lucide-react";
import type { Metadata } from "next";
import { createSocialImageMetadata, stripHtmlExcerpt } from "@/lib/seo-image-utils";
import { createCanonicalMetadata } from "@/lib/seo/canonical-utils";
import { getOrgLogoUrl, getOrgOgImageUrl, getSiteName } from "@/lib/seo/site-branding";
import { SermonSchema } from "@/components/seo/sermon-schema";
import { ShareButtons } from "@/components/content/share-buttons";
import { incrementSermonViews } from "@/lib/actions/event-views";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const [sermonResult, orgOgImage, siteName] = await Promise.all([
    supabase
      .from("sermons")
      .select("title, description, meta_title, meta_description, thumbnail_url, slug")
      .eq("slug", params.slug)
      .single(),
    getOrgOgImageUrl(),
    getSiteName(),
  ]);

  const data = sermonResult.data;
  if (!data) return { title: "Sermon Not Found" };

  const ogTitle = data.meta_title || data.title;
  const excerpt =
    data.meta_description?.trim() ||
    stripHtmlExcerpt(data.description, 160) ||
    "Watch and listen to powerful sermons from Kingdom Deliverance Centre Uganda.";
  const socialImage = createSocialImageMetadata(
    ogTitle,
    excerpt,
    data.thumbnail_url,
    "sermon",
    orgOgImage
  );

  const pageUrl = `https://kdcuganda.org/sermons/${data.slug}`;

  return {
    title: `${ogTitle} | KDC Uganda Sermons`,
    description: excerpt,
    ...createCanonicalMetadata(`/sermons/${data.slug}`),
    openGraph: {
      title: ogTitle,
      description: excerpt,
      url: pageUrl,
      siteName,
      type: "article",
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

export default async function SermonDetailPage({ params }: Props) {
  const supabase = createClient();
  const [sermonResult, orgOgImage, orgLogoUrl, siteName] = await Promise.all([
    supabase
      .from("sermons")
      .select("*, sermon_series(name)")
      .eq("slug", params.slug)
      .single(),
    getOrgOgImageUrl(),
    getOrgLogoUrl(),
    getSiteName(),
  ]);

  const { data: sermon } = sermonResult;
  if (!sermon) notFound();

  void incrementSermonViews(sermon.id);

  const excerpt =
    sermon.meta_description?.trim() ||
    stripHtmlExcerpt(sermon.description, 200) ||
    "";
  const sermonUrl = `https://kdcuganda.org/sermons/${sermon.slug}`;
  const shareImage = createSocialImageMetadata(
    sermon.meta_title || sermon.title,
    excerpt || stripHtmlExcerpt(sermon.description, 160) || sermon.title,
    sermon.thumbnail_url,
    "sermon",
    orgOgImage
  );

  const { data: related } = await supabase
    .from("sermons")
    .select("id,title,slug,preacher,date,series")
    .eq("status", "published")
    .neq("id", sermon.id)
    .limit(3)
    .order("date", { ascending: false });

  return (
    <>
      <SermonSchema
        title={sermon.meta_title || sermon.title}
        description={excerpt || sermon.title}
        slug={sermon.slug}
        datePublished={sermon.date}
        preacher={sermon.preacher}
        imageUrl={shareImage.url}
        videoUrl={sermon.video_url}
        audioUrl={sermon.audio_url}
        orgName={siteName}
        orgLogoUrl={orgLogoUrl}
      />
    <div className="flex flex-col">
      <section className="relative w-full min-h-[38vh] md:min-h-[44vh] flex items-center text-white bg-primary overflow-hidden">
        {sermon.thumbnail_url && (
          <div className="absolute inset-0 w-full h-full" aria-hidden>
            <Image
              src={sermon.thumbnail_url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[left_center] md:object-center scale-110 md:scale-100 blur-sm md:blur-0"
            />
            {/* Solid overlay on mobile hides baked-in thumbnail text; softer gradient on larger screens */}
            <div className="absolute inset-0 bg-primary/92 md:bg-primary/80 lg:bg-gradient-to-t lg:from-primary lg:from-25% lg:via-primary/70 lg:to-primary/35" />
          </div>
        )}
        <div className="relative z-10 container px-4 max-w-4xl mx-auto text-center flex flex-col items-center py-16 md:py-24">
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
          <ShareButtons
            url={sermonUrl}
            title={sermon.meta_title || sermon.title}
            text={excerpt || sermon.title}
            label="Share this message:"
          />

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

          {/* Description / excerpt */}
          {(excerpt || sermon.description) && (
            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-primary">About This Message</h2>
              {excerpt && (
                <p className="text-lg font-medium leading-relaxed text-primary/90">{excerpt}</p>
              )}
              {sermon.description && sermon.description !== excerpt && (
                <p className="text-primary/80 leading-relaxed text-lg">{sermon.description}</p>
              )}
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
    </>
  );
}
