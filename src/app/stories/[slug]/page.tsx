import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ChapterView from '@/components/chapter/ChapterView';
import { posterSrc, stories, storyBySlug } from '@/content/stories';

export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = storyBySlug(slug);
  if (!s) return {};
  const title = `${s.posterTitle.join(' ')} · Vow ${s.numeral}`;
  return {
    title,
    description: s.excerpt,
    openGraph: { title, description: s.excerpt, images: [posterSrc(s)] },
  };
}

// Params resolve inside Suspense so navigations stay instant: the App Shell (an empty, transparent
// block) renders at once while the flying poster from the ring covers the moment the slug resolves.
export default function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Chapter params={params} />
    </Suspense>
  );
}

async function Chapter({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = storyBySlug(slug);
  if (!story) notFound();
  return <ChapterView index={story.index} />;
}
