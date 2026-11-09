'use client';

import { gsap } from './gsap';
import { stories } from '@/content/stories';

export const HOME = { paper: '#F5F1EA', ink: '#2B2A33' };

/** Tween the home page ink and accent to a chapter's palette. */
export function applyChapterTheme(index: number, duration = 0.9) {
  const p = stories[index]?.palette;
  if (!p) return;
  gsap.to(document.documentElement, {
    '--ink': p.ink,
    '--accent': p.accent,
    '--tint': p.paper,
    duration,
    ease: 'power2.out',
    overwrite: 'auto',
  });
}

/** Fade the page background (used by the chapter fly-in and on return). */
export function applyPageBg(color: string, duration = 1.1) {
  gsap.to(document.documentElement, { '--page-bg': color, duration, ease: 'power2.inOut', overwrite: 'auto' });
}

export function resetHomeTheme(index: number) {
  applyChapterTheme(index, 0.6);
  applyPageBg(HOME.paper, 0.6);
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
