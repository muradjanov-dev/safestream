'use client';

import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { VideoGrid } from '@/components/feed/video-grid';
import { feedApi } from '@/lib/api/client';
import { TrendingUp } from 'lucide-react';

export default function TrendingPage() {
  const { data, isLoading } = useQuery({ queryKey: ['feed', 'trending'], queryFn: () => feedApi.trending() });
  return (
    <MainLayout>
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Trending
        </h1>
        {isLoading ? <GridSkeleton /> : <VideoGrid videos={data?.items ?? []} />}
      </div>
    </MainLayout>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-video bg-muted rounded-lg animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
