import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Clock3, Flame, MapPin } from 'lucide-react'
import { EventImage } from '@/components/content/event-image'
import { FIRE_SERVICE_EVENT_SLUG, FIRE_SERVICE_LOCATION, getFireServiceSchedule } from '@/lib/fire-service-schedule'

export function FireServiceSection() {
  const schedule = getFireServiceSchedule()
  const eventUrl = `/events/${FIRE_SERVICE_EVENT_SLUG}`
  return <section id="fire-service" aria-labelledby="home-fire-service-title" className="scroll-mt-28 overflow-hidden border-y border-[#e7ca83]/20 bg-gradient-to-br from-[#231126] via-[#19132b] to-[#0d1b3e] py-8 text-white md:py-10">
    <div className="container px-5 md:px-10">
      <div className="grid grid-cols-[minmax(0,1fr)_112px] items-start gap-x-4 gap-y-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center sm:gap-x-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-14">
        <div className="col-start-1 row-start-1">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#e7ca83] sm:text-xs"><Flame size={16} className="shrink-0" aria-hidden="true" />Worship · Prayer · Deliverance</p>
          <h2 id="home-fire-service-title" className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">The <span className="text-[#e7ca83]">Fire Service.</span></h2>
          <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-white/75 sm:block">Join our church family for a night of worship, prayer and deliverance. Come in person or share your prayer list with our ministry team.</p>
        </div>
        <Link href={eventUrl} aria-label="View the Fire Service event and full poster" className="col-start-2 row-start-1 block overflow-hidden rounded-xl border border-[#e7ca83]/35 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e7ca83] sm:row-span-3 sm:rounded-2xl">
          <EventImage src="https://kdcuganda.org/events/fire-service-poster.png" alt={`Fire Service poster with Bishop Climate Wiseman and KDC church photos — ${schedule.formattedDate}`} className="h-auto w-full" />
        </Link>
        <div className="col-span-2 sm:col-span-1">
          <p className="mb-4 text-sm leading-6 text-white/75 sm:hidden">A night of worship, prayer and deliverance. Join us in person or send your prayer list to our ministry team.</p>
          <div className="rounded-2xl border border-[#e7ca83]/20 bg-white/5 p-4 md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e7ca83]">Next Fire Service</p>
            <p className="mt-2 flex items-start gap-3 text-base font-semibold sm:text-lg"><CalendarDays size={19} className="mt-0.5 shrink-0 text-[#e7ca83]" aria-hidden="true" /><span>{schedule.formattedDate}</span></p>
            <p className="mt-3 flex items-start gap-3 text-sm text-white/80"><Clock3 size={17} className="shrink-0 text-[#e7ca83]" aria-hidden="true" />{schedule.formattedTime}</p>
            <p className="mt-3 flex items-start gap-3 text-xs leading-5 text-white/65"><MapPin size={17} className="mt-0.5 shrink-0 text-[#e7ca83]" aria-hidden="true" />{FIRE_SERVICE_LOCATION}</p>
            <p className="mt-3 border-t border-white/10 pt-3 text-[11px] text-white/55">Held on the last Friday of every month.</p>
          </div>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1">
          <Link href={eventUrl} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e7ca83] px-5 py-3 text-xs font-semibold text-[#0d1b3e] transition hover:bg-[#f4dca2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">View event details <ArrowUpRight size={16} aria-hidden="true" /></Link>
          <Link href="/fire-service#prayer-form" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e7ca83]">Submit your Fire List <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  </section>
}
