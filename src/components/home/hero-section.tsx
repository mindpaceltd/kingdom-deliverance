import { HeroBackground, getHeroImageSrc } from '@/components/home/hero-background'
import {
  HeroSectionContent,
  type HeroSectionContentProps,
} from '@/components/home/hero-section-content'

export function HeroSection({
  backgroundImage,
  content,
}: {
  backgroundImage?: string | null
  content: HeroSectionContentProps
}) {
  const heroSrc = getHeroImageSrc(backgroundImage)

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
      <HeroBackground src={heroSrc} />
      <HeroSectionContent {...content} />
    </section>
  )
}
