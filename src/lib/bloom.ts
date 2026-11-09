'use client';

/** Asks the touch bloom (TouchBloom.tsx) to open a labelled disc at a point on screen. */
export function bloom(x: number, y: number, label: string) {
  window.dispatchEvent(new CustomEvent('svs:bloom', { detail: { x, y, label } }));
}

export type BloomDetail = { x: number; y: number; label: string };
