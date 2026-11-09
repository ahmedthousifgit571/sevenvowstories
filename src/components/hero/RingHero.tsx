'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLenis } from 'lenis/react';
import { ArrowUpRight } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { live, RING, stage, useStage, vowProgress } from '@/lib/stage-store';
import { applyChapterTheme, resetHomeTheme } from '@/lib/theme';
import { curtainClick, LABELS } from '@/lib/curtain';
import { stories } from '@/content/stories';
import { site } from '@/content/site';
import StoryLine from './StoryLine';
import FallbackFan from './FallbackFan';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function RingHero() {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const pinRef = useRef<ScrollTrigger | null>(null);
  const active = useStage((s) => s.activeIndex);
  const webgl = useStage((s) => s.webgl);
  const ready = useStage((s) => s.ready);
  const story = stories[active];

  // This route owns the ring while it is visible (Activity hides it on chapter pages).
  useLayoutEffect(() => {
    stage.set({ home: true, handoff: false, flight: null });
    live.homeActive = true;
    resetHomeTheme(stage.get().activeIndex);
    return () => {
      live.homeActive = false;
      stage.set({ home: false, hoverIndex: null, cursor: 'default', cursorLabel: null });
    };
  }, []);

  useEffect(() => {
    applyChapterTheme(active);
  }, [active]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        if (!stage.get().webgl) return;
        const pinLength = () => window.innerHeight * RING.pinVh;
        // Furniture fades are driven by the pin's own progress: triggers on a pinned element measure from after the pin.
        const furniture = Array.from(el.querySelectorAll<HTMLElement>('.hero-fade'));
        const fadeOut = (p: number) => {
          const f = Math.min(1, Math.max(0, (p - RING.aEnd) / 0.08));
          gsap.set(furniture, { autoAlpha: 1 - f, y: -16 * f });
        };
        const st = ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: () => `+=${pinLength()}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            live.progress = self.progress;
            fadeOut(self.progress);
          },
          onLeave: () => stage.set({ handoff: true }),
          onEnterBack: () => stage.set({ handoff: false }),
          onRefresh: (self) => {
            live.progress = self.progress;
            fadeOut(self.progress);
            stage.set({ handoff: self.progress >= 1 });
          },
        });
        pinRef.current = st;

        live.scrollToVow = (i, immediate) => {
          const y = st.start + (st.end - st.start) * vowProgress(i);
          live.lenis?.scrollTo(y, { immediate, duration: 1.2, easing: easeOutCubic, force: true });
        };

        // Returning from a chapter: put the ring back on the vow we left from.
        if (live.returnIndex != null) {
          const i = live.returnIndex;
          live.returnIndex = null;
          requestAnimationFrame(() => live.scrollToVow?.(i, true));
        } else if (live.returnY != null) {
          // Returning from the collection: back to exactly where the visitor left.
          const y = live.returnY;
          live.returnY = null;
          requestAnimationFrame(() => {
            live.lenis?.resize();
            ScrollTrigger.refresh();
            live.lenis?.scrollTo(y, { immediate: true, force: true });
            window.scrollTo(0, y);
          });
        }

        return () => {
          gsap.set(furniture, { clearProps: 'opacity,visibility,transform' });
          pinRef.current = null;
          live.scrollToVow = null;
          live.progress = 0;
        };
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        live.scrollToVow = (i) => {
          live.progress = vowProgress(i);
          stage.set({ activeIndex: i });
        };
        if (live.returnIndex != null) {
          live.scrollToVow(live.returnIndex);
          live.returnIndex = null;
        } else if (live.returnY != null) {
          const y = live.returnY;
          live.returnY = null;
          requestAnimationFrame(() => window.scrollTo(0, y));
        }
        return () => {
          live.scrollToVow = null;
        };
      });
    },
    { scope: ref, dependencies: [webgl] },
  );

  // Track the hero's position (reduced motion scrolls the ring away with the page) and snap between vows.
  const snapTimer = useRef<number | undefined>(undefined);
  useLenis((lenis) => {
    const el = ref.current;
    if (el) live.heroTop = el.getBoundingClientRect().top;
    window.clearTimeout(snapTimer.current);
    const st = pinRef.current;
    if (!st || live.reduced) return;
    snapTimer.current = window.setTimeout(() => {
      if (stage.get().flight || lenis.isStopped) return;
      const p = live.progress;
      if (p <= 0.001 || p >= RING.aEnd) return;
      const idx = Math.round((p / RING.aEnd) * (RING.count - 1));
      const target = vowProgress(idx);
      if (Math.abs(target - p) < 0.0015) return;
      lenis.scrollTo(st.start + (st.end - st.start) * target, { duration: 0.8, easing: easeOutCubic });
    }, 150);
  });

  // Keyboard: arrows turn the ring while it is on screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!stage.get().home || stage.get().drawer || stage.get().film != null) return;
      const t = e.target as HTMLElement;
      if (t.closest('input,textarea,select,[contenteditable]')) return;
      if (live.progress >= RING.aEnd && live.progress > 0) return;
      const el = ref.current;
      if (!el || el.getBoundingClientRect().bottom < 0) return;
      const i = stage.get().activeIndex;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (i < RING.count - 1) {
          e.preventDefault();
          live.scrollToVow?.(i + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (i > 0) {
          e.preventDefault();
          live.scrollToVow?.(i - 1);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Intro: wordmark letters rise in once the posters are ready.
  useEffect(() => {
    if (!ready) return;
    const root = ref.current;
    if (!root) return;
    const chars = root.querySelectorAll('.wm-char');
    const bits = root.querySelectorAll('.intro-bit');
    if (live.reduced) {
      gsap.set([chars, bits], { opacity: 1, y: 0 });
      return;
    }
    const a = animate(chars, { y: ['105%', '0%'], opacity: [0, 1], delay: stagger(38, { start: 250 }), duration: 1100, ease: 'outExpo' });
    const b = animate(bits, { y: [14, 0], opacity: [0, 1], delay: stagger(90, { start: 650 }), duration: 1000, ease: 'outQuart' });
    return () => {
      a.revert();
      b.revert();
    };
  }, [ready]);

  const open = (i: number) => {
    if (live.flyTo && stage.get().webgl && !live.reduced) live.flyTo(i);
    else router.push(`/stories/${stories[i].slug}`);
  };

  return (
    // Stable wrapper: the pin moves the section into a spacer, and React only ever touches this div.
    <div>
      <section
        ref={ref}
        id="ring"
        aria-label="The seven vows"
        className="relative h-svh w-full overflow-hidden text-ink"
        style={{ overflowAnchor: 'none' }}
      >
        <h1 className="sr-only">
          {site.name}: {site.tagline}
        </h1>

        {!webgl && <FallbackFan active={active} onOpen={open} />}

        {/* Top furniture */}
        <header className="hero-fade pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-4 px-[var(--gutter)] pt-[clamp(1.25rem,5.2vh,3.25rem)]">
          <button
            type="button"
            onClick={() => stage.set({ drawer: { kind: 'about' } })}
            className="nav-link intro-bit pointer-events-auto justify-self-start opacity-0 max-sm:text-[0.7rem] max-sm:tracking-[0.06em]"
          >
            About
          </button>
          <div className="flex flex-col items-center text-center">
            <p
              className="overflow-hidden font-sans text-[clamp(1.05rem,0.7rem+1.6vw,2.35rem)] leading-none max-sm:text-[0.92rem] font-medium tracking-[0.06em] whitespace-nowrap uppercase"
              aria-label={site.name}
            >
              {site.name.split('').map((c, i) => (
                <span key={i} className="wm-char inline-block opacity-0" aria-hidden>
                  {c === ' ' ? ' ' : c}
                </span>
              ))}
            </p>
            <p className="intro-bit eyebrow mt-[0.9em] text-[clamp(0.6rem,0.55rem+0.25vw,0.85rem)] whitespace-nowrap opacity-0 max-[380px]:text-[0.55rem] max-[380px]:tracking-[0.16em]">
              Chapter · {site.chapterLabel}
            </p>
            <span className="intro-bit mt-3 text-[0.8rem] leading-none opacity-0" aria-hidden>
              ✦
            </span>
          </div>
          <Link
            href="/collection"
            onClick={curtainClick('/collection', LABELS.collection)}
            className="nav-link intro-bit pointer-events-auto inline-flex items-center gap-1 justify-self-end opacity-0 max-sm:text-[0.7rem] max-sm:tracking-[0.06em]"
          >
            Collection
            <ArrowUpRight className="size-[1em] max-sm:hidden" strokeWidth={1.5} />
          </Link>
        </header>

        {/* The story text is drawn in WebGL for depth; this copy serves screen readers and the no-WebGL fallback. */}
        <div
          className={
            webgl
              ? 'sr-only'
              : 'pointer-events-none absolute inset-x-0 top-[24%] z-10 mx-auto max-w-[min(92vw,34rem)] text-center text-[clamp(2.6rem,6vw,4.6rem)]'
          }
          aria-live="polite"
        >
          <StoryLine line={story.heroLine} />
        </div>

        {/* Bottom furniture */}
        <footer className="hero-fade pointer-events-none absolute bottom-0 left-0 z-10 px-[var(--gutter)] pb-[clamp(1.1rem,4.4vh,2.75rem)]">
          <div className="flex flex-col items-start gap-3">
            <button
              type="button"
              onClick={() => open(active)}
              className="intro-bit group pointer-events-auto flex flex-col items-start text-left opacity-0"
              aria-label={`Open chapter ${story.numeral}: ${story.posterTitle.join(' ')}`}
            >
              <span className="eyebrow text-[0.62rem] sm:text-[0.68rem]">
                Vow {story.numeral} · {story.theme}
              </span>
              <span className="serif-italic mt-1 text-[clamp(1.05rem,0.9rem+0.5vw,1.35rem)] leading-tight">
                {story.couple}, {story.city.split(',')[0]}
                <ArrowUpRight className="ml-1 inline size-[0.8em] -translate-y-px transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.4} />
              </span>
            </button>
            <nav aria-label="Choose a vow" className="intro-bit pointer-events-auto flex items-center gap-[clamp(0.55rem,1.4vw,1.1rem)] opacity-0">
              {stories.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => live.scrollToVow?.(i)}
                  aria-current={i === active ? 'true' : undefined}
                  aria-label={`Vow ${s.numeral}: ${s.theme}`}
                  className="group relative px-0.5 py-1 font-sans text-[0.68rem] tracking-[0.12em] transition-opacity duration-500"
                  style={{ opacity: i === active ? 1 : 0.42 }}
                >
                  {s.numeral}
                  <span
                    className="absolute inset-x-0 -bottom-0.5 h-px origin-center bg-current transition-transform duration-700"
                    style={{ transform: `scaleX(${i === active ? 1 : 0})` }}
                  />
                </button>
              ))}
            </nav>
            {/* Touch has no "Explore" cursor over the posters, so it gets a quiet line instead. */}
            <p className="intro-bit eyebrow hidden text-[0.55rem] tracking-[0.2em] opacity-0 touch:block [@media(max-height:700px)]:hidden!" aria-hidden>
              <span className="opacity-55">Scroll to turn · Tap a poster</span>
            </p>
          </div>
        </footer>


        {/* Hidden list of chapters for keyboard users and crawlers */}
        <ul className="sr-only">
          {stories.map((s) => (
            <li key={s.slug}>
              <Link href={`/stories/${s.slug}`}>
                Vow {s.numeral}, {s.theme}: {s.posterTitle.join(' ')}. {s.couple}, {s.city}.
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
