'use client';

import { useEffect, useRef } from 'react';
import { gsap, MOTION_OK } from '@/lib/gsap';
import type { BloomDetail } from '@/lib/bloom';

const LABELS: Record<string, string> = { explore: 'Explore', play: 'Play', view: 'View', drag: 'Drag' };
const TORAN = [14, 26, 38, 50, 60, 70, 82, 94, 106]
  .map((x, i) => {
    const t = (x - 6) / 108;
    const y = 6 + 34 * 2 * t * (1 - t);
    return `<circle cx="${x}" cy="${y.toFixed(1)}" r="${i % 2 ? 3.2 : 4}" fill="var(--accent)"/><circle cx="${x}" cy="${y.toFixed(1)}" r="1.4" fill="currentColor" opacity=".55"/>`;
  })
  .join('');

/**
 * Touch screens have no cursor, so the cursor's labelled disc blooms under the finger instead:
 * a tap on a poster, film or row opens "View", "Play" or "Explore" where it landed, then lets go.
 */
export default function TouchBloom() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)');
    const motion = window.matchMedia(MOTION_OK);
    const root = layer.current;
    if (!root) return;

    const open = ({ x, y, label }: BloomDetail, dark: boolean) => {
      if (!coarse.matches || !motion.matches) return;
      // Colours are read once: a ring tap starts tweening --ink and --tint toward the chapter's palette straight away.
      const cs = getComputedStyle(document.documentElement);
      const bg = dark ? '#f5f1ea' : cs.getPropertyValue('--ink').trim() || '#7a2e0e';
      const fg = dark ? '#1d1a1f' : cs.getPropertyValue('--tint').trim() || '#f8e6c2';
      const el = document.createElement('div');
      el.className = 'pointer-events-none fixed top-0 left-0';
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.innerHTML = `
        <span data-ring class="absolute -top-14 -left-14 block size-28 rounded-full border" style="border-color:${bg}"></span>
        <span data-disc class="absolute -top-13 -left-13 grid size-26 place-items-center rounded-full" style="background:${bg};color:${fg}">
          <span class="font-sans text-[0.7rem] font-medium tracking-[0.14em] uppercase">${label}</span>
          <svg viewBox="0 0 120 40" class="absolute -bottom-5 left-1/2 w-18 -translate-x-1/2" style="color:${bg}">
            <path d="M6 6 Q60 40 114 6" fill="none" stroke="currentColor" stroke-width="1.2"/>${TORAN}
          </svg>
        </span>`;
      root.appendChild(el);
      const disc = el.querySelector('[data-disc]');
      const ring = el.querySelector('[data-ring]');
      gsap
        .timeline({ onComplete: () => el.remove() })
        .fromTo(disc, { scale: 0.25, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.42, ease: 'vow' })
        .fromTo(ring, { scale: 0.6, autoAlpha: 0.55 }, { scale: 1.75, autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 0)
        .to(disc, { scale: 1.06, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 0.62);
    };

    // Only a tap blooms: a finger that moved or lingered was scrolling.
    let down: { x: number; y: number; t: number; target: HTMLElement | null } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      down = { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target as HTMLElement | null };
    };
    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      if (!d || e.pointerType === 'mouse') return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.t > 500) return;
      const t = d.target?.closest?.<HTMLElement>('[data-cursor]');
      if (!t) return;
      const label = t.dataset.cursorLabel?.split(' ')[0] || LABELS[t.dataset.cursor ?? ''] || 'View';
      open({ x: e.clientX, y: e.clientY, label }, t.closest<HTMLElement>('[data-tone]')?.dataset.tone === 'dark');
    };
    const onCancel = () => (down = null);
    // Taps the DOM can't see (the WebGL ring) ask for a bloom directly.
    const onBloom = (e: Event) => {
      const detail = (e as CustomEvent<BloomDetail>).detail;
      const under = document.elementFromPoint(detail.x, detail.y) as HTMLElement | null;
      open(detail, under?.closest<HTMLElement>('[data-tone]')?.dataset.tone === 'dark');
    };

    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onCancel, { passive: true });
    window.addEventListener('svs:bloom', onBloom);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('svs:bloom', onBloom);
    };
  }, []);

  return <div ref={layer} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden />;
}
