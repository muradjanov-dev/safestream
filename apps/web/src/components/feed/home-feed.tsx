'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { feedApi } from '@/lib/api/client';
import { VideoCard } from '@/components/video/video-card';
import { Button } from '@/components/ui/button';
import { useInteractionsStore } from '@/stores/interactions.store';
import { buildPreference, rankByPreference, hasPreference } from '@/lib/mock-data';
import { Sparkles } from 'lucide-react';

export function HomeFeed() {
  const { likedIds, historyIds, subscribedChannelIds } = useInteractionsStore();

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed', 'home'],
    queryFn: ({ pageParam }) => feedApi.home(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const videos = data?.pages.flatMap((p) => p.items) ?? [];
  const pref = buildPreference(likedIds, historyIds, subscribedChannelIds);
  const personalized = hasPreference(pref);
  const ranked = personalized ? rankByPreference(videos, pref) : videos;

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      {personalized && (
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> Recommended for you
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ranked.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => fetchNextPage()}>Load more</Button>
        </div>
      )}
    </div>
  );
}
