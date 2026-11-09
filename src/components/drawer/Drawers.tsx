'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Play } from 'lucide-react';
import Drawer from './Drawer';
import { openFilm, stage, useStage } from '@/lib/stage-store';
import { curtainClick, LABELS } from '@/lib/curtain';
import SocialLinks from '@/components/SocialLinks';
import { posterSrc, stories } from '@/content/stories';
import { about, site } from '@/content/site';

export default function Drawers() {
  const drawer = useStage((s) => s.drawer);
  const close = useCallback(() => stage.set({ drawer: null }), []);
  // The last story stays rendered while the drawer animates closed.
  const lastStory = useStage((st) => st.lastStory);
  const s = stories[lastStory];

  return (
    <>
      <Drawer open={drawer?.kind === 'story'} onClose={close} label={`${s.posterTitle.join(' ')}: story`} tone={{ bg: s.palette.paper, ink: s.palette.ink }}>
        <div className="dr-in flex items-start gap-5">
          <Image src={posterSrc(s)} alt="" width={1200} height={1600} unoptimized className="w-[34%] shrink-0 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.5)]" />
          <div className="pt-1">
            <p className="eyebrow text-[0.62rem] opacity-70">
              Vow {s.numeral} · {s.theme}
            </p>
            <h2 className="serif-italic mt-2 text-[clamp(2rem,1.5rem+2vw,3rem)] leading-[0.95]">{s.posterTitle.join(' ')}</h2>
            <p lang="sa" className="mt-4 font-deva text-lg">
              {s.sanskrit}
            </p>
            <p className="mt-1 font-sans text-[0.8rem] italic opacity-75">{s.transliteration}</p>
          </div>
        </div>

        <p className="dr-in mt-8 serif-italic text-[1.45rem] leading-snug">“{s.meaning}”</p>

        <dl className="dr-in mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-current/15 py-6 font-sans text-[0.85rem]">
          <div>
            <dt className="eyebrow text-[0.58rem] opacity-60">Couple</dt>
            <dd className="mt-1">{s.couple}</dd>
          </div>
          <div>
            <dt className="eyebrow text-[0.58rem] opacity-60">Where</dt>
            <dd className="mt-1">
              {s.venue}, {s.city}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-[0.58rem] opacity-60">When</dt>
            <dd className="mt-1">{s.date}</dd>
          </div>
          <div>
            <dt className="eyebrow text-[0.58rem] opacity-60">Celebrations</dt>
            <dd className="mt-1">{s.details[1]?.value}</dd>
          </div>
        </dl>

        <p className="dr-in mt-8 font-sans text-[1rem] leading-relaxed opacity-90">{s.excerpt}</p>

        <div className="dr-in mt-8 grid grid-cols-3 gap-2">
          {[s.images.a, s.images.b, s.images.c].map((src) => (
            <div key={src} className="relative aspect-[4/5] overflow-hidden">
              <Image src={src} alt="" fill sizes="(max-width: 640px) 33vw, 13rem" className="object-cover" />
            </div>
          ))}
        </div>

        <div className="dr-in mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openFilm(s.index)}
            className="btn-pill"
            style={{ background: s.palette.ink, color: s.palette.paper }}
          >
            <Play className="size-3.5 fill-current" strokeWidth={0} /> Watch the film
          </button>
          <Link href={`/stories/${s.slug}`} onClick={close} className="btn-pill border border-current/30 hover:border-current">
            Read the chapter <ArrowUpRight className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
      </Drawer>

      <Drawer open={drawer?.kind === 'about'} onClose={close} label="About the studio">
        <p className="dr-in eyebrow text-[0.62rem] opacity-60">{about.eyebrow}</p>
        <h2 className="dr-in serif-italic mt-3 text-[clamp(2.2rem,1.6rem+2.4vw,3.4rem)] leading-[0.98]">{about.title}</h2>
        <div className="mt-8 space-y-5 font-sans text-[1rem] leading-relaxed opacity-90">
          {about.body.map((p) => (
            <p key={p} className="dr-in">
              {p}
            </p>
          ))}
        </div>
        <ol className="mt-10 space-y-6">
          {about.principles.map((p, i) => (
            <li key={p.title} className="dr-in grid grid-cols-[2.5rem_1fr] border-t border-current/15 pt-5">
              <span className="headline text-[2rem] leading-none">{['I', 'II', 'III'][i]}</span>
              <div>
                <p className="serif-italic text-xl">{p.title}</p>
                <p className="mt-1 font-sans text-[0.9rem] opacity-80">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="dr-in mt-10 rounded-sm bg-[#2b2a33] p-6 text-[#f5f1ea]">
          <p className="eyebrow text-[0.6rem] opacity-70">{site.contact.city}</p>
          <a href={`mailto:${site.contact.email}`} className="mt-2 block serif-italic text-2xl underline-offset-4 hover:underline">
            {site.contact.email}
          </a>
          <SocialLinks className="mt-5" />
          {/* Works from any page: the curtain scrolls on the home page and cuts to it from elsewhere. */}
          <Link
            href="/#concierge"
            onClick={(e) => {
              close();
              curtainClick('/#concierge', LABELS.concierge)(e);
            }}
            className="nav-link mt-4 inline-block text-[0.75rem]"
          >
            Check a date
          </Link>
        </div>
      </Drawer>
    </>
  );
}
