import RingHero from '@/components/hero/RingHero';
import Lookbook from '@/components/lookbook/Lookbook';
import FilmReel from '@/components/film/FilmReel';
import CoupleArchive from '@/components/archive/CoupleArchive';
import Concierge from '@/components/concierge/Concierge';
import Footer from '@/components/Footer';
import MiniNav from '@/components/MiniNav';

export default function Home() {
  // One React-owned root: GSAP pins move sections into spacer wrappers, and React's Activity must
  // never use a moved node as its insertion reference when it swaps routes.
  return (
    <main id="home">
      <RingHero />
      <Lookbook />
      <FilmReel />
      <CoupleArchive />
      <Concierge />
      <Footer />
      <MiniNav />
    </main>
  );
}
