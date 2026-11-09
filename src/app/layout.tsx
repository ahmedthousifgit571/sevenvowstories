import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost, Six_Caps, Tiro_Devanagari_Sanskrit } from 'next/font/google';
import 'lenis/dist/lenis.css';
import './globals.css';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';
import StageMount from '@/components/stage/StageMount';
import Cursor from '@/components/Cursor';
import TouchBloom from '@/components/TouchBloom';
import SoundToggle from '@/components/SoundToggle';
import Loader from '@/components/Loader';
import Drawers from '@/components/drawer/Drawers';
import FilmModal from '@/components/film/FilmModal';
import Curtain from '@/components/Curtain';
import { site } from '@/content/site';

const six = Six_Caps({ weight: '400', subsets: ['latin'], variable: '--nf-six', display: 'swap' });
const jost = Jost({ subsets: ['latin'], variable: '--nf-jost', display: 'swap' });
const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--nf-cormorant',
  display: 'swap',
});
const tiro = Tiro_Devanagari_Sanskrit({ weight: '400', subsets: ['devanagari', 'latin'], variable: '--nf-tiro', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { title: site.name, description: site.description, images: ['/posters/vow-1.webp'], type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#f5f1ea',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${six.variable} ${jost.variable} ${cormorant.variable} ${tiro.variable}`}>
      <body>
        <SmoothScrollProvider>
          <div id="app" className="relative">
            <StageMount />
            <div className="relative z-[2]">{children}</div>
          </div>
          <Drawers />
          <FilmModal />
          <Curtain />
          <SoundToggle />
          <Cursor />
          <TouchBloom />
          <Loader />
          <div className="grain" aria-hidden />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
