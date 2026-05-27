'use client'

import { FadeInSection } from '@/components/ui/page-transition'
import type { ResolvedAboutPage } from '@/lib/cms/about-page-defaults'
import { Heart, Users, Award, Globe, Calendar, MapPin } from 'lucide-react'

const FOUNDATION_ICONS = [
  <Heart key="heart" className="w-8 h-8 text-accent" />,
  <Users key="users" className="w-8 h-8 text-accent" />,
  <Award key="award" className="w-8 h-8 text-accent" />,
]

const LEADER_FALLBACK_ICONS = [
  <Award key="a" className="w-6 h-6" />,
  <Heart key="h" className="w-6 h-6" />,
  <Users key="u" className="w-6 h-6" />,
]

export function AboutPageView({ data }: { data: ResolvedAboutPage }) {
  return (
    <div className="flex flex-col">
      <section className="relative pt-48 pb-32 lg:pt-56 lg:pb-40 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url('${data.hero.imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b3e]/90 via-[#0d1b3e]/75 to-[#0d1b3e]/95" />
        <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
          <FadeInSection>
            {data.hero.badge ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
                <MapPin className="w-4 h-4" />
                {data.hero.badge}
              </div>
            ) : null}
            <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight text-white">
              {data.hero.title}
            </h1>
            <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-accent" />
            {data.hero.subtitle ? (
              <p className="mt-6 text-white/90 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
                {data.hero.subtitle}
              </p>
            ) : null}
          </FadeInSection>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="container px-4">
          <FadeInSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-6">
              <Globe className="h-4 w-4" />
              {data.foundationBadge}
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary">
              {data.foundationTitle}
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.foundationCards.map((item, index) => (
              <FadeInSection key={`${item.label}-${index}`} delay={index * 0.2}>
                <div className="group text-center space-y-5 p-8 rounded-2xl border border-gray-200 bg-white hover:border-accent/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                    {FOUNDATION_ICONS[index % FOUNDATION_ICONS.length]}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                    {item.label}
                  </h3>
                  <div className="w-12 h-1 bg-accent mx-auto rounded-full" />
                  <p className="text-primary/75 leading-relaxed">{item.text}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container px-4">
          <FadeInSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-6">
              <Users className="h-4 w-4" />
              {data.leadershipBadge}
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary">
              {data.leadershipTitle}
            </h2>
            <div className="w-20 h-1 bg-accent mx-auto rounded-full mt-4" />
          </FadeInSection>

          <div className="flex flex-wrap justify-center gap-8">
            {data.leaders.map((leader, index) => (
              <FadeInSection
                key={`${leader.name}-${index}`}
                delay={index * 0.2}
                className="w-full max-w-sm"
              >
                <div className="group flex h-full flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative mb-6 size-32 shrink-0 overflow-hidden rounded-full border-4 border-accent/40 bg-gradient-to-br from-[#0d1b3e] to-[#1a3a6e] shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:scale-105 md:size-36">
                    {leader.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={leader.imageUrl}
                        alt={leader.name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10">
                        <div className="text-accent scale-150">
                          {LEADER_FALLBACK_ICONS[index % LEADER_FALLBACK_ICONS.length]}
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-primary transition-colors duration-300 group-hover:text-accent">
                    {leader.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-accent">{leader.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-primary/70">{leader.bio}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#0d1b3e] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:50px_50px]" />
        </div>
        <div className="container px-4 relative z-10">
          <FadeInSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-6 py-3 text-sm font-medium text-accent mb-6">
              <Calendar className="w-4 h-4" />
              {data.timelineBadge}
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
              {data.timelineTitle}
            </h2>
            <div className="w-20 h-1 bg-accent mx-auto rounded-full mt-4" />
          </FadeInSection>

          <div className="max-w-3xl mx-auto relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-accent/30" />
            <div className="space-y-10">
              {data.timeline.map((item, i) => (
                <FadeInSection key={`${item.year}-${i}`} delay={i * 0.1}>
                  <div className="flex gap-6 relative group">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-accent flex items-center justify-center z-10 font-bold text-primary text-sm group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-accent/30">
                      {item.year.slice(2)}
                    </div>
                    <div className="pt-3 flex-1 border border-white/10 rounded-xl p-5 bg-white/5 hover:bg-white/8 transition-colors duration-300">
                      <span className="text-accent font-bold text-base">{item.year}</span>
                      <p className="text-white/90 mt-1 leading-relaxed text-sm">{item.event}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50 text-center">
        <div className="container px-4 max-w-3xl mx-auto space-y-6">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              <Globe className="h-4 w-4" />
              {data.affiliationBadge}
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
              {data.affiliationTitle}
            </h2>
            <div className="w-16 h-1 bg-accent mx-auto rounded-full mt-4 mb-6" />
            <p className="text-primary/75 leading-relaxed text-lg whitespace-pre-line">
              {data.affiliationText}
            </p>
          </FadeInSection>
        </div>
      </section>
    </div>
  )
}
