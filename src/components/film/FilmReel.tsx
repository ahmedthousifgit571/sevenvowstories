'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type Lenis from 'lenis';
import { useLenis } from 'lenis/react';
import { ArrowUpRight, Play } from 'lucide-react';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { live, openFilm, stage, useStage } from '@/lib/stage-store';
import { filmPreviewSrc, filmStillSrc, stories } from '@/content/stories';
import { site } from '@/content/site';
import { YouTubeIcon } from '@/components/SocialLinks';

const FILM_LENGTH = '0:28';

/** The statement, one wipe per line. The last line is set in the accent italic. */
const LINES = ['We don’t make', 'highlight reels.', 'We make films.'];

// Choreography, measured in screen heights of scroll.
const ZOOM = 1.05; // the camera pulls back from the halftone close-up
const FILL_AT = 0.18; // the first line starts to develop
const FILL_GAP = 0.27; // each next line starts this much later
const FILL = 0.42; // one line's wipe
const PRINTS_AT = 1.42; // the first print leaves the bottom edge
const STEP = 0.36; // a new print every STEP
const RISE = 0.3; // one print's flight onto the pile: shorter than STEP, so each lands before the next is thrown
const TAIL = 0.32; // the finished pile holds before the page moves on

/** Seven films and the invitation that lands on top of them. */
const COUNT = stories.length + 1;
// Each print's resting angle on the pile, and a nudge off centre as a fraction of its own size.
const REST = [-4.2, 3.4, -2.6, 4.8, -3.5, 2.4, -1.6, 1.8];
const NUDGE: [number, number][] = [
  [-0.03, 0.012],
  [0.028, -0.016],
  [-0.014, 0.02],
  [0.034, 0.006],
  [-0.024, -0.014],
  [0.016, 0.018],
  [-0.008, -0.006],
  [0.01, 0.004],
];
// The room light: warm while the statement develops, then each film's own colour as its print lands.
const BASE_GLOW = '#5c2a17';
const GLOWS = [...stories.map((s) => s.palette.pageBg), BASE_GLOW];

const landAt = (i: number) => PRINTS_AT + i * STEP + RISE;
/** Where scrolling comes to rest: the finished statement, then each print as it lands. */
const SNAPS = [PRINTS_AT, ...Array.from({ length: COUNT }, (_, i) => landAt(i))];
const LAST = SNAPS[SNAPS.length - 1];
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type Scene = { st: ScrollTrigger; tl: gsap.core.Timeline };

/** Timeline time (screen heights) at a scroll position, or null while the scene isn't built. */
function timeAt(scene: Scene | null, scroll: number) {
  if (!scene) return null;
  const { st, tl } = scene;
  return ((scroll - st.start) / Math.max(1, st.end - st.start)) * tl.duration();
}

function scrollToTime(scene: Scene | null, t: number, duration = 0.8) {
  if (!scene) return;
  const { st, tl } = scene;
  const y = st.start + (t / tl.duration()) * (st.end - st.start);
  if (live.lenis) live.lenis.scrollTo(y, { duration, easing: easeOutCubic });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}

/** Settle on the nearest resting point, leaning the way the visitor was already scrolling. */
function settle(scene: Scene | null, lenis: Lenis) {
  const t = timeAt(scene, lenis.scroll);
  if (t == null || t < PRINTS_AT - 0.12 || t > LAST + 0.02) return;
  let k = 0;
  SNAPS.forEach((s, i) => {
    if (s <= t) k = i;
  });
  const a = SNAPS[k];
  const b = SNAPS[Math.min(k + 1, SNAPS.length - 1)];
  const f = b > a ? (t - a) / (b - a) : 0;
  const target = t < a ? a : (lenis.direction < 0 ? f > 0.75 : f > 0.25) ? b : a;
  if (Math.abs(target - t) < 0.004) return;
  scrollToTime(scene, target, 0.7);
}

/**
 * Seven short films. The section pins while a statement develops out of a halftone screen, the camera pulling back as
 * each line fills in behind a slanted wipe. Then the films are dealt onto it one by one as instant prints: each comes
 * alive with its preview as it lands, and the room light takes on its chapter's colour. The last print is the
 * visitor's own: "Your film could be the eighth". Reduced motion gets the statement and the prints laid out flat.
 */
