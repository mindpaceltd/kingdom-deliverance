import { HeroSection } from "@/components/home/hero-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Video, Heart, BookOpen } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />

      {/* Mission & Welcome Section */}
      <section className="py-24 bg-white text-primary">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-serif font-bold">Our Mission</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
            <p className="text-lg leading-relaxed text-primary/80 pt-4">
              Kingdom Deliverance Centre Uganda exists to bring the message of salvation, healing, and deliverance to our generation. Under the leadership of Bishop Climate Wiseman, we are a family of believers committed to passionate worship, deep biblical teaching, and transforming our community through the love of Jesus Christ.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links / Features */}
      <section className="py-20 bg-muted">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Video className="w-8 h-8 text-accent" />}
              title="Latest Sermons"
              description="Catch up on recent teachings and be blessed by the Word of God."
              link="/sermons"
              linkText="Watch Now"
            />
            <FeatureCard 
              icon={<Calendar className="w-8 h-8 text-accent" />}
              title="Upcoming Events"
              description="Join us for our upcoming special services, conferences, and community outreaches."
              link="/events"
              linkText="View Calendar"
            />
            <FeatureCard 
              icon={<BookOpen className="w-8 h-8 text-accent" />}
              title="Ministries"
              description="Find your place to serve and grow in our various church ministries."
              link="/ministries"
              linkText="Explore Ministries"
            />
            <FeatureCard 
              icon={<Heart className="w-8 h-8 text-accent" />}
              title="Give Online"
              description="Partner with us in spreading the Gospel through your generous giving."
              link="/donations"
              linkText="Donate Now"
            />
          </div>
        </div>
      </section>

      {/* Featured Sermon Section (Placeholder for dynamic content) */}
      <section className="py-24 bg-primary text-white">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-serif font-bold text-accent">Recent Message</h2>
              <p className="text-white/70 mt-2">Listen to the latest word from our leadership.</p>
            </div>
            <Button asChild variant="outline" className="mt-6 md:mt-0 border-accent text-accent hover:bg-accent hover:text-primary bg-transparent">
              <Link href="/sermons">View All Sermons</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-2xl">
              {/* Fake Video Player */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=2000&auto=format&fit=crop')" }}>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-primary ml-1"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-3xl font-serif font-bold">The Power of Faith in Troubled Times</h3>
              <p className="text-white/80 leading-relaxed text-lg">
                In this powerful message, we explore how standing firm in faith can break chains and bring deliverance in our darkest moments. Discover the biblical keys to overcoming adversity.
              </p>
              <div className="flex items-center space-x-4 text-sm text-white/60">
                <span>By Bishop Climate Wiseman</span>
                <span>•</span>
                <span>April 24, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function FeatureCard({ icon, title, description, link, linkText }: { icon: React.ReactNode, title: string, description: string, link: string, linkText: string }) {
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white text-primary">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle className="font-serif text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-primary/70">{description}</p>
        <Button asChild variant="link" className="px-0 text-accent font-semibold hover:text-accent/80">
          <Link href={link}>{linkText} &rarr;</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
