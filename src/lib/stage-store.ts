'use client';

import { useSyncExternalStore } from 'react';
import type Lenis from 'lenis';

// Shared state between the persistent WebGL stage (root layout) and the DOM.
// React-facing values live in `state` (subscribe with useStage); per-frame values live in `live`.

export type CursorMode = 'default' | 'explore' | 'play' | 'view' | 'drag' | 'hidden';

export type Flight = { index: number; slug: string };

type State = {
  activeIndex: number;
  hoverIndex: number | null;
  cursor: CursorMode;
  cursorLabel: string | null;
  loadProgress: number;
  ready: boolean;
  webgl: boolean;
  /** the home page (ring + lookbook) is the visible route */
  home: boolean;
  /** DOM lookbook has taken over from the WebGL cards */
  handoff: boolean;
  flight: Flight | null;
  sound: boolean;
  drawer: { kind: 'story'; index: number } | { kind: 'about' } | null;
  /** last story shown in the drawer (kept while it animates closed) */
  lastStory: number;
  film: number | null;
  /** film kept mounted while the modal animates closed */
  filmMounted: number | null;
};

const initial: State = {
  activeIndex: 0,
  hoverIndex: null,
  cursor: 'default',
  cursorLabel: null,
  loadProgress: 0,
  ready: false,
  webgl: true,
  home: false,
  handoff: false,
  flight: null,
  sound: false,
  drawer: null,
  lastStory: 0,
  film: null,
  filmMounted: null,
};

let state: State = initial;
const listeners = new Set<() => void>();

export const stage = {
  get: () => state,
  set(patch: Partial<State>) {
    let changed = false;
    for (const k in patch) {
      if (!Object.is(state[k as keyof State], patch[k as keyof State])) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export const openStory = (index: number) => stage.set({ drawer: { kind: 'story', index }, lastStory: index });
export const openFilm = (index: number) => stage.set({ film: index, filmMounted: index });

export function useStage<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    stage.subscribe,
    () => selector(state),
    () => selector(initial),
  );
}

export type Rect = { x: number; y: number; w: number; h: number };

/** Mutable per-frame values, written by the DOM and read inside useFrame. */
export const live = {
  /** ring pin progress 0..1 (phase A then phase B) */
  progress: 0,
  /** hero section top in px relative to viewport (reduced-motion scroll-away) */
  heroTop: 0,
  /** lookbook poster rects in viewport px at the handoff moment (lookbook top = viewport top) */
  targets: [] as (Rect | null)[],
  /** chapter page poster rect in viewport px once mounted */
  chapterPoster: null as Rect | null,
  chapterPosterLoaded: false,
  /** the home ring is mounted and visible */
  homeActive: false,
  reduced: false,
  lenis: null as Lenis | null,
  /** index to restore when returning from a chapter */
  returnIndex: null as number | null,
  /** home scroll position to restore when returning from the collection */
  returnY: null as number | null,
  /** scroll helpers registered by the hero */
  scrollToVow: null as null | ((i: number, immediate?: boolean) => void),
  /** fly a ring card into its chapter page (registered by the stage) */
  flyTo: null as null | ((i: number) => void),
};

// Ring choreography constants shared by DOM and WebGL.
export const RING = {
  count: 7,
  /** pin length in viewport heights */
  pinVh: 5.2,
  /** share of the pin used to turn the ring (phase A); the rest unwinds it (phase B) */
  aEnd: 0.68,
};

export function vowProgress(i: number) {
  return (i / (RING.count - 1)) * RING.aEnd;
}

/** Where the chapter page draws its hero poster. The page's CSS mirrors this; the stage corrects to the measured rect. */
export function chapterPosterRect(vw: number, vh: number): Rect {
  const h = Math.min(vh * 0.72, ((vw * 0.84) * 4) / 3);
  const w = h * 0.75;
  return { x: vw / 2 - w / 2, y: vh * 0.5 - h / 2, w, h };
}
