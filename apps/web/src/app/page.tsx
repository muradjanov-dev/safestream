import { Suspense } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { HomeFeed } from '@/components/feed/home-feed';
import { FeedSkeleton } from '@/components/feed/feed-skeleton';

export default function HomePage() {
  return (
    <MainLayout>
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <Suspense fallback={<FeedSkeleton />}>
          <HomeFeed />
        </Suspense>
      </div>
    </MainLayout>
  );
}
