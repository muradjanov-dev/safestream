import { useAuthStore } from '@/stores/auth.store';

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

// ── HTTP client ───────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await useAuthStore.getState().refreshTokens();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${useAuthStore.getState().accessToken}`;
      const retry = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      if (retry.ok) return retry.json() as Promise<T>;
    }
    useAuthStore.getState().logout();
    throw new ApiError('UNAUTHORIZED', 'Session expired', 401);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    throw new ApiError(
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? 'Request failed',
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(url: string) => request<T>(url, { method: 'GET' }),
  post:   <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  patch:  <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};

// ── Domain APIs ───────────────────────────────────────────────────────────────

export const videosApi = {
  list:        (params?: Record<string, string>) =>
    api.get<Paginated<Video>>(`/videos?${new URLSearchParams(params)}`),
  getOne:      (id: string) => api.get<{ success: boolean; data: Video }>(`/videos/${id}`),
  mine:        () => api.get<Paginated<Video>>('/videos/mine'),
  related:     (id: string) => api.get<Paginated<Video>>(`/videos/${id}/related`),
  trending:    () => api.get<Paginated<Video>>('/videos/trending'),
  recordView:  (id: string, data: { watchedSeconds?: number }) => api.post(`/videos/${id}/view`, data),
  like:        (id: string) => api.post(`/videos/${id}/like`),
  dislike:     (id: string) => api.post(`/videos/${id}/dislike`),
  save:        (id: string) => api.post(`/videos/${id}/save`),
  report:      (id: string, reason: string) => api.post(`/videos/${id}/report`, { reason }),
  initUpload: (body: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    title: string;
    description?: string;
    tags?: string[];
    visibility: string;
    videoType: string;
  }) =>
    api.post<{ uploadId: string; videoId: string; presignedUrls: string[] }>(
      '/videos/upload/init',
      body,
    ),
  completeUpload: (body: {
    videoId: string;
    uploadId: string;
    parts: Array<{ partNumber: number; etag: string }>;
  }) => api.post('/videos/upload/complete', body),
};

export const feedApi = {
  home:          (cursor?: string) =>
    api.get<Paginated<Video>>(`/feed/home${cursor ? `?cursor=${cursor}` : ''}`),
  trending:      (category?: string) =>
    api.get<Paginated<Video>>(`/feed/trending${category ? `?category=${category}` : ''}`),
  shorts:        () => api.get<Paginated<Video>>('/feed/shorts'),
  subscriptions: () => api.get<Paginated<Video>>('/feed/subscriptions'),
  explore:       (category: string) =>
    api.get<Paginated<Video>>(`/feed/explore?category=${category}`),
};

export const channelsApi = {
  getOne:       (handle: string) =>
    api.get<{ success: boolean; data: Channel }>(`/channels/${handle}`),
  getMine:      () => api.get<{ success: boolean; data: Channel }>('/channels/mine'),
  getAnalytics: (id: string) => api.get<ChannelAnalytics>(`/channels/${id}/analytics`),
  subscribe:    (id: string) => api.post(`/channels/${id}/subscribe`),
  unsubscribe:  (id: string) => api.delete(`/channels/${id}/subscribe`),
};

export const commentsApi = {
  list:   (videoId: string, parentId?: string) =>
    api.get<Paginated<VideoComment>>(
      `/videos/${videoId}/comments${parentId ? `?parentId=${parentId}` : ''}`,
    ),
  create: (videoId: string, content: string, parentId?: string) =>
    api.post(`/videos/${videoId}/comments`, { content, parentId }),
  delete: (videoId: string, id: string) =>
    api.delete(`/videos/${videoId}/comments/${id}`),
};

export const conversationsApi = {
  list: () => api.get<Paginated<Conversation>>('/conversations'),
  create: (participantIds: string[], type: 'direct' | 'group', name?: string) =>
    api.post<{ success: boolean; data: Conversation }>('/conversations', {
      participantIds,
      type,
      name,
    }),
  messages: (id: string, page = 1) =>
    api.get<Paginated<Message>>(`/conversations/${id}/messages?page=${page}`),
};
