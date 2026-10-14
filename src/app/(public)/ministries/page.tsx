import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowUpRight, BookOpen, Check, Clock3, Flame, HandHeart, HeartHandshake, Music2, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/server'
import { EventImage } from '@/components/content/event-image'
import { buildListPageMetadata } from '@/lib/seo/list-page-metadata'
import { pageKeywords } from '@/lib/seo/brand-keywords'

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: 'Ministries',
    description: 'Find your place at Kingdom Deliverance Centre Uganda. Explore worship, prayer, Bible study and opportunities to serve with our church family in Kampala.',
    path: '/ministries', keywords: pageKeywords('ministries'), ogType: 'ministry',
  })
}

export const dynamic = 'force-dynamic'

const waysToConnect = [
  { title: 'Worship & music', category: 'Bring your gifts', description: 'Interested in singing, music or supporting worship? Talk with our team about opportunities to get involved.', icon: Music2, href: '/contact', action: 'Ask about serving', color: 'bg-[#f2eaf8] text-[#714394]' },
  { title: 'Prayer & intercession', category: 'Stand together in faith', description: 'Share a prayer request with our ministry team and find support for the people and situations on your heart.', icon: HandHeart, href: '/prayer', action: 'Request prayer', color: 'bg-[#f9eddc] text-[#956627]' },
  { title: 'Bible study', category: 'Grow in the Word', description: 'Join our Wednesday Bible study, from 6:00–9:30 PM EAT, and make time for Scripture and fellowship.', icon: BookOpen, href: '/visit', action: 'Plan your visit', color: 'bg-[#e7eeeb] text-[#3c705a]' },
  { title: 'Monthly Fire Service', category: 'Gather for prayer', description: 'Come together for worship, prayer and deliverance on the last Friday of each month, 6:00–9:30 PM EAT.', icon: Flame, href: '/fire-service', action: 'See the next service', color: 'bg-[#fce8e2] text-[#ae4d30]' },
  { title: 'Serve & volunteer', category: 'Make a difference', description: 'Tell us about your interests and skills. Our team can help you explore current ways to support the life of the church.', icon: HeartHandshake, href: '/contact', action: 'Talk with our team', color: 'bg-[#e7edf8] text-[#4e6898]' },
  { title: 'Church community', category: 'Find your people', description: 'New to KDC? Join a service, meet our church family and take your next step in worship and fellowship.', icon: Users, href: '/visit', action: 'Join us at KDC', color: 'bg-[#f4eddf] text-[#806125]' },
]

