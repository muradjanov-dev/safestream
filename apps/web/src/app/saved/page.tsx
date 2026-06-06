'use client';

import { BookMarked } from 'lucide-react';
import { LibraryPage } from '@/components/feed/library-page';
import { useInteractionsStore } from '@/stores/interactions.store';

export default function SavedPage() {
  const ids = useInteractionsStore((s) => s.savedIds);
  return (
    <LibraryPage
      title="Saved"
      icon={<BookMarked className="h-6 w-6 text-primary" />}
      ids={ids}
      empty="Videos you save will appear here."
    />
  );
}
