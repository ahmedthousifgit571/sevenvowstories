'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { live } from '@/lib/stage-store';

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  tone?: { bg: string; ink: string };
  /** Sheet layout: a title bar with a close button, a scrolling body and a pinned footer. */
  title?: React.ReactNode;
  footer?: React.ReactNode;
  /** CSS max-width of the panel. */
  width?: string;
};

/** Side drawer: slides in from the right, traps focus, pauses page scroll, closes on Esc or backdrop. */
export default function Drawer({ open, onClose, label, children, tone, title, footer, width }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const sheet = title != null || footer != null;
  const bg = tone?.bg ?? '#f5f1ea';
  const ink = tone?.ink ?? '#2b2a33';

  useEffect(() => {
    const r = root.current;
    const p = panel.current;
    const b = backdrop.current;
    if (!r || !p || !b) return;
    if (!open && !wasOpen.current) return;
    wasOpen.current = open;
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      live.lenis?.stop();
      gsap.set(r, { visibility: 'visible' });
      gsap.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      gsap.fromTo(p, { xPercent: 100, x: 0 }, { xPercent: 0, x: 0, duration: 0.9, ease: 'vow' });
      gsap.fromTo(p.querySelectorAll('.dr-in'), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.06, delay: 0.2, ease: 'vow' });
      (scroller.current ?? p).scrollTop = 0;
      window.setTimeout(() => p.querySelector<HTMLElement>('[data-autofocus]')?.focus(), 60);
    } else {
      gsap.to(b, { opacity: 0, duration: 0.4 });
      gsap.to(p, {
        xPercent: 100,
        x: 0,
        duration: 0.6,
        ease: 'power3.in',
        onComplete: () => {
          gsap.set(r, { visibility: 'hidden' });
          if (!document.querySelector('[data-modal-open="true"]')) live.lenis?.start();
          lastFocus.current?.focus?.({ preventScroll: true });
        },
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div ref={root} className="invisible fixed inset-0 z-[75]" aria-hidden={!open} data-modal-open={open}>
      <div ref={backdrop} className="absolute inset-0 bg-[#15141a]/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-lenis-prevent
        className={`absolute inset-y-0 right-0 w-full translate-x-full overscroll-contain shadow-[-30px_0_80px_-40px_rgba(0,0,0,0.5)] ${
          sheet ? 'flex flex-col' : 'overflow-y-auto'
        }`}
        style={{ background: bg, color: ink, maxWidth: width ?? 'min(100vw, 40rem)' }}
      >
        {sheet ? (
          <>
            <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6 pb-4 sm:px-8 sm:pt-7">
              <div className="min-w-0 font-sans text-[0.95rem] font-medium tracking-[0.12em] uppercase">{title}</div>
              <button type="button" onClick={onClose} data-autofocus aria-label="Close" className="-mr-2 grid size-10 shrink-0 place-items-center">
                <X className="size-5" strokeWidth={1.2} />
              </button>
            </div>
            <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-8 sm:px-8">
              {children}
            </div>
            {footer && <div className="shrink-0 px-4 pt-3 pb-4 sm:px-4" style={{ background: bg }}>{footer}</div>}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              data-autofocus
              className="sticky top-0 z-10 ml-auto flex items-center gap-2 px-6 py-5 font-sans text-[0.72rem] tracking-[0.18em] uppercase sm:px-10"
              style={{ background: `linear-gradient(${bg} 60%, transparent)` }}
            >
              Close <X className="size-4" strokeWidth={1.5} />
            </button>
            <div className="px-6 pb-14 sm:px-10">{children}</div>
          </>
        )}
      </div>
    </div>
  );
}
