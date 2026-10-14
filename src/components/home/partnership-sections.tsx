import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Heart, HandHeart, Radio, Users } from 'lucide-react';
const mediaRoot = 'https://pub-6299bd19a8614368b611590ccf05ac14.r2.dev/images/';
const churchPhotos = [
  { url: mediaRoot + '1779823204561-IMG_0358.jpg', label: 'Worship and the church gathering at KDC' },
  { url: mediaRoot + '1779820085942-IMG_0413.jpeg', label: 'Teaching at Kingdom Deliverance Centre' },
  { url: mediaRoot + '1779823232562-IMG_0352.jpg', label: 'KDC church community' },
  { url: mediaRoot + '1779823258016-IMG_0351.jpeg', label: 'A moment from church life at KDC' },
];
const buttonClass = 'inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#e7ca83]';

const opportunities = [
  { title: 'Share the Gospel.', category: 'Teaching & ministry', body: 'Help make room for worship, prayer and biblical teaching. Partner with the ministry at KDC.', href: '/donations', action: 'Support the ministry', photo: churchPhotos[1], icon: Radio },
  { title: 'Grow a community.', category: 'Church life', body: 'Faith grows through connection. Discover church life and find your place in our Kampala family.', href: '/ministries', action: 'Explore our ministries', photo: churchPhotos[2], icon: Users },
  { title: 'Bring your gifts.', category: 'Serve & volunteer', body: 'Your time, skills and willingness to serve matter. Talk with our team about getting involved.', href: '/contact', action: 'Get involved', photo: churchPhotos[0], icon: HandHeart },
];

export function PartnershipProjects() {
  return (
    <section id="partnership-projects" aria-labelledby="partnership-heading" className="bg-[#f7f4ed] py-16 md:py-24">
      <div className="container px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/65">Partnership projects</p>
            <h2 id="partnership-heading" className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-[#0d1b3e] md:text-6xl">A shared purpose.<br /><span className="text-[#806125]">A place for you.</span></h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-primary/70">Give, connect or lend a hand. Together, we can support the work of the church and share the love of Jesus.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {opportunities.map(({ title, category, body, href, action, photo, icon: Icon }, index) => (
            <Link key={title} href={href} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#0d1b3e]/5 transition-shadow hover:shadow-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#806125]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#0d1b3e]">
                <Image src={photo.url} alt={photo.label} fill sizes="(max-width: 767px) 100vw, 33vw" className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b3e]/75 via-transparent to-transparent" />
                <span className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#e7ca83] text-[#0d1b3e]"><Icon size={21} aria-hidden="true" /></span>
                <span className="absolute bottom-5 left-5 text-xs font-semibold uppercase tracking-[0.16em] text-white">{category}</span>
                <span className="absolute bottom-4 right-5 text-5xl font-semibold text-white/60" aria-hidden="true">0{index + 1}</span>
              </div>
              <div className="flex flex-1 flex-col p-6 lg:p-7">
                <h3 className="text-2xl font-semibold leading-tight text-[#0d1b3e] lg:text-3xl">{title}</h3>
                <p className="mb-7 mt-4 text-sm leading-7 text-primary/70">{body}</p>
                <span className="mt-auto flex min-h-11 items-center justify-between gap-3 border-t border-primary/10 pt-5 text-sm font-semibold text-[#0d1b3e]">{action}<ArrowUpRight size={21} className="transition-transform motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:translate-x-1" aria-hidden="true" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SupportUs() {
  return (
    <section id="support-us" aria-labelledby="support-heading" className="bg-white px-5 py-16 md:px-10 md:py-24">
      <div className="container overflow-hidden rounded-3xl bg-[#0d1b3e] p-0 text-white">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[300px] lg:min-h-[560px]">
            <Image src={churchPhotos[3].url} alt={churchPhotos[3].label} fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b3e] via-[#0d1b3e]/15 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7 md:p-10">
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#e7ca83]/60 text-[#e7ca83]"><Heart size={23} aria-hidden="true" /></span>
              <blockquote className="max-w-sm text-2xl font-medium leading-snug text-white md:text-3xl">“For where your treasure is, there will your heart be also.”</blockquote>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#e7ca83]">Matthew 6:21 · KJV</p>
            </div>
          </div>
          <div className="flex flex-col justify-center p-7 md:p-12 lg:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e7ca83]">Support us</p>
            <h2 id="support-heading" className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl xl:text-6xl">Your generosity.<br /><span className="text-[#e7ca83]">A greater reach.</span></h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/75">Be part of what God is doing through Kingdom Deliverance Centre Uganda. Your giving helps support the ministry and the life of our church.</p>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/65">Every gift is an opportunity to partner in worship, prayer and sharing the Gospel. You can also support KDC with your time and talents.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/donations" className={`${buttonClass} bg-[#e7ca83] text-[#0d1b3e]`}>Give Now <ArrowUpRight size={19} aria-hidden="true" /></Link>
              <Link href="/contact" className={`${buttonClass} border border-white/35 text-white`}>Become a Partner <ArrowUpRight size={19} aria-hidden="true" /></Link>
            </div>
            <div className="mt-8 flex items-center gap-3 border-t border-white/15 pt-6 text-xs font-medium tracking-wide text-white/65"><HandHeart size={20} className="shrink-0 text-[#e7ca83]" aria-hidden="true" /> Give with love. Serve with purpose. Grow together.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
