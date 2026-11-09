'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor, useProgress } from '@react-three/drei';
import Ring, { FOV } from './Ring';
import { stage } from '@/lib/stage-store';
import { SMALL_POSTERS } from '@/content/stories';

/** Render continuously only while something on the stage can move; otherwise draw one last frame and rest. */
function FrameLoop() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let current = '';
    const update = () => {
      const st = stage.get();
      const on = st.flight != null || (st.home && !st.handoff);
      const next = on ? 'always' : 'demand';
      if (next !== current) {
        current = next;
        setFrameloop(next);
        invalidate();
        // one more frame after the state settles so hidden cards are cleared
        requestAnimationFrame(() => invalidate());
      }
    };
    update();
    return stage.subscribe(update);
  }, [setFrameloop, invalidate]);
  return null;
}

function Progress() {
  const { progress } = useProgress();
  useEffect(() => {
    stage.set({ loadProgress: progress / 100 });
  }, [progress]);
  return null;
}

export default function Stage() {
  // Phones cap the canvas resolution lower: a full-screen antialiased buffer at 1.75x is a big share of iOS's budget.
  const [maxDpr] = useState(() => (window.matchMedia(SMALL_POSTERS).matches ? 1.5 : 1.75));
  const [dpr, setDpr] = useState<[number, number]>([1, maxDpr]);
  // Client-only component (loaded with ssr: false), so the DOM is available on first render.
  const [source] = useState<HTMLElement | null>(() => document.getElementById('app'));

  if (!source) return null;

  return (
    <Canvas
      className="stage-canvas"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100lvh', pointerEvents: 'none', zIndex: 1 }}
      eventSource={source}
      eventPrefix="client"
      flat
      linear
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: FOV, near: 0.1, far: 100, position: [0, 1, 8.5] }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <PerformanceMonitor onDecline={() => setDpr([1, 1.15])} onIncline={() => setDpr([1, maxDpr])} />
      <FrameLoop />
      <Progress />
      <Suspense fallback={null}>
        <Ring />
      </Suspense>
    </Canvas>
  );
}
