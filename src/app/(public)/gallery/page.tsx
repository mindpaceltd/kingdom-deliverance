import type { Metadata } from "next";
import { getGallery } from "@/lib/supabase/queries";
import { normalizeMediaUrl } from "@/lib/media-url";
import { DEFAULT_ABOUT_HERO_URL } from "@/lib/seo/page-hero";
import { GalleryLightboxGrid } from "@/components/gallery/gallery-lightbox-grid";

export const metadata: Metadata = {
  title: "Gallery | Kingdom Deliverance Centre Uganda",
  description:
    "View moments from worship services, outreaches, conferences, and church life at Kingdom Deliverance Centre Uganda.",
};

export const revalidate = 3600;

function formatAlbum(album: string | null | undefined): string {
  if (!album) return "General";
  return album.charAt(0).toUpperCase() + album.slice(1);
}

export default async function GalleryPage() {
  const items = await getGallery();
  const heroUrl =
    (items[0]?.image_url && normalizeMediaUrl(items[0].image_url)) ||
    DEFAULT_ABOUT_HERO_URL;

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden py-20 text-white md:py-40">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b3e]/90 via-[#0d1b3e]/75 to-[#0d1b3e]/95" />
        <div className="container relative z-10 px-4 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-accent backdrop-blur-md">
            Moments of Grace
          </div>
          <h1 className="font-serif text-5xl font-bold leading-tight text-white md:text-6xl">
            Photo Gallery
          </h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 md:text-xl">
            Celebrate what God is doing through Kingdom Deliverance Centre Uganda.
          </p>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container px-4">
          {items.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-primary/10 bg-muted/30 px-8 py-16 text-center">
              <p className="font-serif text-xl font-bold text-primary">Gallery coming soon</p>
              <p className="mt-3 text-sm leading-relaxed text-primary/70">
                New photos from our services and outreaches will appear here as they are added.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-center text-sm text-primary/60">
                Tap any photo to view full size — use arrows to browse. Order shuffles on each visit.
              </p>
              <GalleryLightboxGrid
                items={items.map((item) => ({
                  id: item.id,
                  image_url: item.image_url,
                  title: item.title?.trim() || formatAlbum(item.album),
                  category: formatAlbum(item.album),
                  description: item.description,
                }))}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
