import type { Metadata } from "next";
import { FadeInSection } from "@/components/ui/page-transition";
import { Heart, Users, Award, Globe, Calendar, MapPin, Sparkles, ChevronRight, Target, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Story | Kingdom Deliverance Centre Uganda",
  description:
    "Learn about Kingdom Deliverance Centre Uganda — our history, vision, leadership, and mission under Bishop Climate Wiseman.",
};

const leaders = [
  {
    name: "Bishop Climate Wiseman",
    title: "Senior Pastor & Founder",
    bio: "Bishop Climate Wiseman is the visionary leader and founder of Kingdom Deliverance Centre Uganda. With over 25 years of ministry experience, he has dedicated his life to seeing people set free through the power of the Holy Spirit. He is also the head of Kingdom Temple, with branches across East Africa.",
    image: "/images/bishop.jpg",
    icon: <Award className="w-5 h-5" />,
  },
  {
    name: "Pastor Grace Wiseman",
    title: "Co-Pastor & Women's Ministry Lead",
    bio: "An anointed minister and teacher of the Word, Pastor Grace leads the women's ministry and co-pastors the church alongside Bishop Climate. Her passion is seeing families restored and women walking in their God-given destiny.",
    image: "/images/co-pastor.jpg",
    icon: <Heart className="w-5 h-5" />,
  },
  {
    name: "Pastor James Okello",
    title: "Youth Pastor",
    bio: "Pastor James has a burning passion for the next generation. Through dynamic worship, relevant teaching, and mentorship, he leads hundreds of young people into a deep relationship with God.",
    image: "/images/youth-pastor.jpg",
    icon: <Users className="w-5 h-5" />,
  },
];