export default async function MinistriesPage() {
  const { data: ministries, error } = await createPublicClient().from('ministries').select('*')
    .eq('is_active', true).eq('status', 'published').order('display_order', { ascending: true })
  if (error) console.error('[MinistriesPage]', error.message)

  return <div className="bg-[#faf8f4] pt-[89px] text-[#0d1b3e] sm:pt-[105px]">
    <section aria-labelledby="ministries-title" className="relative overflow-hidden bg-[#0d1b3e] text-white">
      <div className="container grid items-center gap-8 px-5 py-10 md:grid-cols-2 md:px-10 md:py-12 lg:gap-14">
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e7ca83]">Ministries · Kingdom Deliverance Centre</p>
          <h1 id="ministries-title" className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">A place to belong.<br /><span className="text-[#e7ca83]">A purpose to share.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/75">Grow in faith, build friendships and bring your gifts to the life of our church. Your next step can start here.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="#get-involved" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e7ca83] px-5 py-3 text-sm font-semibold text-[#0d1b3e] transition hover:bg-[#f5dc9d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Find your place <ArrowDown size={16} aria-hidden="true" /></Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Talk with our team <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl pb-4 pr-4">
          <div className="absolute bottom-0 right-0 h-3/4 w-3/4 rounded-[24px] border border-[#e7ca83]/40" />
          <div className="relative h-60 overflow-hidden rounded-[20px] sm:h-72 lg:h-[340px]">
            <Image src="/images/ministries/church-worship.webp" alt="Musicians and the worship team at Kingdom Deliverance Centre Uganda" fill priority sizes="(max-width:767px) 100vw, 50vw" className="object-cover object-[center_32%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b3e]/75 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-5 flex items-center gap-2 text-sm font-medium text-white"><span className="h-2 w-2 rounded-full bg-[#e7ca83]" />Worship. Fellowship. Community.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="get-involved" aria-labelledby="get-involved-title" className="scroll-mt-28 py-10 md:py-14">
      <div className="container px-5 md:px-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6a2d]">Connect · Grow · Serve</p><h2 id="get-involved-title" className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Take your next step.</h2><p className="mt-3 text-sm leading-6 text-slate-600">Explore church life at KDC, or talk with our team about where your gifts and interests could fit.</p></div>
          <Link href="/visit" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">New here? Plan a visit <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
        {Boolean(ministries?.length) && <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Church ministries">
          {ministries!.map(ministry => <Link key={ministry.id} href={`/ministries/${ministry.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[#0d1b3e]/10 bg-white transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#947332]">
            {ministry.image_url && <div className="h-44 overflow-hidden"><EventImage src={ministry.image_url} alt={ministry.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></div>}
            <div className="flex flex-1 flex-col p-5"><p className="text-xs font-semibold uppercase tracking-widest text-[#8a6a2d]">KDC Ministry</p><h3 className="mt-2 text-xl font-semibold">{ministry.name}</h3>{ministry.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{ministry.description}</p>}<div className="my-4 space-y-2 text-xs text-slate-500">{ministry.leader && <p className="flex items-center gap-2"><Users size={14} aria-hidden="true" />{ministry.leader}</p>}{ministry.meeting_time && <p className="flex items-center gap-2"><Clock3 size={14} aria-hidden="true" />{ministry.meeting_time}</p>}</div><span className="mt-auto inline-flex min-h-10 items-center gap-2 text-sm font-semibold">Explore ministry <ArrowUpRight size={16} aria-hidden="true" /></span></div>
          </Link>)}
        </div>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Ways to get involved">
          {waysToConnect.map(({ title, category, description, icon: Icon, href, action, color }) => <Link href={href} key={title} className="group flex flex-col rounded-2xl border border-[#0d1b3e]/10 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#c2a569] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#947332] md:p-6">
            <div className="flex items-start justify-between gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}><Icon size={23} strokeWidth={1.7} aria-hidden="true" /></span><ArrowUpRight size={19} className="mt-1 text-slate-400 transition group-hover:text-[#8a6a2d]" aria-hidden="true" /></div>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a6a2d]">{category}</p><h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3><p className="mb-4 mt-3 text-sm leading-6 text-slate-600">{description}</p><span className="mt-auto flex min-h-10 items-center gap-2 border-t border-slate-100 pt-3 text-sm font-semibold">{action}<ArrowUpRight size={16} aria-hidden="true" /></span>
          </Link>)}
        </div>
      </div>
    </section>

    <section aria-labelledby="first-step-title" className="pb-10 md:pb-14">
      <div className="container px-5 md:px-10"><div className="grid overflow-hidden rounded-2xl bg-[#eee8da] md:grid-cols-5">
        <div className="relative h-52 md:col-span-2 md:h-auto md:min-h-72"><Image src="/images/ministries/church-teaching.webp" alt="Teaching and worship inside Kingdom Deliverance Centre Uganda" fill sizes="(max-width:767px) 100vw, 40vw" className="object-cover object-[center_30%]" /></div>
        <div className="p-6 md:col-span-3 md:p-8 lg:p-10"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a2d]">You are welcome here</p><h2 id="first-step-title" className="mt-3 text-2xl font-semibold md:text-3xl">Not sure where to start?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">You do not need to have it all figured out. Come to a service, get to know our church family and tell us how you would like to get involved.</p><ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium">{['Visit a service', 'Meet the team', 'Explore serving'].map(step => <li key={step} className="flex items-center gap-2"><Check size={14} className="text-[#806125]" aria-hidden="true" />{step}</li>)}</ul><Link href="/contact" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0d1b3e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#263b64]">Let’s find your next step <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
      </div></div>
    </section>
  </div>
}
