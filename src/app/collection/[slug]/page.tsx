import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import LookView from '@/components/collection/LookView';
import { shortCity, weddingBySlug, weddings } from '@/content/collection';

export function generateStaticParams() {
  return weddings.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = weddingBySlug(slug);
  if (!w) return {};
  const title = `${w.couple}, ${shortCity(w)} · The Collection`;
  return {
    title,
    description: `${w.tagline}. ${w.description}`,
    openGraph: { title, description: w.tagline, images: [w.frames[0].src] },
  };
}

// Params resolve inside Suspense so the navigation itself never waits (same pattern as the chapter pages).
export default function WeddingPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Wedding params={params} />
    </Suspense>
  );
}

async function Wedding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!weddingBySlug(slug)) notFound();
  return <LookView slug={slug} />;
}
