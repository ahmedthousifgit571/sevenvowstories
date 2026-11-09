'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { curtainClick, LABELS } from '@/lib/curtain';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { openStory } from '@/lib/stage-store';
import { archive } from '@/content/archive';
import { stories } from '@/content/stories';

/**
 * Big-type list of couples; a photograph follows the cursor, leaning into its own speed.
 * Touch has no cursor, so the photograph rides down the left margin to whichever row is mid-screen, leaning into the
 * scroll's speed instead.
 */
export default function CoupleArchive() {
  const ref = useRef<HTMLElement>(null);
  const float = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const u = () => setFine(mq.matches);
    u();
    mq.addEventListener('change', u);
    return () => mq.removeEventListener('change', u);
  }, []);

  // Cursor follower with velocity skew
  useEffect(() => {
    if (!fine) return;
    const sec = ref.current;
    const el = float.current;
    if (!sec || !el) return;
    gsap.set(el, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    const qx = gsap.quickTo(el, 'x', { duration: 0.75, ease: 'power3.out' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.75, ease: 'power3.out' });
    const qr = gsap.quickTo(el, 'rotation', { duration: 0.9, ease: 'power3.out' });
    const qs = gsap.quickTo(el, 'skewX', { duration: 0.9, ease: 'power3.out' });
    let lastX = 0;
    let lastT = performance.now();
    const move = (e: PointerEvent) => {
      const r = sec.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const now = performance.now();
      const vx = (e.clientX - lastX) / Math.max(16, now - lastT);
      lastX = e.clientX;
      lastT = now;
      qx(x);
      qy(y);
      qr(gsap.utils.clamp(-14, 14, vx * 9));
      qs(gsap.utils.clamp(-10, 10, -vx * 6));
    };
    sec.addEventListener('pointermove', move);
    return () => sec.removeEventListener('pointermove', move);
  }, [fine]);

  // Touch follower: rides to the row nearest the middle of the screen.
  useEffect(() => {
    if (fine) return;
    const sec = ref.current;
    const el = float.current;
    const list = sec?.querySelector<HTMLElement>('.ar-list');
    if (!sec || !el || !list) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>('.ar-row'));
    const reduced = !window.matchMedia(MOTION_OK).matches;
    gsap.set(el, { xPercent: 0, yPercent: -50, x: 0, y: 0, rotation: 0, skewY: 0 });
    const qy = gsap.quickTo(el, 'y', { duration: 0.65, ease: 'power3.out' });
    const qr = gsap.quickTo(el, 'rotation', { duration: 0.8, ease: 'power3.out' });
    const qs = gsap.quickTo(el, 'skewY', { duration: 0.8, ease: 'power3.out' });
    let current = -1;
    let placed = false;
    let lean = 0;
    let settle: gsap.core.Tween | null = null;

    const choose = (i: number) => {
      if (i === current) return;
      if (current >= 0) rows[current]?.classList.remove('is-live');
      if (i >= 0) rows[i]?.classList.add('is-live');
      current = i;
      setActive(i >= 0 ? i : null);
      if (i < 0) placed = false;
    };
    // Position: re-measured every frame while the list is on screen, since the rows rise in after the scroll that
    // revealed them and nothing scrolls when they land.
    let lastY = NaN;
    const track = () => {
      const mid = window.innerHeight / 2;
      const lr = list.getBoundingClientRect();
      let best = -1;
      if (lr.top < mid && lr.bottom > mid) {
        let bestD = Infinity;
        rows.forEach((r, i) => {
          const b = r.getBoundingClientRect();
          const d = Math.abs(b.top + b.height / 2 - mid);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
      }
      choose(best);
      if (best < 0) return;
      const b = rows[best].getBoundingClientRect();
      const y = b.top - sec.getBoundingClientRect().top + b.height / 2;
      // Each row has the print set down at its own slight angle, like prints laid out by hand.
      lean = best % 2 ? 2.5 : -2.5;
      if (!placed || reduced) {
        gsap.set(el, { y, rotation: reduced ? 0 : lean });
        placed = true;
        lastY = y;
      } else if (Math.abs(y - lastY) > 0.5) {
        qy(y);
        lastY = y;
      }
    };
    // Lean: only from real scroll movement, settling back once it stops.
    const update = (self: ScrollTrigger) => {
      track();
      if (reduced || current < 0) return;
      const v = self.getVelocity();
      qr(lean + gsap.utils.clamp(-9, 9, v / 260));
      qs(gsap.utils.clamp(-7, 7, -v / 380));
      settle?.kill();
      settle = gsap.delayedCall(0.14, () => {
        qr(lean);
        qs(0);
      });
    };
    const st = ScrollTrigger.create({
      trigger: list,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: update,
      onRefresh: track,
      onLeave: () => choose(-1),
      onLeaveBack: () => choose(-1),
    });
    const tick = () => {
      if (st.isActive) track();
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      settle?.kill();
      choose(-1);
    };
  }, [fine]);

  useEffect(() => {
    const el = float.current;
    if (!el) return;
    gsap.to(el, { scale: active != null ? 1 : 0.6, autoAlpha: active != null ? 1 : 0, duration: 0.6, ease: 'vow' });
  }, [active, fine]);

  useGSAP(
    () => {
      const sec = ref.current;
      if (!sec) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(sec.querySelectorAll('.ar-row'), {
          yPercent: 40,
          y: 0,
          opacity: 0,
          duration: 1,
          stagger: 0.05,
          ease: 'vow',
          scrollTrigger: { trigger: sec.querySelector('.ar-list'), start: 'top 80%' },
        });
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="archive" aria-labelledby="archive-title" className="relative z-[3] overflow-hidden bg-paper py-[clamp(5rem,14vh,10rem)] text-[#2b2a33]">
      <header className="flex flex-col gap-6 px-[var(--gutter)] md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-[0.62rem] opacity-60">The archive</p>
          <h2 id="archive-title" className="headline mt-4 text-[clamp(3rem,7vw,7rem)]">
            Couples we have
            <br />
            <em>walked with</em>
          </h2>
        </div>
        <p className="max-w-sm font-sans text-[0.92rem] leading-relaxed opacity-75">
          A few of the weddings behind the seven chapters, and some that became chapters of their own.
        </p>
      </header>

      <ul className="ar-list mt-[clamp(3rem,8vh,5rem)] border-t border-current/15" onPointerLeave={() => fine && setActive(null)}>
        {archive.map((a, i) => {
          const story = a.slug ? stories.find((s) => s.slug === a.slug) : undefined;
          // Touch keeps a wider first column: it is the margin the photograph rides down.
          const rowCls = `grid w-full items-baseline gap-x-4 px-[var(--gutter)] py-[clamp(1rem,2.4vh,1.6rem)] text-left transition-colors duration-500 ${
            fine
              ? 'grid-cols-[2.75rem_1fr_auto] md:grid-cols-[3rem_1fr_10rem_6rem_7rem]'
              : 'grid-cols-[clamp(4.25rem,21vw,6.75rem)_1fr_auto] md:grid-cols-[clamp(4.25rem,12vw,7.5rem)_1fr_10rem_6rem_7rem]'
          }`;
          const href = `/collection/${a.collectionSlug}`;
          const content = (
            <>
              <span className="font-sans text-[0.72rem] tabular-nums opacity-50">{String(i + 1).padStart(2, '0')}</span>
              <span className="relative font-serif text-[clamp(1.9rem,1.2rem+3.4vw,4.4rem)] leading-[1] transition-transform duration-700 ease-[var(--ease-vow)] group-hover:translate-x-3 group-[.is-live]:translate-x-2">
                <span className="italic">{a.couple.split(' & ')[0]}</span>
                <span className="mx-[0.25em] font-sans text-[0.4em] align-middle opacity-60">&amp;</span>
                <span className="italic">{a.couple.split(' & ')[1]}</span>
              </span>
              <span className="hidden font-sans text-[0.85rem] opacity-70 md:block">{a.city}</span>
              <span className="hidden font-sans text-[0.85rem] tabular-nums opacity-70 md:block">{a.year}</span>
              <span className="flex items-center justify-end gap-2 font-sans text-[0.72rem] tracking-[0.12em] uppercase opacity-70">
                <span className="hidden sm:inline">{a.vow}</span>
                <ArrowUpRight
                  className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-[.is-live]:-translate-y-0.5 group-[.is-live]:translate-x-0.5"
                  strokeWidth={1.4}
                />
              </span>
            </>
          );
          const hover = fine ? { onPointerEnter: () => setActive(i), onFocus: () => setActive(i) } : {};
          return (
            <li key={a.couple} className="ar-row group border-b border-current/15">
              {/* Chapters open their story drawer; the other weddings open their page in the collection. */}
              {story ? (
                <button type="button" onClick={() => openStory(story.index)} {...hover} data-cursor="view" data-cursor-label="Read story" className={rowCls}>
                  {content}
                </button>
              ) : (
                <Link href={href} onClick={curtainClick(href, LABELS.collection)} {...hover} data-cursor="view" data-cursor-label="View wedding" className={rowCls}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {/* Desktop: follows the cursor. Touch: a smaller print riding the margin, framed like a photograph. */}
      <div
        ref={float}
        key={fine ? 'cursor' : 'margin'}
        className={`pointer-events-none absolute top-0 z-10 opacity-0 ${
          fine ? 'left-0 w-[clamp(14rem,22vw,22rem)]' : 'left-[var(--gutter)] w-[clamp(4rem,20vw,6.5rem)] md:w-[clamp(4rem,11.5vw,7.25rem)]'
        }`}
        aria-hidden
      >
        <div
          className={`relative aspect-[4/5] overflow-hidden ${
            fine ? 'shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)]' : 'shadow-[0_22px_40px_-16px_rgba(0,0,0,0.5)] ring-[3px] ring-paper'
          }`}
        >
          {archive.map((a, i) => (
            <Image
              key={a.couple}
              src={a.image}
              alt=""
              fill
              sizes={fine ? '22rem' : '7.5rem'}
              className="object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-vow)]"
              style={{ opacity: active === i ? 1 : 0, transform: `scale(${active === i ? 1 : 1.12})` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
