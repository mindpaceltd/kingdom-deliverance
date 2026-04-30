import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { Radio, Video, Globe, ExternalLink, Sparkles, Clock, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Live Stream | Kingdom Deliverance Centre Uganda",
  description: "Watch Kingdom Deliverance Centre Uganda live on YouTube and Facebook. Join our Sunday services and special programs online.",
};

export default function LivePage() {
  const liveStreamUrl = process.env.NEXT_PUBLIC_LIVE_STREAM_URL ?? "https://www.youtube.com/embed/live_stream?channel=UCxxxxxxxxx";

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-48 pb-32 bg-[#0a121f] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center px-4 max-w-4xl mx-auto text-white">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative flex items-center justify-center h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </div>
            <span className="text-red-500 font-black text-xs tracking-[0.3em] uppercase">On Air Now</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-8xl font-bold leading-tight">
            Kingdom <span className="text-[#eab308]">Live</span>
          </h1>
          <div className="mx-auto mt-8 h-1.5 w-24 rounded-full bg-gradient-to-r from-[#eab308] to-yellow-500" />
          <p className="mt-8 text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Distance is not a barrier to the Holy Spirit. Join our global family online and experience the power of God from wherever you are.
          </p>
        </div>
      </section>

      {/* Stream Player Container */}
      <section className="relative z-20 -mt-16 pb-20">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="bg-[#0a121f] p-3 md:p-6 rounded-[2.5rem] shadow-2xl shadow-[#0a121f]/20 border border-white/5 overflow-hidden">
            <div className="aspect-video rounded-[1.5rem] overflow-hidden bg-black relative group">
              <iframe
                src={liveStreamUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {/* Optional overlay if no stream */}
              {!liveStreamUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[#0a121f]">
                  <Video className="w-16 h-16 text-[#eab308] opacity-20 mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">No active broadcast</h3>
                  <p className="text-white/40 text-sm max-w-xs">Check our schedule below for the next live encounter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Service Schedule */}
      <section className="py-24 relative overflow-hidden">
        <div className="container px-4 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#eab308] rounded-full" />
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-[#0a121f]">Broadcast Schedule</h2>
              </div>
              <p className="text-gray-500 font-medium">
                We stream all our major services live. Set your notifications to never miss a moment of impact.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-all">
                <Video className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { day: "Sunday", time: "9:00 AM", label: "Morning Glory Service", icon: <Sparkles className="w-6 h-6" /> },
              { day: "Sunday", time: "11:30 AM", label: "Anointing & Breakthrough", icon: <Radio className="w-6 h-6" /> },
              { day: "Wednesday", time: "6:30 PM", label: "Deeper Life Bible Study", icon: <Clock className="w-6 h-6" /> },
            ].map((s) => (
              <div key={`${s.day}-${s.time}`} className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#0a121f]/5 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#eab308] group-hover:bg-[#eab308] group-hover:text-white transition-all duration-500 mb-6">
                  {s.icon}
                </div>
                <p className="text-[#eab308] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{s.day}</p>
                <h3 className="font-serif text-2xl font-bold text-[#0a121f] mb-1">{s.time}</h3>
                <p className="text-gray-500 font-medium text-sm">{s.label}</p>
                
                <div className="mt-8 flex items-center gap-2 text-[#0a121f] text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Set Reminder <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>

          {/* Engagement CTA */}
          <div className="mt-20 bg-gradient-to-br from-[#0a121f] to-[#1a2b4b] rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#eab308] opacity-[0.03] rounded-full blur-[80px]" />
            <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight">Can't Watch Now?</h2>
              <p className="text-white/60 text-lg leading-relaxed">
                Catch up on previous messages and worship encounters in our sermon archive. Available 24/7 for your spiritual growth.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a href="/sermons" className="bg-[#eab308] hover:bg-white text-[#0a121f] px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-[#eab308]/10">
                  Browse Archive
                </a>
                <a href="/contact" className="border border-white/10 hover:bg-white/5 text-white px-8 py-4 rounded-2xl font-bold transition-all">
                  Prayer Requests
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
