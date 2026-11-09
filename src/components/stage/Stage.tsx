'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor, useProgress } from '@react-three/drei';
import Ring, { FOV } from './Ring';
import { stage } from '@/lib/stage-store';

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
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75]);
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
      <PerformanceMonitor onDecline={() => setDpr([1, 1.15])} onIncline={() => setDpr([1, 1.75])} />
      <FrameLoop />
      <Progress />
      <Suspense fallback={null}>
        <Ring />
      </Suspense>
    </Canvas>
  );
}
