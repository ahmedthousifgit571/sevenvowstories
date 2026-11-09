'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLenis } from 'lenis/react';
import { useStage } from '@/lib/stage-store';
import { curtainClick, LABELS } from '@/lib/curtain';
import { nav } from '@/content/site';

/** Floating pill of section links that appears once the ring has handed over to the page. */
export default function MiniNav() {
  const handoff = useStage((s) => s.handoff);
  const webgl = useStage((s) => s.webgl);
  const [overForm, setOverForm] = useState(false);
  // Step aside while the concierge form fills the screen, so it never covers an input.
  useLenis(() => {
    const el = document.getElementById('concierge');
    if (!el) return;
    const r = el.getBoundingClientRect();
    setOverForm(r.top < window.innerHeight * 0.55 && r.bottom > window.innerHeight * 0.45);
  });
  const show = (handoff || !webgl) && !overForm;
  const item = 'block rounded-full px-2.5 py-2 transition-colors hover:bg-white/10 sm:px-4';
  return (
    <nav
      aria-label="Sections"
      className="fixed bottom-[clamp(1rem,3.6vh,2.25rem)] left-1/2 z-[55] -translate-x-1/2 transition-[opacity,transform] duration-700 ease-[var(--ease-vow)]"
      style={{ opacity: show ? 1 : 0, transform: `translateY(${show ? 0 : 18}px)`, pointerEvents: show ? 'auto' : 'none' }}
    >
      <ul className="flex items-center gap-1 rounded-full border border-white/10 bg-[#1d1a1f]/80 p-1 font-sans text-[0.62rem] tracking-[0.12em] whitespace-nowrap sm:text-[0.68rem] sm:tracking-[0.14em] text-paper uppercase shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {nav.map((n) => {
          const label = (
            <>
              <span className="sm:hidden">{n.short ?? n.label}</span>
              <span className="hidden sm:inline">{n.label}</span>
            </>
          );
          return (
            <li key={n.href} className={n.wide ? 'hidden sm:block' : undefined}>
              {n.href.startsWith('/#') ? (
                <a href={n.href.slice(1)} className={item}>
                  {label}
                </a>
              ) : (
                // Other rooms of the site open behind the curtain.
                <Link href={n.href} onClick={curtainClick(n.href, LABELS.collection)} className={item}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
