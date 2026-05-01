import type { Metadata } from "next";
import { FadeInSection } from "@/components/ui/page-transition";
import { Heart, Users, Award, Globe, Calendar, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Kingdom Deliverance Centre Uganda — our history, vision, leadership, and mission under Bishop Climate Wiseman.",
};

const leaders = [
  {
    name: "Bishop Climate Wiseman Irungu",
    title: "Senior Pastor & Founder",
    bio: "Bishop Climate Wiseman Irungu is the visionary leader and founder of Kingdom Deliverance Centre Uganda. With a heart for the people of Uganda, he leads with power and authority to set the captives free. He is also the head of Kingdom Temple network.",
    image: "/images/bishop.jpg",
    icon: <Award className="w-6 h-6" />,
  },
  {
    name: "Pastor Clear",
    title: "Co-Founder & Kingdom Temple UK",
    bio: "Pastor Clear brings an anointed word from the UK and co-pioneered the work of Kingdom Deliverance alongside Bishop Climate. Together, they are building a community that is wealthy, healthy, and wise.",
    image: "/images/pastor-clear.jpg",
    icon: <Heart className="w-6 h-6" />,
  },
  {
    name: "Pastor Grace Wiseman",
    title: "Lead Pastor",
    bio: "An anointed minister and teacher of the Word, Pastor Grace leads the daily operations of the ministry in Uganda, seeing families restored and walking in their God-given destiny.",
    image: "/images/co-pastor.jpg",
    icon: <Users className="w-6 h-6" />,
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
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative pt-48 pb-32 lg:pt-56 lg:pb-40 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493397212122-2b85dda8106b?q=80&w=2071&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
              <MapPin className="w-4 h-4" />
              Our Story
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight text-white">
              About Kingdom Deliverance Centre
            </h1>
            <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-accent" />
            <p className="mt-6 text-white/90 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
              A movement of faith, power, and transformation — rooted in the Word of God and led by the Holy Spirit to impact lives across Uganda and beyond.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-24 bg-gray-50">
        <div className="container px-4">
          <FadeInSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-6">
              <Globe className="h-4 w-4" />
              Our Foundation
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary">
              Built on Purpose
            </h2>
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                label: "Our Mission",
                icon: <Heart className="w-8 h-8 text-accent" />,
                text: "To set the captives free — bringing salvation, healing, and deliverance to every soul through the power of Jesus Christ.",
              },
              {
                label: "Our Vision",
                icon: <Users className="w-8 h-8 text-accent" />,
                text: "To cultivate a community that is wealthy, healthy and wise, grounded in the Word of God and empowered for total transformation.",
              },
              {
                label: "Our Values",
                icon: <Award className="w-8 h-8 text-accent" />,
                text: "Faith, Prayer, Integrity, Community, Excellence in Worship, and unwavering commitment to the authority of Scripture.",
              },
            ].map((item, index) => (
              <FadeInSection key={item.label} delay={index * 0.2}>
                <div className="group text-center space-y-5 p-8 rounded-2xl border border-gray-200 bg-white hover:border-accent/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                    {item.icon}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                    {item.label}
                  </h3>
                  <div className="w-12 h-1 bg-accent mx-auto rounded-full" />
                  <p className="text-primary/75 leading-relaxed">{item.text}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <FadeInSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-6">
              <Users className="h-4 w-4" />
              Meet The Team
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary">
              Our Leadership
            </h2>
            <div className="w-20 h-1 bg-accent mx-auto rounded-full mt-4" />
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {leaders.map((leader, index) => (
              <FadeInSection key={leader.name} delay={index * 0.2}>
                <div className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-56 bg-gradient-to-br from-[#0d1b3e] to-[#1a3a6e] flex items-center justify-center relative overflow-hidden">
                    <div className="w-28 h-28 rounded-full border-4 border-accent/60 bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="text-accent scale-150">
                        {leader.icon}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <h3 className="font-serif text-xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                      {leader.name}
                    </h3>
                    <p className="text-accent text-sm font-semibold">{leader.title}</p>
                    <p className="text-primary/70 text-sm leading-relaxed">{leader.bio}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Church History Timeline */}
      <section className="py-24 bg-[#0d1b3e] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:50px_50px]" />
        </div>
        <div className="container px-4 relative z-10">
          <FadeInSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-6 py-3 text-sm font-medium text-accent mb-6">
              <Calendar className="w-4 h-4" />
              18 Years of Faith
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
              Our Journey
            </h2>
            <div className="w-20 h-1 bg-accent mx-auto rounded-full mt-4" />
          </FadeInSection>
          
          <div className="max-w-3xl mx-auto relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-accent/30" />
            <div className="space-y-10">
              {timeline.map((item, i) => (
                <FadeInSection key={i} delay={i * 0.1}>
                  <div className="flex gap-6 relative group">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-accent flex items-center justify-center z-10 font-bold text-primary text-sm group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-accent/30">
                      {item.year.slice(2)}
                    </div>
                    <div className="pt-3 flex-1 border border-white/10 rounded-xl p-5 bg-white/5 hover:bg-white/8 transition-colors duration-300">
                      <span className="text-accent font-bold text-base">{item.year}</span>
                      <p className="text-white/90 mt-1 leading-relaxed text-sm">{item.event}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Affiliation */}
      <section className="py-24 bg-gray-50 text-center">
        <div className="container px-4 max-w-3xl mx-auto space-y-6">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              <Globe className="h-4 w-4" />
              Our Network
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
              Part of Kingdom Temple
            </h2>
            <div className="w-16 h-1 bg-accent mx-auto rounded-full mt-4 mb-6" />
            <p className="text-primary/75 leading-relaxed text-lg">
              Kingdom Deliverance Centre Uganda is proudly affiliated with Kingdom Temple, a global ministry network founded and led by Bishop Climate Wiseman. Kingdom Temple has branches across East Africa and is committed to spreading the Gospel and demonstrating the power of God in every nation.
            </p>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
