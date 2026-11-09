'use client';

// A cinematic cut between the big rooms of the site (the ring and the collection). The Curtain component
// registers `go`; anything can call curtainTo(). Without the curtain (or with reduced motion) it navigates directly.

export type CurtainLabel = { eyebrow: string; title: string };

type Go = (href: string, label: CurtainLabel) => void;

export const curtain: { go: Go | null } = { go: null };

export const LABELS = {
  collection: { eyebrow: 'Chapter · The Saptapadi', title: 'The Collection' },
  home: { eyebrow: 'Seven Vow Stories', title: 'The Seven Vows' },
  concierge: { eyebrow: 'The concierge', title: 'Begin your chapter' },
} satisfies Record<string, CurtainLabel>;

export function curtainTo(href: string, label: CurtainLabel = LABELS.home) {
  if (curtain.go) curtain.go(href, label);
  else window.location.assign(href);
}

/** Click handler for links: lets modified clicks (new tab, etc.) behave normally. */
export function curtainClick(href: string, label?: CurtainLabel) {
  return (e: React.MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    curtainTo(href, label);
  };
}
