'use client';

import dynamic from 'next/dynamic';
import { useEffect, useSyncExternalStore } from 'react';
import { stage } from '@/lib/stage-store';

const Stage = dynamic(() => import('./Stage'), { ssr: false });

let support: boolean | null = null;
function hasWebGL() {
  if (support != null) return support;
  try {
    const c = document.createElement('canvas');
    support = !!(c.getContext('webgl2') || c.getContext('webgl'));
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
