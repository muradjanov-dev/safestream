'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MainLayout } from '@/components/layout/main-layout';
import { VideoGrid } from '@/components/feed/video-grid';
import { useAuthStore } from '@/stores/auth.store';
import { useInteractionsStore } from '@/stores/interactions.store';
import { getUploadedVideos, type Video } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { likedIds, savedIds, historyIds } = useInteractionsStore();
  const [uploads, setUploads] = useState<Video[]>([]);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  useEffect(() => {
    setUploads(getUploadedVideos());
  }, []);

  if (!user) return null;

  return (
    <MainLayout>
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-5 mb-8">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.displayName ?? user.username} width={96} height={96} className="rounded-full" />
          ) : (
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              {(user.displayName ?? user.username)[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{user.displayName ?? user.username}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span><b className="text-foreground">{uploads.length}</b> uploads</span>
              <span><b className="text-foreground">{likedIds.length}</b> liked</span>
              <span><b className="text-foreground">{savedIds.length}</b> saved</span>
              <span><b className="text-foreground">{historyIds.length}</b> watched</span>
            </div>
          </div>
          <div className="ml-auto">
            <Button variant="outline" onClick={() => router.push('/settings')}>Edit settings</Button>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Your uploads</h2>
        <VideoGrid videos={uploads} empty="You haven't uploaded any videos yet. Click Upload in the top bar to add one." />
      </div>
    </MainLayout>
  );
}
