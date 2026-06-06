'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDuration, formatViewCount, timeAgo } from '@/lib/utils';
import { useCountersStore } from '@/stores/counters.store';
import type { Video } from '@/lib/api/client';

interface Props { video: Video }

export function VideoCard({ video }: Props) {
  const views = useCountersStore((s) => s.videos[video.id]?.viewCount ?? video.viewCount ?? 0);
  return (
    <Link href={`/watch/${video.id}`} className="group block space-y-2">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200" />
        )}
        {video.durationSeconds && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {formatDuration(video.durationSeconds)}
          </span>
        )}
        {video.videoType === 'premium' && (
          <span className="absolute top-1 left-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded font-semibold">PREMIUM</span>
        )}
      </div>
      <div>
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <span>{formatViewCount(views)} views</span>
          {video.publishedAt && <><span>·</span><span>{timeAgo(video.publishedAt)}</span></>}
        </div>
      </div>
    </Link>
  );
}
