import Image from 'next/image'
import { normalizeMediaUrl } from '@/lib/media-url'

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1920&auto=format&fit=crop'

export function getHeroImageSrc(backgroundImage?: string | null): string {
  return normalizeMediaUrl(backgroundImage) || HERO_FALLBACK
}

/** LCP image — server-rendered <img> so Lighthouse can measure Largest Contentful Paint. */
export function HeroBackground({ src }: { src: string }) {
  return (
    <div className="absolute inset-0 z-0" aria-hidden>
      <Image
        src={src}
        alt=""
        fill
        priority
        fetchPriority="high"
        quality={75}
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b3e]/90 via-[#0d1b3e]/80 to-[#0d1b3e]/95" />
      <div
        className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl float-animation"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl float-animation"
        style={{ animationDelay: '3s' }}
      />
    </div>
  )
}
