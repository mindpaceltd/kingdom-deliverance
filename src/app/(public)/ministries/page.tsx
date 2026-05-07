import { createClient } from '@/lib/supabase/server';
import Link from "next/link";
import { ArrowRight, Users, Clock, Music, Heart, BookOpen, Shield, Star, Globe, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ministries | Kingdom Deliverance Centre Uganda",
  description: "Discover the various ministries at Kingdom Deliverance Centre Uganda — find your place to serve and grow.",
};

export const revalidate = 3600;

const staticMinistries = [
  {
    id: "1", slug: "worship", name: "Worship Ministry", icon: <Music className="w-8 h-8 text-accent" />,
    description: "Leading the congregation into the presence of God through anointed praise and worship. We train singers, musicians, and sound technicians.",
    leader: "Minister Sarah Nakato", meeting_time: "Saturdays 3:00 PM",
  },
  {
    id: "2", slug: "youth", name: "Youth Ministry", icon: <Zap className="w-8 h-8 text-accent" />,
    description: "Empowering the next generation with the Word of God, mentorship, and relevant programs that build faith and character.",
    leader: "Pastor James Okello", meeting_time: "Fridays 5:00 PM",
  },
  {
    id: "3", slug: "womens", name: "Women's Ministry", icon: <Heart className="w-8 h-8 text-accent" />,
    description: "A community of women growing together in faith, supporting one another, and walking in their God-given purpose and destiny.",
    leader: "Pastor Grace Wiseman", meeting_time: "Saturdays 10:00 AM",
  },
  {
    id: "4", slug: "mens", name: "Men's Ministry", icon: <Shield className="w-8 h-8 text-accent" />,
    description: "Building strong men of God who lead their families, communities, and workplaces with integrity, wisdom, and the fear of God.",
    leader: "Deacon Peter Ssemanda", meeting_time: "Saturdays 8:00 AM",
  },
  {
    id: "5", slug: "children", name: "Children's Church", icon: <Star className="w-8 h-8 text-accent" />,
    description: "A vibrant, fun, and Spirit-filled environment where children learn about Jesus, grow in faith, and discover their identity in Christ.",
    leader: "Sister Ruth Apio", meeting_time: "Sundays 10:00 AM (EAT)",
  },
  {
    id: "6", slug: "bible-study", name: "Bible Study", icon: <BookOpen className="w-8 h-8 text-accent" />,
    description: "Deep, systematic teaching of the Word of God to equip believers with sound doctrine and practical application for daily life.",
    leader: "Bishop Climate Wiseman", meeting_time: "Wednesdays 6:00 PM (EAT)",
  },
  {
    id: "7", slug: "outreach", name: "Outreach & Missions", icon: <Globe className="w-8 h-8 text-accent" />,
    description: "Taking the Gospel beyond the church walls — into communities, prisons, hospitals, and nations through evangelism and social action.",
    leader: "Evangelist Moses Kato", meeting_time: "Monthly Saturdays",
  },
  {
    id: "8", slug: "prayer", name: "Prayer Ministry", icon: <Users className="w-8 h-8 text-accent" />,
    description: "Interceding for the church, nation, and world. We believe in the power of prayer to move mountains and transform lives.",
    leader: "Elder Grace Namukasa", meeting_time: "Fridays 6:00 AM",
  },
];

export default async function MinistriesPage() {
  const supabase = createClient();
  const { data: dbMinistries } = await supabase
    .from("ministries")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-40 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
            <Users className="w-4 h-4" />
            Serve &amp; Grow
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">
            Our Ministries
          </h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            There is a place for you in the body of Christ. Find your ministry and step into your purpose.
          </p>
        </div>
      </section>

      {/* Ministries Grid */}
      <section className="py-24 bg-gray-50">
        <div className="container px-4">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">Find Your Place</h2>
            <p className="text-primary/65 mt-3 max-w-xl mx-auto">
              Every believer has a role to play. Explore our ministries and discover where you belong.
            </p>
          </div>

          {dbMinistries && dbMinistries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dbMinistries.map((ministry) => (
                <Link
                  key={ministry.id}
                  href={`/ministries/${ministry.slug}`}
                  className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="h-1.5 bg-gradient-to-r from-[#0d1b3e] to-accent" />
                  <div className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-primary group-hover:text-accent transition-colors">{ministry.name}</h3>
                    {ministry.description && (
                      <p className="text-sm text-primary/65 leading-relaxed line-clamp-3">{ministry.description}</p>
                    )}
                    <div className="space-y-1.5">
                      {ministry.leader && (
                        <p className="text-xs text-primary/55 flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-accent" /> {ministry.leader}
                        </p>
                      )}
                      {ministry.meeting_time && (
                        <p className="text-xs text-primary/55 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-accent" /> {ministry.meeting_time}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-accent text-sm font-semibold">
                      Learn More <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {staticMinistries.map((ministry) => (
                <div
                  key={ministry.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="h-1.5 bg-gradient-to-r from-[#0d1b3e] to-accent" />
                  <div className="p-6 space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                      {ministry.icon}
                    </div>
                    <h3 className="font-serif text-xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                      {ministry.name}
                    </h3>
                    <p className="text-sm text-primary/65 leading-relaxed">{ministry.description}</p>
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs text-primary/55 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-accent" /> {ministry.leader}
                      </p>
                      <p className="text-xs text-primary/55 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-accent" /> {ministry.meeting_time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0d1b3e] text-center text-white">
        <div className="container px-4 max-w-2xl mx-auto space-y-6">
          <h2 className="font-serif text-4xl font-bold">Ready to Get Involved?</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            Join one of our thriving ministries and discover your God-given purpose. Every member has a role to play in building the Kingdom.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-accent text-primary px-8 py-4 rounded-full font-bold hover:bg-accent/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-accent/30"
          >
            Contact Us to Join <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
