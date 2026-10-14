import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Clock3, Flame, MapPin } from 'lucide-react';

export function WeeklyServices({ label = 'Join us this week', services }: { label?: string; services: { label: string; time: string }[] }) {
  return <section aria-labelledby="weekly-services-heading" className="border-b border-[#0d1b3e]/5 bg-[#f7f5ef] py-8 md:py-10">
    <div className="container px-5 md:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0d1b3e] text-[#e7ca83]"><CalendarDays size={22} aria-hidden="true" /></span><div><h2 id="weekly-services-heading" className="text-lg font-semibold tracking-tight text-[#0d1b3e] md:text-xl">{label}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={13} aria-hidden="true" />Kampala, Uganda · East Africa Time</p></div></div>
        <Link href="/visit" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#0d1b3e]/15 bg-white px-5 py-2 text-sm font-semibold text-[#0d1b3e] transition hover:bg-[#0d1b3e] hover:text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#947332]">Plan your visit <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{services.map((service, index) => {
        const fire = /fire/i.test(service.label);
        return <div key={`${service.label}-${index}`} className={`relative overflow-hidden rounded-2xl border p-5 ${fire ? 'border-[#e7ca83]/50 bg-[#0d1b3e] text-white' : 'border-slate-200/80 bg-white text-[#0d1b3e]'}`}>
          <div className="flex items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${fire ? 'bg-[#e7ca83]/15 text-[#e7ca83]' : 'bg-[#f7f5ef] text-[#806125]'}`}>{fire ? <Flame size={18} aria-hidden="true" /> : <Clock3 size={18} aria-hidden="true" />}</span><h3 className={`text-sm font-semibold leading-5 ${fire ? 'text-white' : 'text-[#0d1b3e]'}`}>{service.label}</h3></div>
          <p className={`mt-4 text-sm font-medium leading-6 ${fire ? 'text-[#e7ca83]' : 'text-slate-600'}`}>{service.time}</p>
        </div>;
      })}</div>
    </div>
  </section>;
}
