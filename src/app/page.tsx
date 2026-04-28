import { HeroSection } from "@/components/home/hero-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, Heart, BookOpen, Sparkles, Users, Award, Globe, ArrowRight, Play, Quote } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection />

      {/* Mission Section */}
      <section className="section-fade-up py-24 relative overflow-hidden">
        <div className="absolute inset-0 classic-surface" />
        <div className="container px-4 relative z-10">
          <div className="mx-auto max-w-4xl space-y-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              <Sparkles className="h-4 w-4" />
              Our Mission
            </div>
            <h2 className="text-4xl font-bold md:text-6xl font-serif">
              A Church Rooted in 
              <span className="text-gradient"> Truth and Love</span>
            </h2>
            <div className="mx-auto h-1 w-32 rounded-full bg-gradient-to-r from-accent to-yellow-400" />
            <p className="pt-4 text-lg leading-relaxed text-primary/80 md:text-xl max-w-3xl mx-auto">
              Kingdom Deliverance Centre Uganda exists to bring the message of salvation, healing, and deliverance to our generation. Under the leadership of Bishop Climate Wiseman, we are a family of believers committed to passionate worship, deep biblical teaching, and transforming our community through the love of Jesus Christ.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
              <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-accent">500+</div>
                <div className="text-sm text-primary/70 font-medium">Church Members</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-accent">15+</div>
                <div className="text-sm text-primary/70 font-medium">Years of Ministry</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-accent">50+</div>
                <div className="text-sm text-primary/70 font-medium">Lives Transformed</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-accent">10+</div>
                <div className="text-sm text-primary/70 font-medium">Community Programs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-fade-up py-24 relative">
        <div className="container px-4">
          <div className="mb-16 text-center space-y-4">
            <h2 className="text-4xl font-bold md:text-5xl font-serif">Grow With Us</h2>
            <p className="text-lg text-primary/70 max-w-2xl mx-auto">
              Explore teaching, fellowship, outreach, and worship resources designed to help you grow in your faith journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Video className="w-8 h-8 text-accent" />}
              title="Latest Sermons"
              description="Catch up on recent teachings and be blessed by the Word of God delivered with passion and truth."
              link="/sermons"
              linkText="Watch Now"
              gradient="from-blue-500/10 to-purple-500/10"
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8 text-accent" />}
              title="Upcoming Events"
              description="Join us for our upcoming special services, conferences, and community outreaches that transform lives."
              link="/events"
              linkText="View Calendar"
              gradient="from-green-500/10 to-teal-500/10"
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8 text-accent" />}
              title="Ministries"
              description="Find your place to serve and grow in our various church ministries designed for every age and calling."
              link="/ministries"
              linkText="Explore Ministries"
              gradient="from-orange-500/10 to-red-500/10"
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8 text-accent" />}
              title="Give Online"
              description="Partner with us in spreading the Gospel through your generous giving and support the Kingdom work."
              link="/donations"
              linkText="Donate Now"
              gradient="from-pink-500/10 to-rose-500/10"
            />
          </div>
        </div>
      </section>

      {/* Featured Sermon Section */}
      <section className="section-fade-up py-24 gradient-primary text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container px-4 relative z-10">
          <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-2 text-sm font-medium text-accent">
                <Play className="w-4 h-4" />
                Latest Message
              </div>
              <h2 className="text-4xl font-bold text-white md:text-5xl font-serif">
                Recent Message
              </h2>
              <p className="text-white/80 text-lg">Listen to the latest word from our leadership.</p>
            </div>
            <Button 
              asChild 
              variant="outline" 
              className="glass-morphism border-accent/30 text-accent hover:scale-105 hover:bg-accent hover:text-primary transition-all duration-300"
            >
              <Link href="/sermons" className="flex items-center gap-2">
                View All Sermons
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-yellow-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/20 transition-transform duration-500 hover:scale-[1.02]">
                <div 
                  className="absolute inset-0 bg-cover bg-center" 
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=2000&auto=format&fit=crop')" }}
                >
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-accent/90 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-accent pulse-glow">
                      <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-accent">
                <Quote className="w-4 h-4" />
                Featured Sermon
              </div>
              <h3 className="text-3xl font-bold font-serif md:text-4xl">
                The Power of Faith in Troubled Times
              </h3>
              <p className="text-white/90 leading-relaxed text-lg">
                In this powerful message, we explore how standing firm in faith can break chains and bring deliverance in our darkest moments. Discover the biblical keys to overcoming adversity and walking in victory.
              </p>
              <div className="flex items-center space-x-6 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-accent" />
                  </div>
                  <span>By Bishop Climate Wiseman</span>
                </div>
                <span>•</span>
                <span>April 24, 2026</span>
              </div>
              <Button 
                asChild 
                className="gradient-accent text-primary font-semibold hover:scale-105 transition-all duration-300"
              >
                <Link href="/sermons" className="flex items-center gap-2">
                  Watch Full Message
                  <Play className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-fade-up py-24">
        <div className="container px-4">
          <div className="mb-16 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              <Award className="h-4 w-4" />
              Our Values
            </div>
            <h2 className="text-4xl font-bold md:text-5xl font-serif">
              What We Stand For
            </h2>
            <p className="text-lg text-primary/70 max-w-2xl mx-auto">
              Our core values guide everything we do as a church community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValueCard
              icon={<Heart className="w-12 h-12 text-accent" />}
              title="Love & Compassion"
              description="We believe in showing Christ's love through our actions, caring for one another and our community with genuine compassion."
            />
            <ValueCard
              icon={<BookOpen className="w-12 h-12 text-accent" />}
              title="Biblical Truth"
              description="We are committed to teaching and living by the Word of God, ensuring our faith is grounded in biblical truth and sound doctrine."
            />
            <ValueCard
              icon={<Globe className="w-12 h-12 text-accent" />}
              title="Global Impact"
              description="We strive to make a difference not just locally but globally, spreading the Gospel and serving communities worldwide."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  link, 
  linkText, 
  gradient 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  linkText: string;
  gradient: string;
}) {
  return (
    <Card className="group border border-primary/10 bg-white/95 text-primary shadow-lg hover-lift transition-all duration-300 hover:shadow-2xl hover:border-accent/20 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <CardHeader className="relative z-10">
        <div className="mb-4 p-3 w-fit rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
          {icon}
        </div>
        <CardTitle className="text-2xl font-serif group-hover:text-accent transition-colors duration-300">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <p className="text-primary/70 leading-relaxed">{description}</p>
        <Button 
          asChild 
          variant="link" 
          className="px-0 font-semibold text-accent hover:translate-x-2 transition-all duration-300 group/btn"
        >
          <Link href={link} className="flex items-center gap-2">
            {linkText}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ValueCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group text-center space-y-6 p-8 rounded-2xl hover:bg-secondary/30 transition-all duration-300 hover-lift">
      <div className="mx-auto w-fit p-4 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold font-serif group-hover:text-accent transition-colors duration-300">
        {title}
      </h3>
      <p className="text-primary/70 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
