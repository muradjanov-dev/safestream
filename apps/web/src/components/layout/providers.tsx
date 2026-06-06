'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useInteractionsStore } from '@/stores/interactions.store';
import { useFirestore } from '@/lib/firestore';
import { upsertUser } from '@/lib/data/firestore-data';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  useEffect(() => {
    // Restore Firebase session (if configured) and saved theme
    useAuthStore.getState().initAuth();
    if (localStorage.getItem('safestream-theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }

    const onUser = (u: { id: string } | null) => {
      if (!u || !useFirestore) return;
      void upsertUser(useAuthStore.getState().user!);
      void useInteractionsStore.getState().hydrate(u.id);
    };
    // Hydrate for an already-restored session, then on every change
    onUser(useAuthStore.getState().user);
    const unsub = useAuthStore.subscribe((state, prev) => {
      if (state.user?.id !== prev.user?.id) onUser(state.user);
    });
    return unsub;
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
