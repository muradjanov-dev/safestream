'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { VideoGrid } from '@/components/feed/video-grid';
import { feedApi } from '@/lib/api/client';

const LABELS: Record<string, string> = {
  education: '📚 Education',
  music: '🎵 Music',
  gaming: '🎮 Gaming',
  science: '🔬 Science',
  arts: '🎨 Arts',
  technology: '💻 Technology',
  documentary: '🎬 Documentary',
};

export default function ExplorePage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['feed', 'explore', category],
    queryFn: () => feedApi.explore(category),
  });

  return (
    <MainLayout>
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 capitalize">{LABELS[category] ?? category}</h1>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <VideoGrid videos={data?.items ?? []} empty={`No ${category} videos yet.`} />
        )}
      </div>
    </MainLayout>
  );
}
