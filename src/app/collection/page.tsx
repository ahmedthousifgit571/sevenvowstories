import type { Metadata } from 'next';
import CollectionView from '@/components/collection/CollectionView';
import { collectionMeta } from '@/content/collection';

export const metadata: Metadata = {
  title: 'The Collection',
  description: collectionMeta.intro,
  openGraph: { title: 'The Collection · Seven Vow Stories', description: collectionMeta.intro, images: [collectionMeta.reel.landscapePoster] },
};

export default function CollectionPage() {
  return <CollectionView />;
}
