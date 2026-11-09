'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { live } from '@/lib/stage-store';
import { curtain, type CurtainLabel } from '@/lib/curtain';
import Accent from '@/components/Accent';

type Job = { path: string; hash: string; pushed: boolean; timer?: number };

const raf2 = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

function scrollToHash(hash: string) {
  const el = hash ? document.getElementById(hash) : null;
  if (!el) return;
  live.lenis?.resize();
  ScrollTrigger.refresh();
  const y = el.getBoundingClientRect().top + window.scrollY;
  live.lenis?.scrollTo(y, { immediate: true, force: true });
  window.scrollTo(0, y);
}

/** Full-screen panel that covers a route change, then lifts once the new page has rendered. */
export default function Curtain() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const job = useRef<Job | null>(null);
  const current = useRef(pathname);
  const [label, setLabel] = useState<CurtainLabel>({ eyebrow: '', title: '' });

  useEffect(() => {
    current.current = pathname;
  }, [pathname]);

  const lift = useCallback(async () => {
    const j = job.current;
    const el = ref.current;
    if (!j || !el) return;
    window.clearTimeout(j.timer);
    job.current = null;
    await raf2();
    if (j.hash) {
      // Pinned sections rebuild when a page becomes visible again; measure after they have.
      await raf2();
      scrollToHash(j.hash);
    }
    gsap
      .timeline({
        onComplete: () => {
          gsap.set(el, { autoAlpha: 0, yPercent: 0 });
          el.style.pointerEvents = 'none';
          if (!document.querySelector('[data-modal-open="true"]')) live.lenis?.start();
        },
      })
      .to(el.querySelector('.cu-inner'), { opacity: 0, y: -24, duration: 0.35, ease: 'power2.in' }, 0.05)
      .to(el, { yPercent: -100, duration: 0.95, ease: 'vowInOut' }, 0.2);
  }, []);

  useEffect(() => {
    curtain.go = (href, text) => {
      const url = new URL(href, window.location.href);
      const path = url.pathname;
      const hash = url.hash.replace('#', '');
      const el = ref.current;
      // Same page: just scroll there.
      if (path === current.current) {
        if (hash) scrollToHash(hash);
        else live.lenis?.scrollTo(0, { duration: 1.4 });
        return;
      }
      // Leaving the ring: remember where we were so coming back lands on the same vow.
      if (current.current === '/') live.returnY = window.scrollY;
      if (path === '/' && hash) {
        live.returnY = null;
        live.returnIndex = null;
      }
      if (!el || live.reduced || job.current) {
        router.push(path + (hash ? `#${hash}` : ''), { scroll: !hash });
        return;
      }
      setLabel(text);
      job.current = { path, hash, pushed: false };
      live.lenis?.stop();
      el.style.pointerEvents = 'auto';
      gsap
        .timeline()
        .set(el, { autoAlpha: 1, yPercent: 100 })
        .to(el, { yPercent: 0, duration: 0.8, ease: 'vowInOut' })
        .fromTo(el.querySelector('.cu-inner'), { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, ease: 'vow' }, 0.35)
        .add(() => {
          const j = job.current;
          if (!j) return;
          j.pushed = true;
          router.push(path, { scroll: false });
          // Never leave the curtain down if the route is slow or the navigation is abandoned.
          j.timer = window.setTimeout(lift, 2600);
        }, 0.82);
    };
    return () => {
      curtain.go = null;
    };
  }, [router, lift]);

  useEffect(() => {
    const j = job.current;
    if (j?.pushed && pathname === j.path) lift();
  }, [pathname, lift]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none invisible fixed inset-0 z-[78] grid place-items-center bg-[#1d1a1f] text-[#f5f1ea] opacity-0"
    >
      <div className="cu-inner flex flex-col items-center px-6 text-center">
        <p className="eyebrow text-[0.62rem] text-[#f5f1ea]/60">{label.eyebrow}</p>
        <p className="headline mt-5 text-[clamp(3.6rem,9.5vw,9rem)]">
          <Accent text={label.title} />
        </p>
        <span className="mt-6 text-[0.8rem] leading-none text-[#e7a04a]">✦</span>
      </div>
    </div>
  );
}
