'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { live } from '@/lib/stage-store';
import { relatedTabs, type Wedding } from '@/content/collection';
import WeddingCard from './WeddingCard';
import { C } from './shared';

function Arrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 8 14" className="h-3.5 w-2" aria-hidden>
      <path d={dir === 'left' ? 'M7 1L1 7l6 6' : 'M1 1l6 6-6 6'} fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/** "You may also like": tabs of related weddings in a snapping row. */
export default function RelatedCarousel({ w }: { w: Wedding }) {
  const tabs = relatedTabs(w);
  const [tab, setTab] = useState(tabs[0].id);
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const items = (tabs.find((t) => t.id === tab) ?? tabs[0]).items;

  const measure = () => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  // A new tab starts from its first card.
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    el.scrollLeft = 0;
    measure();
  }, [tab]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const stepPx = card ? card.offsetWidth + 8 : el.clientWidth / 2;
    const perView = Math.max(1, Math.round(el.clientWidth / stepPx));
    el.scrollBy({ left: dir * stepPx * perView, behavior: live.reduced ? 'auto' : 'smooth' });
  };

  return (
    <section aria-labelledby="related-title" className="border-t py-[clamp(3.5rem,9vh,6rem)]" style={{ borderColor: `${C.ink}14` }}>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 px-4 lg:px-8">
        <div>
          <h2 id="related-title" className="font-sans text-[0.95rem] font-medium tracking-[0.14em] uppercase">
            You may also like
          </h2>
          <div role="tablist" aria-label="Related weddings" className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === tab}
                onClick={() => setTab(t.id)}
                className="border-b pb-1.5 font-sans text-[0.74rem] tracking-[0.14em] uppercase transition-[opacity,border-color] duration-300"
                style={{ borderColor: t.id === tab ? C.ink : 'transparent', opacity: t.id === tab ? 1 : 0.5 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={edge.start}
            aria-label="Previous weddings"
            className="grid size-11 place-items-center border transition-opacity disabled:opacity-30"
            style={{ borderColor: `${C.ink}33` }}
          >
            <Arrow dir="left" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={edge.end}
            aria-label="More weddings"
            className="grid size-11 place-items-center border transition-opacity disabled:opacity-30"
            style={{ borderColor: `${C.ink}33` }}
          >
            <Arrow dir="right" />
          </button>
        </div>
      </div>
      <div
        ref={track}
        onScroll={measure}
        role="tabpanel"
        className="no-scrollbar mt-8 flex snap-x snap-mandatory scroll-px-2 gap-2 overflow-x-auto px-2 lg:scroll-px-4 lg:px-4"
      >
        {items.map((o) => (
          <div key={o.slug} data-card className="w-[calc((100%-0.5rem)/2)] shrink-0 snap-start sm:w-[calc((100%-1rem)/3)] lg:w-[calc((100%-1.5rem)/4)]">
            <WeddingCard w={o} vw={{ lg: 25, base: 50 }} browse={false} />
          </div>
        ))}
      </div>
    </section>
  );
}
