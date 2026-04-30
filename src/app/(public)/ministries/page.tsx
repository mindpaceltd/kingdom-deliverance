import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, Users, Clock, Music, Heart, BookOpen, Shield, Star, Globe, Zap, Sparkles, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Ministries | Kingdom Deliverance Centre Uganda",
  description: "Discover the various ministries at Kingdom Deliverance Centre Uganda — find your place to serve and grow in your spiritual journey.",
};

export const revalidate = 3600;

const staticMinistries = [
  {
    id: "1", slug: "worship", name: "Worship Ministry", icon: <Music className="w-8 h-8" />,
    description: "Leading the congregation into the presence of God through anointed praise and worship. We train singers, musicians, and sound technicians.",
    leader: "Minister Sarah Nakato", meeting_time: "Saturdays 3:00 PM",
  },
  {
    id: "2", slug: "youth", name: "Youth Ministry", icon: <Zap className="w-8 h-8" />,
    description: "Empowering the next generation with the Word of God, mentorship, and relevant programs that build faith and character.",
    leader: "Pastor James Okello", meeting_time: "Fridays 5:00 PM",
  },
  {
    id: "3", slug: "womens", name: "Women's Ministry", icon: <Heart className="w-8 h-8" />,
    description: "A community of women growing together in faith, supporting one another, and walking in their God-given purpose and destiny.",
    leader: "Pastor Grace Wiseman", meeting_time: "Saturdays 10:00 AM",
  },
  {
    id: "4", slug: "mens", name: "Men's Ministry", icon: <Shield className="w-8 h-8" />,
    description: "Building strong men of God who lead their families, communities, and workplaces with integrity, wisdom, and the fear of God.",
    leader: "Deacon Peter Ssemanda", meeting_time: "Saturdays 8:00 AM",
  },
  {
    id: "5", slug: "children", name: "Children's Church", icon: <Star className="w-8 h-8" />,
    description: "A vibrant, fun, and Spirit-filled environment where children learn about Jesus, grow in faith, and discover their identity in Christ.",
    leader: "Sister Ruth Apio", meeting_time: "Sundays 9:00 AM",
  },
  {
    id: "6", slug: "bible-study", name: "Bible Study", icon: <BookOpen className="w-8 h-8" />,
    description: "Deep, systematic teaching of the Word of God to equip believers with sound doctrine and practical application for daily life.",
    leader: "Bishop Climate Wiseman", meeting_time: "Wednesdays 6:30 PM",
  },
  {
    id: "7", slug: "outreach", name: "Outreach & Missions", icon: <Globe className="w-8 h-8" />,
    description: "Taking the Gospel beyond the church walls — into communities, prisons, hospitals, and nations through evangelism and social action.",
    leader: "Evangelist Moses Kato", meeting_time: "Monthly Saturdays",
  },
  {
    id: "8", slug: "prayer", name: "Prayer Ministry", icon: <Users className="w-8 h-8" />,
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

  const displayMinistries = dbMinistries && dbMinistries.length > 0 ? dbMinistries : staticMinistries;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-40 pb-24 bg-[#0a121f] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center px-4 max-w-4xl mx-auto text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-8">
            <Sparkles className="w-3.5 h-3.5" /> Serve & Grow
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Our <span className="text-[#eab308]">Ministries</span>
          </h1>
          <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-[#eab308] to-yellow-500" />
          <p className="mt-8 text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Discover where you belong in the body of Christ. Our ministries are designed to help you discover your purpose and impact lives through service.
          </p>
        </div>
      </section>

      {/* Ministries Grid */}
      <section className="py-24 relative z-20">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#eab308] rounded-full" />
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-[#0a121f]">Find Your Place</h2>
              </div>
              <p className="text-gray-500 max-w-xl font-medium">
                Every member of KDC is a valuable part of the team. Explore the different ways you can get involved and grow.
              </p>
            </div>
            <div className="hidden md:block">
              <Link href="/contact" className="text-sm font-bold uppercase tracking-widest text-[#eab308] hover:underline flex items-center gap-2">
                Talk to a leader <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayMinistries.map((ministry) => (
              <Link
                key={ministry.id}
                href={`/ministries/${ministry.slug}`}
                className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#0a121f]/5 transition-all duration-500 overflow-hidden flex flex-col h-full"
              >
                {/* Accent line on hover */}
                <div className="absolute top-0 left-0 w-0 h-1.5 bg-[#eab308] group-hover:w-full transition-all duration-500" />
                
                <div className="p-8 space-y-6 flex-1 flex flex-col">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#eab308] group-hover:bg-[#eab308] group-hover:text-[#0a121f] transition-all duration-500">
                    {/* If ministry has an icon property (static), use it. Otherwise use a default Users icon */}
                    {(ministry as any).icon || <Users className="w-8 h-8" />}
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-serif text-2xl font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors duration-300">
                      {ministry.name}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 font-medium">
                      {ministry.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-50 space-y-3 flex-1 flex flex-col justify-end">
                    <div className="space-y-2">
                      {ministry.leader && (
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <Users className="w-3.5 h-3.5 text-[#eab308]" />
                          <span className="text-[#0a121f]">{ministry.leader}</span>
                        </div>
                      )}
                      {ministry.meeting_time && (
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5 text-[#eab308]" />
                          <span className="text-[#0a121f]">{ministry.meeting_time}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 flex items-center justify-between group-hover:translate-x-1 transition-transform duration-300">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0a121f]">Discover More</span>
                    <ArrowRight className="w-4 h-4 text-[#eab308]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Movement CTA */}
      <section className="py-24 bg-[#0a121f] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-[#eab308]/5 to-transparent pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-1/3 h-full bg-gradient-to-r from-[#eab308]/5 to-transparent pointer-events-none" />
        
        <div className="container relative z-10 px-4 max-w-4xl mx-auto text-center space-y-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#eab308] text-[10px] font-black uppercase tracking-[0.3em]">
            Step Into Your Calling
          </div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Ready to Make an <span className="text-[#eab308]">Eternal Impact?</span>
          </h2>
          <p className="text-white/60 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            God has equipped you with unique gifts to build His Kingdom. Join one of our thriving ministries and see what He can do through you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Link
              href="/contact"
              className="w-full sm:w-auto bg-[#eab308] hover:bg-white text-[#0a121f] px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl shadow-[#eab308]/10 group"
            >
              Contact Us to Join <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto border border-white/10 hover:bg-white/5 text-white px-10 py-5 rounded-2xl font-bold transition-all duration-300"
            >
              Our Vision
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
