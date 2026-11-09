import { parseLine } from '@/content/stories';

export const TEXT_CANVAS = { w: 2048, h: 1024 };

let familyCache: string | null = null;

/** The next/font family list for Six Caps, read from the CSS variable next/font defines. */
export function sixCapsFamily() {
  if (familyCache) return familyCache;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--nf-six').trim();
  familyCache = v || '"Six Caps", "Arial Narrow", sans-serif';
  return familyCache;
}

export async function ensureFont() {
  try {
    await document.fonts.load(`200px ${sixCapsFamily()}`, 'ABC');
  } catch {
    /* fall back to whatever is available */
  }
}

/**
 * Draw a hero line (big words + small ~connector words) centred on a transparent canvas, in white.
 * The shader tints it, so colour changes never need a redraw.
 */
export function drawStoryLine(canvas: HTMLCanvasElement, line: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const family = sixCapsFamily();
  const words = parseLine(line);

  const layout = (big: number) => {
    const small = big * 0.34;
    const gap = big * 0.15;
    const ws = words.map((wd) => {
      ctx.font = `${wd.small ? small : big}px ${family}`;
      const text = wd.small ? wd.w.toLowerCase() : wd.w.toUpperCase();
      return { ...wd, text, width: ctx.measureText(text).width, size: wd.small ? small : big };
    });
    const total = ws.reduce((a, w) => a + w.width + gap, -gap);
    const maxW = W * 0.96;
    const target = Math.min(maxW, total / Math.ceil(total / maxW) + big * 0.9);
    const lines: (typeof ws)[] = [[]];
    let lw = 0;
    for (const w of ws) {
      if (lw + w.width > target && lines[lines.length - 1].length) {
        lines.push([]);
        lw = 0;
      }
      lines[lines.length - 1].push(w);
      lw += w.width + gap;
    }
    return { lines, gap, lead: big * 0.98 };
  };

  // Largest size that fits in four lines and the canvas height.
  let big = H * 0.3;
  let res = layout(big);
  while ((res.lines.length > 4 || res.lines.length * res.lead > H * 0.96) && big > 40) {
    big -= 4;
    res = layout(big);
  }

  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const blockH = res.lines.length * res.lead;
  const top = (H - blockH) / 2;
  res.lines.forEach((ln, i) => {
    const total = ln.reduce((a, w) => a + w.width + res.gap, -res.gap);
    let x = (W - total) / 2;
    const y = top + big * 0.86 + i * res.lead;
    for (const w of ln) {
      ctx.font = `${w.size}px ${family}`;
      ctx.fillText(w.text, x, y);
      x += w.width + res.gap;
    }
  });
}
