'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLenis } from 'lenis/react';
import { stage, useStage } from '@/lib/stage-store';
import { startTanpura, stopTanpura } from '@/lib/tanpura';

/** Ambient tanpura drone, off by default and only ever started by a click. */
export default function SoundToggle() {
  const on = useStage((s) => s.sound);
  const film = useStage((s) => s.film);
  const [dark, setDark] = useState(false);

  // Switch to light ink over dark sections (films, concierge, footer).
  useLenis(() => {
    const y = window.innerHeight - 40;
    const over = Array.from(document.querySelectorAll<HTMLElement>('[data-tone="dark"]')).some((el) => {
      if (!el.offsetParent) return false;
      const r = el.getBoundingClientRect();
      return r.top <= y && r.bottom >= y;
    });
    setDark(over);
  });

  // Films have their own soundtrack: pause the drone while one plays.
  useEffect(() => {
    if (!on) return;
    if (film != null) stopTanpura();
    else startTanpura();
  }, [film, on]);

  const toggle = () => {
    const next = !on;
    stage.set({ sound: next });
    if (next) startTanpura();
    else stopTanpura();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Turn ambient sound off' : 'Turn ambient sound on'}
      className="group fixed right-[var(--gutter)] bottom-[clamp(1.1rem,4.4vh,2.75rem)] z-[60] flex items-center gap-2 font-sans text-[0.78rem] tracking-[0.1em] uppercase transition-colors duration-500"
      style={{ color: dark ? '#f5f1ea' : 'var(--ink)' }}
    >
      <span className="relative hidden w-7 overflow-hidden text-right sm:inline-block">
        <span className="block transition-transform duration-500" style={{ transform: `translateY(${on ? '-100%' : '0'})` }}>
          Off
        </span>
        <span className="absolute inset-0 block transition-transform duration-500" style={{ transform: `translateY(${on ? '0' : '100%'})` }}>
          On
        </span>
      </span>
      {on ? (
        <span className="flex h-4 items-end gap-[2px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-[2px] origin-bottom bg-current"
              style={{ height: '100%', animation: `eq 1.${i + 1}s ease-in-out ${i * 0.12}s infinite alternate` }}
            />
          ))}
        </span>
      ) : (
        <VolumeX className="size-4" strokeWidth={1.5} aria-hidden />
      )}
      <Volume2 className="hidden" aria-hidden />
    </button>
  );
}