const timeline = [
  { year: "2008", event: "Kingdom Deliverance Centre Uganda founded by Bishop Climate Wiseman in Kampala." },
  { year: "2010", event: "First permanent church building acquired. Membership grows to over 500 families." },
  { year: "2012", event: "Launch of the Youth Ministry and Wednesday Bible Study programs." },
  { year: "2015", event: "Official affiliation with Kingdom Temple established. Major revival conference draws thousands." },
  { year: "2018", event: "Children's Church and Deliverance Ministry launched. Community outreach programs begin." },
  { year: "2021", event: "Online services launched during COVID-19. Digital ministry reaches thousands across Africa." },
  { year: "2024", event: "New sanctuary construction begins. Membership exceeds 3,000 registered members." },
  { year: "2026", event: "Kingdom Deliverance Centre celebrates 18 years of ministry impact across Uganda." },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-48 pb-32 text-white overflow-hidden bg-[#0a121f]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center max-w-5xl mx-auto px-4">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-8">
              <Sparkles className="w-3.5 h-3.5" /> Our Heritage
            </div>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-8xl font-bold leading-tight text-white">
              The <span className="text-[#eab308]">Kingdom</span> Story
            </h1>
            <div className="mx-auto mt-8 h-1.5 w-24 rounded-full bg-gradient-to-r from-[#eab308] to-yellow-500" />
            <p className="mt-10 text-white/70 text-lg md:text-2xl leading-relaxed max-w-3xl mx-auto font-medium italic">
              "A movement of faith, power, and transformation — rooted in the Word and led by the Spirit to impact lives for eternity."
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-32 relative z-20">
        <div className="container px-4 max-w-7xl mx-auto">
          <FadeInSection className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-6">
              <Target className="h-4 w-4" />
              Our Foundation
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#0a121f]">
              Driven by Purpose
            </h2>
            <p className="text-gray-500 mt-6 max-w-xl mx-auto font-medium">
              We are not just a building; we are a mission field dedicated to the restoration of souls and the demonstration of God's power.
            </p>
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                label: "Our Mission",
                icon: <Globe className="w-8 h-8" />,
                text: "To preach the Gospel of Jesus Christ with signs, wonders, and miracles following — bringing salvation, healing, and deliverance to every soul we encounter.",
              },
              {
                label: "Our Vision",
                icon: <Sparkles className="w-8 h-8" />,
                text: "To raise a generation of bold, Spirit-filled believers who transform families, communities, and nations through the power of God's Word.",
              },
              {
                label: "Our Core Values",
                icon: <ShieldCheck className="w-8 h-8" />,
                text: "Faith, Prayer, Integrity, Community, Excellence in Worship, and unwavering commitment to the absolute authority of Scripture.",
              },
            ].map((item, index) => (
              <FadeInSection key={item.label} delay={index * 0.2}>
                <div className="group h-full bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#0a121f]/5 hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#eab308] group-hover:bg-[#eab308] group-hover:text-white transition-all duration-500 mb-8">
                    {item.icon}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors duration-300 mb-4">
                    {item.label}
                  </h3>
                  <div className="w-10 h-1 bg-gray-100 group-hover:w-16 group-hover:bg-[#eab308] transition-all duration-500 mb-6 rounded-full" />
                  <p className="text-gray-500 leading-relaxed font-medium">{item.text}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-32 bg-[#0a121f] relative overflow-hidden">
        <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-[#eab308]/5 to-transparent pointer-events-none" />
        <div className="container px-4 max-w-7xl mx-auto relative z-10">
          <FadeInSection className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-6">
              <Users className="h-4 w-4" />
              Kingdom Stewards
            </div>
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-white">
              Anointed Leadership
            </h2>
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {leaders.map((leader, index) => (
              <FadeInSection key={leader.name} delay={index * 0.2}>
                <div className="group bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-500">
                  <div className="h-72 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center relative group-hover:scale-105 transition-transform duration-700">
                    <div className="absolute inset-0 flex items-center justify-center text-white/5">
                      <Users className="w-48 h-48" />
                    </div>
                    <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-[#eab308] shadow-2xl group-hover:bg-[#eab308] group-hover:text-[#0a121f] transition-all duration-500">
                      {leader.icon}
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-serif text-2xl font-bold text-white">
                        {leader.name}
                      </h3>
                      <p className="text-[#eab308] text-xs font-black uppercase tracking-widest">{leader.title}</p>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed font-medium">{leader.bio}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Church History Timeline */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container px-4 max-w-7xl mx-auto">
          <FadeInSection className="text-center mb-24">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-6">
              <Calendar className="w-4 h-4" />
              Our Timeline
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#0a121f]">
              The Journey So Far
            </h2>
          </FadeInSection>
          
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gray-100 -translate-x-1/2 hidden md:block" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <FadeInSection key={i} delay={i * 0.1}>
                  <div className={`flex flex-col md:flex-row gap-8 items-center ${i % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
                    <div className="flex-1 md:text-right hidden md:block" />
                    <div className="flex-shrink-0 w-16 h-16 rounded-3xl bg-[#0a121f] text-[#eab308] flex items-center justify-center z-10 font-black text-xs shadow-xl shadow-[#0a121f]/10 relative">
                      <div className="absolute -inset-2 border border-[#eab308]/20 rounded-[1.5rem] animate-pulse" />
                      {item.year.slice(2)}'
                    </div>
                    <div className="flex-1 bg-gray-50 border border-gray-100 rounded-[2rem] p-8 hover:bg-white hover:shadow-xl hover:shadow-[#0a121f]/5 transition-all duration-500">
                      <span className="text-[#eab308] font-black text-xs uppercase tracking-widest mb-2 block">{item.year}</span>
                      <p className="text-[#0a121f] font-bold leading-relaxed">{item.event}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Affiliation Section */}
      <section className="py-32 bg-[#0a121f] text-center text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-[#eab308] opacity-[0.03] rounded-full blur-[120px]" />
        <div className="container relative z-10 px-4 max-w-4xl mx-auto space-y-10">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-4">
              <Globe className="h-4 w-4" />
              Global Connection
            </div>
            <h2 className="font-serif text-4xl md:text-6xl font-bold leading-tight">
              Part of <span className="text-[#eab308]">Kingdom Temple</span>
            </h2>
            <div className="w-20 h-1.5 bg-[#eab308] mx-auto rounded-full mt-8 mb-10" />
            <p className="text-white/60 leading-relaxed text-lg md:text-xl font-medium">
              Kingdom Deliverance Centre Uganda is proudly affiliated with Kingdom Temple, a global ministry network founded and led by Bishop Climate Wiseman. With branches across East Africa and beyond, we are united in our mission to spread the Gospel and demonstrate God's power in every nation.
            </p>
            <div className="pt-10 flex flex-wrap justify-center gap-6">
              <Link href="/contact" className="bg-[#eab308] hover:bg-white text-[#0a121f] px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl shadow-[#eab308]/10 group">
                Contact Our Office <ChevronRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
