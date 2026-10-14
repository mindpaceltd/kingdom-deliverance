"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import type { CmsHomeDetails } from "@/lib/cms/page-content";
interface Testimony {
  slug: string; title: string; name: string; excerpt: string;
  photoUrl: string; photoAlt: string; videoUrl?: string; photoContext?: boolean;
}

export function TestimonyCarousel({ stories, content = {} }: { stories: Testimony[]; content?: CmsHomeDetails }) {
  const track = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false), [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(true), [visible, setVisible] = useState(false), [pageHidden, setPageHidden] = useState(false);
  const looping = stories.length > 1 && !reduced && content.testimonyAutoScroll !== "off";
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches); const visibility = () => setPageHidden(document.hidden);
    update(); visibility(); preference.addEventListener("change", update); document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (track.current) observer.observe(track.current);
    return () => { preference.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); observer.disconnect(); };
  }, []);
  useEffect(() => {
    const element = track.current;
    if (!element || content.testimonyAutoScroll === "off" || !looping || paused || dragging || hovered || focused || !visible || pageHidden) return;
    let frame: number; let previous = 0; let position = element.scrollLeft;
    const speed = Math.min(60, Math.max(10, Number(content.testimonyScrollSpeed) || 22));
    const move = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 50) : 0; previous = now;
      position += elapsed * speed / 1000;
      const start = element.querySelector<HTMLElement>("[data-loop-start]")?.offsetLeft;
      if (start && position >= start) position -= start;
      element.scrollLeft = position;
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move); return () => cancelAnimationFrame(frame);
  }, [looping, paused, dragging, hovered, focused, visible, pageHidden, content.testimonyAutoScroll, content.testimonyScrollSpeed]);
  function step(direction: number) {
    setPaused(true); const element = track.current; if (!element) return;
    const width = element.firstElementChild?.getBoundingClientRect().width ?? 320;
    element.scrollBy({ left: direction * (width + 24), behavior: reduced ? "auto" : "smooth" });
  }
  const card = (story: Testimony, copy = false, index = 0) => <article key={`${copy ? "copy" : "story"}-${index}-${story.slug}`} data-loop-start={copy && index === 0 ? true : undefined} aria-hidden={copy || undefined} className="testimony-card shrink-0 overflow-hidden rounded-2xl border border-primary/10 bg-white">
    <Link href={`/testimonies/${story.slug}`} tabIndex={copy ? -1 : undefined} className="group block h-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-accent">
      <div className="relative h-36 overflow-hidden bg-muted sm:h-40 lg:h-44 xl:h-48"><Image src={story.photoUrl} alt={copy ? "" : story.photoAlt} fill sizes="(max-width: 639px) 86vw, (max-width: 1023px) 45vw, 30vw" quality={75} className="object-cover object-[center_20%] transition-transform duration-500 motion-safe:group-hover:scale-105" />{story.photoContext && <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[9px] text-white">From our church gallery</span>}{story.videoUrl && <span className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-primary"><Play size={14} /> Video testimony</span>}</div>
      <div className="p-4"><p className="mb-2 truncate text-[10px] uppercase tracking-widest text-muted-foreground">{story.name}</p><h3 className="line-clamp-1 text-lg font-semibold leading-6">{story.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-primary/70">{story.excerpt}</p><span className="mt-2 inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-primary">{story.videoUrl ? "Watch Their Story" : "Read Their Story"}<ArrowRight size={16} /></span></div>
    </Link>
  </article>;
  return <section id="stories" className="bg-[#faf8f4] py-8 md:py-10" aria-labelledby="stories-heading"><div className="container px-5 md:px-10">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="home-eyebrow">{content.testimoniesBadge || "Faith. People. Stories."}</p><h2 id="stories-heading" className="mt-2 max-w-2xl text-2xl leading-tight md:text-3xl">{content.testimoniesTitle || "Stories from our church family."}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-primary/70">{content.testimoniesSubtitle || "Meet the people behind the testimonies. Follow their stories and discover life at KDC."}</p></div><Link href="/testimonies" className="inline-flex items-center gap-2 border-b border-primary/30 pb-2 text-sm font-semibold">View All Testimonies <ArrowRight size={17} /></Link></div>
    {stories.length ? <><div ref={track} role="region" aria-label="Church family testimonies" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} onPointerDown={() => setDragging(true)} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)} onPointerLeave={() => setDragging(false)} className="testimony-track relative flex gap-6 overflow-x-auto pb-3">{stories.map(story => card(story))}{looping && stories.concat(stories).map((story, index) => card(story, true, index))}</div>
      <div className="mt-2 flex items-center justify-between gap-3"><p className="text-[11px] text-primary/60">Explore the full story.</p><div className="flex gap-2">{looping && <button className="carousel-control h-11 w-11" onClick={() => setPaused(!paused)} aria-label={paused ? "Play testimony carousel" : "Pause testimony carousel"}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>}<button className="carousel-control h-11 w-11" onClick={() => step(-1)} aria-label="Previous testimony"><ArrowLeft size={18} /></button><button className="carousel-control h-11 w-11" onClick={() => step(1)} aria-label="Next testimony"><ArrowRight size={18} /></button></div></div></> : <div ref={track} className="rounded-2xl border border-primary/10 bg-white p-5 md:p-6"><h3 className="text-2xl">Your story matters.</h3><p className="mt-3 max-w-lg text-primary/70">Would you like to share your experience of faith and community at KDC? Get in touch with our team.</p><Link href={content.testimoniesCtaUrl || "/testimonies#share-story"} className="mt-6 inline-flex items-center gap-2 font-semibold">{content.testimoniesCtaLabel || "Share Your Story"} <ArrowRight size={18} /></Link></div>}
    {stories.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/10 bg-white p-4"><div><h3 className="text-base font-semibold">{content.testimoniesCtaTitle || 'Have a testimony?'}</h3><p className="mt-1 text-xs text-primary/65">{content.testimoniesCtaBody || 'Share your experience with our church family.'}</p></div><Link href={content.testimoniesCtaUrl || '/testimonies#share-story'} className="inline-flex items-center gap-2 font-semibold">{content.testimoniesCtaLabel || 'Share Your Story'} <ArrowRight size={17} /></Link></div>}
  </div></section>;
}
