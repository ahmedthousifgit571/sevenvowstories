// Renders the seven magazine-cover posters (front + back) used by both the WebGL ring and the DOM.
// Run: npm run posters   (needs Node >= 22.18 for direct .ts import)
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { stories, parseLine } from '../src/content/stories.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontDir = path.join(root, 'scripts', 'poster-fonts');
const outDir = path.join(root, 'public', 'posters');

const fonts = {
  six: ['SixCaps.ttf', 'SVS Six'],
  jost: ['Jost[wght].ttf', 'SVS Jost'],
  rozha: ['RozhaOne-Regular.ttf', 'SVS Rozha'],
  italiana: ['Italiana-Regular.ttf', 'SVS Italiana'],
  monoton: ['Monoton-Regular.ttf', 'SVS Monoton'],
  dmserif: ['DMSerifDisplay-Italic.ttf', 'SVS DMSerif'],
  gloock: ['Gloock-Regular.ttf', 'SVS Gloock'],
  poiret: ['PoiretOne-Regular.ttf', 'SVS Poiret'],
  cormorant: ['CormorantGaramond-Italic[wght].ttf', 'SVS Cormorant'],
  tiro: ['TiroDevanagariSanskrit-Regular.ttf', 'SVS Tiro'],
};
for (const [file, alias] of Object.values(fonts)) GlobalFonts.registerFromPath(path.join(fontDir, file), alias);
const F = (k) => `"${fonts[k][1]}"`;

// Per-face title styling: case, tracking (em), size cap, tilt.
const titleStyle = {
  rozha: { upper: false, track: -0.01, max: 170, tilt: 0 },
  italiana: { upper: true, track: 0.08, max: 150, tilt: 0 },
  monoton: { upper: true, track: 0.02, max: 210, tilt: 0 },
  dmserif: { upper: false, track: -0.01, max: 150, tilt: -0.035 },
  gloock: { upper: false, track: -0.01, max: 165, tilt: 0 },
  poiret: { upper: true, track: 0.06, max: 120, tilt: 0 },
  cormorant: { upper: false, track: -0.005, max: 160, tilt: -0.06 },
};

