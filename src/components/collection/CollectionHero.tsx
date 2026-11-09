'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { live } from '@/lib/stage-store';
import { collectionMeta } from '@/content/collection';

const PORTRAIT = '(max-aspect-ratio: 4/5)';

/** Full-bleed showreel with the collection's title set over it, as a fashion house opens a season. */
export default function CollectionHero({ onScrollDown }: { onScrollDown: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [shown, setShown] = useState(false);
  const { reel } = collectionMeta;

  // Autoplay only when motion is welcome; the still stays otherwise.
  useEffect(() => {
    const v = video.current;
    if (!v || live.reduced) return;
    v.play().catch(() => undefined);
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(el.querySelectorAll('.hero-in'), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.12, ease: 'vow', delay: 0.25 });
        gsap.to(el.querySelector('.hero-media'), {
          yPercent: 14,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        });
      });
    },
    { scope: ref },
  );

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  };

  return (
    <section
      ref={ref}
      data-tone="dark"
      aria-label={collectionMeta.title}
      className="relative h-[80svh] min-h-[30rem] w-full overflow-hidden bg-[#141216] text-white max-lg:mt-16"
    >
      <div className="hero-media absolute inset-0 will-change-transform">
        <picture>
          <source media={PORTRAIT} srcSet={reel.portraitPoster} />
          {/* Art-directed poster for the film: already a small webp, so it skips the image optimizer. */}
          <img src={reel.landscapePoster} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        <video
          ref={video}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          onPlaying={() => {
            setPlaying(true);
            setShown(true);
          }}
          onPause={() => setPlaying(false)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1.4s]"
          style={{ opacity: shown ? 1 : 0 }}
        >
          <source media={PORTRAIT} src={reel.portrait} type="video/mp4" />
          <source src={reel.landscape} type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,12,16,0.45)_0%,rgba(14,12,16,0.16)_30%,rgba(14,12,16,0.26)_55%,rgba(14,12,16,0.66)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_62%_42%_at_50%_74%,rgba(10,8,12,0.5),transparent_72%)]" />

      <div className="absolute inset-x-0 bottom-[clamp(4.5rem,15%,9rem)] flex flex-col items-center px-6 text-center">
        <p className="hero-in font-sans text-[0.74rem] font-medium tracking-[0.16em] text-white/85 uppercase">{collectionMeta.eyebrow}</p>
        <h1 className="hero-in mt-3 font-sans text-[clamp(1.4rem,1rem+1.3vw,2rem)] leading-tight font-medium tracking-[0.12em] uppercase">
          {collectionMeta.title}
        </h1>
        <p className="hero-in mt-5 max-w-[37rem] font-sans text-[clamp(0.9rem,0.84rem+0.25vw,1.04rem)] leading-relaxed text-white/88">
          {collectionMeta.intro}
        </p>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause the showreel' : 'Play the showreel'}
        className="absolute bottom-[clamp(1.5rem,4vh,2.5rem)] left-[clamp(1rem,3vw,2.75rem)] grid size-11 place-items-center text-white/90 transition-opacity hover:text-white"
      >
        {playing ? <Pause className="size-4 fill-current" strokeWidth={0} /> : <Play className="size-4 fill-current" strokeWidth={0} />}
      </button>

      <button
        type="button"
        onClick={onScrollDown}
        aria-label="Scroll to the weddings"
        className="group absolute top-1/2 right-[clamp(1rem,3.4vw,3.25rem)] hidden -translate-y-1/2 flex-col items-center gap-1.5 py-2 sm:flex"
      >
        <span className="relative block h-14 w-px overflow-hidden bg-white/30">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[hint_2.2s_ease-in-out_infinite] bg-white" />
        </span>
        <svg viewBox="0 0 10 7" className="w-2.5 text-white transition-transform duration-500 group-hover:translate-y-0.5" aria-hidden>
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </section>
  );
}
