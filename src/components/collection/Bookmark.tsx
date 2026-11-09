'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { live } from '@/lib/stage-store';
import { shortlist, useShortlist } from '@/lib/shortlist';

/** Save-to-shortlist toggle: an outline bookmark that fills when the wedding is on the shortlist. */
export default function Bookmark({ slug, name, large = false, className = '' }: { slug: string; name: string; large?: boolean; className?: string }) {
  const on = useShortlist().includes(slug);
  const icon = useRef<SVGSVGElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    shortlist.toggle(slug);
    if (icon.current && !live.reduced) gsap.fromTo(icon.current, { scale: 0.55 }, { scale: 1, duration: 0.7, ease: 'back.out(3)' });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from your shortlist` : `Save ${name} to your shortlist`}
      title={on ? 'On your shortlist' : 'Save to shortlist'}
      className={`relative grid shrink-0 place-items-center transition-transform duration-300 before:absolute before:-inset-2 before:content-[''] fine:hover:scale-110 ${
        large ? 'size-8' : 'size-6'
      } ${className}`}
    >
      <svg ref={icon} viewBox="0 0 12 16" className={large ? 'h-[19px] w-[14px]' : 'h-[15px] w-[11px]'} fill="none" aria-hidden>
        <path
          d="M1 1h10v13.6L6 10.7l-5 3.9V1Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
          fill={on ? 'currentColor' : 'transparent'}
          style={{ transition: 'fill 0.3s' }}
        />
      </svg>
    </button>
  );
}
