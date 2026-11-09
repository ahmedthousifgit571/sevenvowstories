'use client';

import { useEffect, useRef } from 'react';
import { ReactLenis, useLenis, type LenisRef } from 'lenis/react';
import { gsap, MOTION_OK, ScrollTrigger } from '@/lib/gsap';
import { live } from '@/lib/stage-store';

function ScrollTriggerBridge() {
  const lenis = useLenis(ScrollTrigger.update);
  useEffect(() => {
    live.lenis = lenis ?? null;
    live.reduced = !window.matchMedia(MOTION_OK).matches;  }, [lenis]);
  return null;
}

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const tick = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    // Web fonts change text metrics, which moves every trigger below the fold.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      gsap.ticker.remove(tick);
    };
  }, []);

  // Lenis only reads these options inside an effect, so this never reaches the markup.
  const smoothWheel = typeof window === 'undefined' || window.matchMedia(MOTION_OK).matches;

  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.09, smoothWheel, anchors: true }}>
      <ScrollTriggerBridge />
      {children}
    </ReactLenis>
  );
}
