'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Menu, X } from 'lucide-react';
import Drawer from '@/components/drawer/Drawer';
import SocialLinks from '@/components/SocialLinks';
import { whatsappHref } from '@/components/concierge/enquiry';
import { gsap, useGSAP } from '@/lib/gsap';
import { live, stage } from '@/lib/stage-store';
import { shortlist, useShortlist } from '@/lib/shortlist';
import { curtainClick, curtainTo, LABELS } from '@/lib/curtain';
import { shortCity, weddingBySlug, type Wedding } from '@/content/collection';
import { site } from '@/content/site';
import { C } from './shared';

export type View = 'weddings' | 'films';

type Props = {
  variant: 'overlay' | 'solid';
  view?: View;
  /** On the collection page the menu switches views in place; elsewhere it links to the collection. */
  onSelectView?: (v: View) => void;
};

const hello = 'Hello Seven Vow Stories, we have been looking through your collection and would love to talk about our wedding.';

export function shortlistMessage(list: Wedding[]) {
  const lines = list.map((w) => `• ${w.couple}, ${shortCity(w)}`);
  return [
    'Hello Seven Vow Stories,',
    '',
    'These weddings from your collection feel like us:',
    ...lines,
    '',
    'We would love to talk about our own.',
  ].join('\n');
}

