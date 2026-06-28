import { preload } from "react-dom";
import { HeroSection } from "@/components/home/hero-section";
import { getHeroImageSrc } from "@/components/home/hero-background";
import { PageSection } from "@/components/content/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar, Video, Heart, BookOpen, Sparkles,
  Users, Award, ArrowRight, Play, Quote,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from '@/lib/supabase/server';
import { PostsCarousel } from "@/components/home/posts-carousel";
import { EventCard } from "@/components/content/event-card";
import { TestimoniesSection } from "@/components/home/testimonies-section";
import { ProductCarousel } from "@/components/home/product-carousel";
import type { Post, Sermon, Event } from "@/lib/types";
import { getPublishedPageBySlug } from "@/lib/cms/get-published-page";
import { resolveHomeDetails } from "@/lib/cms/home-page-defaults";
import { resolveFireServiceCtaTitle } from "@/lib/fire-service-schedule";
import { withFireServiceSchedules } from "@/lib/events/resolve-fire-service-event";
import { getOrgOgImageUrl, getSiteName } from "@/lib/seo/site-branding";
import { normalizeMediaUrl } from "@/lib/media-url";
import { createSocialImageMetadata } from "@/lib/seo-image-utils";
import { createCanonicalMetadata } from "@/lib/seo/canonical-utils";

/** Always read fresh homepage CMS + sermons/events/posts from Supabase. */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient();
  const [homePage, orgOgImage, siteName] = await Promise.all([
    getPublishedPageBySlug(supabase, 'home'),
    getOrgOgImageUrl(),
    getSiteName(),
  ]);
  const content = homePage?.content ?? null;
  const pageTitle =
    content?.seo?.metaTitle?.trim() ||
    `${siteName} | Pentecostal Church in Kampala, Uganda`;
  const ogTitle =
    content?.seo?.ogTitle?.trim() || pageTitle;
  const description =
    content?.seo?.ogDescription?.trim() ||
    content?.seo?.metaDescription?.trim() ||
    'Welcome to Kingdom Deliverance Centre Uganda. Join worship services, sermons, events, and ministries.';
  const pageUrl = 'https://kdcuganda.org/';
  const socialImage = createSocialImageMetadata(
    ogTitle,
    description,
    content?.seo?.ogImageUrl || content?.hero?.imageUrl,
    'default',
    orgOgImage
  );

  return {
    title: { absolute: pageTitle },
    description,
    ...createCanonicalMetadata('/'),
    openGraph: {
      title: ogTitle,
      description,
      url: pageUrl,
      siteName,
      type: 'website',
      locale: 'en_UG',
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [socialImage.url],
    },
  };
}

async function fetchFeaturedSermon(
  supabase: ReturnType<typeof createClient>,
  slug?: string
): Promise<Sermon | null> {
  if (slug) {
    const { data } = await supabase
      .from('sermons')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (data) return data as Sermon;
  }

  const { data } = await supabase
    .from('sermons')
    .select('*')
    .eq('status', 'published')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Sermon | null) ?? null;
}

