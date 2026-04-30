import type { Metadata } from "next";
import Image from "next/image";
import { Sparkles, Camera, Plus, ZoomIn } from "lucide-react";

export const metadata: Metadata = {
  title: "Moments of Faith | Kingdom Deliverance Centre Uganda",
  description:
    "View moments from worship services, outreaches, conferences, and church life at Kingdom Deliverance Centre Uganda.",
};

export const revalidate = 3600;

const galleryItems = [
  {
    id: "worship-night",
    title: "Worship Night Encounter",
    category: "Worship",
    image:
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1800&auto=format&fit=crop",
  },
  {
    id: "sunday-service",
    title: "Sunday Celebration Service",
    category: "Services",
    image:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1800&auto=format&fit=crop",
  },
  {
    id: "youth-ministry",
    title: "Youth Ministry Gathering",
    category: "Ministry",
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=1800&auto=format&fit=crop",
  },
  {
    id: "outreach",
    title: "Community Outreach Day",
    category: "Outreach",
    image:
      "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=1800&auto=format&fit=crop",
  },
  {
    id: "conference",
    title: "Annual Revival Conference",
    category: "Conference",
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1800&auto=format&fit=crop",
  },
  {
    id: "children",
    title: "Children's Church Joy",
    category: "Children",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1800&auto=format&fit=crop",
  },
];

export default function GalleryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-48 pb-32 text-white overflow-hidden bg-[#0a121f]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-8">
            <Sparkles className="w-3.5 h-3.5" /> Moments of Grace
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-8xl font-bold leading-tight text-white">
            Photo <span className="text-[#eab308]">Gallery</span>
          </h1>
          <div className="mx-auto mt-8 h-1.5 w-24 rounded-full bg-gradient-to-r from-[#eab308] to-yellow-500" />
          <p className="mt-8 text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            A visual journey through our worship, community outreach, and church family life. Witness the beauty of God's work among us.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-24 relative z-20">
        <div className="container px-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#eab308] rounded-full" />
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-[#0a121f]">Captured Memories</h2>
              </div>
              <p className="text-gray-500 max-w-xl font-medium">
                Explore the different seasons of our ministry through these selected snapshots of life at KDC Uganda.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm text-xs font-bold text-[#0a121f] uppercase tracking-widest">
              <Camera className="w-4 h-4 text-[#eab308]" /> {galleryItems.length} Featured Moments
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {galleryItems.map((item) => (
              <article
                key={item.id}
                className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#0a121f]/10 transition-all duration-700"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  
                  {/* Glass Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#eab308] text-[#0a121f] flex items-center justify-center scale-50 group-hover:scale-100 transition-transform duration-500 shadow-xl">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                      {item.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-8 space-y-2 relative">
                  <div className="absolute -top-6 right-8 w-12 h-12 rounded-2xl bg-[#eab308] text-[#0a121f] flex items-center justify-center shadow-lg group-hover:-translate-y-2 transition-transform duration-500">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors duration-300">
                    {item.title}
                  </h2>
                </div>
              </article>
            ))}
          </div>

          {/* Load More / Pagination Placeholder */}
          <div className="mt-20 text-center">
            <button className="px-12 py-5 rounded-2xl bg-white border border-gray-100 text-[#0a121f] font-black uppercase tracking-widest hover:bg-[#0a121f] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[#0a121f]/5">
              Explore More Moments
            </button>
          </div>
        </div>
      </section>

      {/* Social Feed Placeholder */}
      <section className="py-24 bg-[#0a121f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 px-4 max-w-4xl mx-auto text-center space-y-10">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight">
            Follow Our <span className="text-[#eab308]">Kingdom Journey</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto">
            Stay connected with us daily. Follow KDC Uganda on social media for more photos, videos, and live updates.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {["Instagram", "Facebook", "Twitter", "YouTube"].map((social) => (
              <a key={social} href="#" className="px-8 py-3 rounded-full border border-white/10 hover:border-[#eab308] hover:text-[#eab308] text-white text-xs font-bold uppercase tracking-widest transition-all">
                {social}
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
