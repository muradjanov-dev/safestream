'use client';

import { ThumbsUp } from 'lucide-react';
import { LibraryPage } from '@/components/feed/library-page';
import { useInteractionsStore } from '@/stores/interactions.store';

export default function LikedPage() {
  const ids = useInteractionsStore((s) => s.likedIds);
  return (
    <LibraryPage
      title="Liked Videos"
      icon={<ThumbsUp className="h-6 w-6 text-primary" />}
      ids={ids}
      empty="Videos you like will appear here."
    />
  );
}
