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
    name: "Bishop Climate Wiseman",
    title: "Senior Pastor & Founder",
    bio: "Bishop Climate Wiseman is the visionary leader and founder of Kingdom Deliverance Centre Uganda. With over 25 years of ministry experience, he has dedicated his life to seeing people set free through the power of the Holy Spirit. He is also the head of Kingdom Temple, with branches across East Africa.",
    image: "/images/bishop.jpg",
    icon: <Award className="w-6 h-6" />,
  },
  {
    name: "Pastor Grace Wiseman",
    title: "Co-Pastor & Women's Ministry Lead",
    bio: "An anointed minister and teacher of the Word, Pastor Grace leads the women's ministry and co-pastors the church alongside Bishop Climate. Her passion is seeing families restored and women walking in their God-given destiny.",
    image: "/images/co-pastor.jpg",
    icon: <Heart className="w-6 h-6" />,
  },
  {
    name: "Pastor James Okello",
    title: "Youth Pastor",
    bio: "Pastor James has a burning passion for the next generation. Through dynamic worship, relevant teaching, and mentorship, he leads hundreds of young people into a deep relationship with God.",
    image: "/images/youth-pastor.jpg",
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
      <section className="relative py-32 gradient-primary text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center parallax-bg"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493397212122-2b85dda8106b?q=80&w=2071&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 to-primary/90" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-accent/30 rounded-full float-animation" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-accent/20 rounded-full float-animation" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-20 w-1 h-1 bg-accent/40 rounded-full float-animation" style={{ animationDelay: '4s' }} />
        
        <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 rounded-full glass-morphism px-6 py-3 text-sm font-medium text-accent mb-8">
              <MapPin className="w-4 h-4" />
              Our Story
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight">
              About Kingdom 
              <span className="text-gradient bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                {" "}Deliverance Centre
              </span>
            </h1>
            <p className="mt-8 text-white/90 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
              A movement of faith, power, and transformation — rooted in the Word of God and led by the Holy Spirit to impact lives across Uganda and beyond.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 classic-surface" />
        <div className="container px-4 relative z-10">
          <FadeInSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-6">
              <Globe className="h-4 w-4" />
              Our Foundation
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary">
              Built on <span className="text-gradient">Purpose</span>
            </h2>
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                label: "Our Mission",
                icon: <Heart className="w-8 h-8 text-accent" />,
                text: "To preach the Gospel of Jesus Christ with signs, wonders, and miracles following — bringing salvation, healing, and deliverance to every soul we encounter.",
                gradient: "from-red-500/10 to-pink-500/10"
              },
              {
                label: "Our Vision",
                icon: <Users className="w-8 h-8 text-accent" />,
                text: "To raise a generation of bold, Spirit-filled believers who transform families, communities, and nations through the power of God's Word.",
                gradient: "from-blue-500/10 to-purple-500/10"
              },
              {
                label: "Our Values",
                icon: <Award className="w-8 h-8 text-accent" />,
                text: "Faith, Prayer, Integrity, Community, Excellence in Worship, and unwavering commitment to the authority of Scripture.",
                gradient: "from-green-500/10 to-teal-500/10"
              },
            ].map((item, index) => (
              <FadeInSection key={item.label} delay={index * 0.2}>
                <div className={`group text-center space-y-6 p-8 rounded-2xl border border-primary/10 hover-lift bg-gradient-to-br ${item.gradient} hover:border-accent/20 transition-all duration-300 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="mx-auto w-fit p-4 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
                      {item.icon}
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                      {item.label}
                    </h3>
                    <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
                    <p className="text-primary/70 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-24 bg-secondary/30">
        <div className="container px-4">
          <FadeInSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-6">
              <Users className="h-4 w-4" />
              Meet The Team
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary">
              Our <span className="text-gradient">Leadership</span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-accent to-yellow-400 mx-auto rounded-full mt-6" />
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {leaders.map((leader, index) => (
              <FadeInSection key={leader.name} delay={index * 0.2}>
                <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover-lift hover:shadow-2xl transition-all duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="h-64 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 group-hover:scale-110 transition-transform duration-500" />
                      <div className="relative w-32 h-32 rounded-full glass-morphism border-4 border-accent/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <div className="text-accent group-hover:scale-110 transition-transform duration-300">
                          {leader.icon}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <h3 className="font-serif text-xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                        {leader.name}
                      </h3>
                      <p className="text-accent text-sm font-semibold">{leader.title}</p>
                      <p className="text-primary/70 text-sm leading-relaxed">{leader.bio}</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Church History Timeline */}
      <section className="py-24 gradient-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px]" />
        </div>
        
        <div className="container px-4 relative z-10">
          <FadeInSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-6 py-3 text-sm font-medium text-accent mb-6">
              <Calendar className="w-4 h-4" />
              18 Years of Faith
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
              Our <span className="text-accent">Journey</span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-accent to-yellow-400 mx-auto rounded-full mt-6" />
          </FadeInSection>
          
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-accent/30" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <FadeInSection key={i} delay={i * 0.1}>
                  <div className="flex gap-8 relative group">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full gradient-accent flex items-center justify-center z-10 font-bold text-primary text-sm group-hover:scale-110 transition-transform duration-300 pulse-glow">
                      {item.year.slice(2)}
                    </div>
                    <div className="pt-4 pb-2 glass-morphism rounded-xl p-6 flex-1 group-hover:bg-white/5 transition-colors duration-300">
                      <span className="text-accent font-bold text-lg">{item.year}</span>
                      <p className="text-white/90 mt-2 leading-relaxed">{item.event}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Affiliation */}
      <section className="py-24 bg-white text-center relative overflow-hidden">
        <div className="absolute inset-0 classic-surface" />
        <div className="container px-4 max-w-4xl mx-auto space-y-8 relative z-10">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-6">
              <Globe className="h-4 w-4" />
              Our Network
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
              Part of <span className="text-gradient">Kingdom Temple</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-accent to-yellow-400 mx-auto rounded-full" />
            <p className="text-primary/80 leading-relaxed text-lg max-w-3xl mx-auto">
              Kingdom Deliverance Centre Uganda is proudly affiliated with Kingdom Temple, a global ministry network founded and led by Bishop Climate Wiseman. Kingdom Temple has branches across East Africa and is committed to spreading the Gospel and demonstrating the power of God in every nation.
            </p>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
