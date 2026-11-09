'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { stage, useStage, type CursorMode } from '@/lib/stage-store';

const LABELS: Record<CursorMode, string> = {
  default: '',
  explore: 'Explore',
  play: 'Play',
  view: 'View',
  drag: 'Drag',
  hidden: '',
};

/** A small ring that follows the pointer and opens into a labelled disc over posters, films and rows. */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const stageMode = useStage((s) => s.cursor);
  const [domMode, setDomMode] = useState<{ mode: CursorMode; label: string | null }>({ mode: 'default', label: null });
  const [dark, setDark] = useState(false);
  const mode = stageMode !== 'default' ? stageMode : domMode.mode;
  const label = stageMode !== 'default' ? LABELS[stageMode] : domMode.label || LABELS[domMode.mode];

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('has-cursor');
    const el = dot.current!;
    gsap.set(el, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const qx = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
    let shown = false;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!shown) {
        shown = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { autoAlpha: 1, duration: 0.3 });
      }
      qx(e.clientX);
      qy(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      setDark(target?.closest?.<HTMLElement>('[data-tone]')?.dataset.tone === 'dark');
      const t = target?.closest?.<HTMLElement>('[data-cursor]');
      if (t) setDomMode({ mode: (t.dataset.cursor as CursorMode) || 'default', label: t.dataset.cursorLabel || null });
      else setDomMode((m) => (m.mode === 'default' ? m : { mode: 'default', label: null }));
    };
    const leave = () => {
      shown = false;
      gsap.to(el, { autoAlpha: 0, duration: 0.3 });
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
      stage.set({ cursor: 'default' });
    };
  }, [enabled]);

  const open = mode !== 'default' && mode !== 'hidden';
  useEffect(() => {
    if (!enabled || !disc.current) return;
    gsap.to(disc.current, {
      scale: open ? 1 : 0.18,
      backgroundColor: open ? (dark ? '#f5f1ea' : 'var(--ink)') : 'rgba(0,0,0,0)',
      borderColor: dark ? '#f5f1ea' : 'var(--ink)',
      borderWidth: open ? 0 : 6,
      duration: 0.55,
      ease: 'vow',
    });
  }, [open, enabled, dark]);

  if (!enabled) return null;

  return (
    <div ref={dot} className="pointer-events-none fixed top-0 left-0 z-90 opacity-0" aria-hidden style={{ opacity: mode === 'hidden' ? 0 : undefined }}>
      <div
        ref={disc}
        className="relative grid size-34 place-items-center rounded-full border-solid border-ink"
        style={{ transform: 'scale(0.18)', borderWidth: 6 }}
      >
        <span
          className="font-sans text-[0.78rem] font-medium tracking-[0.14em] text-tint uppercase transition-opacity duration-300"
          style={{ opacity: open ? 1 : 0, color: dark ? '#1d1a1f' : undefined }}
        >
          {label}
        </span>
        {/* Marigold toran: a small garland arc hanging under the disc */}
        <svg
          viewBox="0 0 120 40"
          className="absolute -bottom-6 left-1/2 w-22 -translate-x-1/2 transition-opacity duration-500"
          style={{ opacity: open ? 1 : 0 }}
        >
          <path d="M6 6 Q60 40 114 6" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
          {[14, 26, 38, 50, 60, 70, 82, 94, 106].map((x, i) => {
            const t = (x - 6) / 108;
            const y = 6 + 34 * 2 * t * (1 - t);
            return (
              <g key={x}>
                <circle cx={x} cy={y} r={i % 2 ? 3.2 : 4} fill="var(--accent)" />
                <circle cx={x} cy={y} r={1.4} fill="var(--ink)" opacity={0.55} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
