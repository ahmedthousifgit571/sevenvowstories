'use client';

import dynamic from 'next/dynamic';
import { useEffect, useSyncExternalStore } from 'react';
import { stage } from '@/lib/stage-store';

const Stage = dynamic(() => import('./Stage'), { ssr: false });

let support: boolean | null = null;
function hasWebGL() {
  if (support != null) return support;
  try {
    // three.js (r163+) needs WebGL 2; a WebGL 1-only browser would throw inside the Canvas and blank the page.
    const gl = document.createElement('canvas').getContext('webgl2');
    support = !!gl;
    // Free the probe context straight away: phones allow only a few live contexts and little GPU memory.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    support = false;
  }
  return support;
}
const noop = () => () => {};

/** Loads three.js only on the client, and only when WebGL exists; otherwise the DOM fallbacks take over. */
export default function StageMount() {
  const ok = useSyncExternalStore(noop, hasWebGL, () => false);
  useEffect(() => {
    if (!hasWebGL()) stage.set({ webgl: false, ready: true, loadProgress: 1 });
  }, []);
  return ok ? <Stage /> : null;
}
