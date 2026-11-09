'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { filmSrc, filmStillSrc, type Story } from '@/content/stories';

// Renditions that actually exist for each film. Add a 2160p entry here when 4K masters are supplied.
const RENDITIONS = [{ label: '1080p', src: (s: Story) => filmSrc(s) }];

// Act markers (seconds) for the placeholder films: title card, then the three acts.
const MARKERS = [
  { t: 2.2, label: 'I · The Vow' },
  { t: 9.6, label: 'II · The Ceremony' },
  { t: 19.2, label: 'III · Ever After' },
];

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

export default function FilmPlayer({ story, onClose }: { story: Story; onClose: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [full, setFull] = useState(false);
  const [idle, setIdle] = useState(false);
  const [started, setStarted] = useState(false);
  const [rendition, setRendition] = useState(0);
  const idleTimer = useRef<number | undefined>(undefined);

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {
        // Autoplay with sound can be refused: retry muted.
        v.muted = true;
        setMuted(true);
        v.play().catch(() => undefined);
      });
    } else v.pause();
  }, []);

  const seek = useCallback((t: number) => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.max(0, Math.min(v.duration, t));
  }, []);

  const toggleFull = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => undefined);
    else document.exitFullscreen?.();
  }, []);

  const wake = useCallback(() => {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), 2600);
  }, []);

  // Start playing as soon as the modal opens.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.play().catch(() => undefined);
    wake();
    return () => window.clearTimeout(idleTimer.current);
  }, [wake]);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Keyboard: space/K play, J/L ±10s, arrows ±5s, M mute, F fullscreen, Esc close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = video.current;
      if (!v) return;
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'k') {
        e.preventDefault();
        toggle();
      } else if (k === 'j') seek(v.currentTime - 10);
      else if (k === 'l') seek(v.currentTime + 10);
      else if (k === 'arrowleft') seek(v.currentTime - 5);
      else if (k === 'arrowright') seek(v.currentTime + 5);
      else if (k === 'm') {
        v.muted = !v.muted;
        setMuted(v.muted);
      } else if (k === 'f') toggleFull();
      else if (k === 'escape' && !document.fullscreenElement) onClose();
      else return;
      wake();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek, toggleFull, onClose, wake]);

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = bar.current;
    if (!el || !duration) return;
    const r = el.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * duration);
  };

  const pct = duration ? (time / duration) * 100 : 0;
  const hideUi = playing && idle;

  return (
    <div
      ref={wrap}
      className="absolute inset-0 grid place-items-center bg-[#0d0c10]"
      onPointerMove={wake}
    >
      <video
        ref={video}
        className="h-full w-full object-contain"
        src={RENDITIONS[rendition].src(story)}
        poster={filmStillSrc(story)}
        playsInline
        preload="metadata"
        onClick={toggle}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onProgress={(e) => {
          const v = e.currentTarget;
          if (v.buffered.length && v.duration) setBuffered(v.buffered.end(v.buffered.length - 1) / v.duration);
        }}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        onEnded={() => setIdle(false)}
      />

      {/* Title plate before play */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-6 pt-6 pb-16 transition-opacity duration-700 sm:px-10 sm:pt-8"
        style={{ opacity: hideUi ? 0 : 1 }}
      >
        <p className="eyebrow text-[0.62rem] opacity-70">
          Vow {story.numeral} · {story.theme} · A Seven Vow Stories film
        </p>
        <p className="serif-italic mt-1 text-[clamp(1.4rem,1rem+1.6vw,2.4rem)] leading-tight">{story.posterTitle.join(' ')}</p>
        <p className="font-sans text-[0.82rem] opacity-70">
          {story.couple} · {story.city}
        </p>
      </div>

      {!started && (
        <button
          type="button"
          onClick={toggle}
          className="absolute grid size-24 place-items-center rounded-full border border-white/40 bg-white/10 backdrop-blur transition-transform duration-500 hover:scale-105"
          aria-label="Play film"
        >
          <Play className="ml-1 size-7 fill-current" strokeWidth={0} />
        </button>
      )}

      {/* Controls */}
      <div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-14 pb-4 transition-opacity duration-500 sm:px-10 sm:pb-7"
        style={{ opacity: hideUi ? 0 : 1, pointerEvents: hideUi ? 'none' : 'auto' }}
      >
        <div
          ref={bar}
          className="group relative h-6 cursor-pointer touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            scrub(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) scrub(e);
          }}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
        >
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/20">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${buffered * 100}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${pct}%` }} />
          </div>
          {duration > 0 &&
            MARKERS.filter((m) => m.t < duration).map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  seek(m.t);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="group/m absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-[#0d0c10]"
                style={{ left: `${(m.t / duration) * 100}%` }}
                aria-label={`Jump to ${m.label}`}
              >
                <span className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-1 font-sans text-[0.62rem] tracking-[0.12em] uppercase opacity-0 transition-opacity group-hover/m:opacity-100">
                  {m.label}
                </span>
              </button>
            ))}
          <div
            className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
            style={{ left: `${pct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center gap-4 font-sans text-[0.75rem] tracking-[0.08em]">
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="grid size-9 place-items-center">
            {playing ? <Pause className="size-5 fill-current" strokeWidth={0} /> : <Play className="size-5 fill-current" strokeWidth={0} />}
          </button>
          <button
            type="button"
            onClick={() => {
              const v = video.current;
              if (!v) return;
              v.muted = !v.muted;
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="grid size-9 place-items-center"
          >
            {muted ? <VolumeX className="size-5" strokeWidth={1.5} /> : <Volume2 className="size-5" strokeWidth={1.5} />}
          </button>
          <span className="tabular-nums opacity-80">
            {fmt(time)} / {fmt(duration)}
          </span>
          <span className="ml-auto flex items-center gap-1">
            {RENDITIONS.map((r, i) => (
              <button
                key={r.label}
                type="button"
                onClick={() => {
                  const v = video.current;
                  const t = v?.currentTime ?? 0;
                  setRendition(i);
                  requestAnimationFrame(() => {
                    if (video.current) {
                      video.current.currentTime = t;
                      video.current.play().catch(() => undefined);
                    }
                  });
                }}
                className="rounded-full border px-2.5 py-1 text-[0.62rem] tracking-[0.14em] uppercase"
                style={{ borderColor: i === rendition ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)' }}
                aria-pressed={i === rendition}
              >
                {r.label}
              </button>
            ))}
          </span>
          <button type="button" onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'} className="grid size-9 place-items-center">
            {full ? <Minimize className="size-5" strokeWidth={1.5} /> : <Maximize className="size-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>
    </div>
  );
}
