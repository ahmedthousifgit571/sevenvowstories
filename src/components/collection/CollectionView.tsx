'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Footer from '@/components/Footer';
import SocialLinks, { YouTubeLogo } from '@/components/SocialLinks';
import { Flip, gsap, observeReveal } from '@/lib/gsap';
import { live } from '@/lib/stage-store';
import { curtainClick, LABELS } from '@/lib/curtain';
import { matches, weddings, type FacetKey, type Filters } from '@/content/collection';
import { site } from '@/content/site';
import CollectionHeader, { type View } from './CollectionHeader';
import CollectionHero from './CollectionHero';
import FilterBar from './FilterBar';
import FiltersDrawer from './FiltersDrawer';
import FilmCard from './FilmCard';
import WeddingCard from './WeddingCard';
import { C, navMemory, scrollToY, useCollectionTheme } from './shared';

const films = weddings.filter((w) => w.storyIndex != null);

/** Scroll position that puts the top of the grid just under the sticky bar. */
function gridTopOf(el: HTMLElement | null) {
  if (!el) return 0;
  const bar = window.matchMedia('(min-width: 1024px)').matches ? 0 : 64;
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - bar - 72);
}

export default function CollectionView() {
  useCollectionTheme();
  const [view, setView] = useState<View>('weddings');
  const [filters, setFilters] = useState<Filters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [density, setDensity] = useState<1 | 2>(2);
  const gridArea = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  // Arriving: start at the top, or come back to the card the visitor opened.
  useLayoutEffect(() => {
    scrollToY(navMemory.fromDetail && navMemory.gridY != null ? navMemory.gridY : 0);
    return () => setFiltersOpen(false);
  }, []);

  // /collection#films opens on the films (links from the menu on wedding pages).
  useEffect(() => {
    if (window.location.hash !== '#films') return;
    // Read after hydration so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView('films');
    history.replaceState(null, '', '/collection');
    requestAnimationFrame(() => scrollToY(gridTopOf(gridArea.current)));
  }, []);

  const visible = useMemo(() => new Set(weddings.filter((w) => matches(w, filters)).map((w) => w.slug)), [filters]);
  const visibleFilms = films.filter((w) => visible.has(w.slug));
  const counts = { weddings: visible.size, films: visibleFilms.length };

  useEffect(() => {
    const el = gridArea.current;
    return el ? observeReveal(el) : undefined;
  }, [view, density]);

  const gridTop = () => gridTopOf(gridArea.current);

  // Filtering re-flows the grid with Flip: kept cards glide to their new places, others fade.
  const applyFilters = (next: Filters) => {
    const top = gridTop();
    if (window.scrollY > top) scrollToY(top);
    if (grid.current && !live.reduced) flipState.current = Flip.getState(grid.current.querySelectorAll('[data-flip]'));
    setFilters(next);
  };
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;
    Flip.from(state, {
      duration: 0.8,
      ease: 'vow',
      absoluteOnLeave: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.75, delay: 0.12, ease: 'vow' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.96, duration: 0.35, ease: 'power2.in' }),
    });
  }, [filters]);

  const toggle = (key: FacetKey, value: string) => {
    const cur = filters[key] ?? [];
    applyFilters({ ...filters, [key]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] });
  };
  const clear = () => applyFilters({});

  const switchView = (v: View) => {
    const area = gridArea.current;
    const top = gridTop();
    const go = () => {
      setView(v);
      if (area && !live.reduced) requestAnimationFrame(() => gsap.fromTo(area, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'vow' }));
    };
    if (window.scrollY > top + 4 || window.scrollY < top - window.innerHeight * 0.5) live.lenis?.scrollTo(top, { duration: 1.1 });
    if (v === view) return;
    if (area && !live.reduced) gsap.to(area, { opacity: 0, y: 10, duration: 0.25, ease: 'power2.in', onComplete: go });
    else go();
  };

  const noun = view === 'weddings' ? (counts.weddings === 1 ? 'wedding' : 'weddings') : counts.films === 1 ? 'film' : 'films';
  const vw = { lg: 25, base: density === 1 ? 100 : 50 };

  return (
    <main id="collection" className="relative min-h-screen" style={{ background: C.paper, color: C.ink, overflowAnchor: 'none' }}>
      <CollectionHeader variant="overlay" view={view} onSelectView={switchView} />
      <CollectionHero onScrollDown={() => live.lenis?.scrollTo(gridTop(), { duration: 1.3 })} onFilms={() => switchView('films')} />

      <section aria-label={view === 'weddings' ? 'Weddings' : 'Films'} className="relative pb-[clamp(4rem,10vh,7rem)]">
        <FilterBar
          view={view}
          onView={switchView}
          counts={counts}
          filters={filters}
          onRemove={toggle}
          onClear={clear}
          onOpenFilters={() => setFiltersOpen(true)}
          density={density}
          onDensity={setDensity}
        />

        <div ref={gridArea} className="pt-2">
          {view === 'weddings' ? (
            <ul ref={grid} className={`grid gap-x-2 gap-y-5 px-2 sm:gap-y-6 lg:grid-cols-4 lg:px-4 ${density === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {weddings.map((w, i) => (
                <li key={w.slug} data-flip data-flip-id={w.slug} className={visible.has(w.slug) ? '' : 'hidden'}>
                  <div className="reveal" style={{ '--i': i % 4 } as React.CSSProperties}>
                    <WeddingCard w={w} vw={vw} eager={i < 4} fromGrid />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-1 gap-x-2 gap-y-6 px-2 sm:grid-cols-2 lg:grid-cols-3 lg:px-4">
              {visibleFilms.map((w, i) => (
                <li key={w.slug}>
                  <div className="reveal" style={{ '--i': i % 3 } as React.CSSProperties}>
                    <FilmCard w={w} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {view === 'films' && counts.films > 0 && (
            <div className="mt-14 flex flex-col items-center gap-4 px-6 text-center">
              <p className="serif-italic text-[clamp(1.5rem,1.2rem+1vw,2.1rem)] leading-tight">More of our films live on YouTube.</p>
              {/* YouTube's red play mark on the night pill, so the button reads as YouTube before the label is read. */}
              <a
                href={site.contact.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-2 inline-flex h-14 items-center gap-3.5 rounded-full pr-6 pl-5 font-sans text-[0.74rem] font-medium tracking-[0.14em] uppercase shadow-[0_18px_36px_-22px_rgba(0,0,0,0.55)] transition-opacity duration-300 hover:opacity-90"
                style={{ background: C.night, color: C.paper }}
              >
                <YouTubeLogo className="h-[1.4rem] w-auto transition-transform duration-500 ease-vow group-hover:scale-110" />
                Watch on YouTube
                <ArrowUpRight
                  className="size-4 opacity-60 transition-transform duration-500 ease-vow group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.4}
                />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          )}

          {counts[view] === 0 && (
            <div className="mx-auto max-w-md px-6 py-24 text-center">
              <p className="serif-italic text-[2rem] leading-tight">Nothing matches all of those.</p>
              <p className="mt-3 font-sans text-[0.92rem] leading-relaxed opacity-65">
                Try fewer filters, or tell us what you are imagining and we will show you work that is close.
              </p>
              <button
                type="button"
                onClick={clear}
                className="mt-7 h-12 px-8 font-sans text-[0.72rem] tracking-[0.14em] uppercase"
                style={{ background: C.night, color: C.paper }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Closing note ---------- */}
      <section className="border-t px-[var(--gutter)] py-[clamp(4.5rem,12vh,8rem)]" style={{ borderColor: `${C.ink}14` }}>
        <div className="mx-auto grid max-w-6xl items-end gap-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow text-[0.62rem] opacity-55">Your chapter</p>
            <p className="serif-italic mt-4 text-[clamp(2rem,1.4rem+2.4vw,3.6rem)] leading-[1.04]">
              Every wedding in this collection began with a conversation.
            </p>
            <p className="mt-8 font-sans text-[0.85rem] opacity-60">Follow our latest work on {site.contact.instagramHandle}.</p>
            <SocialLinks tone="light" detailed className="mt-4" />
          </div>
          <div className="md:justify-self-end">
            <p className="max-w-sm font-sans text-[0.95rem] leading-relaxed opacity-70">
              Tell us your date and the weddings you saved. We reply within two days with availability and ideas.
            </p>
            <Link
              href="/#concierge"
              onClick={curtainClick('/#concierge', LABELS.concierge)}
              className="mt-6 inline-flex h-12 items-center gap-3 px-7 font-sans text-[0.72rem] tracking-[0.14em] uppercase transition-opacity hover:opacity-90"
              style={{ background: C.night, color: C.paper }}
            >
              Book a date <ArrowUpRight className="size-4" strokeWidth={1.4} />
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-14 max-w-6xl font-sans text-[0.76rem] leading-relaxed opacity-45">{site.disclaimer}</p>
      </section>

      <Footer backLabel="Back to top" />

      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onToggle={toggle}
        onClear={clear}
        count={counts[view]}
        noun={noun}
      />
    </main>
  );
}
