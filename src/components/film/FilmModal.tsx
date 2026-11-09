'use client';

import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { live, stage, useStage } from '@/lib/stage-store';
import { stories } from '@/content/stories';
import FilmPlayer from './FilmPlayer';

/** Full-screen film modal, opened from anywhere with openFilm(index). */
export default function FilmModal() {
  const film = useStage((s) => s.film);
  const mounted = useStage((s) => s.filmMounted);
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (film != null) {
      wasOpen.current = true;
      live.lenis?.stop();
      gsap.set(el, { visibility: 'visible' });
      gsap.fromTo(el, { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'vowInOut' });
    } else if (wasOpen.current) {
      wasOpen.current = false;
      gsap.to(el, {
        clipPath: 'inset(50% 0% 50% 0%)',
        duration: 0.6,
        ease: 'power3.in',
        onComplete: () => {
          gsap.set(el, { visibility: 'hidden' });
          stage.set({ filmMounted: null });
          if (!stage.get().drawer) live.lenis?.start();
        },
      });
    }
  }, [film]);

  const close = useCallback(() => stage.set({ film: null }), []);
  const story = mounted != null ? stories[mounted] : null;

  return (
    <div
      ref={ref}
      className="invisible fixed inset-0 z-[85] bg-[#0d0c10] text-[#f5f1ea]"
      role="dialog"
      aria-modal="true"
      aria-hidden={film == null}
      aria-label={story ? `Film: ${story.posterTitle.join(' ')}` : 'Film'}
      data-modal-open={film != null}
      data-tone="dark"
    >
      {story && <FilmPlayer key={story.slug} story={story} onClose={close} />}
      <button
        type="button"
        onClick={close}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-black/30 px-4 py-2.5 font-sans text-[0.7rem] tracking-[0.18em] uppercase backdrop-blur sm:top-6 sm:right-6"
      >
        Close <X className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
