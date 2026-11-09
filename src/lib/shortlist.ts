'use client';

import { useSyncExternalStore } from 'react';

// The visitor's shortlist of weddings from the collection (the "mood board"). It is a per-visitor
// convenience kept in localStorage, and it travels with their enquiry from the concierge.

const KEY = 'svs-shortlist';
const EMPTY: string[] = [];

let items: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    items = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function commit(next: string[]) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: the list still works for this visit */
  }
  listeners.forEach((l) => l());
}

export const shortlist = {
  get() {
    if (!loaded) load();
    return items;
  },
  has: (slug: string) => shortlist.get().includes(slug),
  toggle(slug: string) {
    const cur = shortlist.get();
    commit(cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);
  },
  remove(slug: string) {
    commit(shortlist.get().filter((s) => s !== slug));
  },
  clear() {
    commit([]);
  },
  subscribe(l: () => void) {
    listeners.add(l);
    // Keep tabs in step with each other.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      load();
      l();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener('storage', onStorage);
    };
  },
};

/** Slugs on the shortlist. The server render (and hydration) always sees an empty list. */
export function useShortlist(): string[] {
  return useSyncExternalStore(shortlist.subscribe, shortlist.get, () => EMPTY);
}
