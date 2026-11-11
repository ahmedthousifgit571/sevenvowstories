'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Play } from 'lucide-react';
import { gsap, MOTION_OK, quickScale, useGSAP } from '@/lib/gsap';
import { openFilm } from '@/lib/stage-store';
import { filmPreviewSrc, filmStillSrc, stories } from '@/content/stories';
import { site } from '@/content/site';
import { YouTubeIcon } from '@/components/SocialLinks';

const FILM_LENGTH = '0:28';

// The sprocket rows take the strip's width from the frames (w-0 min-w-full) instead of setting it: 260 holes would
// otherwise stretch the strip, and the reel would scroll on into empty film.
function Sprockets() {
  return (
    <div className="flex h-7 w-0 min-w-full items-center gap-[14px] overflow-hidden px-3" aria-hidden>
      {Array.from({ length: 260 }, (_, i) => (
        <span key={i} className="h-3 w-4 shrink-0 rounded-[3px] bg-paper/85" />
      ))}
    </div>
  );
}

export default function FilmReel() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const sec = ref.current;
      const tr = track.current;
      const vp = viewport.current;
      if (!sec || !tr || !vp) return;
      const mm = gsap.matchMedia();
      // Desktop: the strip runs sideways while the section is pinned.
      mm.add(`(min-width: 1024px) and ${MOTION_OK}`, () => {
        const distance = () => Math.max(0, tr.scrollWidth - vp.clientWidth);
        gsap.to(tr, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: sec,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });
      // Phones and tablets get the same pinned reel, plus a focus pull: the frame in the middle sits full size and
      // bright while its neighbours ease back, each still drifting inside its frame, and a line counts the films.
      mm.add(`(max-width: 1023.98px) and ${MOTION_OK}`, () => {
        const distance = () => Math.max(0, tr.scrollWidth - vp.clientWidth);
        const frames = Array.from(sec.querySelectorAll<HTMLElement>('.fr-frame'));
        const stills = frames.map((f) => f.querySelector<HTMLElement>('.fr-still')!);
        const count = sec.querySelector<HTMLElement>('.fr-count');
        const bar = sec.querySelector<HTMLElement>('.fr-bar');
        // The reel moves with the page now, so it can't also be swiped sideways.
        vp.style.overflowX = 'hidden';
        vp.style.scrollSnapType = 'none';
        vp.scrollLeft = 0;
        gsap.set(stills, { scale: 1.12 });
        const set = frames.map((f, i) => ({
          s: quickScale(f),
          o: gsap.quickSetter(f, 'opacity'),
          x: gsap.quickSetter(stills[i], 'xPercent'),
        }));
        const setBar = bar ? gsap.quickSetter(bar, 'scaleX') : null;
        let shown = -1;
        const focus = (progress: number) => {
          const mid = window.innerWidth / 2;
          let best = 0;
          let bestD = Infinity;
          frames.forEach((f, i) => {
            const r = f.getBoundingClientRect();
            const w = r.width || 1;
            const d = (r.left + r.width / 2 - mid) / w;
            const a = Math.min(1, Math.abs(d));
            set[i].s(1 - 0.075 * a);
            set[i].o(1 - 0.45 * a);
            set[i].x(gsap.utils.clamp(-5, 5, -d * 5));
            if (Math.abs(d) < bestD) {
              bestD = Math.abs(d);
              best = i;
            }
          });
          setBar?.(progress);
          if (count && best !== shown) {
            shown = best;
            count.textContent = String(best + 1).padStart(2, '0');
          }
        };
        // ScrollTrigger can refresh while the tween is still being created, before `tween` is assigned.
        let tween: gsap.core.Tween | null = null;
        const at = () => tween?.progress() ?? 0;
        tween = gsap.to(tr, {
          x: () => -distance(),
          ease: 'none',
          onUpdate: () => focus(at()),
          scrollTrigger: {
            trigger: sec,
            // Short phones can't fit the header and the strip, so the pin waits until the strip is on screen.
            start: () => (sec.offsetHeight > window.innerHeight + 1 ? 'bottom bottom' : 'top top'),
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onRefresh: () => focus(at()),
          },
        });
        focus(0);
        return () => {
          vp.style.overflowX = '';
          vp.style.scrollSnapType = '';
          gsap.set([...frames, ...stills], { clearProps: 'transform,opacity' });
          if (bar) gsap.set(bar, { clearProps: 'transform' });
        };
      });
      // Headline letters drift in from the right.
      mm.add(MOTION_OK, () => {
        gsap.from(sec.querySelectorAll('.fr-word'), {
          yPercent: 100,
          y: 0,
          duration: 1.2,
          stagger: 0.08,
          ease: 'vow',
          scrollTrigger: { trigger: sec, start: 'top 75%' },
        });
      });
    },
    { scope: ref },
  );

  // Previews play while hovered (mouse) or while on screen (touch).
  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (!coarse) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          const v = en.target.querySelector('video');
          if (!v) return;
          if (en.isIntersecting && en.intersectionRatio > 0.6) {
            v.preload = 'auto';
            v.play().catch(() => undefined);
            en.target.classList.add('is-live');
          } else {
            v.pause();
            en.target.classList.remove('is-live');
          }
        }),
      { threshold: [0, 0.6, 1] },
    );
    sec.querySelectorAll('.fr-frame').forEach((f) => io.observe(f));
    return () => io.disconnect();
  }, []);

  const hoverPlay = (e: React.PointerEvent<HTMLElement>, on: boolean) => {
    if (e.pointerType !== 'mouse') return;
    const v = e.currentTarget.querySelector('video');
    if (!v) return;
    if (on) {
      v.preload = 'auto';
      v.play().catch(() => undefined);
    } else v.pause();
  };

  return (
    // Stable wrapper around the pinned section (see RingHero).
    <div className="relative z-[3]">
      <section ref={ref} id="films" data-tone="dark" aria-labelledby="films-title" className="relative z-[3] overflow-hidden bg-night text-paper">
        <div className="flex flex-col justify-center gap-[clamp(2rem,6vh,4rem)] py-[clamp(4rem,10vh,7rem)] max-lg:motion-safe:min-h-lvh lg:min-h-svh">
          <header className="grid gap-6 px-[var(--gutter)] lg:grid-cols-[1.4fr_1fr] lg:items-end">
            {/* Bottom padding keeps descenders inside the clip the words rise out of. */}
            {/* Set wholly in the light Cormorant italic of the hero's couple line; "films" keeps the accent colour. */}
            <h2 id="films-title" className="headline overflow-hidden pb-[0.14em] pl-[0.04em] text-[clamp(3.4rem,7.4vw,8.6rem)] font-normal italic">

              <span className="fr-word inline-block">Seven</span> <span className="fr-word inline-block">short</span>{' '}
              <em className="fr-word inline-block pr-[0.06em] text-[color:var(--accent)]">films</em>
            </h2>
            <div className="max-w-md font-sans text-[0.95rem] leading-relaxed text-paper/75">
              <p>
                Each chapter is cut as a short film, not a highlight reel: a beginning, a ceremony, and an ending you will want to
                watch again in twenty years.
              </p>
              <p className="eyebrow mt-5 text-[0.6rem] text-paper/50">
                <span className="touch:hidden">Hover to preview · Click to watch</span>
                <span className="hidden touch:motion-safe:inline">Scroll to roll the reel · Tap to watch</span>
                <span className="hidden touch:motion-reduce:inline">Swipe the reel · Tap to watch</span>
              </p>
              <a
                href={site.contact.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-paper/20 py-2 pr-4 pl-3 font-sans text-[0.7rem] font-medium tracking-[0.14em] text-paper/80 uppercase transition-colors duration-300 hover:border-paper/70 hover:text-paper"
              >
                <YouTubeIcon className="size-4" /> More films on YouTube
                <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
              </a>
            </div>
          </header>

          <div
            ref={viewport}
            className="relative snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:snap-none lg:overflow-visible [&::-webkit-scrollbar]:hidden"
          >
            <div ref={track} className="flex w-max flex-col bg-[#0a090c] py-1">
              <Sprockets />
              <div className="flex gap-3 px-3">
                {stories.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    className="fr-frame group relative w-[84vw] shrink-0 snap-center overflow-hidden text-left sm:w-[62vw] lg:w-[46vw]"
                    onClick={() => openFilm(s.index)}
                    onPointerEnter={(e) => hoverPlay(e, true)}
                    onPointerLeave={(e) => hoverPlay(e, false)}
                    data-cursor="play"
                    data-cursor-label="Play film"
                    aria-label={`Play film: ${s.posterTitle.join(' ')}, ${s.couple}`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <div className="fr-still absolute inset-0">
                      <Image
                        src={filmStillSrc(s)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 84vw, (max-width: 1024px) 62vw, 46vw"
                        className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-vow)] group-hover:scale-[1.04]"
                      />
                      <video
                        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-[.is-live]:opacity-100"
                        src={filmPreviewSrc(s)}
                        muted
                        loop
                        playsInline
                        preload="none"
                        aria-hidden
                      />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <span className="absolute top-4 left-4 grid size-11 place-items-center rounded-full border border-white/40 bg-black/20 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 fine:hidden">
                        <Play className="ml-0.5 size-4 fill-current" strokeWidth={0} />
                      </span>
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
                        <div>
                          <p className="eyebrow text-[0.58rem] text-white/70">
                            Vow {s.numeral} · {s.theme}
                          </p>
                          <p className="serif-italic mt-1 text-[clamp(1.35rem,1rem+1.4vw,2.4rem)] leading-tight">{s.posterTitle.join(' ')}</p>
                          <p className="font-sans text-[0.8rem] text-white/70">
                            {s.couple} · {s.city.split(',')[0]}
                          </p>
                        </div>
                        <span className="font-sans text-[0.72rem] tracking-[0.14em] text-white/70 tabular-nums">{FILM_LENGTH}</span>
                      </div>
                    </div>
                  </button>
                ))}
                <div className="flex w-[70vw] shrink-0 flex-col justify-center px-[6vw] sm:w-[40vw] lg:w-[30vw]">
                  <p className="serif-italic text-[clamp(1.6rem,1.2rem+1.4vw,2.6rem)] leading-[1.08]">Your film could be the eighth.</p>
                  <a href="#concierge" className="nav-link mt-6 inline-block self-start text-paper">
                    Check a date
                  </a>
                  <a
                    href={site.contact.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link mt-5 inline-flex items-center gap-2 self-start text-paper/65 hover:text-paper"
                  >
                    <YouTubeIcon className="size-4" /> Every film on YouTube
                  </a>
                </div>
              </div>
              <Sprockets />
            </div>
          </div>

          {/* Below lg: which film is in the gate, and how far along the reel you are. */}
          <div className="-mt-[clamp(0.75rem,2.5vh,2rem)] flex items-center gap-4 px-[var(--gutter)] motion-reduce:hidden lg:hidden" aria-hidden>
            <span className="fr-count font-sans text-[0.7rem] tracking-[0.16em] text-paper/80 tabular-nums">01</span>
            <span className="relative h-px flex-1 bg-paper/15">
              {/* Inline transform, not Tailwind's scale-x-0: that sets the CSS `scale` property, which would pin GSAP's scaleX at 0. */}
              <span className="fr-bar absolute inset-0 origin-left bg-[color:var(--accent)]" style={{ transform: 'scaleX(0)' }} />
            </span>
            <span className="font-sans text-[0.7rem] tracking-[0.16em] text-paper/40 tabular-nums">{String(stories.length).padStart(2, '0')}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

