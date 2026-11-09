'use client';

import Link from 'next/link';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { site } from '@/content/site';
import { stories } from '@/content/stories';
import { credits } from '@/content/credits';
import { live } from '@/lib/stage-store';
import { curtainClick, LABELS } from '@/lib/curtain';
import { whatsappHref } from '@/components/concierge/enquiry';
import SocialLinks from '@/components/SocialLinks';

export default function Footer({ backLabel = 'Back to the vows' }: { backLabel?: string }) {
  return (
    <footer data-tone="dark" className="relative z-[3] overflow-hidden bg-[#151318] px-[var(--gutter)] pt-[clamp(4rem,10vh,7rem)] pb-[clamp(5rem,9vh,6rem)] text-paper">
      <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="eyebrow text-[0.6rem] text-paper/50">Say hello</p>
          <a href={`mailto:${site.contact.email}`} className="mt-3 block serif-italic text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-tight underline-offset-[6px] hover:underline">
            {site.contact.email}
          </a>
          <p className="mt-2 font-sans text-[0.9rem] text-paper/60">
            <a
              href={whatsappHref(site.contact.whatsapp, 'Hello Seven Vow Stories, we would love to talk about our wedding.')}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 transition-colors hover:text-paper hover:underline"
            >
              WhatsApp {site.contact.whatsappDisplay}
            </a>{' '}
            · {site.contact.city}
          </p>
          <SocialLinks className="mt-7" detailed />
        </div>
        <nav aria-label="Chapters">
          <p className="eyebrow text-[0.6rem] text-paper/50">The seven chapters</p>
          <ul className="mt-3 space-y-1.5 font-sans text-[0.9rem]">
            {stories.map((s) => (
              <li key={s.slug}>
                <a href={`/stories/${s.slug}`} className="text-paper/75 transition-colors hover:text-paper">
                  <span className="inline-block w-9 text-paper/40">{s.numeral}</span>
                  {s.posterTitle.join(' ')}
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/collection"
            onClick={curtainClick('/collection', LABELS.collection)}
            className="mt-5 inline-flex items-center gap-1.5 font-sans text-[0.72rem] tracking-[0.16em] text-paper/80 uppercase underline-offset-4 hover:text-paper hover:underline"
          >
            The full collection <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
          </Link>
        </nav>
        <div>
          <p className="eyebrow text-[0.6rem] text-paper/50">A note on this site</p>
          <p className="mt-3 font-sans text-[0.85rem] leading-relaxed text-paper/60">{site.disclaimer}</p>
          <details className="group mt-4 font-sans text-[0.8rem] text-paper/60">
            <summary className="cursor-pointer list-none underline underline-offset-4 hover:text-paper">Image credits ({credits.length})</summary>
            <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-2" data-lenis-prevent>
              {credits.map((c) => (
                <li key={c.file}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-paper">
                    {c.title}
                  </a>{' '}
                  · {c.creator ?? c.source} · {c.license}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      <div className="mt-[clamp(4rem,10vh,7rem)] flex items-end justify-between gap-6 border-t border-paper/10 pt-6">
        <p className="font-sans text-[0.75rem] text-paper/45">© 2026 {site.name}</p>
        <button
          type="button"
          onClick={() => live.lenis?.scrollTo(0, { duration: 2.2 })}
          className="flex items-center gap-2 font-sans text-[0.72rem] tracking-[0.16em] text-paper/60 uppercase hover:text-paper"
        >
          {backLabel} <ArrowUp className="size-4" strokeWidth={1.4} />
        </button>
      </div>
      <p className="headline pointer-events-none mt-8 text-center text-[clamp(3.4rem,11.5vw,13rem)] leading-[0.9] font-semibold text-paper/[0.09] select-none" aria-hidden>
        <em>Seven Vow Stories</em>
      </p>
    </footer>
  );
}
