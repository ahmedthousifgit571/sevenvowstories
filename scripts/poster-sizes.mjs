// Writes half-size copies of the posters to public/posters/sm for phones and tablets.
// The WebGL ring uploads all fourteen posters (front + back) as textures; at 1200x1600 that is ~140 MB of GPU memory,
// which is enough for iOS Safari to kill the tab ("This page couldn't load"). 600x800 is still sharper than a phone shows.
// Run: npm run posters (after the full-size render), or `node scripts/poster-sizes.mjs` on its own.
import { mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'public', 'posters');
const outDir = path.join(srcDir, 'sm');

await mkdir(outDir, { recursive: true });
for (const file of (await readdir(srcDir)).filter((f) => f.endsWith('.webp'))) {
  await sharp(path.join(srcDir, file)).resize(600, 800, { fit: 'fill' }).webp({ quality: 86 }).toFile(path.join(outDir, file));
  console.log('poster sm', file);
}
