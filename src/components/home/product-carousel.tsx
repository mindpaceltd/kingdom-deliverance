'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Download, Package, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/lib/currency-context';
import { getMediaProxyUrl, normalizeMediaUrl } from '@/lib/media-url';
import styles from './product-carousel.module.css';

interface Product {
  id: string; name: string; slug: string; image_url: string;
  price_usd: number; regular_price_usd: number; sale_price_usd: number;
  short_description: string; type: 'digital' | 'physical';
}
interface Props { products: Product[]; badge?: string; title?: string; subtitle?: string; viewAllLabel?: string; viewAllUrl?: string; autoScroll?: boolean }

function ProductThumb({ src, alt }: { src: string; alt: string }) {
  const [url, setUrl] = useState(normalizeMediaUrl(src) || '/placeholder.svg');
  useEffect(() => setUrl(normalizeMediaUrl(src) || '/placeholder.svg'), [src]);
  // Remote product media can require the existing same-origin proxy fallback.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" className="h-full w-full object-contain p-3 drop-shadow-lg transition-transform duration-500 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-[1.03] sm:p-4" onError={() => { const proxy = getMediaProxyUrl(src); if (url !== '/placeholder.svg') setUrl(proxy && url !== proxy ? proxy : '/placeholder.svg'); }} />;
}

