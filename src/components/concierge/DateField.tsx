'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fromISO(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

type Props = {
  id: string;
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** "We haven't fixed a date yet", offered from inside the calendar. */
  onUnsure?: () => void;
};

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 8 14" className="h-3.5 w-2" aria-hidden>
      <path d={dir === 'left' ? 'M7 1L1 7l6 6' : 'M1 1l6 6-6 6'} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** A date field that opens a small calendar instead of the browser's native date picker. Past days are closed. */
export default function DateField({ id, value, onChange, disabled, placeholder = 'Choose your date', onUnsure }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // "Today" and the month on show are set when the calendar opens (an event), keeping render pure.
  const [today, setToday] = useState<Date | null>(null);
  const [view, setView] = useState({ y: 2026, m: 0 });
  const [focusISO, setFocusISO] = useState<string | null>(null);
  const [up, setUp] = useState(false);
  const selected = fromISO(value);

  const show = () => {
    const now = new Date();
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = selected && selected >= t ? selected : t;
    // Open upwards when the calendar (about 26rem tall) would run off the bottom of the screen.
    const r = trigger.current?.getBoundingClientRect();
    setUp(!!r && window.innerHeight - r.bottom < 420 && r.top > 440);
    setToday(t);
    setView({ y: start.getFullYear(), m: start.getMonth() });
    setFocusISO(toISO(start));
    setOpen(true);
  };
  const hide = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  // Close when the field is hidden (route change) or switched off.
  useLayoutEffect(() => () => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) hide(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', away);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  // Keep keyboard focus on the active day as the visitor moves through the calendar.
  useEffect(() => {
    if (!open || !focusISO) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focusISO}"]`)?.focus({ preventScroll: true });
  }, [open, focusISO, view]);

  const pick = (d: Date) => {
    onChange(toISO(d));
    hide();
  };

  const move = (e: React.KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const delta = steps[e.key];
    if (delta == null || !focusISO || !today) return;
    e.preventDefault();
    const next = addDays(fromISO(focusISO)!, delta);
    if (next < today) return;
    setFocusISO(toISO(next));
    if (next.getMonth() !== view.m || next.getFullYear() !== view.y) setView({ y: next.getFullYear(), m: next.getMonth() });
  };

  const shift = (n: number) => {
    const d = new Date(view.y, view.m + n, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const label = selected
    ? selected.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    : placeholder;

  const first = new Date(view.y, view.m, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const atFirstMonth = today != null && view.y === today.getFullYear() && view.m === today.getMonth();

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? hide() : show())}
        className="flex w-full items-center justify-between gap-4 border-b border-paper/20 pt-1 pb-2.5 text-left font-serif text-[clamp(1.3rem,1.1rem+0.6vw,1.65rem)] transition-opacity duration-300 disabled:opacity-30"
      >
        <span className={selected ? 'text-paper' : 'text-paper/25'}>{label}</span>
        <CalendarDays className="size-5 shrink-0 text-paper/50" strokeWidth={1.2} aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose your wedding date"
          className={`absolute left-0 z-30 w-[min(21rem,calc(100vw-2.5rem))] animate-[pop_0.4s_var(--ease-vow)] rounded-[4px] border border-paper/12 bg-[#28242b] p-5 text-paper shadow-[0_34px_70px_-30px_rgba(0,0,0,0.85)] ${
            up ? 'bottom-full mb-3' : 'top-full mt-3'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shift(-1)}
              disabled={atFirstMonth}
              aria-label="Previous month"
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-25"
            >
              <Chevron dir="left" />
            </button>
            <p className="serif-italic text-[1.35rem] leading-none" aria-live="polite">
              {MONTHS[view.m]} {view.y}
            </p>
            <button type="button" onClick={() => shift(1)} aria-label="Next month" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10">
              <Chevron dir="right" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 text-center font-sans text-[0.6rem] tracking-[0.14em] text-paper/40 uppercase" aria-hidden>
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div ref={grid} onKeyDown={move} className="mt-2 grid grid-cols-7 justify-items-center gap-y-1">
            {Array.from({ length: offset }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const d = new Date(view.y, view.m, i + 1);
              const iso = toISO(d);
              const past = today != null && d < today;
              const isSel = value === iso;
              const isToday = today != null && iso === toISO(today);
              return (
                <button
                  key={iso}
                  type="button"
                  data-date={iso}
                  disabled={past}
                  tabIndex={iso === focusISO ? 0 : -1}
                  onClick={() => pick(d)}
                  aria-pressed={isSel}
                  aria-label={d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  className={`grid size-9 place-items-center rounded-full font-sans text-[0.84rem] tabular-nums transition-colors duration-200 disabled:pointer-events-none disabled:opacity-20 ${
                    isSel ? 'bg-[color:var(--c-accent)] text-[#1d1a1f]' : isToday ? 'ring-1 ring-paper/40 hover:bg-white/10' : 'hover:bg-white/10'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          {onUnsure && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-paper/10 pt-3 font-sans text-[0.74rem] text-paper/50">
              <span>Muhurat not set yet?</span>
              <button
                type="button"
                onClick={() => {
                  onUnsure();
                  hide();
                }}
                className="tracking-[0.12em] text-paper/85 uppercase underline-offset-4 hover:text-paper hover:underline"
              >
                Date not fixed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
