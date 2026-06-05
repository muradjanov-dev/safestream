'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { feedApi } from '@/lib/api/client';
import { VideoCard } from '@/components/video/video-card';
import { Button } from '@/components/ui/button';

export function HomeFeed() {
  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed', 'home'],
    queryFn: ({ pageParam }) => feedApi.home(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const videos = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
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
