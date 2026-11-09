'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Play } from 'lucide-react';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { live, openFilm, stage, useStage } from '@/lib/stage-store';
import { filmStillSrc, posterSrc, stories } from '@/content/stories';
import { site } from '@/content/site';
import Accent from '@/components/Accent';

export default function ChapterView({ index }: { index: number }) {
  const s = stories[index];
  const next = stories[(index + 1) % stories.length];
  const p = s.palette;
  const root = useRef<HTMLDivElement>(null);
  const posterBox = useRef<HTMLDivElement>(null);
  const flight = useStage((st) => st.flight);
  const arriving = flight?.slug === s.slug;
  const revealed = !arriving;

  // Page colours: set at once on a direct visit; the ring flight has already been tweening them.
  useLayoutEffect(() => {
    if (!stage.get().flight) {
      gsap.set(document.documentElement, { '--page-bg': p.pageBg, '--ink': p.pageInk, '--tint': p.pageBg, '--accent': p.accent });
    } else {
      gsap.to(document.documentElement, { '--accent': p.accent, duration: 0.8 });
    }
    live.lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [p]);

  // Tell the stage where the poster sits so the flying card lands exactly on it.
  const markLoaded = useCallback(() => {
    live.chapterPosterLoaded = true;
  }, []);
  useLayoutEffect(() => {
    const el = posterBox.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    live.chapterPoster = { x: r.left, y: r.top, w: r.width, h: r.height };
    const img = el.querySelector('img');
    if (img?.complete && img.naturalWidth) markLoaded();
    return () => {
      live.chapterPoster = null;
    };
  }, [markLoaded]);

  // Reveal the surrounding type once the card has landed.
  useEffect(() => {
    if (!revealed || !root.current) return;
    const bits = root.current.querySelectorAll('.ch-in');
    if (live.reduced) {
      gsap.set(bits, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(bits, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, ease: 'vow' });
  }, [revealed]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.to(posterBox.current, {
          yPercent: -18,
          scale: 0.86,
          ease: 'none',
          scrollTrigger: { trigger: el.querySelector('.ch-hero'), start: 'top top', end: 'bottom top', scrub: true },
        });
        el.querySelectorAll<HTMLElement>('.ch-par').forEach((img) => {
          gsap.fromTo(
            img,
            { yPercent: -8, scale: 1.12 },
            { yPercent: 8, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
          );
        });
        el.querySelectorAll<HTMLElement>('.ch-rise').forEach((t) => {
          gsap.from(t, { y: 40, opacity: 0, duration: 1.1, ease: 'vow', scrollTrigger: { trigger: t, start: 'top 85%' } });
        });
        gsap.fromTo(
          el.querySelector('.ch-pill'),
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, ease: 'none', scrollTrigger: { trigger: el.querySelector('.ch-meaning'), start: 'top 80%', end: 'top 60%', scrub: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="relative min-h-screen"
      style={{ background: flight ? 'transparent' : p.pageBg, color: p.pageInk, overflowAnchor: 'none' }}
    >
      {/* ---------- Hero ---------- */}
      <section className="ch-hero relative h-screen overflow-hidden">
        <header className="absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-start gap-4 px-[var(--gutter)] pt-[clamp(1.25rem,5.2vh,3.25rem)]">
          <Link href="/" className="ch-in nav-link inline-flex items-center gap-2 justify-self-start opacity-0">
            <ArrowLeft className="size-[1em]" strokeWidth={1.5} /> <span className="hidden sm:inline">The seven vows</span>
            <span className="sm:hidden">Vows</span>
          </Link>
          <Link href="/" className="ch-in text-center font-sans text-[clamp(0.95rem,0.7rem+1vw,1.6rem)] leading-none font-medium tracking-[0.06em] whitespace-nowrap uppercase opacity-0">
            {site.name}
          </Link>
          <Link href="/#concierge" className="ch-in nav-link inline-flex items-center gap-1 justify-self-end opacity-0">
            <span className="hidden sm:inline">Book a date</span>
            <span className="sm:hidden">Book</span>
            <ArrowUpRight className="size-[1em]" strokeWidth={1.5} />
          </Link>
        </header>

        <div
          ref={posterBox}
          data-chapter-poster
          className="absolute top-1/2 left-1/2 aspect-[3/4] h-[min(72vh,calc(84vw*4/3))] -translate-x-1/2 -translate-y-1/2 will-change-transform"
          style={{ opacity: arriving ? 0 : 1 }}
        >
          <Image
            src={posterSrc(s)}
            alt={`${s.posterTitle.join(' ')}: poster for vow ${s.numeral}`}
            width={1200}
            height={1600}
            unoptimized
            loading="eager"
            fetchPriority="high"
            onLoad={markLoaded}
            className="h-full w-full shadow-[0_50px_100px_-40px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Side columns (desktop) / above-below (phones) */}
        <div className="pointer-events-none absolute inset-x-[var(--gutter)] top-[18vh] flex justify-between max-md:top-[12vh] max-md:justify-center">
          <div className="ch-in opacity-0 max-md:hidden">
            <p className="headline text-[clamp(4.5rem,8vw,8.5rem)] leading-none">{s.numeral}</p>
            <p className="eyebrow mt-2 text-[0.62rem] opacity-70">Vow {s.numeral} of VII</p>
            <p className="serif-italic mt-1 text-[1.6rem]">{s.theme}</p>
          </div>
          <div className="ch-in text-right opacity-0 max-md:text-center">
            <p className="eyebrow text-[0.62rem] opacity-70">{s.date}</p>
            <p className="serif-italic mt-1 text-[clamp(1.3rem,1rem+1vw,2rem)] leading-tight">{s.couple}</p>
            <p className="font-sans text-[0.85rem] opacity-75">
              {s.venue} · {s.city}
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[clamp(1.25rem,5vh,3rem)] flex flex-col items-center gap-2">
          <p lang="sa" className="ch-in font-deva text-[clamp(1rem,0.9rem+0.4vw,1.35rem)] opacity-0">
            {s.sanskrit}
          </p>
          <p className="ch-in eyebrow text-[0.58rem] opacity-0">Scroll to read the chapter</p>
        </div>
      </section>

      {/* ---------- The vow ---------- */}
      <section className="ch-meaning px-[var(--gutter)] py-[clamp(5rem,16vh,11rem)]">
        <div className="mx-auto max-w-5xl text-center">
          <p className="ch-rise eyebrow text-[0.62rem] opacity-70">
            {s.transliteration} · The {['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'][index]} step
          </p>
          <p className="ch-rise serif-italic mt-6 text-[clamp(2rem,1.2rem+3.6vw,4.6rem)] leading-[1.04]">“{s.meaning}”</p>
          <p className="ch-rise mx-auto mt-10 max-w-2xl font-sans text-[1.02rem] leading-relaxed opacity-80">{s.excerpt}</p>
        </div>
      </section>

      {/* ---------- Acts ---------- */}
      {s.acts.map((act, ai) => (
        <section key={act.title} className="px-[var(--gutter)] pb-[clamp(5rem,14vh,10rem)]">
          <div className={`grid items-start gap-[clamp(2rem,5vw,6rem)] lg:grid-cols-12 ${ai % 2 ? 'lg:[direction:rtl]' : ''}`}>
            <div className="lg:col-span-5 lg:[direction:ltr] lg:sticky lg:top-[14vh]">
              <p className="ch-rise eyebrow text-[0.62rem] opacity-70">{act.label}</p>
              <h2 className="ch-rise headline mt-4 text-[clamp(3.2rem,6.4vw,6.6rem)]">
                <Accent text={act.title} />
              </h2>
              <div className="mt-8 space-y-5 font-sans text-[1.02rem] leading-relaxed opacity-85">
                {act.body.map((b) => (
                  <p key={b} className="ch-rise">
                    {b}
                  </p>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7 lg:[direction:ltr]">
              <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/4]">
                <Image src={act.images[0]} alt="" fill sizes="(max-width: 1024px) 92vw, 56vw" className="ch-par object-cover" />
              </div>
              {act.images[1] && (
                <div className={`relative mt-[clamp(1rem,3vw,2.5rem)] aspect-[4/5] w-[62%] overflow-hidden ${ai % 2 ? 'mr-auto' : 'ml-auto'}`}>
                  <Image src={act.images[1]} alt="" fill sizes="(max-width: 1024px) 58vw, 34vw" className="ch-par object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* ---------- Film ---------- */}
      <section className="px-[var(--gutter)] pb-[clamp(5rem,14vh,10rem)]">
        <button
          type="button"
          onClick={() => openFilm(s.index)}
          className="group relative block aspect-video w-full overflow-hidden text-left"
          data-cursor="play"
          data-cursor-label="Play film"
          aria-label={`Play the film: ${s.posterTitle.join(' ')}`}
        >
          <Image src={filmStillSrc(s)} alt="" fill sizes="92vw" className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-vow)] group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <span className="absolute top-1/2 left-1/2 grid size-[clamp(4.5rem,9vw,7rem)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-white/10 text-white backdrop-blur transition-transform duration-500 group-hover:scale-110">
            <Play className="ml-1 size-[30%] fill-current" strokeWidth={0} />
          </span>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5 text-white sm:p-8">
            <div>
              <p className="eyebrow text-[0.6rem] text-white/70">The chapter film · 0:28</p>
              <p className="serif-italic mt-1 text-[clamp(1.6rem,1.2rem+1.6vw,2.8rem)] leading-tight">{s.posterTitle.join(' ')}</p>
            </div>
            <p className="font-sans text-[0.8rem] text-white/70">{s.couple}</p>
          </div>
        </button>
      </section>

      {/* ---------- Next vow ---------- */}
      <section className="border-t px-[var(--gutter)] py-[clamp(4rem,12vh,8rem)]" style={{ borderColor: `${p.pageInk}22` }}>
        <Link href={`/stories/${next.slug}`} className="group grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          <div className="relative w-[min(42vw,13rem)] transition-transform duration-700 ease-[var(--ease-vow)] group-hover:-rotate-3">
            <Image src={posterSrc(next)} alt="" width={1200} height={1600} unoptimized className="h-auto w-full shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]" />
          </div>
          <div>
            <p className="eyebrow text-[0.62rem] opacity-70">Next · Vow {next.numeral} · {next.theme}</p>
            <p className="headline mt-4 text-[clamp(3rem,7vw,7.4rem)]">
              <Accent text={next.posterTitle.join(' ')} />
              <ArrowUpRight className="ml-2 inline size-[0.5em] -translate-y-[0.1em] transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-[0.2em]" strokeWidth={1} />
            </p>
            <p className="font-sans text-[0.9rem] opacity-75">
              {next.couple} · {next.city}
            </p>
          </div>
        </Link>
        <p className="mt-[clamp(3rem,8vh,5rem)] max-w-2xl font-sans text-[0.78rem] leading-relaxed opacity-55">{site.disclaimer}</p>
      </section>

      {/* ---------- Details pill (fixed) ---------- */}
      <Link
        href="/#concierge"
        className="ch-pill invisible fixed bottom-[clamp(1rem,3.6vh,2.25rem)] left-[var(--gutter)] z-[55] flex max-w-[calc(100vw-2*var(--gutter)-6rem)] items-center gap-3 rounded-2xl p-2 pr-4 opacity-0 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-md sm:left-1/2 sm:-translate-x-1/2"
        style={{ background: `${p.paper}ee`, color: p.ink }}
      >
        <Image src={s.images.poster} alt="" width={56} height={56} className="size-12 shrink-0 rounded-lg object-cover" />
        <span className="min-w-0">
          <span className="block truncate serif-italic text-[1.05rem] leading-tight">{s.details[0].value}</span>
          <span className="block truncate font-sans text-[0.72rem] opacity-75">{s.details[1].value}</span>
        </span>
        <ArrowUpRight className="ml-1 size-4 shrink-0" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
