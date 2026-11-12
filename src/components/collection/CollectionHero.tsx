'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Pause, Play } from 'lucide-react';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { live } from '@/lib/stage-store';
import { collectionMeta, shortCity, weddingBySlug, weddings } from '@/content/collection';
import { coverSizes } from './WeddingCard';
import { C, rememberGridScroll } from './shared';

type Cell = { slug: string; frame: number; aspect: number } | { reel: true; aspect: number };
type Column = {
  id: 'e1' | 'a' | 'b' | 'c' | 'e2';
  cells: Cell[];
  /** How far the column trails the scroll (negative runs ahead of it), and how long it takes to settle (s). */
  lag: [number, number];
};

/**
 * The wall. Every wedding appears once, with the showreel at the heart of it. Frames are chosen to differ from the
 * covers in the grid below and from the photographs the reel is cut from (scripts/render-collection-reel.mjs), so the
 * same picture never sits twice in view; Simran & Arjun keep their cover because their other frame opens the reel.
 * Phones show columns b and c, tablets a to c, and desktops all five, the outer two running off the edges of the
 * screen. Moments of the day sit in the middle columns; places and textures at the edges.
 */
const WALL: Column[] = [
  {
    id: 'e1',
    lag: [0.5, 0.8],
    cells: [
      { slug: 'sanya-and-neel', frame: 3, aspect: 3 / 4 },
      { slug: 'diya-and-aarav', frame: 1, aspect: 2 / 3 },
    ],
  },
  {
    id: 'a',
    lag: [1.3, 1.05],
    cells: [
      { slug: 'aanya-and-kabir', frame: 2, aspect: 4 / 5 },
      { slug: 'nila-and-karthik', frame: 3, aspect: 2 / 3 },
      { slug: 'mira-and-jai', frame: 1, aspect: 3 / 4 },
    ],
  },
  {
    id: 'b',
    lag: [-0.35, 0.7],
    cells: [
      { reel: true, aspect: 4 / 5 },
      { slug: 'simran-and-arjun', frame: 0, aspect: 3 / 4 },
      { slug: 'isha-and-rohan', frame: 2, aspect: 2 / 3 },
    ],
  },
  {
    id: 'c',
    lag: [0.95, 0.95],
    cells: [
      { slug: 'pooja-and-nikhil', frame: 1, aspect: 2 / 3 },
      { slug: 'ananya-and-siddharth', frame: 1, aspect: 4 / 5 },
      { slug: 'tara-and-vikram', frame: 1, aspect: 3 / 4 },
    ],
  },
  {
    id: 'e2',
    lag: [0.25, 0.85],
    cells: [
      { slug: 'meera-and-arjun', frame: 3, aspect: 3 / 4 },
      { slug: 'riya-and-dev', frame: 2, aspect: 2 / 3 },
    ],
  },
];

/** Tile width in vw at desktop (lg) and below, for image sizes. */
const TILE_VW = { lg: 25, base: 48 };

function WeddingTile({ slug, frame, aspect, eager }: { slug: string; frame: number; aspect: number; eager: boolean }) {
  const w = weddingBySlug(slug);
  if (!w) return null;
  const f = w.frames[frame] ?? w.frames[0];
  const place = shortCity(w);
  return (
    <li className="cw-tile">
      <Link
        href={`/collection/${w.slug}`}
        onClick={rememberGridScroll}
        data-cursor="view"
        data-cursor-label="View"
        aria-label={`${w.couple}, ${place}: view the wedding`}
        className="group block"
      >
        <span className="cw-media" style={{ aspectRatio: aspect }}>
          <span className="cw-img">
            <Image
              src={f.src}
              alt={f.caption}
              fill
              sizes={coverSizes(f, TILE_VW, aspect)}
              loading={eager ? 'eager' : 'lazy'}
              className="object-cover transition-[scale] duration-[1.6s] ease-vow fine:group-hover:scale-[1.045]"
            />
          </span>
        </span>
        <span className="cw-cap">
          <span className="cw-cap-name">{w.couple}</span>
          <span className="opacity-50">{place}</span>
        </span>
      </Link>
    </li>
  );
}

