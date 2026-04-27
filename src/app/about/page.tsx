import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Kingdom Deliverance Centre Uganda",
  description:
    "Learn about Kingdom Deliverance Centre Uganda — our history, vision, leadership, and mission under Bishop Climate Wiseman.",
};

const leaders = [
  {
    name: "Bishop Climate Wiseman",
    title: "Senior Pastor & Founder",
    bio: "Bishop Climate Wiseman is the visionary leader and founder of Kingdom Deliverance Centre Uganda. With over 25 years of ministry experience, he has dedicated his life to seeing people set free through the power of the Holy Spirit. He is also the head of Kingdom Temple, with branches across East Africa.",
    image: "/images/bishop.jpg",
  },
  {
    name: "Pastor Grace Wiseman",
    title: "Co-Pastor & Women's Ministry Lead",
    bio: "An anointed minister and teacher of the Word, Pastor Grace leads the women's ministry and co-pastors the church alongside Bishop Climate. Her passion is seeing families restored and women walking in their God-given destiny.",
    image: "/images/co-pastor.jpg",
  },
  {
    name: "Pastor James Okello",
    title: "Youth Pastor",
    bio: "Pastor James has a burning passion for the next generation. Through dynamic worship, relevant teaching, and mentorship, he leads hundreds of young people into a deep relationship with God.",
    image: "/images/youth-pastor.jpg",
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
      <section className="relative py-32 bg-primary text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493397212122-2b85dda8106b?q=80&w=2071&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />
        <div className="container relative z-10 text-center max-w-3xl mx-auto px-4">
          <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent/50 text-accent font-medium text-sm tracking-wider uppercase mb-6">
            Our Story
          </span>
          <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight">
            About Kingdom Deliverance Centre
          </h1>
          <p className="mt-6 text-white/80 text-lg leading-relaxed">
            A movement of faith, power, and transformation — rooted in the Word of God and led by the Holy Spirit.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                label: "Our Mission",
                icon: "🕊️",
                text: "To preach the Gospel of Jesus Christ with signs, wonders, and miracles following — bringing salvation, healing, and deliverance to every soul we encounter.",
              },
              {
                label: "Our Vision",
                icon: "👁️",
                text: "To raise a generation of bold, Spirit-filled believers who transform families, communities, and nations through the power of God's Word.",
              },
              {
                label: "Our Values",
                icon: "✝️",
                text: "Faith, Prayer, Integrity, Community, Excellence in Worship, and unwavering commitment to the authority of Scripture.",
              },
            ].map((item) => (
              <div key={item.label} className="text-center space-y-4 p-8 rounded-2xl border border-primary/10 hover:shadow-lg transition-shadow">
                <div className="text-5xl">{item.icon}</div>
                <h3 className="font-serif text-2xl font-bold text-primary">{item.label}</h3>
                <div className="w-12 h-1 bg-accent mx-auto rounded-full" />
                <p className="text-primary/70 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-24 bg-muted">
        <div className="container px-4">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm tracking-wider uppercase">Meet The Team</span>
            <h2 className="font-serif text-4xl font-bold text-primary mt-2">Our Leadership</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {leaders.map((leader) => (
              <div key={leader.name} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
                <div className="h-64 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center relative overflow-hidden">
                  <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-accent/40 flex items-center justify-center">
                    <span className="font-serif text-5xl text-primary/30">{leader.name[0]}</span>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="font-serif text-xl font-bold text-primary">{leader.name}</h3>
                  <p className="text-accent text-sm font-semibold">{leader.title}</p>
                  <p className="text-primary/70 text-sm leading-relaxed">{leader.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Church History Timeline */}
      <section className="py-24 bg-primary text-white">
        <div className="container px-4">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm tracking-wider uppercase">18 Years of Faith</span>
            <h2 className="font-serif text-4xl font-bold text-white mt-2">Our Journey</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full mt-4" />
          </div>
          <div className="max-w-3xl mx-auto relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-accent/30" />
            <div className="space-y-10">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-8 relative">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center z-10 font-bold text-primary text-sm">
                    {item.year.slice(2)}
                  </div>
                  <div className="pt-3 pb-2">
                    <span className="text-accent font-bold">{item.year}</span>
                    <p className="text-white/80 mt-1 leading-relaxed">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Affiliation */}
      <section className="py-20 bg-white text-center">
        <div className="container px-4 max-w-2xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl font-bold text-primary">Part of Kingdom Temple</h2>
          <p className="text-primary/70 leading-relaxed">
            Kingdom Deliverance Centre Uganda is proudly affiliated with Kingdom Temple, a global ministry network founded and led by Bishop Climate Wiseman. Kingdom Temple has branches across East Africa and is committed to spreading the Gospel and demonstrating the power of God in every nation.
          </p>
        </div>
      </section>
    </div>
  );
}
