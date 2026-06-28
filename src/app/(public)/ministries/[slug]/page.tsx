import { createClient } from '@/lib/supabase/server';
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { createSocialImageMetadata, stripHtmlExcerpt } from "@/lib/seo-image-utils";
import { createCanonicalMetadata } from "@/lib/seo/canonical-utils";
import { getOrgOgImageUrl, getSiteName } from "@/lib/seo/site-branding";

import { incrementMinistryViews } from "@/lib/actions/event-views";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const [ministryResult, orgOgImage, siteName] = await Promise.all([
    supabase
      .from("ministries")
      .select("name, description, meta_title, meta_description, image_url, slug")
      .eq("slug", params.slug)
      .single(),
    getOrgOgImageUrl(),
    getSiteName(),
  ]);

  const data = ministryResult.data;
  if (!data) return { title: "Ministry Not Found" };

  const ogTitle = data.meta_title?.trim() || data.name;
  const excerpt =
    data.meta_description?.trim() ||
    stripHtmlExcerpt(data.description, 160) ||
    "Discover the ministries of Kingdom Deliverance Centre Uganda.";
  const pageUrl = `https://kdcuganda.org/ministries/${data.slug}`;
  const socialImage = createSocialImageMetadata(
    ogTitle,
    excerpt,
    data.image_url,
    "ministry",
    orgOgImage
  );

  return {
    title: ogTitle,
    description: excerpt,
    ...createCanonicalMetadata(`/ministries/${data.slug}`),
    openGraph: {
      title: ogTitle,
      description: excerpt,
      url: pageUrl,
      siteName,
      type: "website",
      locale: "en_UG",
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

export default async function MinistryDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: ministry } = await supabase
    .from("ministries")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!ministry) notFound();

  // Background increment views
  incrementMinistryViews(ministry.id).catch(console.error);

  return (
    <div className="flex flex-col">
      <section className="py-28 bg-primary text-white">
        <div className="container px-4 max-w-4xl mx-auto">
          <Link href="/ministries" className="inline-flex items-center gap-2 text-white/60 hover:text-accent text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Ministries
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-bold">{ministry.name}</h1>
          <div className="flex flex-wrap gap-6 mt-6 text-white/70 text-sm">
            {ministry.leader && (
              <span className="flex items-center gap-2"><Users className="w-4 h-4 text-accent" />Led by {ministry.leader}</span>
            )}
            {ministry.meeting_time && (
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" />{ministry.meeting_time}</span>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container px-4 max-w-4xl mx-auto space-y-8">
          {ministry.description && (
            <p className="text-xl text-primary/80 leading-relaxed border-l-4 border-accent pl-6">{ministry.description}</p>
          )}
          {ministry.content && (
            <div className="prose prose-purple prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: ministry.content }} />
          )}
          <div className="flex flex-wrap gap-4 pt-4">
            <Button asChild className="bg-accent text-primary hover:bg-accent/90">
              <Link href="/contact">Join This Ministry</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary text-primary">
              <Link href="/ministries">View All Ministries</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
