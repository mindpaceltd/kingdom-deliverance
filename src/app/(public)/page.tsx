import { HeroSection } from "@/components/home/hero-section";
import { PageSection } from "@/components/content/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar, Video, Heart, BookOpen, Sparkles,
  Users, Award, Globe, ArrowRight, Play, Quote,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/content/post-card";
import { EventCard } from "@/components/content/event-card";
import { TestimoniesSection } from "@/components/home/testimonies-section";
import { ProductCarousel } from "@/components/home/product-carousel";
import type { Post, Sermon, Event } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Kingdom Deliverance Centre Uganda. Join worship services, sermons, events, and ministries.",
};

export default async function Home() {
  const supabase = createClient();

  // Fetch: latest published sermon, featured upcoming events (fallback to next 3 upcoming), latest 3 posts, featured products
  const [sermonRes, featuredEventsRes, postsRes, productsRes] = await Promise.all([
    supabase
      .from("sermons")
      .select("*")
      .eq("status", "published")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
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
      .limit(3),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const featuredSermon: Sermon | null = sermonRes.data ?? null;
  let upcomingEvents: Event[] = featuredEventsRes.data ?? [];

  // Fallback: if no featured events, get next 3 upcoming regardless of is_featured
  if (upcomingEvents.length === 0) {
    const { data: fallbackEvents } = await supabase
      .from("events")
      .select("*")
      .eq("status", "upcoming")
      .order("date", { ascending: true })
      .limit(3);
    upcomingEvents = fallbackEvents ?? [];
  }

  const latestPosts: Post[] = (postsRes.data as Post[]) ?? [];
  const featuredProducts = productsRes.data ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection />

      {/* Mission / Stats */}
      <PageSection className="bg-white py-24">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Our Mission
            </div>
            <h2 className="text-4xl font-bold md:text-5xl font-serif text-primary leading-tight">
              To Set the{" "}
              <span className="bg-gradient-to-r from-accent to-yellow-500 bg-clip-text text-transparent">
                Captives Free
              </span>
            </h2>
            <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-accent to-yellow-400" />
            <p className="text-base leading-relaxed text-primary/70 md:text-lg">
              Kingdom Deliverance Centre Uganda, led by Bishop Climate Wiseman Irungu and Pastor Clear, 
              is a vibrant community dedicated to the total liberation of mankind. Our mandate is to 
              deliver the oppressed and cultivate a community that is wealthy, healthy, and wise.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "500+", label: "Church Members" },
              { value: "15+", label: "Years of Ministry" },
              { value: "50+", label: "Lives Transformed" },
              { value: "10+", label: "Community Programs" },
            ].map((stat) => (
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
            <h2 className="text-4xl font-bold md:text-5xl font-serif text-primary">Grow With Us</h2>
            <p className="text-base text-primary/60 max-w-xl mx-auto md:text-lg">
              Resources and community designed to help you grow in your faith journey.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Video className="w-7 h-7 text-accent" />}
              title="Latest Sermons"
              description="Catch up on recent teachings and be blessed by the Word of God delivered with passion and truth."
              link="/sermons"
              linkText="Watch Now"
            />
            <FeatureCard
              icon={<Calendar className="w-7 h-7 text-accent" />}
              title="Upcoming Events"
              description="Join us for special services, conferences, and community outreaches that transform lives."
              link="/events"
              linkText="View Calendar"
            />
            <FeatureCard
              icon={<BookOpen className="w-7 h-7 text-accent" />}
              title="Ministries"
              description="Find your place to serve and grow in our various church ministries for every age and calling."
              link="/ministries"
              linkText="Explore Ministries"
            />
            <FeatureCard
              icon={<Heart className="w-7 h-7 text-accent" />}
              title="Give Online"
              description="Partner with us in spreading the Gospel through your generous giving and support the Kingdom work."
              link="/donations"
              linkText="Donate Now"
            />
          </div>
        </div>
      </section>

      {/* Product Carousel */}
      {featuredProducts.length > 0 && (
        <ProductCarousel products={featuredProducts} />
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
                Latest Message
              </div>
                <h2 className="text-4xl font-bold font-serif md:text-5xl text-white">Recent Message</h2>
              <p className="text-white/60 text-base">The latest word from our leadership.</p>
            </div>
            <Button
              asChild
              variant="outline"
              className="self-start border-white/20 bg-white/8 text-white hover:bg-white/15 hover:border-white/30 rounded-full px-6 transition-all duration-300"
            >
              <Link href="/sermons" className="flex items-center gap-2">
                View All Sermons
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Video Thumbnail */}
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-accent/20 to-yellow-400/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=2000&auto=format&fit=crop')",
                  }}
                >
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-18 h-18 flex items-center justify-center rounded-full bg-accent/90 shadow-xl shadow-accent/40 hover:scale-110 hover:bg-accent transition-all duration-300 cursor-pointer">
                      <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sermon Info */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
                <Quote className="w-3.5 h-3.5" />
                Featured Sermon
              </div>
              <h3 className="text-3xl font-bold font-serif md:text-4xl leading-tight text-white">
                {featuredSermon?.title ?? "The Power of Faith in Troubled Times"}
              </h3>
              <p className="text-white/75 leading-relaxed text-base md:text-lg">
                {featuredSermon?.description ??
                  "In this powerful message, we explore how standing firm in faith can break chains and bring deliverance in our darkest moments."}
              </p>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span>{featuredSermon?.preacher ?? "Bishop Climate Wiseman"}</span>
                </div>
                <span>·</span>
                <span>{featuredSermon ? new Date(featuredSermon.date).toLocaleDateString() : "April 24, 2026"}</span>
              </div>
              <Button
                asChild
                className="bg-accent hover:bg-accent/90 text-primary font-bold rounded-full px-8 shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-105 transition-all duration-300"
              >
                <Link href={featuredSermon ? `/sermons/${featuredSermon.slug}` : "/sermons"} className="flex items-center gap-2">
                  Watch Full Message
                  <Play className="w-4 h-4 fill-current" />
                </Link>
              </Button>
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
              Our Values
            </div>
            <h2 className="text-4xl font-bold md:text-5xl font-serif text-primary">
              What We Stand For
            </h2>
            <p className="text-base text-primary/60 max-w-xl mx-auto md:text-lg">
              Our core values guide everything we do as a church community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValueCard
              icon={<Sparkles className="w-10 h-10 text-accent" />}
              title="Wealthy"
              description="We believe in God's provision and financial breakthrough for His people, enabling us to be a blessing to others."
            />
            <ValueCard
              icon={<Heart className="w-10 h-10 text-accent" />}
              title="Healthy"
              description="God's desire is for His children to walk in total health — spirit, soul, and body, free from all infirmities."
            />
            <ValueCard
              icon={<BookOpen className="w-10 h-10 text-accent" />}
              title="Wise"
              description="Through the Word of God, we gain the wisdom needed to navigate life and build lasting generations."
            />
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
                  Upcoming Events
                </div>
                <h2 className="text-3xl font-bold font-serif text-primary md:text-4xl">What&apos;s Coming Up</h2>
              </div>
              <Button asChild variant="outline" className="self-start border-primary/20 text-primary rounded-full px-6">
                <Link href="/events" className="flex items-center gap-2">View All Events <ArrowRight className="w-4 h-4" /></Link>
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
        <section className="py-12 bg-gray-50/80">
          <div className="container px-4">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
                  <BookOpen className="h-3.5 w-3.5" />
                  Latest Posts
                </div>
                <h2 className="text-3xl font-bold font-serif text-primary md:text-4xl">News &amp; Teachings</h2>
              </div>
              <Button asChild variant="outline" className="self-start border-primary/20 text-primary rounded-full px-6">
                <Link href="/blog" className="flex items-center gap-2">Read All Posts <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonies Section */}
      <TestimoniesSection />

      {/* CTA Banner - Fire Service */}
      <section className="py-12 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.2)_0%,transparent_100%)] mix-blend-multiply" />
        <div className="container px-4 text-center space-y-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-white">
            🔥 The Fire Service: April 24, 2026 🔥
          </h2>
          <p className="text-white/90 text-base md:text-xl max-w-2xl mx-auto font-medium">
            There is a matter in your life that will not respond until it is brought into the place of fire. Submit your case to the Fire Altar tonight.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button
              asChild
              className="bg-white hover:bg-gray-100 text-red-600 font-bold rounded-full px-10 py-6 text-lg shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <Link href="/fire-service">Submit Your Fire List Now</Link>
            </Button>
          </div>
        </div>
      </section>
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