export default async function Home() {
  const supabase = createClient();

  const homePage = await getPublishedPageBySlug(supabase, 'home');
  const homeContent = homePage?.content ?? null;
  const home = resolveHomeDetails(homeContent?.home);
  const featuredSlug = home.sermonFeaturedSlug?.trim();

  const [featuredSermon, featuredEventsRes, postsRes, productsRes, heroRes] =
    await Promise.all([
      fetchFeaturedSermon(supabase, featuredSlug || undefined),
      supabase
        .from("events")
        .select("*")
        .eq("is_featured", true)
        .eq("status", "upcoming")
        .order("date", { ascending: true })
        .limit(3),
      supabase
        .from("posts")
        .select("*, profiles(name, avatar_url)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(12),
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("organization_images")
        .select("url")
        .eq("type", "hero")
        .eq("is_active", true)
        .maybeSingle(),
    ]);

  const heroImageUrl = homeContent?.hero?.imageUrl?.trim() || heroRes.data?.url;
  let upcomingEvents: Event[] = withFireServiceSchedules(featuredEventsRes.data ?? []);

  // Fallback: if no featured events, get next 3 upcoming regardless of is_featured
  if (upcomingEvents.length === 0) {
    const { data: fallbackEvents } = await supabase
      .from("events")
      .select("*")
      .eq("status", "upcoming")
      .order("date", { ascending: true })
      .limit(3);
    upcomingEvents = withFireServiceSchedules(fallbackEvents ?? []);
  }

  const latestPosts: Post[] = (postsRes.data as Post[]) ?? [];
  const featuredProducts = productsRes.data ?? [];
  const sermonThumb =
    normalizeMediaUrl(home.sermonThumbnailUrl) ||
    normalizeMediaUrl(featuredSermon?.thumbnail_url) ||
    null;
  const sermonWatchHref =
    home.sermonVideoUrl?.trim() ||
    featuredSermon?.video_url?.trim() ||
    (featuredSermon ? `/sermons/${featuredSermon.slug}` : home.sermonViewAllUrl || "/sermons");
  const heroCopy = {
    welcomeText: home.heroWelcomeText || '',
    headingTop: home.heroHeadingTop || '',
    headingBottom: home.heroHeadingBottom || '',
    lead: home.heroLead || '',
    primaryCtaLabel: home.heroPrimaryCtaLabel || '',
    primaryCtaUrl: home.heroPrimaryCtaUrl || '/about',
    secondaryCtaLabel: home.heroSecondaryCtaLabel || '',
    secondaryCtaUrl: home.heroSecondaryCtaUrl || '/live',
    joinUsLabel: home.joinUsLabel || '',
    serviceSlots: (home.serviceSlots ?? []).slice(0, 4),
  };

  const heroSrc = getHeroImageSrc(heroImageUrl);
  preload(heroSrc, { as: "image", fetchPriority: "high" });

  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection backgroundImage={heroImageUrl} content={heroCopy} />

      {/* Mission / Stats */}
      <PageSection className="bg-white py-24">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {home.missionBadge}
            </div>
            <h2 className="text-4xl font-bold md:text-5xl font-serif text-primary leading-tight">
              <span className="bg-gradient-to-r from-accent to-yellow-500 bg-clip-text text-transparent">
                {home.missionTitle}
              </span>
            </h2>
            <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-accent to-yellow-400" />
            <p className="text-base leading-relaxed text-primary/70 md:text-lg">
              {home.missionBody}
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {(home.stats ?? []).map((stat) => (
              <div
                key={stat.label}
                className="text-center rounded-2xl border border-accent/15 bg-accent/5 p-6 hover:border-accent/30 hover:bg-accent/10 transition-all duration-300"
              >
                <div className="text-3xl md:text-4xl font-bold text-accent mb-1">{stat.value}</div>
                <div className="text-sm text-primary/60 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
      </PageSection>

      {/* Grow With Us */}
      <section className="py-24 bg-gray-50/80">
        <div className="container px-4">
          <div className="mb-14 text-center space-y-4">
            <h2 className="text-4xl font-bold md:text-5xl font-serif text-primary">{home.growTitle}</h2>
            <p className="text-base text-primary/60 max-w-xl mx-auto md:text-lg">
              {home.growSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(home.features ?? []).map((feature, idx) => (
              <FeatureCard
                key={feature.title + idx}
                icon={
                  idx % 4 === 0 ? <Video className="w-7 h-7 text-accent" /> :
                  idx % 4 === 1 ? <Calendar className="w-7 h-7 text-accent" /> :
                  idx % 4 === 2 ? <BookOpen className="w-7 h-7 text-accent" /> :
                  <Heart className="w-7 h-7 text-accent" />
                }
                title={feature.title}
                description={feature.description}
                link={feature.link}
                linkText={feature.linkText}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Product Carousel */}
      {featuredProducts.length > 0 && (
        <ProductCarousel
          products={featuredProducts}
          badge={home.storeBadge}
          title={home.storeTitle}
          subtitle={home.storeSubtitle}
          viewAllLabel={home.storeViewAllLabel}
          viewAllUrl={home.storeViewAllUrl}
        />
      )}

      {/* Featured Sermon */}
      <section className="py-24 bg-[#0d1b3e] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>

        <div className="container px-4 relative z-10">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
                <Play className="w-3.5 h-3.5 fill-current" />
                {home.sermonBadge}
              </div>
                <h2 className="text-4xl font-bold font-serif md:text-5xl text-white">{home.sermonTitle}</h2>
              <p className="text-white/60 text-base">{home.sermonSubtitle}</p>
            </div>
            <Button
              asChild
              variant="outline"
              className="self-start border-white/20 bg-white/8 text-white hover:bg-white/15 hover:border-white/30 rounded-full px-6 transition-all duration-300"
            >
              <Link href={home.sermonViewAllUrl || "/sermons"} className="flex items-center gap-2">
                {home.sermonViewAllLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Video Thumbnail */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-accent/20 to-yellow-400/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <Link
                href={sermonWatchHref}
                className="relative block aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
              >
                <div
                  className={`absolute inset-0 bg-cover bg-center ${sermonThumb ? '' : 'bg-primary/40'}`}
                  style={sermonThumb ? { backgroundImage: `url('${sermonThumb}')` } : undefined}
                >
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-18 h-18 flex items-center justify-center rounded-full bg-accent/90 shadow-xl shadow-accent/40 group-hover:scale-110 group-hover:bg-accent transition-all duration-300">
                      <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Sermon Info — title, description, preacher, date from sermons table */}
            <div className="space-y-6">
              {featuredSermon ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
                    <Quote className="w-3.5 h-3.5" />
                    {home.sermonFeaturedBadge}
                  </div>
                  <h3 className="text-3xl font-bold font-serif md:text-4xl leading-tight text-white">
                    {featuredSermon.title}
                  </h3>
                  {featuredSermon.description ? (
                    <p className="text-white/75 leading-relaxed text-base md:text-lg">
                      {featuredSermon.description}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <span>{featuredSermon.preacher}</span>
                    </div>
                    <span>·</span>
                    <span>{new Date(featuredSermon.date).toLocaleDateString()}</span>
                  </div>
                  <Button
                    asChild
                    className="bg-accent hover:bg-accent/90 text-primary font-bold rounded-full px-8 shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-105 transition-all duration-300"
                  >
                    <Link href={sermonWatchHref} className="flex items-center gap-2">
                      {home.sermonWatchLabel}
                      <Play className="w-4 h-4 fill-current" />
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-white/70">
                  No published sermon yet. Add one under Admin → Sermons or set a featured sermon
                  slug on the Homepage in Admin → Pages.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="mb-14 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Award className="h-3.5 w-3.5" />
                  {home.valuesBadge}
            </div>
            <h2 className="text-4xl font-bold md:text-5xl font-serif text-primary">
                  {home.valuesTitle}
            </h2>
            <p className="text-base text-primary/60 max-w-xl mx-auto md:text-lg">
                  {home.valuesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(home.values ?? []).map((value, idx) => (
              <ValueCard
                key={value.title + idx}
                icon={
                  idx % 3 === 0 ? <Sparkles className="w-10 h-10 text-accent" /> :
                  idx % 3 === 1 ? <Heart className="w-10 h-10 text-accent" /> :
                  <BookOpen className="w-10 h-10 text-accent" />
                }
                title={value.title}
                description={value.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container px-4">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
                  <Calendar className="h-3.5 w-3.5" />
                  {home.eventsBadge}
                </div>
                <h2 className="text-3xl font-bold font-serif text-primary md:text-4xl">{home.eventsTitle}</h2>
              </div>
              <Button asChild variant="outline" className="self-start border-primary/20 text-primary rounded-full px-6">
                <Link href={home.eventsViewAllUrl || "/events"} className="flex items-center gap-2">
                  {home.eventsViewAllLabel} <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts Section */}
      {latestPosts.length > 0 && (
        <PostsCarousel
          posts={latestPosts}
          badge={home.postsBadge}
          title={home.postsTitle}
          viewAllLabel={home.postsViewAllLabel}
          viewAllUrl={home.postsViewAllUrl || "/blog"}
        />
      )}

      {/* CTA Banner - Fire Service */}
      <section className="py-12 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.2)_0%,transparent_100%)] mix-blend-multiply" />
        <div className="container px-4 text-center space-y-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-white">
            {resolveFireServiceCtaTitle(home.fireCtaTitle)}
          </h2>
          <p className="text-white/90 text-base md:text-xl max-w-2xl mx-auto font-medium">
            {home.fireCtaBody}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button
              asChild
              className="bg-white hover:bg-gray-100 text-red-600 font-bold rounded-full px-10 py-6 text-lg shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <Link href={home.fireCtaUrl || "/fire-service"}>{home.fireCtaLabel}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonies Section */}
      <TestimoniesSection home={homeContent?.home} />
    </div>
  );
}

function FeatureCard({
  icon, title, description, link, linkText,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  linkText: string;
}) {
  return (
    <Card className="group border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-accent/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <CardHeader>
        <div className="mb-3 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
          {icon}
        </div>
        <CardTitle className="text-xl font-serif text-primary group-hover:text-accent transition-colors duration-300">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-primary/60 leading-relaxed">{description}</p>
        <Button
          asChild
          variant="link"
          className="px-0 text-accent font-semibold text-sm hover:translate-x-1 transition-all duration-300 group/btn"
        >
          <Link href={link} className="flex items-center gap-1.5">
            {linkText}
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ValueCard({
  icon, title, description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group text-center space-y-5 p-8 rounded-2xl border border-gray-100 hover:border-accent/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-serif text-primary group-hover:text-accent transition-colors duration-300">
        {title}
      </h3>
      <p className="text-sm text-primary/60 leading-relaxed">{description}</p>
    </div>
  );
}
