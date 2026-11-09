'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useShortlist } from '@/lib/shortlist';
import { FACETS, filterCount, type FacetKey, type Filters } from '@/content/collection';
import type { View } from './CollectionHeader';
import { C, openShortlist } from './shared';

type Props = {
  view: View;
  onView: (v: View) => void;
  counts: Record<View, number>;
  filters: Filters;
  onRemove: (key: FacetKey, value: string) => void;
  onClear: () => void;
  onOpenFilters: () => void;
  density: 1 | 2;
  onDensity: (d: 1 | 2) => void;
};

const VIEW_LABEL: Record<View, string> = { weddings: 'Weddings', films: 'Films' };
const label = 'font-sans text-[0.76rem] tracking-[0.14em] uppercase sm:text-[0.8rem]';

function ViewMenu({ view, onView, counts }: Pick<Props, 'view' | 'onView' | 'counts'>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => () => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', away);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${label} flex items-center gap-2.5 py-2`}>
        {VIEW_LABEL[view]}
        <svg viewBox="0 0 14 8" className={`w-3.5 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} aria-hidden>
          <path d="M1 1l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      </button>
      <ul
        role="listbox"
        aria-label="Show"
        className={`absolute top-full left-0 z-10 mt-2 min-w-[14rem] border py-2 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.4)] transition-[opacity,transform,visibility] duration-300 ${
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
        }`}
        style={{ background: C.paper, borderColor: `${C.ink}1f` }}
      >
        {(Object.keys(VIEW_LABEL) as View[]).map((v) => (
          <li key={v}>
            <button
              type="button"
              role="option"
              aria-selected={v === view}
              onClick={() => {
                setOpen(false);
                onView(v);
              }}
              className={`${label} flex w-full items-center justify-between gap-6 px-4 py-3 text-left transition-colors hover:bg-black/[0.04]`}
            >
              <span className={v === view ? 'underline underline-offset-[6px]' : ''}>{VIEW_LABEL[v]}</span>
              <span className="tabular-nums opacity-45">{counts[v]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Sticky bar above the grid: what is shown, the shortlist and the filters. */
export default function FilterBar(props: Props) {
  const { view, onView, counts, filters, onRemove, onClear, onOpenFilters, density, onDensity } = props;
  const saved = useShortlist().length;
  const active = filterCount(filters);
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  // A hairline appears once the bar is stuck over the grid.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const top = window.matchMedia('(min-width: 1024px)').matches ? 0 : 64;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: `-${top + 1}px 0px 0px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chips = FACETS.flatMap(({ key }) => (filters[key] ?? []).map((value) => ({ key, value })));

  return (
    <>
      <div ref={sentinel} aria-hidden className="h-px" />
      <div
        className="sticky top-16 z-20 transition-shadow duration-500 lg:top-0"
        style={{
          background: 'var(--page-bg)',
          boxShadow: stuck ? `0 1px 0 ${C.ink}14, 0 18px 30px -28px rgba(0,0,0,0.35)` : 'none',
        }}
      >
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:h-16 lg:px-8">
          <ViewMenu view={view} onView={onView} counts={counts} />
          <div className="flex items-center gap-4 sm:gap-7">
            <p className={`${label} hidden tabular-nums opacity-45 md:block`} aria-live="polite">
              {counts[view]} {view === 'weddings' ? (counts[view] === 1 ? 'wedding' : 'weddings') : counts[view] === 1 ? 'film' : 'films'}
            </p>
            {/* The header carries the shortlist until it scrolls away; then the bar takes over. */}
            <button
              type="button"
              onClick={openShortlist}
              tabIndex={stuck ? 0 : -1}
              aria-hidden={!stuck}
              className={`${label} nav-link hidden tabular-nums transition-opacity duration-500 lg:block ${stuck ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
              Shortlist ({saved})
            </button>
            {view === 'weddings' && (
              <button
                type="button"
                onClick={() => onDensity(density === 2 ? 1 : 2)}
                aria-label={density === 2 ? 'Show one wedding per row' : 'Show two weddings per row'}
                className="-mx-1 grid size-9 place-items-center lg:hidden"
              >
                {density === 2 ? (
                  <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                    <path d="M1.5 1.5h5v5h-5zM9.5 1.5h5v5h-5zM1.5 9.5h5v5h-5zM9.5 9.5h5v5h-5z" fill="none" stroke="currentColor" strokeWidth="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                    <path d="M3.5 1.5h9v13h-9z" fill="none" stroke="currentColor" strokeWidth="1" />
                  </svg>
                )}
              </button>
            )}
            <button type="button" onClick={onOpenFilters} aria-haspopup="dialog" className={`${label} nav-link tabular-nums`}>
              Filters ({active})
            </button>
          </div>
        </div>
        {chips.length > 0 && (
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 pb-3 lg:px-8">
            {chips.map((c) => (
              <button
                key={`${c.key}-${c.value}`}
                type="button"
                onClick={() => onRemove(c.key, c.value)}
                aria-label={`Remove filter ${c.value}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[0.78rem] transition-colors hover:bg-black/[0.04]"
                style={{ borderColor: `${C.ink}33` }}
              >
                {c.value} <X className="size-3" strokeWidth={1.5} />
              </button>
            ))}
            <button type="button" onClick={onClear} className="shrink-0 px-2 font-sans text-[0.74rem] tracking-[0.12em] uppercase underline underline-offset-4 opacity-70 hover:opacity-100">
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
}
