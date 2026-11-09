'use client';

import Image from 'next/image';
import { posterSrc, stories } from '@/content/stories';

/** No-WebGL hero: three posters fanned in CSS 3D around the active vow. */
export default function FallbackFan({ active, onOpen }: { active: number; onOpen: (i: number) => void }) {
  const picks = [-1, 0, 1].map((d) => (active + d + stories.length) % stories.length);
  return (
    <div className="absolute inset-x-0 bottom-[14%] z-0 flex justify-center [perspective:1400px]">
      {picks.map((i, k) => {
        const d = k - 1;
        return (
          <button
            key={stories[i].slug}
            type="button"
            onClick={() => onOpen(i)}
            className="relative -mx-[3vw] w-[min(30vw,15rem)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] transition-transform duration-700"
            style={{ transform: `translateZ(${d === 0 ? 60 : 0}px) rotateY(${d * -24}deg) translateY(${d === 0 ? 0 : 6}%)`, zIndex: d === 0 ? 2 : 1 }}
            aria-label={`Open ${stories[i].posterTitle.join(' ')}`}
          >
            <Image src={posterSrc(stories[i])} alt="" width={1200} height={1600} unoptimized className="h-auto w-full" />
          </button>
        );
      })}
    </div>
  );
}
