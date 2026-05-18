import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Gallery | Kingdom Deliverance Centre Uganda",
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
    <div className="flex flex-col">
      <section className="relative py-20 md:py-40 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1800&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
            Moments of Grace
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">Photo Gallery</h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Celebrate what God is doing through Kingdom Deliverance Centre Uganda.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {galleryItems.map((item) => (
              <article
                key={item.id}
                className="group rounded-2xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-accent">
                    {item.category}
                  </span>
                  <h2 className="font-serif text-xl font-bold text-primary">{item.title}</h2>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
