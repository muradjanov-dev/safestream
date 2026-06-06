'use client';

import { VideoCard } from '@/components/video/video-card';
import type { Video } from '@/lib/api/client';

export function VideoGrid({ videos, empty }: { videos: Video[]; empty?: string }) {
  if (!videos.length) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <div className="text-5xl mb-3">📭</div>
        <p>{empty ?? 'Nothing here yet.'}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
