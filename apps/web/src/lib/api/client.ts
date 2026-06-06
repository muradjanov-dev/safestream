// Frontend runs without a backend: these APIs serve synthetic data from
// mock-data.ts plus any videos the user "uploads" (persisted to localStorage).

import {
  getVideos,
  getTrending,
  getShorts,
  getByCategory,
  getVideoById,
  getRelated,
  getComments,
  getChannelByHandle,
  mockChannels,
} from '@/lib/mock-data';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  nextCursor?: string;
  hasMore: boolean;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  hlsManifestUrl?: string;
  durationSeconds?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  channelId: string;
  channel?: { id: string; name: string; handle: string; avatarUrl?: string };
  videoType: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  tags: string[];
  trendingScore: number;
}

export interface Channel {
  id: string;
  handle: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  subscriberCount: number;
  totalVideos: number;
  isVerified: boolean;
  categories: string[];
}

export interface VideoComment {
  id: string;
  content: string;
  userId: string;
  videoId: string;
  parentId?: string;
  likeCount: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: string;
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: Array<{ id: string; username: string; displayName: string | null; avatarUrl: string | null; isOnline?: boolean }>;
  lastMessage?: { content: string; createdAt: string };
  unreadCount?: number;
  currentUserId?: string;
  lastMessageAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  content?: string;
  attachmentUrl?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface ChannelAnalytics {
  viewsLast30Days: number;
  watchTimeSeconds: number;
  newSubscribers: number;
  topVideos: Array<{ id: string; title: string; viewCount: number }>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));
const page = <T>(items: T[]): Paginated<T> => ({ items, total: items.length, hasMore: false });

const UPLOADS_KEY = 'safestream-uploads';

export function getUploadedVideos(): Video[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(UPLOADS_KEY) ?? '[]') as Video[];
  } catch {
    return [];
  }
}

export function saveUploadedVideo(v: Video) {
  if (typeof window === 'undefined') return;
  const all = getUploadedVideos();
  localStorage.setItem(UPLOADS_KEY, JSON.stringify([v, ...all]));
}

export function updateUploadedVideo(id: string, patch: Partial<Video>) {
  if (typeof window === 'undefined') return;
  const all = getUploadedVideos().map((v) => (v.id === id ? { ...v, ...patch } : v));
  localStorage.setItem(UPLOADS_KEY, JSON.stringify(all));
}

export function deleteUploadedVideo(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(UPLOADS_KEY, JSON.stringify(getUploadedVideos().filter((v) => v.id !== id)));
}

function withUploads(list: Video[]): Video[] {
  const uploads = getUploadedVideos();
  if (!uploads.length) return list;
  return [...uploads, ...list];
}

// ── Domain APIs (mock-backed) ─────────────────────────────────────────────────

export const videosApi = {
  list:     async () => page(withUploads(getVideos())),
  getOne:   async (id: string) => {
    const v = getUploadedVideos().find((x) => x.id === id) ?? getVideoById(id);
    return { success: true, data: v as Video };
  },
  mine:     async () => page(getUploadedVideos()),
  related:  async (id: string) => { await delay(); return page(getRelated(id)); },
  trending: async () => page(getTrending()),
  recordView: async (_id: string, _data?: { watchedSeconds?: number }) => ({ success: true }),
  like:     async (_id?: string) => ({ success: true }),
  dislike:  async (_id?: string) => ({ success: true }),
  save:     async (_id?: string) => ({ success: true }),
  report:   async (_id?: string, _reason?: string) => ({ success: true }),
  initUpload: async (_body: {
    fileName: string; fileSize: number; mimeType: string;
    title: string; description?: string; tags?: string[];
    visibility: string; videoType: string;
  }) => {
    await delay();
    return { uploadId: 'mock-' + Date.now(), videoId: 'up-' + Date.now(), presignedUrls: ['mock://part1'] };
  },
  completeUpload: async () => ({ success: true }),
};

export const feedApi = {
  home:          async (_cursor?: string) => { await delay(); return page(withUploads(getVideos())); },
  trending:      async () => page(getTrending()),
  shorts:        async () => page(getShorts()),
  subscriptions: async () => page(getVideos().slice(0, 8)),
  explore:       async (category: string) => page(getByCategory(category)),
};

export const channelsApi = {
  getOne:       async (handle: string) => ({ success: true, data: getChannelByHandle(handle) as Channel }),
  getMine:      async () => ({ success: true, data: mockChannels[0] }),
  getAnalytics: async (_channelId?: string): Promise<ChannelAnalytics> => ({
    viewsLast30Days: 45230,
    watchTimeSeconds: 1820000,
    newSubscribers: 1240,
    topVideos: getTrending().slice(0, 3).map((v) => ({ id: v.id, title: v.title, viewCount: v.viewCount })),
  }),
  subscribe:    async () => ({ success: true }),
  unsubscribe:  async () => ({ success: true }),
};

