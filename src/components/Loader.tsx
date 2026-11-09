'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from '@/lib/gsap';
import { live, useStage } from '@/lib/stage-store';
import { stories } from '@/content/stories';
import { site } from '@/content/site';

/** Paper curtain shown while the posters load: the seven numerals light up with progress. */
export default function Loader() {
  const pathname = usePathname();
  const progress = useStage((s) => s.loadProgress);
  const ready = useStage((s) => s.ready);
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  // Only the home page waits for the ring; chapter pages render straight away.
  const [needed] = useState(() => pathname === '/');
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), 9000);
    return () => window.clearTimeout(t);
  }, []);

  const done = !needed || ready || timedOut;

  useEffect(() => {
    if (!done || gone || !ref.current) return;
    live.lenis?.stop();
    const tl = gsap.timeline({
      delay: needed ? 0.25 : 0,
      onComplete: () => {
        setGone(true);
        live.lenis?.start();
      },
    });
    tl.to(ref.current.querySelectorAll('.ld-num'), { opacity: 1, duration: 0.25, stagger: 0.03 })
      .to(ref.current.querySelector('.ld-inner'), { y: -24, opacity: 0, duration: 0.6, ease: 'power2.in' }, '+=0.15')
      .to(ref.current, { yPercent: -100, duration: 1.05, ease: 'vowInOut' }, '-=0.15');
    return () => {
      tl.kill();
    };
  }, [done, gone, needed]);

  if (gone || !needed) return null;

  const lit = Math.round(progress * stories.length);
  return (
    <div ref={ref} className="fixed inset-0 z-[80] grid place-items-center bg-paper text-[#2b2a33]" role="status" aria-live="polite">
      <div className="ld-inner flex flex-col items-center gap-6">
        <p className="font-sans text-[clamp(1.1rem,0.8rem+1.4vw,2rem)] font-medium tracking-[0.06em] uppercase">{site.name}</p>
        <div className="flex gap-4 font-sans text-[0.72rem] tracking-[0.18em]">
          {stories.map((s, i) => (
            <span key={s.slug} className="ld-num transition-opacity duration-500" style={{ opacity: i < lit ? 1 : 0.2 }}>
              {s.numeral}
            </span>
          ))}
        </div>
        <p className="eyebrow text-[0.6rem] opacity-60">Opening the seven vows</p>
      </div>
    </div>
  );
}
