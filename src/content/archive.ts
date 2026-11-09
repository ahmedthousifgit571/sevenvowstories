// The couple archive on the home page: every wedding in the collection, chapters first.
import { stories } from './stories';
import { shortCity, weddings } from './collection';

export type ArchiveEntry = {
  couple: string;
  city: string;
  year: string;
  vow: string;
  image: string;
  /** chapter story slug, when the wedding is one of the seven */
  slug?: string;
  /** the wedding's page in the collection */
  collectionSlug: string;
};

export const archive: ArchiveEntry[] = weddings.map((w) => ({
  couple: w.couple,
  city: shortCity(w),
  year: w.year,
  vow: w.archiveLabel,
  image: w.frames[0].src,
  slug: w.storyIndex != null ? stories[w.storyIndex].slug : undefined,
  collectionSlug: w.slug,
}));