const COMMENTS_KEY = 'safestream-comments';

function getPersistedUser(): { id: string; username: string; displayName?: string; avatarUrl?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = JSON.parse(localStorage.getItem('safestream-auth') ?? '{}');
    return raw?.state?.user ?? null;
  } catch {
    return null;
  }
}

function getUserComments(videoId: string): VideoComment[] {
  if (typeof window === 'undefined') return [];
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) ?? '{}') as Record<string, VideoComment[]>;
    return all[videoId] ?? [];
  } catch {
    return [];
  }
}

export const commentsApi = {
  list:   async (videoId: string) => { await delay(); return page([...getUserComments(videoId), ...getComments(videoId)]); },
  create: async (videoId: string, content: string, parentId?: string) => {
    if (typeof window === 'undefined') return { success: true };
    const user = getPersistedUser();
    const comment: VideoComment = {
      id: `${videoId}-u${Date.now()}`,
      content,
      userId: user?.id ?? 'you',
      videoId,
      parentId,
      likeCount: 0,
      replyCount: 0,
      isPinned: false,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id ?? 'you',
        username: user?.username ?? 'you',
        displayName: user?.displayName ?? 'You',
        avatarUrl: user?.avatarUrl ?? null,
      },
    };
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) ?? '{}') as Record<string, VideoComment[]>;
    all[videoId] = [comment, ...(all[videoId] ?? [])];
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
    return { success: true };
  },
  delete: async (_id?: string) => ({ success: true }),
};

// ── Messenger (local, no backend) ─────────────────────────────────────────────

const MESSAGES_KEY = 'safestream-messages';

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-alice', type: 'direct', currentUserId: 'me',
    participants: [
      { id: 'me', username: 'you', displayName: 'You', avatarUrl: null },
      { id: 'ch-alice', username: 'alice_edu', displayName: 'AliceLearn', avatarUrl: mockChannels[0].avatarUrl ?? null, isOnline: true },
    ],
    lastMessage: { content: 'Thanks for subscribing! 🎉', createdAt: new Date(Date.now() - 3600000).toISOString() },
  },
  {
    id: 'conv-bob', type: 'direct', currentUserId: 'me',
    participants: [
      { id: 'me', username: 'you', displayName: 'You', avatarUrl: null },
      { id: 'ch-bob', username: 'bob_science', displayName: "Bob's Science Lab", avatarUrl: mockChannels[1].avatarUrl ?? null, isOnline: false },
    ],
    lastMessage: { content: 'Glad you liked the vaccine video!', createdAt: new Date(Date.now() - 86400000).toISOString() },
  },
  {
    id: 'conv-nature', type: 'direct', currentUserId: 'me',
    participants: [
      { id: 'me', username: 'you', displayName: 'You', avatarUrl: null },
      { id: 'ch-nature', username: 'naturexplore', displayName: 'Nature & Wildlife Explorer', avatarUrl: mockChannels[4].avatarUrl ?? null, isOnline: true },
    ],
    lastMessage: { content: 'New rainforest series coming soon 🌿', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  },
];

const CONV_PEER: Record<string, { id: string; greeting: string }> = {
  'conv-alice':  { id: 'ch-alice',  greeting: 'Hi there! Thanks for subscribing to AliceLearn 🎉 Any topics you’d like us to cover?' },
  'conv-bob':    { id: 'ch-bob',    greeting: 'Hey! Glad you’re enjoying the science videos. Got any questions?' },
  'conv-nature': { id: 'ch-nature', greeting: 'Welcome! 🌿 We post new wildlife docs every week.' },
};

function readMessageStore(): Record<string, Message[]> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(MESSAGES_KEY) ?? '{}'); } catch { return {}; }
}
function writeMessageStore(all: Record<string, Message[]>) {
  if (typeof window !== 'undefined') localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
}

export function getStoredMessages(conversationId: string): Message[] {
  const all = readMessageStore();
  if (!all[conversationId]) {
    const peer = CONV_PEER[conversationId];
    all[conversationId] = peer
      ? [{
          id: `${conversationId}-seed`, conversationId, senderId: peer.id, type: 'text',
          content: peer.greeting, isEdited: false, isDeleted: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        }]
      : [];
    writeMessageStore(all);
  }
  return all[conversationId];
}

export function appendMessage(conversationId: string, message: Message) {
  const all = readMessageStore();
  all[conversationId] = [...(all[conversationId] ?? []), message];
  writeMessageStore(all);
}

export const conversationsApi = {
  list:     async () => page<Conversation>(MOCK_CONVERSATIONS),
  create:   async (_data?: unknown) => ({ success: true, data: MOCK_CONVERSATIONS[0] }),
  messages: async (conversationId: string) => { await delay(); return page<Message>(getStoredMessages(conversationId)); },
};
