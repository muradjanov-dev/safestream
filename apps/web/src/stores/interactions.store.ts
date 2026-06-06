'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useFirestore } from '@/lib/firestore';
import { loadInteractions, setInteraction, recordHistory } from '@/lib/data/firestore-data';
import { useAuthStore } from '@/stores/auth.store';

interface InteractionsState {
  likedIds: string[];
  dislikedIds: string[];
  savedIds: string[];
  historyIds: string[];
  subscribedChannelIds: string[];
  hydrate: (uid: string) => Promise<void>;
  toggleLike: (id: string) => void;
  toggleDislike: (id: string) => void;
  toggleSave: (id: string) => void;
  addHistory: (id: string) => void;
  toggleSubscribe: (channelId: string) => void;
  isLiked: (id: string) => boolean;
  isDisliked: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  isSubscribed: (channelId: string) => boolean;
}

const toggle = (arr: string[], id: string) =>
  arr.includes(id) ? arr.filter((x) => x !== id) : [id, ...arr];

const uid = () => useAuthStore.getState().user?.id ?? null;

export const useInteractionsStore = create<InteractionsState>()(
  persist(
    (set, get) => ({
      likedIds: [],
      dislikedIds: [],
      savedIds: [],
      historyIds: [],
      subscribedChannelIds: [],

      hydrate: async (id) => {
        if (!useFirestore) return;
        const snap = await loadInteractions(id);
        set({
          likedIds: snap.likedIds,
          savedIds: snap.savedIds,
          subscribedChannelIds: snap.subscribedChannelIds,
          historyIds: snap.historyIds,
        });
      },

      toggleLike: (id) => {
        const on = !get().likedIds.includes(id);
        set((s) => ({ likedIds: toggle(s.likedIds, id), dislikedIds: s.dislikedIds.filter((x) => x !== id) }));
        const u = uid();
        if (useFirestore && u) void setInteraction(u, 'likes', id, on);
      },
      toggleDislike: (id) =>
        set((s) => ({ dislikedIds: toggle(s.dislikedIds, id), likedIds: s.likedIds.filter((x) => x !== id) })),
      toggleSave: (id) => {
        const on = !get().savedIds.includes(id);
        set((s) => ({ savedIds: toggle(s.savedIds, id) }));
        const u = uid();
        if (useFirestore && u) void setInteraction(u, 'saves', id, on);
      },
      addHistory: (id) => {
        set((s) => ({ historyIds: [id, ...s.historyIds.filter((x) => x !== id)].slice(0, 100) }));
        const u = uid();
        if (useFirestore && u) void recordHistory(u, id);
      },
      toggleSubscribe: (channelId) => {
        const on = !get().subscribedChannelIds.includes(channelId);
        set((s) => ({ subscribedChannelIds: toggle(s.subscribedChannelIds, channelId) }));
        const u = uid();
        if (useFirestore && u) void setInteraction(u, 'subscriptions', channelId, on);
      },

      isLiked: (id) => get().likedIds.includes(id),
      isDisliked: (id) => get().dislikedIds.includes(id),
      isSaved: (id) => get().savedIds.includes(id),
      isSubscribed: (channelId) => get().subscribedChannelIds.includes(channelId),
    }),
    { name: 'safestream-interactions' },
  ),
);
