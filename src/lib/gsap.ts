'use client';

import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase, Flip);

CustomEase.create('vow', '0.16, 1, 0.3, 1');
CustomEase.create('vowInOut', '0.76, 0, 0.24, 1');

ScrollTrigger.config({ ignoreMobileResize: true });

export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const FINE_POINTER = '(hover: hover) and (pointer: fine)';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !window.matchMedia(MOTION_OK).matches;
}

// Touch screens have no hover, so a card shows its hover look while it crosses the middle of the screen.
export function liveWhileCentred(targets: Element[]) {
  return targets.map((trigger) => ScrollTrigger.create({ trigger, start: 'top 62%', end: 'bottom 38%', toggleClass: 'is-live' }));
}

/** Adds .is-in to each .reveal element the first time it reaches the viewport (works for items shown later too). */
export function observeReveal(root: Element) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -6% 0px' },
  );
  root.querySelectorAll('.reveal:not(.is-in)').forEach((el) => io.observe(el));
  return () => io.disconnect();
}

export { Flip, gsap, ScrollTrigger, useGSAP };
