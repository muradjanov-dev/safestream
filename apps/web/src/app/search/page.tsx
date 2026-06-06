'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { VideoGrid } from '@/components/feed/video-grid';
import { searchVideos } from '@/lib/mock-data';
import { Search } from 'lucide-react';

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const results = q ? searchVideos(q) : [];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        {q ? <>Results for &ldquo;{q}&rdquo; <span className="text-muted-foreground font-normal">({results.length})</span></> : 'Search'}
      </h1>
      <VideoGrid videos={results} empty={q ? `No results for "${q}".` : 'Type something in the search bar above.'} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-muted-foreground">Searching…</div>}>
        <SearchResults />
      </Suspense>
    </MainLayout>
  );
}
