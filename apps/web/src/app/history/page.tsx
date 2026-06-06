'use client';

import { History } from 'lucide-react';
import { LibraryPage } from '@/components/feed/library-page';
import { useInteractionsStore } from '@/stores/interactions.store';

export default function HistoryPage() {
  const ids = useInteractionsStore((s) => s.historyIds);
  return (
    <LibraryPage
      title="Watch History"
      icon={<History className="h-6 w-6 text-primary" />}
      ids={ids}
      empty="Videos you watch will appear here."
    />
  );
}