/** The showreel as one tile of the wall: it plays where the photographs are, and opens the films. */
function ReelTile({ aspect, onFilms }: { aspect: number; onFilms: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [shown, setShown] = useState(false);
  const { reel } = collectionMeta;

  // Autoplay only when motion is welcome; the still stays otherwise. Asked of the browser directly: on a first load
  // this runs before the scroll provider has filled in live.reduced.
  useEffect(() => {
    if (!window.matchMedia(MOTION_OK).matches) return;
    video.current?.play().catch(() => undefined);
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  };

  return (
    <li className="cw-tile">
      <div className="group relative">
        <span className="cw-media bg-[#141216]" style={{ aspectRatio: aspect }}>
          <span className="cw-img transition-[scale] duration-[1.6s] ease-vow fine:group-hover:scale-[1.045]">
            {/* Art-directed poster for the reel: already a small webp, so it skips the image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reel.portraitPoster} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
            <video
              ref={video}
              src={reel.portrait}
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              onPlaying={() => {
                setPlaying(true);
                setShown(true);
              }}
              onPause={() => setPlaying(false)}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1.4s]"
              style={{ opacity: shown ? 1 : 0 }}
            />
          </span>
          <button
            type="button"
            onClick={onFilms}
            data-cursor="play"
            data-cursor-label="The films"
            aria-label="Watch the films"
            className="absolute inset-0 z-1"
          />
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause the showreel' : 'Play the showreel'}
            className="absolute bottom-[4%] left-[4%] z-2 grid size-10 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
          >
            {playing ? <Pause className="size-3.5 fill-current" strokeWidth={0} /> : <Play className="ml-0.5 size-3.5 fill-current" strokeWidth={0} />}
          </button>
        </span>
        <button type="button" onClick={onFilms} tabIndex={-1} aria-hidden className="cw-cap w-full text-left">
          <span className="cw-cap-name">The showreel</span>
          <span className="inline-flex items-center gap-1 opacity-50">
            The films <ArrowUpRight className="size-[1.1em]" strokeWidth={1.4} />
          </span>
        </button>
      </div>
    </li>
  );
}

/**
 * The collection opens like a gallery wall: its name set huge, and the weddings rising over it in staggered columns.
 * Each column trails the scroll by its own small amount, so the wall ripples as it moves and settles when it stops.
 */
export default function CollectionHero({ onScrollDown, onFilms }: { onScrollDown: () => void; onFilms: () => void }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(el);

        // Arrival: the name rises from behind its baseline, then the words around it.
        gsap.fromTo(q('.cw-mark-inner'), { yPercent: 104 }, { yPercent: 0, duration: 1.5, ease: 'vow', delay: 0.3 });
        gsap.fromTo(q('.cw-in'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'vow', delay: 0.55 });

        // The photographs already on screen develop one after another from the middle out: a wipe up from the bottom
        // edge while the picture settles. Those further down are simply there when the visitor reaches them; hiding
        // them until they scroll in would leave holes in the wall on a fast flick.
        const mid = window.innerWidth / 2;
        const centre = (t: Element) => {
          const r = t.getBoundingClientRect();
          return Math.abs(r.left + r.width / 2 - mid);
        };
        const onArrival = gsap.utils
          .toArray<HTMLElement>(q('.cw-tile'))
          .filter((t) => {
            const r = t.getBoundingClientRect();
            return r.height > 0 && r.top < window.innerHeight;
          })
          .sort((a, b) => centre(a) - centre(b));
        const part = (sel: string) => onArrival.map((t) => t.querySelector(sel)).filter((x): x is Element => !!x);
        gsap
          .timeline({ delay: 0.5 })
          .fromTo(part('.cw-media'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'vowInOut', stagger: 0.1, clearProps: 'clipPath' }, 0)
          .fromTo(part('.cw-img'), { scale: 1.18 }, { scale: 1, duration: 1.7, ease: 'vow', stagger: 0.1, clearProps: 'transform' }, 0)
          .fromTo(part('.cw-cap'), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power1.out', stagger: 0.1 }, 0.55);

        // The name drifts slower than the page, so the wall slides up over it.
        gsap.to(q('.cw-mark'), {
          y: () => window.innerHeight * 0.32,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${window.innerHeight}`, scrub: true, invalidateOnRefresh: true },
        });

        // Each column trails the scroll by its own amount (the middle one runs a little ahead) and settles when it
        // stops, so the wall ripples as it moves. tanh eases the offsets toward a ceiling instead of clipping them,
        // so a fast flick keeps the columns apart rather than flattening them all to the same limit.
        const MAX = 64;
        const cols = gsap.utils.toArray<HTMLElement>(q('.cw-col'));
        const follow = cols.map((c, i) => gsap.quickTo(c, 'y', { duration: WALL[i].lag[1], ease: 'power3.out' }));
        let onScreen = false;
        const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
        io.observe(el);
        let last = 0;
        const tick = () => {
          if (!onScreen) return;
          const v = live.lenis?.velocity ?? 0;
          if (v === 0 && last === 0) return;
          last = v;
          cols.forEach((_, i) => follow[i](MAX * Math.tanh((v * WALL[i].lag[0]) / MAX)));
        };
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          io.disconnect();
        };
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="cw-title" className="cw" style={{ background: C.paper, color: C.ink }}>
      <div className="cw-intro">
        <p className="cw-in eyebrow text-[0.62rem] opacity-60">Chapter · The Saptapadi</p>
        <div className="cw-in">
          <p className="cw-tagline">{collectionMeta.tagline}</p>
          <button type="button" onClick={onScrollDown} className="nav-link mt-4 inline-flex items-center gap-1.5 text-[0.74rem] tracking-[0.14em]">
            All {weddings.length} weddings <ArrowDown className="size-[1.05em]" strokeWidth={1.4} />
          </button>
        </div>
      </div>

      <h1 id="cw-title" className="cw-mark">
        <span className="sr-only">{collectionMeta.title}</span>
        <span className="cw-mark-inner" aria-hidden>
          {collectionMeta.mark}
        </span>
      </h1>

      <div className="cw-wall">
        {WALL.map((col) => (
          <ul key={col.id} className="cw-col" data-col={col.id}>
            {col.cells.map((cell, j) =>
              'reel' in cell ? (
                <ReelTile key="reel" aspect={cell.aspect} onFilms={onFilms} />
              ) : (
                <WeddingTile key={cell.slug} slug={cell.slug} frame={cell.frame} aspect={cell.aspect} eager={j === 0} />
              ),
            )}
          </ul>
        ))}
      </div>
    </section>
  );
}