export default function FilmReel() {
  const ref = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const topRef = useRef(-1);
  const [top, setTop] = useState(-1);
  const [near, setNear] = useState(false);
  const [motion, setMotion] = useState(false);
  const film = useStage((s) => s.film);
  const touching = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const lastTarget = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOTION_OK);
    const update = () => setMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // The stills start loading a couple of screens before the section arrives, so no print lands empty.
  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: '200% 0px' },
    );
    io.observe(sec);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const sec = ref.current;
      if (!sec) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(sec);
        const zoom = q('.fs-zoom');
        const inks = q('.fs-ink');
        const glow = q('.fs-glow');
        const head = q('.fs-head')[0] as HTMLElement;
        const title = q('.fs-title')[0] as HTMLElement;
        const eyebrow = q('.fs-eyebrow')[0] as HTMLElement;
        const index = q('.fs-index')[0] as HTMLElement;
        const prints = gsap.utils.toArray<HTMLElement>(q('.fs-print'));
        const shades = prints.map((p) => p.querySelector('.fs-shade'));

        gsap.set(prints, { xPercent: -50, yPercent: -50 });

        // Portrait phones and tablets: a print is as wide as the statement and would hide all of it, so as the first
        // print arrives the statement rises and shrinks to sit above the pile, with the index below. Offsets are from
        // the middle of the screen; everywhere else the prints land over the statement and these stay at rest.
        // The eyebrow stays only where the pile clears it.
        let lay = { headY: 0, headS: 1, pileY: 0, eyebrow: 1 };
        const layout = () => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const p = prints[0];
          index.style.top = '';
          if (vw >= 1024 || vh < vw * 1.15) {
            const eyebrowBottom = eyebrow.offsetTop + eyebrow.offsetHeight - title.offsetHeight / 2;
            const pileTop = -p.offsetHeight / 2 - p.offsetWidth * 0.045; // with room for the tilt
            lay = { headY: 0, headS: 1, pileY: 0, eyebrow: eyebrowBottom < pileTop - 4 ? 1 : 0 };
            return;
          }
          const headS = 0.66;
          const hs = title.offsetHeight * headS;
          const hp = p.offsetHeight * 1.06;
          const gap = Math.min(28, vh * 0.03);
          const top = -(hs + gap + hp + gap + index.offsetHeight) / 2;
          lay = { headY: top + hs / 2, headS, pileY: top + hs + gap + hp / 2, eyebrow: 0 };
          index.style.top = `calc(50% + ${Math.round(top + hs + gap + hp + gap)}px)`;
        };
        layout();
        ScrollTrigger.addEventListener('refreshInit', layout);

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate: () => {
            // A print counts as the one on top once it has mostly landed.
            const t = tl.time();
            let k = -1;
            for (let i = 0; i < COUNT; i++) if (t >= PRINTS_AT + i * STEP + RISE * 0.7) k = i;
            if (k !== topRef.current) {
              topRef.current = k;
              setTop(k);
            }
          },
        });

        // Every tween states where it starts. A later tween on an element an earlier one already moves also waits for
        // its turn (immediateRender: false), so a refresh mid-scroll can never re-record a start value from the middle.
        const later = { immediateRender: false };

        // 1. The statement: pull back from the dots while each line develops behind a slanted wipe.
        tl.fromTo(zoom, { scale: () => (window.innerWidth >= 1024 ? 2.6 : 2.1) }, { scale: 1, duration: ZOOM, ease: 'power2.out' }, 0);
        tl.fromTo(glow, { opacity: 0.2 }, { opacity: 1, duration: ZOOM + 0.3, ease: 'power1.in' }, 0);
        inks.forEach((ink, i) => tl.fromTo(ink, { '--p': 0 }, { '--p': 118, duration: FILL, ease: 'power1.inOut' }, FILL_AT + i * FILL_GAP));
        tl.fromTo(eyebrow, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.82);
        tl.fromTo(q('.fs-sub'), { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.98);

        // 2. The prints, dealt from alternate sides. The subtitle makes way for the film index, which is in place by
        // the time the first print lands.
        tl.fromTo(q('.fs-sub'), { autoAlpha: 1, y: 0 }, { ...later, autoAlpha: 0, y: -12, duration: 0.14 }, PRINTS_AT);
        tl.fromTo(index, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: RISE - 0.14, ease: 'power2.out' }, PRINTS_AT + 0.14);
        // Portrait: the statement makes room above the pile. The eyebrow bows out wherever the pile would cover it.
        tl.fromTo(head, { y: 0, scale: 1 }, { ...later, y: () => lay.headY, scale: () => lay.headS, duration: RISE, ease: 'power2.inOut' }, PRINTS_AT);
        tl.fromTo(eyebrow, { autoAlpha: 1 }, { ...later, autoAlpha: () => lay.eyebrow, duration: 0.14 }, PRINTS_AT);
        prints.forEach((p, i) => {
          const side = i % 2 ? 1 : -1;
          const at = PRINTS_AT + i * STEP;
          tl.fromTo(
            p,
            {
              x: () => p.offsetWidth * NUDGE[i][0] + side * window.innerWidth * 0.1,
              y: () => window.innerHeight * 0.5 + p.offsetHeight * 0.9,
              rotation: REST[i] + side * 11,
              scale: 1.08,
            },
            {
              x: () => p.offsetWidth * NUDGE[i][0],
              y: () => p.offsetHeight * NUDGE[i][1] + lay.pileY,
              rotation: REST[i],
              scale: 1,
              duration: RISE,
              ease: 'power3.out',
            },
            at,
          );
          // The print underneath sinks into shadow, and the room light takes on the new film's colour.
          if (i > 0) tl.fromTo(shades[i - 1], { opacity: 0 }, { opacity: 0.3, duration: RISE * 0.6, ease: 'power1.out' }, at + RISE * 0.4);
          tl.fromTo(
            glow,
            { '--glow': i ? GLOWS[i - 1] : BASE_GLOW },
            { ...(i ? later : {}), '--glow': GLOWS[i], duration: RISE * 0.8, ease: 'power1.inOut' },
            at + RISE * 0.2,
          );
        });
        tl.to({}, { duration: TAIL });

        const st = ScrollTrigger.create({
          animation: tl,
          trigger: sec,
          start: 'top top',
          end: () => `+=${window.innerHeight * tl.duration()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        });
        scene.current = { st, tl };

        return () => {
          ScrollTrigger.removeEventListener('refreshInit', layout);
          index.style.top = '';
          scene.current = null;
          topRef.current = -1;
          setTop(-1);
        };
      });
    },
    { scope: ref },
  );

  // Scrolling comes to rest on a landed print (or the finished statement), never halfway through a throw.
  useLenis((lenis) => {
    window.clearTimeout(settleTimer.current);
    if (!scene.current || touching.current) return;
    settleTimer.current = window.setTimeout(() => {
      if (lenis.isStopped || touching.current || stage.get().film != null) return;
      settle(scene.current, lenis);
    }, 170);
  });

  // A finger resting on the glass is not a pause: settle only once it lifts.
  useEffect(() => {
    const down = () => {
      touching.current = true;
      window.clearTimeout(settleTimer.current);
    };
    const up = () => {
      touching.current = false;
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => {
        const lenis = live.lenis;
        if (lenis && !touching.current && !lenis.isStopped && stage.get().film == null) settle(scene.current, lenis);
      }, 260);
    };
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchend', up, { passive: true });
    window.addEventListener('touchcancel', up, { passive: true });
    return () => {
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', up);
    };
  }, []);

  // Keyboard: while the pile is on screen, the arrows deal the next print or take the last one back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir || e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      const s = stage.get();
      if (s.film != null || s.drawer) return;
      if ((e.target as HTMLElement | null)?.closest?.('input,textarea,select,[contenteditable]')) return;
      const lenis = live.lenis;
      const sc = scene.current;
      if (!sc?.st.isActive || !lenis) return;
      const now = timeAt(sc, lenis.scroll);
      if (now == null) return;
      // Mid-glide, step on from where the glide is heading.
      const t = lenis.isScrolling && lastTarget.current != null ? lastTarget.current : now;
      if (dir > 0 && t < PRINTS_AT - 0.12) return;
      const next = dir > 0 ? SNAPS.find((v) => v > t + 0.02) : [...SNAPS].reverse().find((v) => v < t - 0.02);
      if (next == null) return;
      e.preventDefault();
      lastTarget.current = next;
      scrollToTime(sc, next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The print on top plays its preview; every other one rests on its still. Nothing plays behind an open film, and
  // nothing keeps playing once the home page is hidden behind another route.
  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    const videos = Array.from(sec.querySelectorAll<HTMLVideoElement>('video[data-film]'));
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const allowed = motion && film == null && !conn?.saveData;
    videos.forEach((v, i) => {
      if (allowed && i === top) {
        v.preload = 'auto';
        v.play().catch(() => undefined);
      } else {
        v.pause();
        // Warm up the next film so it is ready when its print lands.
        if (allowed && i === top + 1) v.preload = 'auto';
      }
    });
    return () => videos.forEach((v) => v.pause());
  }, [top, film, motion]);

  const jumpTo = (i: number) => {
    lastTarget.current = landAt(i);
    scrollToTime(scene.current, landAt(i), 1.1);
  };
  // Tabbing into a print buried in the pile (or not yet dealt) brings it to the top first.
  const onPrintFocus = (e: React.FocusEvent<HTMLLIElement>) => {
    const i = Number(e.currentTarget.dataset.print);
    if (scene.current && topRef.current !== i && (e.target as HTMLElement).matches(':focus-visible')) jumpTo(i);
  };

  return (
    // Stable wrapper around the pinned section (see RingHero). It carries the dark tone too: while pinned, the section
    // is position: fixed and has no offsetParent, so the sound toggle would otherwise miss it.
    <div className="relative z-[3]" data-tone="dark">
      <section ref={ref} id="films" data-tone="dark" aria-labelledby="films-title" className="fs-section relative z-[3] bg-night text-paper">
        <div className="fs-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="fs-grain pointer-events-none absolute inset-0" aria-hidden />

        <div className="fs-stage relative">
          <div className="fs-copy">
            <div className="fs-head">
              <p className="fs-eyebrow eyebrow text-[0.62rem] text-paper/60">Seven short films</p>
              <div className="fs-zoom">
                <h2 id="films-title" className="fs-title headline font-normal">
                  {LINES.map((line, i) => {
                    const accent = i === LINES.length - 1;
                    const text = accent ? <em>{line}</em> : line;
                    return (
                      <span key={line} className={`fs-line${accent ? ' fs-line-accent' : ''}`}>
                        {/* The halftone underneath, and the solid line that develops over it. */}
                        <span className="fs-dots" aria-hidden>
                          {text}
                        </span>
                        <span className="fs-ink">{text}</span>
                      </span>
                    );
                  })}
                </h2>
              </div>
              <p className="fs-sub font-sans text-[0.95rem] leading-relaxed text-paper/70">
                Each chapter is cut as a short film: a beginning, a ceremony, and an ending you will want to watch again in twenty
                years.
              </p>
            </div>
          </div>

          <ul className="fs-prints" aria-label="The seven films">
            {stories.map((s, i) => (
              <li key={s.slug} className="fs-print" style={{ '--rest': `${REST[i]}deg` } as React.CSSProperties} data-print={i} onFocus={onPrintFocus}>
                <button
                  type="button"
                  className="fs-card group block w-full text-left"
                  onClick={() => openFilm(s.index)}
                  data-cursor="play"
                  data-cursor-label="Play film"
                  aria-label={`Play film: ${s.posterTitle.join(' ')}, ${s.couple}, ${s.city.split(',')[0]}`}
                >
                  <span className="fs-paper">
                    <span className="relative block aspect-video overflow-hidden bg-[#0d0c10]">
                      <Image
                        src={filmStillSrc(s)}
                        alt=""
                        fill
                        loading={near ? 'eager' : 'lazy'}
                        sizes="(min-width: 1024px) 38vw, (min-width: 768px) 56vw, 80vw"
                        className="object-cover"
                      />
                      <video
                        data-film
                        className="fs-video absolute inset-0 h-full w-full object-cover"
                        src={filmPreviewSrc(s)}
                        muted
                        loop
                        playsInline
                        preload="none"
                        aria-hidden
                        onPlaying={(e) => e.currentTarget.setAttribute('data-on', '')}
                        onPause={(e) => e.currentTarget.removeAttribute('data-on')}
                      />
                      <span className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
                      <span className="fs-play absolute top-[5%] left-[3.5%] grid size-[clamp(2rem,9cqw,2.9rem)] place-items-center rounded-full border border-white/45 bg-black/25 text-white backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
                        <Play className="ml-[8%] size-[38%] fill-current" strokeWidth={0} />
                      </span>
                    </span>
                    <span className="fs-caption">
                      <span className="min-w-0">
                        <span className="fs-cap-eyebrow eyebrow block" style={{ color: s.palette.ink }}>
                          Vow {s.numeral} · {s.theme}
                        </span>
                        <span className="fs-cap-title serif-italic block">{s.posterTitle.join(' ')}</span>
                        <span className="fs-cap-meta block">
                          {s.couple} · {s.city.split(',')[0]}
                        </span>
                      </span>
                      <span className="fs-cap-meta flex shrink-0 items-center gap-1.5 tracking-[0.14em] tabular-nums">
                        <Play className="size-[0.85em] fill-current" strokeWidth={0} aria-hidden />
                        {FILM_LENGTH}
                      </span>
                    </span>
                    <span className="fs-shade pointer-events-none absolute inset-0 bg-[#0d0c10] opacity-0" />
                  </span>
                </button>
              </li>
            ))}

            {/* The eighth print is the visitor's own. */}
            <li className="fs-print" style={{ '--rest': `${REST[COUNT - 1]}deg` } as React.CSSProperties} data-print={COUNT - 1} onFocus={onPrintFocus}>
              <div className="fs-card">
                <div className="fs-paper">
                  <div className="fs-blank relative grid aspect-video place-items-center overflow-hidden px-[8%] text-center text-paper">
                    <div>
                      <p className="fs-blank-title serif-italic">Your film could be the eighth.</p>
                      <a href="#concierge" className="nav-link mt-[1.1em] inline-block text-paper">
                        Check a date
                      </a>
                    </div>
                  </div>
                  <div className="fs-caption">
                    <div className="min-w-0">
                      <p className="fs-cap-eyebrow eyebrow">Chapter VIII · Yours</p>
                      <p className="fs-cap-title serif-italic">The next story</p>
                    </div>
                    <a
                      href={site.contact.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fs-cap-meta inline-flex shrink-0 items-center gap-1.5 underline-offset-4 hover:underline"
                    >
                      <YouTubeIcon className="size-[1.25em]" /> Every film
                      <ArrowUpRight className="size-[1em]" strokeWidth={1.5} />
                    </a>
                  </div>
                </div>
              </div>
            </li>
          </ul>

          <nav className="fs-index" aria-label="Choose a film">
            <ol className="flex items-center justify-center gap-[clamp(0.55rem,1.5vw,1.15rem)]">
              {stories.map((s, i) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => jumpTo(i)}
                    aria-current={i === top ? 'true' : undefined}
                    aria-label={`Film ${s.numeral}: ${s.posterTitle.join(' ')}`}
                    className="relative px-1 py-1.5 font-sans text-[0.68rem] tracking-[0.12em] transition-opacity duration-500 hover:opacity-100"
                    style={{ opacity: i === top ? 1 : 0.42 }}
                  >
                    {s.numeral}
                    <span
                      className="absolute inset-x-1 bottom-0.5 h-px origin-center bg-accent transition-transform duration-700"
                      style={{ transform: `scaleX(${i === top ? 1 : 0})` }}
                    />
                  </button>
                </li>
              ))}
            </ol>
            <p className="fs-hint eyebrow mt-2 text-center text-[0.55rem] text-paper/45">
              <span className="touch:hidden">Click the print to watch</span>
              <span className="hidden touch:inline">Tap the print to watch</span>
            </p>
          </nav>
        </div>
      </section>
    </div>
  );
}
