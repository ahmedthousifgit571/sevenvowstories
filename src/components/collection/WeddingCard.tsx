'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { live } from '@/lib/stage-store';
import { shortCity, type Wedding } from '@/content/collection';
import Bookmark from './Bookmark';
import { rememberGridScroll } from './shared';

type Props = {
  w: Wedding;
  /** card width in vw at desktop (lg) and below */
  vw: { lg: number; base: number };
  eager?: boolean;
  /** remember the grid position so Back lands on this card */
  fromGrid?: boolean;
  /** step through the frames inside the card (off inside carousels, where a swipe moves the carousel) */
  browse?: boolean;
};

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 8 16" className="h-4 w-2" aria-hidden>
      <path d={dir === 'left' ? 'M7 1L1 8l6 7' : 'M1 1l6 7-6 7'} fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/**
 * `sizes` for a frame cropped to fill a 3:4 card: a landscape photo must be fetched wide enough that its
 * height covers the card, or the browser picks a variant that is too small and the crop looks soft.
 */
export function coverSizes(f: { w: number; h: number }, vw: { lg: number; base: number }, box = 3 / 4) {
  const k = Math.max(1, f.w / f.h / box);
  return `(min-width: 1024px) ${Math.round(vw.lg * k)}vw, ${Math.round(vw.base * k)}vw`;
}

/** A wedding in the grid: swipe or step through its frames, open it, or save it to the shortlist. */
export default function WeddingCard({ w, vw, eager = false, fromGrid = false, browse = true }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Later frames load once the card shows interest (hover, focus or a touch), not with the page.
  const [warm, setWarm] = useState(false);
  const frames = browse ? w.frames : w.frames.slice(0, 1);
  const n = frames.length;
  const href = `/collection/${w.slug}`;
  const place = shortCity(w);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    setWarm(true);
    const next = Math.max(0, Math.min(n - 1, index + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: live.reduced ? 'auto' : 'smooth' });
  };

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  };

  const onOpen = fromGrid ? rememberGridScroll : undefined;

  return (
    <article className="group/card relative" onPointerEnter={() => setWarm(true)} onFocus={() => setWarm(true)}>
      <div className="relative aspect-[3/4] overflow-hidden bg-[#e7e0d4]">
        <Link
          href={href}
          onClick={onOpen}
          aria-label={`${w.couple}, ${place}: view the wedding`}
          data-cursor="view"
          data-cursor-label="View"
          className="absolute inset-0 block"
        >
          <div
            ref={track}
            onScroll={onScroll}
            onTouchStart={() => setWarm(true)}
            className={`no-scrollbar flex h-full ${n > 1 ? 'snap-x snap-mandatory overflow-x-auto overscroll-x-contain' : 'overflow-hidden'}`}
          >
            {frames.map((f, i) => (
              <div key={f.src} className="relative h-full w-full shrink-0 snap-start snap-always">
                {(i === 0 || warm) && (
                  <Image
                    src={f.src}
                    alt={i === 0 ? f.caption : ''}
                    fill
                    sizes={coverSizes(f, vw)}
                    loading={i === 0 ? (eager ? 'eager' : 'lazy') : 'eager'}
                    className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-vow)] fine:group-hover/card:scale-[1.025]"
                  />
                )}
              </div>
            ))}
          </div>
        </Link>

        {n > 1 && (
          <>
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Previous photograph of ${w.couple}`}
              onClick={() => step(-1)}
              className={`absolute top-1/2 left-1 hidden h-14 w-10 -translate-y-1/2 place-items-center text-white opacity-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-opacity duration-500 fine:grid fine:group-hover/card:opacity-100 ${
                index === 0 ? 'pointer-events-none !opacity-0' : ''
              }`}
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Next photograph of ${w.couple}`}
              onClick={() => step(1)}
              className={`absolute top-1/2 right-1 hidden h-14 w-10 -translate-y-1/2 place-items-center text-white opacity-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-opacity duration-500 fine:grid fine:group-hover/card:opacity-100 ${
                index === n - 1 ? 'pointer-events-none !opacity-0' : ''
              }`}
            >
              <Chevron dir="right" />
            </button>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-3 bottom-3 flex gap-1 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 touch:opacity-100"
            >
              {frames.map((f, i) => (
                <span
                  key={f.src}
                  className="h-[2px] flex-1 rounded-full transition-colors duration-500"
                  style={{ background: i === index ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.38)' }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-2.5 flex items-start justify-between gap-3 px-1 pb-1">
        <Link href={href} onClick={onOpen} tabIndex={-1} aria-hidden className="min-w-0">
          <p className="truncate font-sans text-[0.76rem] font-medium tracking-[0.12em] uppercase sm:text-[0.84rem]">{w.couple}</p>
          <p className="mt-0.5 truncate font-sans text-[0.72rem] opacity-55 sm:text-[0.78rem]">
            {place} · {w.season} {w.year}
          </p>
        </Link>
        <Bookmark slug={w.slug} name={w.couple} className="-mt-0.5" />
      </div>
    </article>
  );
}
