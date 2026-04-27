import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, Users, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ministries | Kingdom Deliverance Centre Uganda",
  description: "Discover the various ministries at Kingdom Deliverance Centre Uganda — find your place to serve and grow.",
};

export const revalidate = 3600;

const iconMap: Record<string, string> = {
  Music: "🎵", Users: "👥", Heart: "❤️", Shield: "🛡️",
  Star: "⭐", Globe: "🌍", BookOpen: "📖", Zap: "⚡",
};

export default async function MinistriesPage() {
  const supabase = createClient();
  const { data: ministries } = await supabase
    .from("ministries")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-28 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=2070&auto=format&fit=crop')" }} />
        <div className="container relative z-10 text-center px-4">
          <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent/50 text-accent font-medium text-sm tracking-wider uppercase mb-6">
            Serve & Grow
          </span>
          <h1 className="font-serif text-5xl md:text-6xl font-bold">Our Ministries</h1>
          <p className="text-white/80 text-lg mt-4 max-w-xl mx-auto">
            There is a place for you in the body of Christ. Find your ministry and step into your purpose.
          </p>
        </div>
      </section>

      {/* Ministries Grid */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          {!ministries || ministries.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl">Ministries coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {ministries.map((ministry) => (
                <Link
                  key={ministry.id}
                  href={`/ministries/${ministry.slug}`}
                  className="group block bg-white rounded-2xl border border-primary/10 shadow hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
                >
                  <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                  <div className="p-7 space-y-4">
                    <div className="text-4xl">{iconMap[ministry.icon] ?? "✝️"}</div>
                    <h3 className="font-serif text-xl font-bold text-primary group-hover:text-accent transition-colors">{ministry.name}</h3>
                    {ministry.description && (
                      <p className="text-sm text-primary/70 leading-relaxed line-clamp-3">{ministry.description}</p>
                    )}
                    <div className="pt-2 space-y-1">
                      {ministry.leader && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-accent" /> {ministry.leader}
                        </p>
                      )}
                      {ministry.meeting_time && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-accent" /> {ministry.meeting_time}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-accent text-sm font-semibold group-hover:underline">
                      Learn More <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-center text-white">
        <div className="container px-4 max-w-2xl mx-auto space-y-6">
          <h2 className="font-serif text-4xl font-bold">Ready to Get Involved?</h2>
          <p className="text-white/80 leading-relaxed">
            Join one of our thriving ministries and discover your God-given purpose. Every member has a role to play in building the Kingdom.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-accent text-primary px-8 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors">
            Contact Us to Join <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
