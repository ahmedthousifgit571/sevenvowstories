// Builds placeholder chapter films from each vow's photographs with ffmpeg:
// slow Ken Burns moves, cross-dissolves, title and end cards, grain, and a soft generated drone.
// Output per vow: public/films/vow-N.mp4 (1080p), vow-N-preview.mp4 (540p, 8s, silent loop), vow-N.webp (still).
// Run: npm run films   (needs ffmpeg on PATH; Node >= 22.18)
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { stories } from '../src/content/stories.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'films');
const tmp = path.join(root, 'scripts', '.film-tmp');
const only = process.argv[2] ? Number(process.argv[2]) : null;

const FPS = 30, CLIP = 5.5, CARD = 3, XF = 1;
const W = 1920, H = 1080;

function run(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: root });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err || `ffmpeg exited ${code}`))));
  });
}

const rel = (p) => path.relative(root, p).split(path.sep).join('/');

async function film(story) {
  const n = story.index + 1;
  const p = story.palette;
  const frames = Math.round(CLIP * FPS);
  const photos = [story.images.poster, story.images.a, story.images.b, story.images.c, story.images.d].map((s) => path.join(root, 'public', s));

  await writeFile(path.join(tmp, `t${n}-title.txt`), story.posterTitle.join(' ').toUpperCase());
  await writeFile(path.join(tmp, `t${n}-vow.txt`), `VOW ${story.numeral}  ·  ${story.theme.toUpperCase()}`);
  await writeFile(path.join(tmp, `t${n}-sub.txt`), `${story.couple.toUpperCase()}  ·  ${story.city.toUpperCase()}`);
  await writeFile(path.join(tmp, `t${n}-end.txt`), 'SEVEN VOW STORIES');

  const six = 'scripts/poster-fonts/SixCaps.ttf';
  const jost = 'scripts/poster-fonts/Jost[wght].ttf'.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
  const tf = (k) => rel(path.join(tmp, `t${n}-${k}.txt`));
  const bg = p.pageBg.replace('#', '0x');
  const fg = p.pageInk.replace('#', '0x');

  const inputs = [];
  const chains = [];
  // Title card
  inputs.push('-f', 'lavfi', '-i', `color=c=${bg}:s=${W}x${H}:d=${CARD}:r=${FPS}`);
  chains.push(
    `[0:v]drawtext=fontfile=${jost}:textfile=${tf('vow')}:fontsize=30:fontcolor=${fg}@0.8:x=(w-tw)/2:y=h/2-250,` +
      `drawtext=fontfile=${six}:textfile=${tf('title')}:fontsize=300:fontcolor=${fg}:x=(w-tw)/2:y=(h-th)/2-20,` +
      `drawtext=fontfile=${jost}:textfile=${tf('sub')}:fontsize=28:fontcolor=${fg}@0.8:x=(w-tw)/2:y=h/2+200,setsar=1,format=yuv420p[c0]`,
  );
  // Photo clips with alternating zoom direction and pan
  photos.forEach((ph, i) => {
    inputs.push('-i', rel(ph));
    const zin = i % 2 === 0;
    const z = zin ? `1+0.11*on/${frames}` : `1.11-0.11*on/${frames}`;
    const dx = [0.5, 0.35, 0.65, 0.42, 0.58][i];
    const x = `(iw-iw/zoom)*${dx}`;
    const y = `(ih-ih/zoom)*${i % 2 ? 0.4 : 0.55}`;
    chains.push(
      `[${i + 1}:v]scale=${W * 3}:${H * 3}:force_original_aspect_ratio=increase,crop=${W * 3}:${H * 3},` +
        `zoompan=z='${z}':x='${x}':y='${y}':d=${frames}:s=${W}x${H}:fps=${FPS},setsar=1,format=yuv420p[c${i + 1}]`,
    );
  });
  // End card
  const endIdx = photos.length + 1;
  inputs.push('-f', 'lavfi', '-i', `color=c=${bg}:s=${W}x${H}:d=${CARD}:r=${FPS}`);
  chains.push(
    `[${endIdx}:v]drawtext=fontfile=${six}:textfile=${tf('end')}:fontsize=170:fontcolor=${fg}:x=(w-tw)/2:y=(h-th)/2,setsar=1,format=yuv420p[c${endIdx}]`,
  );

  // Cross-dissolve chain
  const lens = [CARD, ...photos.map(() => CLIP), CARD];
  let acc = lens[0];
  let last = 'c0';
  for (let k = 1; k < lens.length; k++) {
    const offset = (acc - XF).toFixed(3);
    const label = k === lens.length - 1 ? 'xf' : `x${k}`;
    chains.push(`[${last}][c${k}]xfade=transition=fade:duration=${XF}:offset=${offset}[${label}]`);
    acc = acc + lens[k] - XF;
    last = label;
  }
  const total = acc;
  chains.push(
    `[xf]noise=alls=3:allf=t,vignette=angle=PI/5,fade=t=in:st=0:d=0.8,fade=t=out:st=${(total - 0.9).toFixed(2)}:d=0.9,format=yuv420p[v]`,
  );

  // Soft tanpura-like drone (Sa, Pa, Sa') generated in ffmpeg
  const sa = 130.81;
  inputs.push(
    '-f', 'lavfi', '-i',
    `aevalsrc='0.09*sin(2*PI*${sa}*t)*(0.65+0.35*sin(2*PI*0.21*t))+0.055*sin(2*PI*${(sa * 1.5).toFixed(2)}*t)*(0.6+0.4*sin(2*PI*0.13*t+1))+0.045*sin(2*PI*${sa * 2}*t)*(0.5+0.5*sin(2*PI*0.17*t+2))+0.02*sin(2*PI*${sa * 3}*t)':s=48000:d=${total.toFixed(2)}`,
  );
  const aIdx = endIdx + 1;
  chains.push(`[${aIdx}:a]aecho=0.8:0.6:80|160:0.3|0.18,lowpass=f=1600,afade=t=in:d=2.5,afade=t=out:st=${(total - 3).toFixed(2)}:d=3[a]`);

  const file = path.join(out, `vow-${n}.mp4`);
  await run([
    ...inputs,
    '-filter_complex', chains.join(';'),
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    '-t', total.toFixed(2),
    rel(file),
  ]);
  await run(['-ss', String(CARD + 0.5), '-t', '8', '-i', rel(file), '-an', '-vf', 'scale=960:-2', '-c:v', 'libx264', '-preset', 'medium', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', rel(path.join(out, `vow-${n}-preview.mp4`))]);
  await run(['-ss', String(CARD + 1.5), '-i', rel(file), '-frames:v', '1', '-vf', 'scale=1280:-2', '-c:v', 'libwebp', '-quality', '82', rel(path.join(out, `vow-${n}.webp`))]);
  console.log('film', n, story.posterTitle.join(' '), `${total.toFixed(1)}s`);
  return total;
}

await mkdir(out, { recursive: true });
await mkdir(tmp, { recursive: true });
const durations = {};
for (const s of stories) {
  if (only && s.index + 1 !== only) continue;
  durations[s.index + 1] = await film(s);
}
await rm(tmp, { recursive: true, force: true });
console.log(JSON.stringify(durations));
