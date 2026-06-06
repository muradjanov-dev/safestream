'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { VideoGrid } from '@/components/feed/video-grid';
import { getVideoById } from '@/lib/mock-data';
import { getUploadedVideos, type Video } from '@/lib/api/client';

function resolve(ids: string[]): Video[] {
  const uploads = getUploadedVideos();
  return ids
    .map((id) => uploads.find((u) => u.id === id) ?? getVideoById(id))
    .filter((v): v is Video => Boolean(v));
}

export function LibraryPage({
  title,
  icon,
  ids,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  ids: string[];
  empty: string;
}) {
  const videos = resolve(ids);
  return (
    <MainLayout>
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          {icon} {title}
        </h1>
        <VideoGrid videos={videos} empty={empty} />
      </div>
    </MainLayout>
  );
}
