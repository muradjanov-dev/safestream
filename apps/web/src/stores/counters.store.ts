'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useFirestore } from '@/lib/firestore';
import { getCounters, bumpVideoStat, bumpChannelStat } from '@/lib/data/firestore-data';

export type VideoStatField = 'viewCount' | 'likeCount' | 'dislikeCount' | 'commentCount';

interface VideoCounts { viewCount: number; likeCount: number; dislikeCount: number; commentCount: number }

interface CountersState {
  videos: Record<string, Partial<VideoCounts>>;
  channels: Record<string, { subscriberCount?: number }>;
  loaded: boolean;
  load: () => Promise<void>;
  bumpVideo: (videoId: string, field: VideoStatField, delta?: number) => void;
  bumpChannel: (channelId: string, delta: number) => void;
  videoCount: (videoId: string, field: VideoStatField) => number;
  channelSubs: (channelId: string) => number;
}

export const useCountersStore = create<CountersState>()(
  persist(
    (set, get) => ({
      videos: {},
      channels: {},
      loaded: false,

      load: async () => {
        if (!useFirestore) { set({ loaded: true }); return; }
        try {
          const c = await getCounters();
          set({ videos: c.videos ?? {}, channels: c.channels ?? {}, loaded: true });
        } catch {
          set({ loaded: true });
        }
      },

      bumpVideo: (videoId, field, delta = 1) => {
        set((s) => ({
          videos: {
            ...s.videos,
            [videoId]: { ...s.videos[videoId], [field]: Math.max(0, (s.videos[videoId]?.[field] ?? 0) + delta) },
          },
        }));
        if (useFirestore) void bumpVideoStat(videoId, field, delta);
      },

      bumpChannel: (channelId, delta) => {
        set((s) => ({
          channels: {
            ...s.channels,
            [channelId]: { subscriberCount: Math.max(0, (s.channels[channelId]?.subscriberCount ?? 0) + delta) },
          },
        }));
        if (useFirestore) void bumpChannelStat(channelId, delta);
      },

      videoCount: (videoId, field) => get().videos[videoId]?.[field] ?? 0,
      channelSubs: (channelId) => get().channels[channelId]?.subscriberCount ?? 0,
    }),
    { name: 'safestream-stats' },
  ),
);
