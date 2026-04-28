import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { Radio, Video, Globe, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Live Stream | Kingdom Deliverance Centre Uganda",
  description: "Watch Kingdom Deliverance Centre Uganda live on YouTube and Facebook. Join our Sunday services and special programs online.",
};

export default function LivePage() {
  const liveStreamUrl = process.env.NEXT_PUBLIC_LIVE_STREAM_URL ?? "https://www.youtube.com/embed/live_stream?channel=UCxxxxxxxxx";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-40 bg-[#0d1b3e] text-white">
        <div className="container text-center px-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-bold text-sm tracking-wider uppercase">Live Now</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">Watch Live</h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/90 text-lg md:text-xl max-w-xl mx-auto">
            Join us for live worship, powerful messages, and encounter God from wherever you are.
          </p>
        </div>
      </section>

      {/* Stream Player */}
      <section className="py-12 bg-black">
        <div className="container px-4 max-w-5xl mx-auto">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl bg-primary/20">
            <iframe
              src={liveStreamUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Service Schedule */}
      <section className="py-16 bg-white">
        <div className="container px-4 max-w-3xl mx-auto text-center space-y-10">
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary">Service Schedule</h2>
            <p className="text-primary/70 mt-2">We go live for every service. Set a reminder so you never miss a moment.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { day: "Sunday", time: "9:00 AM", label: "Morning Service" },
              { day: "Sunday", time: "11:30 AM", label: "2nd Service" },
              { day: "Wednesday", time: "6:30 PM", label: "Bible Study" },
            ].map((s) => (
              <div key={`${s.day}-${s.time}`} className="bg-muted rounded-2xl p-6 space-y-2">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Radio className="w-5 h-5 text-accent" />
                </div>
                <p className="font-serif text-xl font-bold text-primary">{s.day}</p>
                <p className="text-accent font-semibold">{s.time}</p>
                <p className="text-sm text-primary/70">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <p className="text-primary/70 font-medium">Also streaming on:</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", className: "border-red-500 text-red-500 hover:bg-red-50 gap-2" })}>
                <Video className="w-5 h-5" /> YouTube <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", className: "border-blue-600 text-blue-600 hover:bg-blue-50 gap-2" })}>
                <Globe className="w-5 h-5" /> Facebook Live <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