function trackMetrics(element: HTMLDivElement) {
  const css = getComputedStyle(element);
  return { columns: Number(css.getPropertyValue('--product-columns')) || 2, step: ((element.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width || 0) + (parseFloat(css.columnGap) || 0) };
}

export function ProductCarousel({ products, badge = 'KDC Store', title = 'Resources for your faith.', subtitle = 'Books, teaching and resources for your daily walk.', viewAllLabel = 'Explore the Shop', viewAllUrl = '/shop', autoScroll = true }: Props) {
  const { formatPrice } = useCurrency();
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ start: 0, columns: 2 });
  const count = products.length;

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => {
      const { columns, step } = trackMetrics(element);
      const start = Math.max(0, Math.min(Math.max(0, count - columns), step ? Math.round(element.scrollLeft / step) : 0));
      setPosition(previous => previous.start === start && previous.columns === columns ? previous : { start, columns });
    };
    update();
    const resize = new ResizeObserver(() => {
      const { columns, step } = trackMetrics(element);
      if (step) element.scrollLeft = Math.min(Math.max(0, count - columns), Math.round(element.scrollLeft / step)) * step;
      update();
    });
    resize.observe(element);
    const intersection = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); intersection.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    return () => { resize.disconnect(); intersection.disconnect(); element.removeEventListener('scroll', update); };
  }, [count]);

  const advance = useCallback((direction: number, automatic = false) => {
    const element = track.current;
    if (!element) return;
    if (!automatic) setPaused(true);
    const { columns, step } = trackMetrics(element);
    const end = element.scrollWidth - element.clientWidth;
    const next = direction > 0 && element.scrollLeft >= end - 3 ? 0 : direction < 0 && element.scrollLeft <= 3 ? end : element.scrollLeft + direction * step * (automatic ? 1 : columns);
    element.scrollTo({ left: Math.max(0, Math.min(end, next)), behavior: reduced ? 'auto' : 'smooth' });
  }, [reduced]);
  useEffect(() => {
    if (!autoScroll || paused || hovered || reduced || !visible || count <= position.columns) return;
    const timer = setInterval(() => { if (!document.hidden) advance(1, true); }, 6000);
    return () => clearInterval(timer);
  }, [advance, autoScroll, paused, hovered, reduced, visible, count, position.columns]);

  if (!count) return null;
  const words = (title || 'Resources for your faith.').trim().split(/\s+/);
  const lastWord = words.pop();
  const lastVisible = Math.min(count, position.start + position.columns);
  const hasMore = count > position.columns;
  const controlClass = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#0d1b3e]/15 bg-white text-[#0d1b3e] transition hover:border-[#0d1b3e] hover:bg-[#0d1b3e] hover:text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#e7ca83] sm:h-11 sm:w-11';

  return <section id="products" aria-labelledby="products-heading" className="border-y border-[#e7ca83]/20 bg-[#f8f6f1] py-12 md:py-16">
    <div className="container px-4 md:px-8 lg:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#b89447]/20 bg-[#eee4ce]/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#74591f]"><BookOpen size={14} aria-hidden="true" />{badge}</p>
          <h2 id="products-heading" className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[#0d1b3e] md:text-4xl">{words.join(' ')} <span className="text-[#806125]">{lastWord}</span></h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:gap-5">
          <Link href={viewAllUrl || '/shop'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#0d1b3e] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#24395f] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#b89447] sm:px-5 sm:text-sm">{viewAllLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>
          {hasMore && <div className="flex items-center gap-1.5" aria-label="Product carousel controls">
            {autoScroll && !reduced && <button type="button" className={controlClass} onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play products carousel' : 'Pause products carousel'}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}
            <button type="button" className={controlClass} onClick={() => advance(-1)} aria-label="Previous products"><ChevronLeft size={19} /></button>
            <button type="button" className={controlClass} onClick={() => advance(1)} aria-label="Next products"><ChevronRight size={19} /></button>
          </div>}
        </div>
      </div>
      <div ref={track} role="region" aria-label="Featured products" aria-roledescription="carousel" tabIndex={0} className={`${styles.track} rounded-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#b89447]`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setPaused(true)} onPointerDown={() => setPaused(true)} onWheel={() => setPaused(true)} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); advance(event.key === 'ArrowRight' ? 1 : -1); } }}>
        {products.map(product => {
          const sale = product.sale_price_usd > 0 && product.sale_price_usd < product.regular_price_usd;
          const price = sale ? product.sale_price_usd : product.regular_price_usd || product.price_usd;
          const saving = sale ? Math.round((1 - price / product.regular_price_usd) * 100) : 0;
          return <article key={product.id} className={`${styles.card} group overflow-hidden rounded-2xl border border-[#0d1b3e]/10 bg-white shadow-sm transition-shadow hover:shadow-lg`}>
            <Link href={`/shop/${product.slug}`} aria-label={`View ${product.name}`} className="flex h-full flex-col rounded-2xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#b89447]">
              <div className={`${styles.cover} relative m-2 aspect-square overflow-hidden rounded-xl`}>
                <ProductThumb src={product.image_url} alt={product.name} />
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#0d1b3e] px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-white sm:text-[9px]">{product.type === 'digital' ? <Download size={10} aria-hidden="true" /> : <Package size={10} aria-hidden="true" />}{product.type === 'digital' ? 'Digital' : 'Physical'}</span>
                {sale && <span className="absolute bottom-2 right-2 rounded-full bg-[#e7ca83] px-2 py-1 text-[10px] font-bold text-[#0d1b3e]">Save {saving}%</span>}
              </div>
              <div className="flex flex-1 flex-col px-3 pb-3 pt-2 md:px-3 xl:px-4 xl:pb-4">
                <h3 className="line-clamp-3 min-h-[60px] text-xs font-semibold leading-5 text-[#0d1b3e] sm:text-[13px] xl:text-sm">{product.name}</h3>
                <div className="mb-4 mt-3 flex min-h-7 flex-wrap items-baseline gap-x-2 gap-y-1"><p className="text-sm font-bold tracking-tight text-[#0d1b3e] xl:text-base">{formatPrice(price)}</p>{sale && <s className="text-[11px] text-slate-500">{formatPrice(product.regular_price_usd)}</s>}</div>
                <span className="mt-auto flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#e7ca83] px-1.5 py-2 text-[11px] font-semibold text-[#0d1b3e] transition-colors group-hover:bg-[#0d1b3e] group-hover:text-white sm:text-xs">View Product <ArrowUpRight size={14} aria-hidden="true" /></span>
              </div>
            </Link>
          </article>;
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-5 border-t border-[#0d1b3e]/10 pt-5">
        <p className="text-xs text-slate-500" aria-label={`Showing products ${position.start + 1} to ${lastVisible} of ${count}`}><span className="font-semibold tabular-nums text-[#0d1b3e]">{position.start + 1}–{lastVisible}</span> of {count} resources</p>
        <div aria-hidden="true" className="h-1 max-w-[180px] flex-1 overflow-hidden rounded-full bg-[#0d1b3e]/10"><div className="h-full rounded-full bg-[#b89447] transition-[width] motion-reduce:transition-none" style={{ width: `${lastVisible / count * 100}%` }} /></div>
      </div>
    </div>
  </section>;
}
