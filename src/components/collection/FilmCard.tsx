'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { openFilm } from '@/lib/stage-store';
import { filmPreviewSrc, filmStillSrc, stories } from '@/content/stories';
import { shortCity, type Wedding } from '@/content/collection';
import Bookmark from './Bookmark';

const FILM_LENGTH = '0:28';

/** A chapter film: previews on hover, opens the film player. */
export default function FilmCard({ w }: { w: Wedding }) {
  const s = stories[w.storyIndex ?? 0];

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
    <article className="group/film relative">
      <button
        type="button"
        onClick={() => openFilm(s.index)}
        onPointerEnter={(e) => hoverPlay(e, true)}
        onPointerLeave={(e) => hoverPlay(e, false)}
        data-cursor="play"
        data-cursor-label="Play film"
        aria-label={`Play the film ${s.posterTitle.join(' ')}, ${w.couple}`}
        className="relative block aspect-video w-full overflow-hidden bg-[#141216] text-left text-white"
      >
        <Image
          src={filmStillSrc(s)}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-vow)] group-hover/film:scale-[1.03]"
        />
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover/film:opacity-100"
          src={filmPreviewSrc(s)}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
        <span className="absolute top-3 left-3 font-sans text-[0.66rem] font-medium tracking-[0.16em] uppercase opacity-85">
          Vow {s.numeral} · {s.theme}
        </span>
        <span className="absolute right-3 bottom-3 font-sans text-[0.7rem] tracking-[0.12em] tabular-nums opacity-85">{FILM_LENGTH}</span>
        <span className="absolute bottom-3 left-3 grid size-10 place-items-center rounded-full border border-white/50 bg-black/15 backdrop-blur-sm transition-transform duration-500 group-hover/film:scale-110">
          <Play className="ml-0.5 size-3.5 fill-current" strokeWidth={0} />
        </span>
      </button>
      <div className="mt-2.5 flex items-start justify-between gap-3 px-1 pb-1">
        <div className="min-w-0">
          <p className="truncate font-sans text-[0.76rem] font-medium tracking-[0.12em] uppercase sm:text-[0.84rem]">{s.posterTitle.join(' ')}</p>
          <p className="mt-0.5 truncate font-sans text-[0.72rem] opacity-55 sm:text-[0.78rem]">
            {w.couple} · {shortCity(w)}
          </p>
        </div>
        <Bookmark slug={w.slug} name={w.couple} className="-mt-0.5" />
      </div>
    </article>
  );
}
