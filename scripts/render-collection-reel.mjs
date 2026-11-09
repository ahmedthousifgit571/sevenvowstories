// Builds the silent, looping showreel behind the collection hero from the most ceremony-led photographs:
// slow Ken Burns moves joined by cross-dissolves. No title cards: the page sets its own type over the film.
// Output: public/films/collection-reel.mp4 (1600x900), collection-reel-portrait.mp4 (720x1280 for phones)
// and a .webp still of each, used as the poster while the film loads.
// Run: npm run reel   (needs ffmpeg on PATH)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'films');

// PLACEHOLDER selection: swap in the studio's own frames (any size; they are cropped to fill).
const PHOTOS = [
  'images/vow-2/poster.jpg',
  'images/archive/01.jpg',
  'images/vow-3/poster.jpg',
  'images/archive/09.jpg',
  'images/vow-5/poster.jpg',
  'images/vow-4/poster.jpg',
  'images/vow-7/poster.jpg',
  'images/archive/06.jpg',
  'images/vow-1/poster.jpg',
];

const FPS = 30, CLIP = 4.6, XF = 1.1;

function run(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: root });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err || `ffmpeg exited ${code}`))));
  });
}

async function reel(name, W, H, crf) {
  const frames = Math.round(CLIP * FPS);
  const inputs = [];
  const chains = [];
  PHOTOS.forEach((ph, i) => {
    inputs.push('-i', path.join('public', ph));
    const zin = i % 2 === 0;
    const z = zin ? `1+0.09*on/${frames}` : `1.09-0.09*on/${frames}`;
    const dx = [0.5, 0.38, 0.62, 0.45, 0.55, 0.4, 0.6, 0.5, 0.44][i % 9];
    chains.push(
      `[${i}:v]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},` +
        `zoompan=z='${z}':x='(iw-iw/zoom)*${dx}':y='(ih-ih/zoom)*${i % 2 ? 0.42 : 0.55}':d=${frames}:s=${W}x${H}:fps=${FPS},setsar=1,format=yuv420p[c${i}]`,
    );
  });
  let acc = CLIP;
  let last = 'c0';
  for (let k = 1; k < PHOTOS.length; k++) {
    const label = k === PHOTOS.length - 1 ? 'xf' : `x${k}`;
    chains.push(`[${last}][c${k}]xfade=transition=fade:duration=${XF}:offset=${(acc - XF).toFixed(3)}[${label}]`);
    acc += CLIP - XF;
    last = label;
  }
  // Fade in from and out to black so the loop seam reads as a cut, not a jump.
  chains.push(`[xf]vignette=angle=PI/5,fade=t=in:st=0:d=0.6,fade=t=out:st=${(acc - 0.6).toFixed(2)}:d=0.6,format=yuv420p[v]`);

  const file = path.join('public', 'films', `${name}.mp4`);
  await run([
    ...inputs,
    '-filter_complex', chains.join(';'),
    '-map', '[v]', '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-movflags', '+faststart',
    '-t', acc.toFixed(2),
    file,
  ]);
  await run(['-ss', '1.2', '-i', file, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '80', path.join('public', 'films', `${name}.webp`)]);
  console.log('reel', name, `${W}x${H}`, `${acc.toFixed(1)}s`);
}

// 1600x900 keeps the autoplaying hero light; it always sits under a dark scrim.
await reel('collection-reel', 1600, 900, 28);
await reel('collection-reel-portrait', 720, 1280, 28);
console.log('done:', path.relative(root, out));
