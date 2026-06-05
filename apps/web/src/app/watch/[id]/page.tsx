import { Suspense } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { VideoPlayer } from '@/components/video/video-player';
import { VideoInfo } from '@/components/video/video-info';
import { CommentSection } from '@/components/video/comment-section';
import { RelatedVideos } from '@/components/video/related-videos';
import { VideoPlayerSkeleton } from '@/components/video/video-player-skeleton';

interface Props { params: { id: string } }

export default function WatchPage({ params }: Props) {
  return (
    <MainLayout>
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Suspense fallback={<VideoPlayerSkeleton />}>
              <VideoPlayer videoId={params.id} />
              <VideoInfo videoId={params.id} />
              <CommentSection videoId={params.id} />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={null}>
              <RelatedVideos videoId={params.id} />
            </Suspense>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
