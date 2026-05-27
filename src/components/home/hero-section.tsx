import { HeroBackground, getHeroImageSrc } from '@/components/home/hero-background'
import { HeroSectionContent } from '@/components/home/hero-section-content'

export function HeroSection({ backgroundImage }: { backgroundImage?: string | null }) {
  const heroSrc = getHeroImageSrc(backgroundImage)

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
      <HeroBackground src={heroSrc} />
      <HeroSectionContent />
    </section>
  )
}
