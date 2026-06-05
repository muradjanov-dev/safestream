'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { videosApi } from '@/lib/api/client';
import { formatViewCount, formatDuration, timeAgo } from '@/lib/utils';

export function RelatedVideos({ videoId }: { videoId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['related', videoId],
    queryFn: () => videosApi.related(videoId),
    staleTime: 5 * 60 * 1000,
  });

  const videos = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-2 animate-pulse">
            <div className="w-40 h-[90px] bg-muted rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Up Next</h3>
      {videos.map((v: any) => (
        <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-2 group">
          <div className="relative w-40 h-[90px] bg-muted rounded-md overflow-hidden flex-shrink-0">
            {v.thumbnailUrl ? (
              <img
                src={v.thumbnailUrl}
                alt={v.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
            )}
            {v.durationSeconds > 0 && (
              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                {formatDuration(v.durationSeconds)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {v.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {v.channel?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatViewCount(v.viewCount)} views · {timeAgo(v.publishedAt ?? v.createdAt)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