export default function CollectionHeader({ variant, view = 'weddings', onSelectView }: Props) {
  const ref = useRef<HTMLElement>(null);
  const slugs = useShortlist();
  const picks = slugs.map(weddingBySlug).filter((w): w is Wedding => !!w);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState(false);

  // Transient panels close when the route is hidden, so coming back never shows them already open.
  useLayoutEffect(
    () => () => {
      setMenu(false);
      setSheet(false);
    },
    [],
  );

  useEffect(() => {
    const open = () => setSheet(true);
    window.addEventListener('svs:open-shortlist', open);
    return () => window.removeEventListener('svs:open-shortlist', open);
  }, []);

  useGSAP(
    () => {
      if (live.reduced) return;
      // from() keeps each link's own resting opacity (the menu sits at 0.8). Safe here because none of
      // these links transition opacity in CSS, which would skew the end value from() reads.
      gsap.from('.hd-in', { y: -14, opacity: 0, duration: 1, stagger: 0.05, ease: 'vow', delay: variant === 'overlay' ? 0.35 : 0.1 });
    },
    { scope: ref },
  );

  const selectView = (v: View) => (e: React.MouseEvent) => {
    if (!onSelectView) return;
    e.preventDefault();
    setMenu(false);
    onSelectView(v);
  };

  const about = () => {
    setMenu(false);
    stage.set({ drawer: { kind: 'about' } });
  };

  const go = (href: string, label = LABELS.home) => (e: React.MouseEvent) => {
    setMenu(false);
    setSheet(false);
    curtainClick(href, label)(e);
  };

  const mainNav: { label: string; href: string; active?: boolean; onClick?: (e: React.MouseEvent) => void }[] = [
    { label: 'Weddings', href: '/collection', active: view === 'weddings', onClick: selectView('weddings') },
    { label: 'Films', href: '/collection#films', active: view === 'films', onClick: selectView('films') },
    { label: 'Stories', href: '/#lookbook', onClick: go('/#lookbook') },
    { label: 'Archive', href: '/#archive', onClick: go('/#archive') },
  ];

  const overlay = variant === 'overlay';
  const link = 'nav-link hd-in text-[0.78rem] tracking-[0.12em]';

  return (
    <>
      {/* ---------- Desktop ---------- */}
      {/* The overlay sits in ink on the collection's light wall; the solid bar is night with paper type. */}
      <header
        ref={ref}
        data-tone={overlay ? undefined : 'dark'}
        className={`z-30 hidden lg:block ${overlay ? 'absolute inset-x-0 top-0' : 'relative'}`}
        style={overlay ? { color: C.ink } : { background: C.night, color: '#f5f1ea' }}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-8 pt-6">
          <nav aria-label="Studio" className="flex items-center gap-7 justify-self-start">
            <Link href="/" onClick={go('/')} className={`${link} inline-flex items-center gap-2`}>
              <ArrowLeft className="size-[1.05em]" strokeWidth={1.4} /> The seven vows
            </Link>
            <Link href="/#concierge" onClick={go('/#concierge', LABELS.concierge)} className={link}>
              Book a date
            </Link>
          </nav>
          <Link
            href="/"
            onClick={go('/')}
            className="hd-in font-sans text-[clamp(1.45rem,0.9rem+1.1vw,2.05rem)] leading-none font-medium tracking-[0.06em] whitespace-nowrap uppercase"
          >
            {site.name}
          </Link>
          <div className="flex items-center gap-7 justify-self-end">
            <a href={site.contact.instagram} target="_blank" rel="noopener noreferrer" className={`${link} inline-flex items-center gap-1`}>
              Instagram <ArrowUpRight className="size-[1em]" strokeWidth={1.4} />
            </a>
            <a href={whatsappHref(site.contact.whatsapp, hello)} target="_blank" rel="noopener noreferrer" className={`${link} inline-flex items-center gap-1`}>
              WhatsApp <ArrowUpRight className="size-[1em]" strokeWidth={1.4} />
            </a>
            <button type="button" onClick={() => setSheet(true)} className={`${link} tabular-nums`} aria-haspopup="dialog">
              Shortlist ({slugs.length})
            </button>
          </div>
        </div>
        <nav aria-label="Main" className="flex items-center justify-center gap-9 pt-6 pb-6">
          {mainNav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              onClick={n.onClick}
              aria-current={n.active ? 'page' : undefined}
              className={`${link} ${n.active ? '' : 'opacity-80 hover:opacity-100'}`}
            >
              {n.label}
            </Link>
          ))}
          <button type="button" onClick={about} className={`${link} opacity-80 hover:opacity-100`}>
            The studio
          </button>
        </nav>
      </header>

      {/* ---------- Phones and tablets ---------- */}
      <div
        data-tone="dark"
        className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-[#1d1a1f]/95 px-2 text-[#f5f1ea] backdrop-blur-md lg:hidden"
      >
        <button type="button" onClick={() => setMenu(true)} aria-label="Open the menu" className="grid size-12 place-items-center">
          <Menu className="size-6" strokeWidth={1.2} />
        </button>
        <Link href="/" onClick={go('/')} className="font-sans text-[clamp(0.95rem,0.6rem+1.6vw,1.25rem)] font-medium tracking-[0.06em] whitespace-nowrap uppercase">
          {site.name}
        </Link>
        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-label={`Your shortlist, ${slugs.length} saved`}
          className="relative grid size-12 place-items-center"
        >
          <svg viewBox="0 0 12 16" className="h-[19px] w-[14px]" fill="none" aria-hidden>
            <path d="M1 1h10v13.6L6 10.7l-5 3.9V1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          <span
            className="absolute top-2 right-1.5 grid min-w-4 place-items-center rounded-full px-1 font-sans text-[0.6rem] leading-4 font-medium tabular-nums"
            style={{ background: '#f5f1ea', color: C.night }}
          >
            {slugs.length}
          </span>
        </button>
      </div>

      {/* ---------- Menu sheet (phones) ---------- */}
      <Drawer open={menu} onClose={() => setMenu(false)} label="Menu" title={site.name} width="min(100vw, 26rem)" tone={{ bg: C.night, ink: '#f5f1ea' }}>
        <nav aria-label="Main" className="mt-6">
          <ul className="space-y-1">
            {[
              { label: 'The seven vows', href: '/', onClick: go('/') },
              ...mainNav,
              { label: 'Book a date', href: '/#concierge', onClick: go('/#concierge', LABELS.concierge) },
            ].map((n) => (
              <li key={n.label} className="dr-in border-b border-white/10">
                <Link href={n.href} onClick={n.onClick} className="flex items-baseline justify-between py-4">
                  <span className="serif-italic text-[2rem] leading-none">{n.label}</span>
                  <ArrowUpRight className="size-4 opacity-50" strokeWidth={1.3} />
                </Link>
              </li>
            ))}
            <li className="dr-in border-b border-white/10">
              <button type="button" onClick={about} className="flex w-full items-baseline justify-between py-4 text-left">
                <span className="serif-italic text-[2rem] leading-none">The studio</span>
                <ArrowUpRight className="size-4 opacity-50" strokeWidth={1.3} />
              </button>
            </li>
          </ul>
          <div className="dr-in mt-10">
            <SocialLinks detailed />
            <a href={`mailto:${site.contact.email}`} className="mt-5 block font-sans text-[0.85rem] text-white/60 hover:text-white">
              {site.contact.email}
            </a>
          </div>
        </nav>
      </Drawer>

      {/* ---------- Shortlist sheet ---------- */}
      <Drawer
        open={sheet}
        onClose={() => setSheet(false)}
        label="Your shortlist"
        title={<span className="tabular-nums">Shortlist ({picks.length})</span>}
        width="min(100vw, 31.25rem)"
        tone={{ bg: C.paper, ink: C.ink }}
        footer={
          picks.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSheet(false);
                  curtainTo('/#concierge', LABELS.concierge);
                }}
                className="h-12 border font-sans text-[0.72rem] tracking-[0.14em] uppercase transition-colors hover:bg-black/5"
                style={{ borderColor: `${C.ink}55` }}
              >
                Book a date
              </button>
              <a
                href={whatsappHref(site.contact.whatsapp, shortlistMessage(picks))}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-12 place-items-center font-sans text-[0.72rem] tracking-[0.14em] uppercase transition-opacity hover:opacity-90"
                style={{ background: C.night, color: C.paper }}
              >
                Send on WhatsApp
              </a>
            </div>
          ) : null
        }
      >
        {picks.length === 0 ? (
          <div className="dr-in pt-6">
            <p className="serif-italic text-[1.9rem] leading-[1.05]">Keep the weddings that feel like yours.</p>
            <p className="mt-4 font-sans text-[0.92rem] leading-relaxed opacity-70">
              Tap the bookmark on any wedding to save it here. Send your shortlist with your enquiry and we will know the mood you are
              after before we even speak.
            </p>
            <button
              type="button"
              onClick={() => setSheet(false)}
              className="mt-8 h-12 w-full font-sans text-[0.72rem] tracking-[0.14em] uppercase"
              style={{ background: C.night, color: C.paper }}
            >
              Browse the collection
            </button>
          </div>
        ) : (
          <>
            <ul className="divide-y" style={{ borderColor: `${C.ink}1a` }}>
              {picks.map((w) => (
                <li key={w.slug} className="dr-in flex items-center gap-4 py-4" style={{ borderColor: `${C.ink}1a` }}>
                  <Link href={`/collection/${w.slug}`} onClick={() => setSheet(false)} className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden">
                    <Image src={w.frames[0].src} alt="" fill sizes="64px" className="object-cover" />
                  </Link>
                  <Link href={`/collection/${w.slug}`} onClick={() => setSheet(false)} className="min-w-0 flex-1">
                    <p className="truncate font-sans text-[0.86rem] font-medium tracking-[0.12em] uppercase">{w.couple}</p>
                    <p className="mt-1 truncate font-sans text-[0.8rem] opacity-60">
                      {shortCity(w)} · {w.season} {w.year}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => shortlist.remove(w.slug)}
                    aria-label={`Remove ${w.couple} from your shortlist`}
                    className="grid size-9 shrink-0 place-items-center opacity-60 hover:opacity-100"
                  >
                    <X className="size-4" strokeWidth={1.3} />
                  </button>
                </li>
              ))}
            </ul>
            <p className="dr-in mt-6 font-sans text-[0.8rem] leading-relaxed opacity-60">
              Your shortlist is added to the message the concierge writes for you, so we see it with your date.
            </p>
            <button type="button" onClick={() => shortlist.clear()} className="dr-in mt-4 font-sans text-[0.75rem] tracking-[0.12em] uppercase underline underline-offset-4 opacity-70 hover:opacity-100">
              Clear all
            </button>
          </>
        )}
      </Drawer>
    </>
  );
}
