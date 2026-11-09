'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLenis } from 'lenis/react';
import { ArrowUpRight, Play } from 'lucide-react';
import Footer from '@/components/Footer';
import { whatsappHref } from '@/components/concierge/enquiry';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { live, openFilm } from '@/lib/stage-store';
import { curtainClick, LABELS } from '@/lib/curtain';
import { stories } from '@/content/stories';
import { shortCity, weddingBySlug } from '@/content/collection';
import { site } from '@/content/site';
import CollectionHeader from './CollectionHeader';
import Bookmark from './Bookmark';
import RelatedCarousel from './RelatedCarousel';
import { coverSizes } from './WeddingCard';
import { C, markLeavingDetail, navMemory, pad2, scrollToY, useCollectionTheme } from './shared';

/** A wedding's page: its frames on the left at their true proportions, the story and details pinned on the right. */
export default function LookView({ slug }: { slug: string }) {
  const w = weddingBySlug(slug)!;
  const story = w.storyIndex != null ? stories[w.storyIndex] : null;
  useCollectionTheme();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [railOn, setRailOn] = useState(false);
  const [more, setMore] = useState(false);
  const fromGrid = useRef(false);

  // Arrive at the top (or at a frame from a #frame-N link); leaving tells the grid to restore its place.
  useLayoutEffect(() => {
    fromGrid.current = navMemory.openedFromGrid;
    navMemory.openedFromGrid = false;
    const m = /^#frame-(\d+)$/.exec(window.location.hash);
    const target = m ? document.getElementById(`frame-${m[1]}`) : null;
    scrollToY(target ? target.getBoundingClientRect().top + window.scrollY : 0);
    return () => {
      markLeavingDetail();
      setMore(false);
    };
  }, []);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // fromTo, not from: explicit end values can't be skewed by a CSS transition caught mid-flight.
        gsap.fromTo(el.querySelectorAll('.lv-in'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: 'vow', delay: 0.15 });
        gsap.fromTo(el.querySelectorAll('.lv-frame'), { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 1.4, stagger: 0.12, ease: 'vow' });
      });
    },
    { scope: root },
  );

  // Desktop: which frame is in view, and whether the frame rail should show at all.
  useLenis(() => {
    const box = framesRef.current;
    if (!box || window.innerWidth < 1024) return;
    const r = box.getBoundingClientRect();
    setRailOn(r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.4);
    const mid = window.innerHeight / 2;
    let best = 0;
    let bestD = Infinity;
    box.querySelectorAll<HTMLElement>('[data-frame]').forEach((f, i) => {
      const fr = f.getBoundingClientRect();
      const d = Math.abs(fr.top + fr.height / 2 - mid);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setActive(best);
  });

  // Phones: the frames are a swipeable row.
  const onRowScroll = () => {
    const el = rail.current;
    if (el && window.innerWidth < 1024) setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  };

  const jump = (i: number) => {
    const f = framesRef.current?.querySelector<HTMLElement>(`[data-frame="${i}"]`);
    if (!f) return;
    if (window.innerWidth < 1024) rail.current?.scrollTo({ left: i * (rail.current?.clientWidth ?? 0), behavior: 'smooth' });
    else live.lenis?.scrollTo(f, { offset: -(window.innerHeight - Math.min(f.offsetHeight, window.innerHeight)) / 2, duration: 1.1 });
  };

  const back = (e: React.MouseEvent) => {
    if (!fromGrid.current || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    router.back();
  };

  const details = [
    { label: 'Venue', value: w.venue },
    { label: 'Region', value: w.region },
    { label: 'Season', value: `${w.season} · ${w.month}` },
    { label: 'Celebrations', value: w.celebrations.join(' · ') },
    { label: 'Light', value: w.light },
    { label: 'Coverage', value: w.coverage },
    { label: 'Crew', value: w.crew },
    { label: 'Delivered', value: w.delivered },
  ];
  const first = details.slice(0, 4);
  const rest = details.slice(4);
  const message = `Hello Seven Vow Stories, we loved ${w.couple}'s wedding in ${shortCity(w)} from your collection and would love to talk about ours.`;

  return (
    <main ref={root} className="relative min-h-screen" style={{ background: C.paper, color: C.ink, overflowAnchor: 'none' }}>
      <CollectionHeader variant="solid" />

      <div className="max-lg:pt-16 lg:grid lg:grid-cols-2">
        {/* ---------- Frames ---------- */}
        <section ref={framesRef} aria-label={`Photographs from ${w.couple}'s wedding`} className="relative">
          <div ref={rail} onScroll={onRowScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:block lg:overflow-visible">
            {w.frames.map((f, i) => (
              <figure
                key={f.src}
                id={`frame-${i + 1}`}
                data-frame={i}
                className="relative w-full shrink-0 snap-center overflow-hidden max-lg:aspect-[4/5] lg:mb-2 lg:last:mb-0"
              >
                <Image
                  src={f.src}
                  alt={f.caption}
                  width={f.w}
                  height={f.h}
                  sizes={coverSizes(f, { lg: 50 / Math.max(1, f.w / f.h / 0.8), base: 100 }, 4 / 5)}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : undefined}
                  className="lv-frame max-lg:absolute max-lg:inset-0 max-lg:h-full max-lg:w-full max-lg:object-cover lg:h-auto lg:w-full"
                />
                <figcaption className="pointer-events-none absolute bottom-3 left-4 font-sans text-[0.72rem] text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] lg:bottom-4 lg:left-5">
                  {f.caption}
                </figcaption>
              </figure>
            ))}
          </div>
          {/* phone counter */}
          <div className="flex items-center justify-between px-4 pt-3 font-sans text-[0.72rem] tracking-[0.14em] tabular-nums lg:hidden">
            <span>
              {pad2(active + 1)} / {pad2(w.frames.length)}
            </span>
            <span className="flex gap-1.5" aria-hidden>
              {w.frames.map((f, i) => (
                <span key={f.src} className="h-px w-5 transition-colors duration-500" style={{ background: i === active ? C.ink : `${C.ink}33` }} />
              ))}
            </span>
          </div>
          {/* desktop rail */}
          <nav
            aria-label="Photographs"
            className="fixed top-1/2 left-5 z-20 hidden -translate-y-1/2 flex-col items-center gap-2.5 transition-opacity duration-500 lg:flex"
            style={{ opacity: railOn ? 1 : 0, pointerEvents: railOn ? 'auto' : 'none' }}
          >
            {w.frames.map((f, i) => (
              <button
                key={f.src}
                type="button"
                onClick={() => jump(i)}
                aria-label={`Photograph ${i + 1}: ${f.caption}`}
                aria-current={i === active ? 'true' : undefined}
                className="grid h-5 w-4 place-items-center"
              >
                <span
                  className="block w-0.5 rounded-full bg-white mix-blend-difference transition-[height,opacity] duration-500"
                  style={{ height: i === active ? 20 : 3, opacity: i === active ? 1 : 0.7 }}
                />
              </button>
            ))}
          </nav>
        </section>

        {/* ---------- Story & details ---------- */}
        <aside className="lg:sticky lg:top-0 lg:min-h-svh lg:self-start">
          <div className="mx-auto w-full max-w-[34rem] px-5 pt-8 pb-14 sm:px-8 lg:px-10 lg:pt-[clamp(3rem,9vh,5.5rem)] xl:px-0">
            <nav aria-label="Breadcrumb" className="lv-in flex items-center gap-3 font-sans text-[0.7rem] tracking-[0.14em] uppercase">
              <Link href="/collection" onClick={back} className="font-medium underline-offset-4 hover:underline">
                The Collection
              </Link>
              <span className="h-3.5 w-px" style={{ background: `${C.ink}55` }} aria-hidden />
              <span className="opacity-60">{story ? `Vow ${story.numeral} · ${story.theme}` : 'From the archive'}</span>
            </nav>

            <div className="lv-in mt-7 flex items-start justify-between gap-4">
              <h1 className="font-sans text-[clamp(1.45rem,1.15rem+0.9vw,1.9rem)] leading-tight font-medium tracking-[0.14em] uppercase">{w.couple}</h1>
              <Bookmark slug={w.slug} name={w.couple} large className="mt-0.5" />
            </div>
            <p className="lv-in serif-italic mt-2 text-[clamp(1.2rem,1.05rem+0.4vw,1.4rem)] leading-snug">{w.tagline}</p>
            <p className="lv-in mt-5 font-sans text-[0.95rem] leading-relaxed opacity-70">{w.description}</p>

            <Link
              href="/#concierge"
              onClick={curtainClick('/#concierge', LABELS.concierge)}
              className="lv-in mt-8 grid h-12 w-full place-items-center bg-[#1d1a1f] font-sans text-[0.74rem] tracking-[0.16em] text-[#f7f4ef] uppercase transition-colors duration-300 hover:bg-[#3a3440]"
            >
              Book a date
            </Link>
            {story && (
              <div className="lv-in mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openFilm(story.index)}
                  className="flex h-12 items-center justify-center gap-2 border font-sans text-[0.7rem] tracking-[0.14em] uppercase transition-colors hover:bg-black/[0.04]"
                  style={{ borderColor: `${C.ink}40` }}
                >
                  <Play className="size-3 fill-current" strokeWidth={0} /> Watch the film
                </button>
                <Link
                  href={`/stories/${story.slug}`}
                  className="flex h-12 items-center justify-center gap-1.5 border font-sans text-[0.7rem] tracking-[0.14em] uppercase transition-colors hover:bg-black/[0.04]"
                  style={{ borderColor: `${C.ink}40` }}
                >
                  Read the chapter <ArrowUpRight className="size-3.5" strokeWidth={1.4} />
                </Link>
              </div>
            )}

            <section aria-labelledby="details-title" className="lv-in mt-10">
              <h2 id="details-title" className="font-sans text-[0.76rem] font-medium tracking-[0.14em] uppercase">
                Details
              </h2>
              <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-6">
                {first.map((d) => (
                  <div key={d.label}>
                    <dt className="font-sans text-[0.68rem] tracking-[0.14em] uppercase opacity-55">{d.label}</dt>
                    <dd className="mt-2 font-sans text-[0.92rem] leading-snug">{d.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="grid transition-[grid-template-rows] duration-500 ease-[var(--ease-vow)]" style={{ gridTemplateRows: more ? '1fr' : '0fr' }}>
                <div className="overflow-hidden">
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-6 pt-6" aria-hidden={!more}>
                    {rest.map((d) => (
                      <div key={d.label}>
                        <dt className="font-sans text-[0.68rem] tracking-[0.14em] uppercase opacity-55">{d.label}</dt>
                        <dd className="mt-2 font-sans text-[0.92rem] leading-snug">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="mt-5 inline-flex items-center gap-2 font-sans text-[0.88rem]">
                {more ? 'Show less' : `+${rest.length} more`}
                <svg viewBox="0 0 14 8" className={`w-3 transition-transform duration-500 ${more ? 'rotate-180' : ''}`} aria-hidden>
                  <path d="M1 1l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.1" />
                </svg>
              </button>
            </section>

            <p className="lv-in mt-8 border-t pt-6 font-sans text-[0.88rem] opacity-80" style={{ borderColor: `${C.ink}17` }}>
              Planning yours?{' '}
              <a href={whatsappHref(site.contact.whatsapp, message)} target="_blank" rel="noopener noreferrer" className="ml-1 underline underline-offset-4 hover:opacity-70">
                Talk to us on WhatsApp
              </a>
            </p>
          </div>
        </aside>
      </div>

      <RelatedCarousel w={w} />
      <Footer backLabel="Back to top" />
    </main>
  );
}