const W = 1200, H = 1600;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function mix(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const c = [16, 8, 0].map((sh) => Math.round(((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** Paper fibre + speckle so flat colour never reads as digital. */
function paper(ctx, base, ink, seed) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  const r = rng(seed);
  for (let i = 0; i < 26000; i++) {
    const x = r() * W, y = r() * H, s = r() * 1.6 + 0.3;
    ctx.fillStyle = r() > 0.5 ? hexA(ink, r() * 0.05) : `rgba(255,255,255,${r() * 0.18})`;
    ctx.fillRect(x, y, s, s);
  }
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = r() * H, l = 6 + r() * 26, a = r() * Math.PI;
    ctx.strokeStyle = hexA(ink, 0.025 + r() * 0.03);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H / 2, H * 0.85);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, hexA(ink, 0.09));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function spaced(ctx, text, x, y, trackPx, align = 'center') {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + trackPx * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + trackPx;
  });
  return total;
}

function measureSpaced(ctx, text, trackPx) {
  const chars = [...text];
  return chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + trackPx * (chars.length - 1);
}

function coverImage(ctx, image, x, y, w, h) {
  const s = Math.max(w / image.width, h / image.height);
  const sw = w / s, sh = h / s;
  const sx = (image.width - sw) / 2, sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

/** Six Caps line with big and small (~) words, wrapped and centred. */
function condensedBlock(ctx, line, cx, top, maxW, big, ink) {
  const words = parseLine(line);
  const small = big * 0.34;
  const gap = big * 0.16;
  const measure = (wd) => {
    ctx.font = `${wd.small ? small : big}px ${F('six')}`;
    return ctx.measureText(wd.small ? wd.w.toLowerCase() : wd.w.toUpperCase()).width;
  };
  const lines = [[]];
  // Balanced wrap: aim for equal line lengths instead of a short last line.
  const widths = words.map(measure);
  const total = widths.reduce((a, w) => a + w + gap, -gap);
  const target = Math.min(maxW, total / Math.ceil(total / maxW) + big * 0.6);
  let lw = 0;
  for (const [i, wd] of words.entries()) {
    const w = widths[i];
    if (lw + w > target && lines[lines.length - 1].length) {
      lines.push([]);
      lw = 0;
    }
    lines[lines.length - 1].push({ ...wd, width: w });
    lw += w + gap;
  }
  ctx.fillStyle = ink;
  ctx.textBaseline = 'alphabetic';
  lines.forEach((ln, i) => {
    const total = ln.reduce((a, w) => a + w.width, 0) + gap * (ln.length - 1);
    let x = cx - total / 2;
    const y = top + big * 0.86 + i * big * 0.98;
    for (const wd of ln) {
      ctx.font = `${wd.small ? small : big}px ${F('six')}`;
      ctx.textAlign = 'left';
      ctx.fillText(wd.small ? wd.w.toLowerCase() : wd.w.toUpperCase(), x, y);
      x += wd.width + gap;
    }
  });
  return lines.length * big * 0.98;
}

async function front(story) {
  const { palette: p } = story;
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  paper(ctx, p.paper, p.ink, 1000 + story.index * 17);

  // Masthead
  ctx.fillStyle = p.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 25px ${F('jost')}`;
  spaced(ctx, 'SEVEN VOW STORIES', W / 2, 96, 7.5);
  ctx.strokeStyle = hexA(p.ink, 0.35);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(150, 120);
  ctx.lineTo(W - 150, 120);
  ctx.stroke();
  ctx.fillStyle = p.accent;
  ctx.font = `500 19px ${F('jost')}`;
  spaced(ctx, `VOW ${story.numeral}  ·  ${story.theme.toUpperCase()}`, W / 2, 156, 6);

  // Title
  const st = titleStyle[story.posterFont];
  const lines = story.posterTitle.map((t) => (st.upper ? t.toUpperCase() : t));
  let size = st.max;
  const fit = () => {
    ctx.font = `${size}px ${F(story.posterFont)}`;
    return Math.max(...lines.map((l) => measureSpaced(ctx, l, size * st.track)));
  };
  const lead = story.posterFont === 'monoton' ? 1.0 : 0.94;
  // Title band is y 178..468: fit width and height, then centre vertically.
  const blockH = () => (lines.length - 1) * size * lead + size * 0.92;
  while ((fit() > 960 || blockH() > 270) && size > 40) size -= 2;
  fit();
  ctx.save();
  ctx.translate(W / 2, 0);
  ctx.rotate(st.tilt);
  ctx.fillStyle = p.ink;
  const titleTop = 178 + (290 - blockH()) / 2 - size * 0.06;
  lines.forEach((l, i) => {
    ctx.font = `${size}px ${F(story.posterFont)}`;
    spaced(ctx, l, 0, titleTop + size * 0.8 + i * size * lead, size * st.track);
  });
  ctx.restore();

  // Sanskrit line
  ctx.fillStyle = hexA(p.ink, 0.78);
  ctx.font = `30px ${F('tiro')}`;
  ctx.textAlign = 'center';
  ctx.fillText(story.sanskrit, W / 2, 508);

  // Photo
  const photo = await loadImage(path.join(root, 'public', story.images.poster));
  const px = 170, py = 540, pw = 860, ph = 770;
  ctx.fillStyle = hexA(p.ink, 0.12);
  ctx.fillRect(px + 6, py + 8, pw, ph);
  coverImage(ctx, photo, px, py, pw, ph);
  // light print grain over the photo
  const r = rng(77 + story.index);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(px + r() * pw, py + r() * ph, 1.4, 1.4);
  }
  ctx.strokeStyle = hexA(p.paper, 0.85);
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 14, py + 14, pw - 28, ph - 28);

  // Tagline
  condensedBlock(ctx, story.posterTagline, W / 2, 1334, 820, 86, p.ink);

  // Footer
  ctx.fillStyle = hexA(p.ink, 0.85);
  ctx.font = `500 17px ${F('jost')}`;
  spaced(ctx, story.city.split(',')[0].toUpperCase(), 150, 1556, 5, 'left');
  spaced(ctx, story.date.toUpperCase(), W - 150, 1556, 5, 'right');
  spaced(ctx, `N° ${story.numeral}`, W / 2, 1556, 5);

  return c.encode('webp', 88);
}

async function back(story) {
  const { palette: p } = story;
  const base = mix(p.paper, '#F3F0EA', 0.72);
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  paper(ctx, base, p.ink, 5000 + story.index * 31);

  const emboss = (draw) => {
    ctx.save();
    ctx.translate(-1.5, -1.5);
    draw('rgba(255,255,255,0.75)');
    ctx.restore();
    ctx.save();
    ctx.translate(1.5, 1.5);
    draw(hexA(p.ink, 0.22));
    ctx.restore();
    draw(hexA(p.ink, 0.1));
  };
  // Deckled frame
  emboss((col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 70, W - 140, H - 140);
  });
  // Monogram seal
  emboss((col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2 - 40, 190, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2 - 40, 172, 0, Math.PI * 2);
    ctx.stroke();
  });
  emboss((col) => {
    ctx.fillStyle = col;
    ctx.font = `150px ${F('italiana')}`;
    ctx.textBaseline = 'middle';
    spaced(ctx, 'SVS', W / 2, H / 2 - 30, 12);
  });
  emboss((col) => {
    ctx.fillStyle = col;
    ctx.textBaseline = 'alphabetic';
    ctx.font = `500 30px ${F('jost')}`;
    spaced(ctx, `VOW ${story.numeral}`, W / 2, H / 2 + 250, 12);
    ctx.font = `44px ${F('tiro')}`;
    ctx.textAlign = 'center';
    ctx.fillText(story.sanskrit, W / 2, H / 2 + 330);
    ctx.font = `500 20px ${F('jost')}`;
    spaced(ctx, 'SEVEN VOW STORIES  ·  THE SAPTAPADI', W / 2, H - 120, 7);
  });
  return c.encode('webp', 82);
}

await mkdir(outDir, { recursive: true });
for (const s of stories) {
  const n = s.index + 1;
  await writeFile(path.join(outDir, `vow-${n}.webp`), await front(s));
  await writeFile(path.join(outDir, `back-${n}.webp`), await back(s));
  console.log('poster', n, s.posterTitle.join(' '));
}
