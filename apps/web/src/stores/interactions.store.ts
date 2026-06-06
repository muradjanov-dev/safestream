'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InteractionsState {
  likedIds: string[];
  dislikedIds: string[];
  savedIds: string[];
  historyIds: string[];
  subscribedChannelIds: string[];
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

export const useInteractionsStore = create<InteractionsState>()(
  persist(
    (set, get) => ({
      likedIds: [],
      dislikedIds: [],
      savedIds: [],
      historyIds: [],
      subscribedChannelIds: [],

      toggleLike: (id) =>
        set((s) => ({
          likedIds: toggle(s.likedIds, id),
          dislikedIds: s.dislikedIds.filter((x) => x !== id),
        })),
      toggleDislike: (id) =>
        set((s) => ({
          dislikedIds: toggle(s.dislikedIds, id),
          likedIds: s.likedIds.filter((x) => x !== id),
        })),
      toggleSave: (id) => set((s) => ({ savedIds: toggle(s.savedIds, id) })),
      addHistory: (id) =>
        set((s) => ({ historyIds: [id, ...s.historyIds.filter((x) => x !== id)].slice(0, 100) })),
      toggleSubscribe: (channelId) =>
        set((s) => ({ subscribedChannelIds: toggle(s.subscribedChannelIds, channelId) })),

      isLiked: (id) => get().likedIds.includes(id),
      isDisliked: (id) => get().dislikedIds.includes(id),
      isSaved: (id) => get().savedIds.includes(id),
      isSubscribed: (channelId) => get().subscribedChannelIds.includes(channelId),
    }),
    { name: 'safestream-interactions' },
  ),
);
