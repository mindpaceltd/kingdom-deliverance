import { HeroSection } from "@/components/home/hero-section";
import { PageSection } from "@/components/content/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar, Video, Heart, BookOpen, Sparkles,
  Users, Award, Globe, ArrowRight, Play, Quote, ChevronRight, Target, ShieldCheck, Zap
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/content/post-card";
import { EventCard } from "@/components/content/event-card";
import type { Post, Sermon, Event } from "@/lib/types";
import { FadeInSection } from "@/components/ui/page-transition";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kingdom Deliverance Centre Uganda | Encounter God, Experience Deliverance",
  description: "Welcome to Kingdom Deliverance Centre Uganda. Join our worship services, explore powerful sermons, find upcoming events, and discover our ministries.",
};

export default async function Home() {
  const supabase = createClient();

  // Fetch: latest published sermon, featured upcoming events (fallback to next 3 upcoming), latest 3 posts
  const [sermonRes, featuredEventsRes, postsRes] = await Promise.all([
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
  
  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <HeroSection />

      {/* Mission & Vision Section */}
      <section className="py-32 relative overflow-hidden bg-white">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <FadeInSection>
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#eab308]">
                  <Target className="h-3.5 w-3.5" />
                  Our Calling
                </div>
                <h2 className="text-4xl md:text-6xl font-bold font-serif text-[#0a121f] leading-[1.1]">
                  A Church Rooted in <br />
                  <span className="text-[#eab308] italic">Truth & Power</span>
                </h2>
                <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-[#eab308] to-yellow-500" />
                <p className="text-lg leading-relaxed text-gray-500 font-medium">
                  Kingdom Deliverance Centre Uganda exists to bring the message of salvation, healing, and
                  deliverance to our generation. Led by Bishop Climate Wiseman, we are a global 
                  family committed to passionate worship and deep biblical transformation.
                </p>
                <div className="pt-6">
                  <Button asChild className="bg-[#0a121f] hover:bg-[#eab308] text-white hover:text-[#0a121f] px-10 py-7 rounded-2xl font-black uppercase tracking-widest transition-all duration-500 shadow-xl shadow-[#0a121f]/10">
                    <Link href="/about" className="flex items-center gap-3">
                      Discover Our Story <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.2}>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: "3K+", label: "Faithful Members", icon: <Users className="w-5 h-5" /> },
                  { value: "18+", label: "Years of Ministry", icon: <Award className="w-5 h-5" /> },
                  { value: "10+", label: "Church Branches", icon: <Globe className="w-5 h-5" /> },
                  { value: "50+", label: "Social Programs", icon: <Heart className="w-5 h-5" /> },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 hover:border-[#eab308]/30 hover:bg-white hover:shadow-2xl hover:shadow-[#0a121f]/5 transition-all duration-500 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[#eab308] group-hover:bg-[#eab308] group-hover:text-white transition-all duration-500 mb-6">
                      {stat.icon}
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-[#0a121f] mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-400 font-black uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Feature Navigation Grid */}
      <section className="py-32 bg-gray-50/50">
        <div className="container px-4 max-w-7xl mx-auto">
          <FadeInSection className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-[#0a121f]">Pathways to Growth</h2>
            <p className="text-gray-500 mt-6 max-w-xl mx-auto font-medium">
              Resources and community designed to help you encounter God and grow in your spiritual journey.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Latest Sermons"
              description="Anointed teachings from our leadership to nourish your spirit and strengthen your faith."
              link="/sermons"
              linkText="Watch Now"
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Upcoming Events"
              description="Join us for life-transforming conferences, worship nights, and community outreaches."
              link="/events"
              linkText="View Calendar"
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Our Ministries"
              description="Find your place to serve and grow in our various ministries for every age and calling."
              link="/ministries"
              linkText="Step In"
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Kingdom Giving"
              description="Partner with us in spreading the Gospel globally through your faithful stewardship."
              link="/donations"
              linkText="Partner Now"
            />
          </div>
        </div>
      </section>

      {/* High-Impact Featured Sermon Section */}
      <section className="py-32 bg-[#0a121f] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>

        <div className="container px-4 max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
            <FadeInSection>
              <div className="space-y-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#eab308]">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Latest Word
                </div>
                <h3 className="text-4xl md:text-6xl font-bold font-serif leading-[1.1]">
                  {featuredSermon?.title ?? "The Power of Faith in Troubled Times"}
                </h3>
                <p className="text-white/50 leading-relaxed text-lg md:text-xl font-medium italic">
                  "{featuredSermon?.description ??
                    "Discover how the power of unwavering faith can silence every storm and bring divine deliverance into your life."}"
                </p>
                <div className="flex flex-wrap items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-[#eab308]" />
                    <span className="text-white">{featuredSermon?.preacher ?? "Bishop Climate Wiseman"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#eab308]" />
                    <span className="text-white">{featuredSermon ? new Date(featuredSermon.date).toLocaleDateString() : "April 24, 2026"}</span>
                  </div>
                </div>
                <div className="pt-6">
                  <Button asChild className="bg-[#eab308] hover:bg-white text-[#0a121f] px-12 py-8 rounded-2xl font-black uppercase tracking-widest transition-all duration-500 shadow-2xl shadow-[#eab308]/10 group">
                    <Link href={featuredSermon ? `/sermons/${featuredSermon.slug}` : "/sermons"} className="flex items-center gap-3">
                      Watch Full Message <Play className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.3}>
              <div className="relative group">
                <div className="absolute -inset-10 bg-[#eab308]/10 rounded-full blur-[100px] group-hover:bg-[#eab308]/20 transition-all duration-700" />
                <div className="relative aspect-video overflow-hidden rounded-[3rem] bg-black shadow-2xl border border-white/5">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=2000&auto=format&fit=crop')",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-24 h-24 flex items-center justify-center rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-[#eab308] hover:text-[#0a121f] text-white transition-all duration-500 cursor-pointer group/play">
                        <Play className="w-10 h-10 ml-1 group-hover/play:scale-125 transition-transform" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-32 bg-white">
        <div className="container px-4 max-w-7xl mx-auto">
          <FadeInSection className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#eab308] mb-6">
              <Award className="h-3.5 w-3.5" />
              Our Identity
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-[#0a121f]">What We Stand For</h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <ValueCard
              icon={<Heart className="w-10 h-10" />}
              title="Divine Love"
              description="We believe in demonstrating Christ's unconditional love through radical compassion and service to all humanity."
            />
            <ValueCard
              icon={<ShieldCheck className="w-10 h-10" />}
              title="Absolute Truth"
              description="We are unapologetically committed to the authority of Scripture as the foundation of our faith and life."
            />
            <ValueCard
              icon={<Zap className="w-10 h-10" />}
              title="Manifest Power"
              description="We believe in the active presence of the Holy Spirit, demonstrating God's power through healing and deliverance."
            />
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <section className="py-32 bg-gray-50/50">
          <div className="container px-4 max-w-7xl mx-auto">
            <FadeInSection>
              <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#eab308]">
                    <Calendar className="h-3.5 w-3.5" />
                    Kingdom Calendar
                  </div>
                  <h2 className="text-4xl font-bold font-serif text-[#0a121f]">Experience It Live</h2>
                </div>
                <Button asChild variant="outline" className="h-14 px-8 border-gray-200 rounded-2xl font-bold hover:bg-[#0a121f] hover:text-white transition-all">
                  <Link href="/events" className="flex items-center gap-2">Explore All Events <ChevronRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </FadeInSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcomingEvents.map((event, i) => (
                <FadeInSection key={event.id} delay={i * 0.1}>
                  <EventCard event={event} />
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts Section */}
      {latestPosts.length > 0 && (
        <section className="py-32 bg-white">
          <div className="container px-4 max-w-7xl mx-auto">
            <FadeInSection>
              <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#eab308]">
                    <BookOpen className="h-3.5 w-3.5" />
                    The Knowledge
                  </div>
                  <h2 className="text-4xl font-bold font-serif text-[#0a121f]">Grace & Truth Blog</h2>
                </div>
                <Button asChild variant="outline" className="h-14 px-8 border-gray-200 rounded-2xl font-bold hover:bg-[#0a121f] hover:text-white transition-all">
                  <Link href="/blog" className="flex items-center gap-2">Read Articles <ChevronRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </FadeInSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestPosts.map((post, i) => (
                <FadeInSection key={post.id} delay={i * 0.1}>
                  <PostCard post={post} />
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stunning Final CTA Section */}
      <section className="py-32 bg-[#0a121f] relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 grayscale" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a121f] via-[#0a121f]/90 to-transparent" />
        
        <div className="container relative z-10 px-4 max-w-4xl mx-auto text-center space-y-12">
          <FadeInSection>
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#eab308] text-[10px] font-black uppercase tracking-[0.3em] mb-6">
              Step Into Your Destiny
            </div>
            <h2 className="text-4xl md:text-7xl font-bold font-serif text-white leading-tight">
              Ready to Encounter <br />
              <span className="text-[#eab308]">The King?</span>
            </h2>
            <p className="text-white/60 text-lg md:text-2xl leading-relaxed max-w-2xl mx-auto font-medium">
              We can't wait to welcome you home. Join us this Sunday and experience a life-altering encounter with the Holy Spirit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
              <Button
                asChild
                className="w-full sm:w-auto bg-[#eab308] hover:bg-white text-[#0a121f] font-black px-12 py-8 rounded-2xl text-sm uppercase tracking-widest shadow-2xl shadow-[#eab308]/20 transition-all duration-500"
              >
                <Link href="/about">Plan Your Visit</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto border-white/10 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 px-12 py-8 rounded-2xl font-bold transition-all"
              >
                <Link href="/contact">Speak to a Leader</Link>
              </Button>
            </div>
          </FadeInSection>
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
    <Card className="group border-none bg-white p-2 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-[#0a121f]/5 transition-all duration-700 flex flex-col h-full">
      <CardHeader className="p-8 pb-4">
        <div className="mb-8 w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#eab308] group-hover:bg-[#eab308] group-hover:text-white transition-all duration-500">
          {icon}
        </div>
        <CardTitle className="text-2xl font-serif text-[#0a121f] group-hover:text-[#eab308] transition-colors duration-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 flex flex-col flex-1 justify-between gap-8">
        <p className="text-sm text-gray-500 leading-relaxed font-medium">{description}</p>
        <Link href={link} className="flex items-center justify-between group-hover:translate-x-1 transition-transform duration-500">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a121f]">{linkText}</span>
          <ArrowRight className="w-4 h-4 text-[#eab308]" />
        </Link>
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
    <div className="group text-center space-y-8 p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-2xl hover:shadow-[#0a121f]/5 hover:-translate-y-2 transition-all duration-700">
      <div className="mx-auto w-20 h-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center text-[#eab308] group-hover:bg-[#eab308] group-hover:text-white transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <div className="space-y-4">
        <h3 className="text-2xl font-bold font-serif text-[#0a121f] group-hover:text-[#eab308] transition-colors duration-500">
          {title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}
