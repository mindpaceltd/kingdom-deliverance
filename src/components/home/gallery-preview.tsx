import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/server';

type Props = { photos?: string[]; title?: string; badge?: string; ctaLabel?: string; ctaUrl?: string };

export async function HomeGalleryPreview({ photos, title = 'A glimpse of life at KDC.', badge = 'Worship. Fellowship. Community.', ctaLabel = 'Explore the Gallery', ctaUrl = '/gallery' }: Props) {
  let available = photos;
  if (!available) {
    const { data } = await createPublicClient().from('gallery').select('image_url').order('display_order');
    available = (data || []).map(photo => photo.image_url).filter((url): url is string => Boolean(url));
  }
  // Select on the server once per request so every screen renders the same four photos.
  const selection = Array.from(new Set(available.filter(Boolean)));
  for (let index = selection.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [selection[index], selection[swap]] = [selection[swap], selection[index]];
  }
  const preview = selection.slice(0, 4);
  return <section id="gallery-preview" data-gallery-count={preview.length} aria-labelledby="gallery-heading" className="bg-[#0d1b3e] py-12 text-white md:py-20">
    <div className="container px-5 md:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e7ca83]">{badge}</p><h2 id="gallery-heading" className="mt-4 text-3xl text-white md:text-5xl">{title}</h2></div>
        <Link href={ctaUrl || '/gallery'} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">{ctaLabel}<ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{preview.map((url, index) => <Link key={url} href={ctaUrl || '/gallery'} aria-label={`Explore church gallery, photo ${index + 1}`} className="relative block aspect-[4/5] overflow-hidden rounded-xl"><Image src={url} alt="Church life and ministry" fill sizes="(max-width: 767px) 50vw, 25vw" className="object-cover" /></Link>)}</div>
    </div>
  </section>;
}
