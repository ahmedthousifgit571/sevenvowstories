'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDownRight } from 'lucide-react';
import { gsap, liveWhileCentred, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { live, openStory, useStage } from '@/lib/stage-store';
import { posterSrc, stories } from '@/content/stories';

// Slot positions. Desktop: left %, top vw, width vw, with a parallax speed each.
// Phone: two staggered columns (left %, top in rows of the phone pitch, width vw); each column drifts at its own speed,
// so a card can never slide into the one below it.
const L = 0.05;
const R = -0.05;
const SLOTS = [
  { d: [6, 9, 20], m: [5, 0, 42], speed: 0.06, mspeed: L },
  { d: [71, 5, 21], m: [53, 0.45, 42], speed: -0.04, mspeed: R },
  { d: [38.5, 25, 22], m: [5, 1, 42], speed: 0.1, mspeed: L },
  { d: [8.5, 55, 19], m: [53, 1.45, 42], speed: -0.02, mspeed: R },
  { d: [66, 51, 22], m: [5, 2, 42], speed: 0.08, mspeed: L },
  { d: [37, 87, 20], m: [53, 2.45, 42], speed: -0.05, mspeed: R },
  { d: [9, 112, 22], m: [29, 3.45, 42], speed: 0.04, mspeed: R },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const TOUCH_MOTION = `${MOTION_OK} and (hover: none), ${MOTION_OK} and (pointer: coarse)`;

export default function Lookbook() {
  const ref = useRef<HTMLElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const handoff = useStage((s) => s.handoff);
  const webgl = useStage((s) => s.webgl);
  const [overlap, setOverlap] = useState(true);

  // The lookbook overlaps the end of the ring pin only when the WebGL handoff runs.
  useEffect(() => {
    const mq = window.matchMedia(MOTION_OK);
    const update = () => setOverlap(webgl && mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [webgl]);
  const showCards = !overlap || handoff;

  // Measure poster slots relative to the section top: at the handoff the section top is the viewport top.
  useEffect(() => {
    const measure = () => {
      const sec = ref.current;
      if (!sec) return;
      const top = sec.getBoundingClientRect().top;
      live.targets = slotRefs.current.map((el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top - top, w: r.width, h: r.height };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    ScrollTrigger.addEventListener('refresh', measure);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      ScrollTrigger.removeEventListener('refresh', measure);
      window.removeEventListener('resize', measure);
    };
  }, [overlap]);

  useGSAP(
    () => {
      const sec = ref.current;
      if (!sec) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Layered parallax that starts at zero at the handoff, so measured rects stay exact.
        sec.querySelectorAll<HTMLElement>('[data-speed]').forEach((el) => {
          const speed = Number(el.dataset.speed);
          const mspeed = Number(el.dataset.mspeed ?? speed);
          gsap.fromTo(
            el,
            { y: 0 },
            {
              // Travel is tied to the viewport, not the section, so tall phone layouts don't drift into collisions.
              y: () => (window.innerWidth >= 768 ? -speed * window.innerHeight * 2 : -mspeed * window.innerHeight * 1.6),
              ease: 'none',
              scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
            },
          );
        });
      });
      mm.add('(hover: none), (pointer: coarse)', () => {
        const triggers = liveWhileCentred(Array.from(sec.querySelectorAll('.lb-card')));
        return () => triggers.forEach((t) => t.kill());
      });
      // Touch stand-in for the mouse tilt: each poster leans back as it rises into view, settles flat mid-screen and
      // tips forward as it leaves; the side columns also turn in toward the middle. It eases in from zero after the
      // handoff, so the WebGL cards still land on flat posters.
      mm.add(TOUCH_MOTION, () => {
        const cards = Array.from(sec.querySelectorAll<HTMLElement>('.lb-card'));
        const tilts = cards.map((c) => c.querySelector<HTMLElement>('.lb-tilt')!);
        const set = tilts.map((t) => ({
          rx: gsap.quickSetter(t, 'rotationX', 'deg'),
          ry: gsap.quickSetter(t, 'rotationY', 'deg'),
          s: gsap.quickSetter(t, 'scale'),
        }));
        const update = (self: ScrollTrigger) => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const ramp = clamp01((self.scroll() - self.start) / (vh * 0.45));
          cards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const cy = r.top + tilts[i].offsetHeight / 2;
            if (cy < -vh || cy > vh * 2) return;
            const t = gsap.utils.clamp(-1, 1, (cy - vh / 2) / (vh * 0.62));
            const cx = r.left + r.width / 2;
            const side = Math.abs(cx - vw / 2) < vw * 0.08 ? 0 : cx < vw / 2 ? -1 : 1;
            set[i].rx(t * 12 * ramp);
            set[i].ry(side * Math.abs(t) * 9 * ramp);
            set[i].s(1 - 0.06 * Math.abs(t) * ramp);
          });
        };
        const st = ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom top', onUpdate: update, onRefresh: update });
        return () => {
          st.kill();
          gsap.set(tilts, { clearProps: 'transform' });
        };
      });
    },
    { scope: ref },
  );

  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget.querySelector<HTMLElement>('.lb-tilt');
    if (!el) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: x * 9, rotateX: -y * 9, duration: 0.6, ease: 'power3.out' });
  };
  const untilt = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget.querySelector<HTMLElement>('.lb-tilt');
    if (el) gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'power3.out' });
  };

  return (
    <section
      ref={ref}
      id="lookbook"
      aria-labelledby="lookbook-title"
      className={`lb-section relative z-[3] ${overlap ? '-mt-[100svh]' : ''}`}
      style={{ overflowAnchor: 'none' }}
    >
      <div
        className="absolute inset-x-[5%] top-[6vw] md:inset-x-auto md:top-[4.5vw] md:left-[36.5%] md:w-[28vw] transition-[opacity,transform] duration-1000 ease-[var(--ease-vow)]"
        style={{ opacity: showCards ? 1 : 0, transform: `translateY(${showCards ? 0 : 24}px)` }}
      >
        <p className="eyebrow text-[0.62rem] opacity-70">The lookbook · Seven chapters</p>
        <h2 id="lookbook-title" className="headline mt-4 text-[clamp(3.2rem,12vw,5.5rem)] md:text-[clamp(2.6rem,4.8vw,5.8rem)]">
          Seven vows,
          <br />
          <em className="text-[0.56em]">seven couples, seven films</em>
        </h2>
      </div>

      {stories.map((s, i) => {
        const slot = SLOTS[i];
        return (
          <div
            key={s.slug}
            className="lb-slot absolute"
            style={
              {
                '--l': `${slot.d[0]}%`,
                '--t': `${slot.d[1]}vw`,
                '--w': `${slot.d[2]}vw`,
                '--lm': `${slot.m[0]}%`,
                '--tm': slot.m[1],
                '--wm': `${slot.m[2]}vw`,
              } as React.CSSProperties
            }
          >
            <div ref={(el) => void (slotRefs.current[i] = el)} className="aspect-[3/4] w-full" aria-hidden />
            <div className="absolute inset-x-0 top-0" data-speed={slot.speed} data-mspeed={slot.mspeed}>
              <button
                type="button"
                className="lb-card group block w-full text-left [perspective:1200px]"
                onClick={() => openStory(i)}
                onPointerMove={tilt}
                onPointerLeave={untilt}
                data-cursor="view"
                data-cursor-label="Open story"
                aria-label={`Vow ${s.numeral}, ${s.theme}: ${s.posterTitle.join(' ')}. ${s.couple}, ${s.city}`}
                style={{ pointerEvents: showCards ? 'auto' : 'none' }}
              >
                <div
                  className="lb-tilt relative aspect-[3/4] w-full will-change-transform [transform-style:preserve-3d]"
                  style={{ opacity: showCards ? 1 : 0 }}
                >
                  <Image
                    src={posterSrc(s)}
                    alt=""
                    width={1200}
                    height={1600}
                    unoptimized
                    loading="eager"
                    className={`h-full w-full object-cover transition-shadow delay-150 duration-1000 ${
                      showCards
                        ? 'shadow-[0_40px_80px_-40px_rgba(30,20,10,0.45)] group-hover:shadow-[0_50px_90px_-35px_rgba(30,20,10,0.55)] group-[.is-live]:shadow-[0_50px_90px_-35px_rgba(30,20,10,0.55)]'
                        : 'shadow-none'
                    }`}
                  />
                </div>
                <div
                  className="mt-4 flex items-start justify-between gap-3 transition-[opacity,transform] duration-1000 ease-[var(--ease-vow)]"
                  style={{ opacity: showCards ? 1 : 0, transform: `translateY(${showCards ? 0 : 12}px)`, transitionDelay: `${150 + i * 60}ms` }}
                >
                  <div>
                    <p className="eyebrow text-[0.58rem] opacity-70">
                      <span className="max-md:hidden">Vow </span>
                      {s.numeral} · {s.theme}
                    </p>
                    <p className="serif-italic mt-1 text-[clamp(1.05rem,0.85rem+0.7vw,1.55rem)] leading-tight">{s.posterTitle.join(' ')}</p>
                    <p className="mt-0.5 font-sans text-[0.78rem] opacity-70">
                      {s.couple} · {s.city.split(',')[0]}
                    </p>
                  </div>
                  <ArrowDownRight
                    className="mt-1 size-5 shrink-0 opacity-50 transition-transform duration-700 group-hover:-rotate-45 group-hover:opacity-100 group-[.is-live]:-rotate-45"
                    strokeWidth={1.2}
                  />
                </div>
              </button>
            </div>
          </div>
        );
      })}

      <div
        className="lb-outro absolute inset-x-[5%] md:inset-x-auto md:left-[62%] md:w-[32vw] transition-opacity duration-1000"
        style={{ opacity: showCards ? 1 : 0 }}
        data-speed={0}
        data-mspeed={R}
      >
        <p className="serif-italic text-[clamp(1.6rem,1.2rem+1.6vw,2.8rem)] leading-[1.1]">
          Every couple gets a chapter: a film, an editorial book, and their story told in their own words.
        </p>
        <a href="#concierge" className="nav-link mt-6 inline-block">
          Begin yours
        </a>
      </div>
    </section>
  );
}
