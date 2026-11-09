'use client';

import { useState } from 'react';
import Drawer from '@/components/drawer/Drawer';
import { facetOptions, FACETS, filterCount, type FacetKey, type Filters } from '@/content/collection';
import { C } from './shared';

type Props = {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onToggle: (key: FacetKey, value: string) => void;
  onClear: () => void;
  count: number;
  noun: string;
};

function Group({ facet, label, filters, onToggle }: { facet: FacetKey; label: string; filters: Filters; onToggle: Props['onToggle'] }) {
  const ticked = filters[facet] ?? [];
  const [open, setOpen] = useState(ticked.length > 0);
  const options = facetOptions(facet, filters);
  const id = `facet-${facet}`;

  return (
    <div className="dr-in border-b" style={{ borderColor: `${C.ink}17` }}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-[1.1rem] text-left">
        <span className="font-sans text-[0.8rem] font-medium tracking-[0.14em] uppercase">
          {label}
          {ticked.length > 0 && (
            <span className="ml-2 tabular-nums" style={{ color: C.accent }}>
              ({ticked.length})
            </span>
          )}
        </span>
        <span className="relative block size-3.5" aria-hidden>
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
          <span className={`absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current transition-transform duration-500 ${open ? 'scale-y-0' : ''}`} />
        </span>
      </button>
      <div id={id} className="grid transition-[grid-template-rows] duration-500 ease-[var(--ease-vow)]" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <ul className="grid gap-x-6 gap-y-1 pb-5 sm:grid-cols-2">
            {options.map((o) => {
              const on = ticked.includes(o.value);
              const off = !on && o.count === 0;
              return (
                <li key={o.value}>
                  <label className={`flex items-center gap-3 py-1.5 font-sans text-[0.9rem] ${off ? 'opacity-35' : ''}`}>
                    <input type="checkbox" className="peer sr-only" checked={on} disabled={off} tabIndex={open ? 0 : -1} onChange={() => onToggle(facet, o.value)} />
                    <span
                      className="grid size-[15px] shrink-0 place-items-center border transition-colors duration-300 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2"
                      style={{ borderColor: on ? C.ink : `${C.ink}59`, background: on ? C.ink : 'transparent' }}
                    >
                      {on && (
                        <svg viewBox="0 0 10 8" className="w-2.5" aria-hidden>
                          <path d="M1 4l2.6 2.6L9 1" fill="none" stroke={C.paper} strokeWidth="1.4" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">{o.value}</span>
                    <span className="text-[0.78rem] tabular-nums opacity-45">{o.count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Right-hand filter sheet: accordion facets with live counts, CLEAR ALL and SHOW N. */
export default function FiltersDrawer({ open, onClose, filters, onToggle, onClear, count, noun }: Props) {
  const active = filterCount(filters);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      label="Filters"
      title="Filters"
      width="min(100vw, 31.25rem)"
      tone={{ bg: C.paper, ink: C.ink }}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={active === 0}
            className="h-12 border font-sans text-[0.72rem] tracking-[0.14em] uppercase transition-[opacity,background-color] hover:bg-black/[0.04] disabled:opacity-35"
            style={{ borderColor: `${C.ink}55` }}
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 font-sans text-[0.72rem] tracking-[0.14em] tabular-nums uppercase transition-opacity hover:opacity-90"
            style={{ background: C.night, color: C.paper }}
          >
            Show {count} {noun}
          </button>
        </div>
      }
    >
      <div className="border-t" style={{ borderColor: `${C.ink}17` }}>
        {FACETS.map((f) => (
          <Group key={f.key} facet={f.key} label={f.label} filters={filters} onToggle={onToggle} />
        ))}
      </div>
    </Drawer>
  );
}
