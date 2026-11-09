'use client';

import { useLayoutEffect } from 'react';
import { gsap } from '@/lib/gsap';
import { live } from '@/lib/stage-store';

/** The collection's own room tone: a gallery ivory with kohl ink, a step lighter than the ring's paper. */
export const C = {
  paper: '#F7F4EF',
  paperDeep: '#ECE6DB',
  ink: '#24212A',
  night: '#1D1A1F',
  accent: '#A8742F',
};

export function useCollectionTheme() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    gsap.killTweensOf(root);
    gsap.set(root, { '--page-bg': C.paper, '--ink': C.ink, '--tint': C.paper, '--accent': C.accent });
  }, []);
}

export function scrollToY(y: number) {
  live.lenis?.resize();
  live.lenis?.scrollTo(y, { immediate: true, force: true });
  window.scrollTo(0, y);
}

// Returning from a wedding page puts the grid back where the visitor left it. The detail page raises the flag
// as it hides and the grid reads it in the same commit; a microtask clears it so later visits start at the top.
export const navMemory = { gridY: null as number | null, fromDetail: false, openedFromGrid: false };

/** A grid card was opened: Back on the wedding page can simply step back to this spot. */
export const rememberGridScroll = () => {
  navMemory.gridY = window.scrollY;
  navMemory.openedFromGrid = true;
};

export function markLeavingDetail() {
  navMemory.fromDetail = true;
  queueMicrotask(() => {
    navMemory.fromDetail = false;
  });
}

/** Opens the shortlist sheet owned by whichever collection header is on screen. */
export const openShortlist = () => window.dispatchEvent(new Event('svs:open-shortlist'));

export const pad2 = (n: number) => String(n).padStart(2, '0');
