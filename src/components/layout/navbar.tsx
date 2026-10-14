'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type FC } from 'react';
import Image from 'next/image';
import { Menu, X, ChevronDown, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNavigationActive } from '@/lib/navigation-active';
import { CartSheet } from '@/components/shop/cart-sheet';
import { UserNav } from './user-nav';

type NavLink = { name: string; href: string };
type NavItem = NavLink | { name: string; children: NavLink[] };
const navigation: NavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Events', href: '/events' },
  { name: 'About Us', children: [{ name: 'Our Story', href: '/about' }, { name: 'Gallery', href: '/gallery' }, { name: 'Contact Us', href: '/contact' }] },
  { name: 'Watch', href: '/sermons' },
  { name: 'Connect', children: [{ name: 'Testimonies', href: '/testimonies' }, { name: 'Fire Service', href: '/fire-service' }, { name: 'Ministries', href: '/ministries' }, { name: 'Live Broadcast', href: '/live' }, { name: 'Prayer Request', href: '/prayer' }] },
  { name: 'Shop', href: '/shop' },
  { name: 'More', children: [{ name: 'Blog', href: '/blog' }, { name: 'Partner With Us', href: '/donations' }] },
];
const activeClass = 'bg-[#e7ca83] text-[#0d1b3e] font-semibold shadow-sm';
const idleClass = 'text-white/80 hover:bg-white/10 hover:text-white';
const focusClass = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e7ca83]';

export const Navbar: FC<{ logo?: string }> = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const active = (href: string) => isNavigationActive(pathname, href);
  const current = (href: string) => active(href) ? pathname === href ? 'page' as const : 'location' as const : undefined;

  useEffect(() => { setIsOpen(false); setDropdown(null); }, [pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setIsOpen(false); setDropdown(null); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return <nav aria-label="Main navigation" className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1b3e] shadow-lg shadow-[#0d1b3e]/10">
    <div className="container flex items-center justify-between gap-3 px-4 py-3 md:px-6">
      <Link href="/" aria-label="Kingdom Deliverance Centre Uganda home" className={`flex min-w-0 items-center gap-2 ${focusClass}`}>
        <Image src="/branding/church-logo.png" alt="" width={80} height={80} priority className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20" />
        <span className="min-w-0"><span className="block truncate text-sm font-bold tracking-wide text-white sm:text-base">Kingdom Deliverance</span><span className="mt-1 block text-[9px] uppercase tracking-[0.2em] text-white/60 sm:text-[10px]">Centre Uganda</span></span>
      </Link>
      <div className="hidden items-center gap-1 xl:flex">
        {navigation.map(item => {
          if ('children' in item) {
            const selected = item.children.some(link => active(link.href));
            return <div key={item.name} className="relative py-2" onMouseLeave={() => setDropdown(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDropdown(null); }}>
              <button type="button" onClick={() => setDropdown(value => value === item.name ? null : item.name)} aria-expanded={dropdown === item.name} aria-controls={`nav-${item.name.replace(/\s/g, '-').toLowerCase()}`} aria-current={selected ? 'location' : undefined} className={cn('flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm transition-colors', focusClass, selected ? activeClass : idleClass)}>{item.name}<ChevronDown size={13} aria-hidden="true" className={cn('transition-transform', dropdown === item.name && 'rotate-180')} /></button>
              {dropdown === item.name && <div id={`nav-${item.name.replace(/\s/g, '-').toLowerCase()}`} className="absolute left-0 top-full w-56 rounded-2xl border border-white/15 bg-[#0d1b3e] p-2 shadow-2xl">
                {item.children.map(link => <Link key={link.href} href={link.href} aria-current={current(link.href)} onClick={() => setDropdown(null)} className={cn('flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors', focusClass, active(link.href) ? activeClass : idleClass)}>{link.name}{active(link.href) && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}</Link>)}
              </div>}
            </div>;
          }
          return <Link key={item.href} href={item.href} aria-current={current(item.href)} className={cn('inline-flex min-h-11 items-center rounded-full px-3 text-sm transition-colors', focusClass, active(item.href) ? activeClass : idleClass)}>{item.name}</Link>;
        })}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <CartSheet />
        <div className="hidden xl:block"><UserNav /></div>
        <Link href="/donations" aria-current={current('/donations')} className={`hidden min-h-11 items-center gap-2 rounded-full bg-[#e7ca83] px-5 text-sm font-semibold text-[#0d1b3e] transition hover:bg-[#f2d99e] xl:inline-flex ${focusClass}`}>Give <ArrowUpRight size={16} aria-hidden="true" /></Link>
        <button type="button" className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/10 xl:hidden ${focusClass}`} aria-expanded={isOpen} aria-controls="mobile-navigation" aria-label={isOpen ? 'Close menu' : 'Open menu'} onClick={() => setIsOpen(value => !value)}>{isOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </div>
    {isOpen && <div id="mobile-navigation" className="max-h-[calc(100dvh-104px)] overflow-y-auto border-t border-white/10 bg-[#0d1b3e] px-4 pb-7 pt-4 xl:hidden">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4"><UserNav /><Link href="/donations" onClick={() => setIsOpen(false)} className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e7ca83] px-5 text-sm font-semibold text-[#0d1b3e] ${focusClass}`}>Give <ArrowUpRight size={16} /></Link></div>
      <div className="space-y-2">{navigation.map(item => 'children' in item ? <div key={item.name} className="pb-2 pt-3"><p className={cn('mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.18em]', item.children.some(link => active(link.href)) ? 'text-[#e7ca83]' : 'text-white/45')}>{item.name}</p><div className="space-y-1">{item.children.map(link => <Link key={link.href} href={link.href} aria-current={current(link.href)} onClick={() => setIsOpen(false)} className={cn('flex min-h-11 items-center justify-between rounded-xl px-4 py-3 text-sm', focusClass, active(link.href) ? activeClass : idleClass)}>{link.name}{active(link.href) && <span className="text-xs">Current section</span>}</Link>)}</div></div> : <Link key={item.href} href={item.href} aria-current={current(item.href)} onClick={() => setIsOpen(false)} className={cn('flex min-h-11 items-center justify-between rounded-xl px-4 py-3 text-sm', focusClass, active(item.href) ? activeClass : idleClass)}>{item.name}{active(item.href) && <span className="text-xs">Current section</span>}</Link>)}</div>
    </div>}
  </nav>;
};
