// All persistent actions (users, likes, saves, history, subscriptions, comments,
// uploaded videos, messages) live in Firestore. Used only when Firebase is configured.

import {
  collection, doc, setDoc, deleteDoc, getDoc, getDocs, addDoc,
  query, orderBy, where, onSnapshot, serverTimestamp, limit,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageInstance } from '@/lib/firestore';
import type { Video, VideoComment, Conversation, Message } from '@/lib/api/client';
import type { User } from '@/stores/auth.store';

// ── Users ──────────────────────────────────────────────────────────────────
export async function upsertUser(user: User) {
  const db = getDb();
  if (!db) return;
  await setDoc(
    doc(db, 'users', user.id),
    {
      uid: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName ?? null,
      avatarUrl: user.avatarUrl ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// ── Interactions (likes / saves / subscriptions / history) ──────────────────
export interface InteractionSnapshot {
  likedIds: string[];
  savedIds: string[];
  subscribedChannelIds: string[];
  historyIds: string[];
}

export async function loadInteractions(uid: string): Promise<InteractionSnapshot> {
  const db = getDb();
  if (!db) return { likedIds: [], savedIds: [], subscribedChannelIds: [], historyIds: [] };
  const [likes, saves, subs, hist] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'likes')),
    getDocs(collection(db, 'users', uid, 'saves')),
    getDocs(collection(db, 'users', uid, 'subscriptions')),
    getDocs(query(collection(db, 'users', uid, 'history'), orderBy('watchedAt', 'desc'), limit(100))),
  ]);
  return {
    likedIds: likes.docs.map((d) => d.id),
    savedIds: saves.docs.map((d) => d.id),
    subscribedChannelIds: subs.docs.map((d) => d.id),
    historyIds: hist.docs.map((d) => d.id),
  };
}

export async function setInteraction(uid: string, kind: 'likes' | 'saves' | 'subscriptions', id: string, on: boolean) {
  const db = getDb();
  if (!db) return;
  const ref0 = doc(db, 'users', uid, kind, id);
  if (on) await setDoc(ref0, { id, at: serverTimestamp() });
  else await deleteDoc(ref0);
}

export async function recordHistory(uid: string, videoId: string) {
  const db = getDb();
  if (!db) return;
  await setDoc(doc(db, 'users', uid, 'history', videoId), { id: videoId, watchedAt: serverTimestamp() });
}

// ── Comments ─────────────────────────────────────────────────────────────────
export async function listComments(videoId: string): Promise<VideoComment[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'videos', videoId, 'comments'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => {
    const v = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      content: String(v.content ?? ''),
      userId: String(v.userId ?? ''),
      videoId,
      parentId: (v.parentId as string) ?? undefined,
      likeCount: Number(v.likeCount ?? 0),
      replyCount: 0,
      isPinned: false,
      createdAt: (v.createdAtIso as string) ?? new Date().toISOString(),
      user: (v.user as VideoComment['user']) ?? { id: '', username: 'user', displayName: 'User', avatarUrl: null },
    };
  });
}

export async function addComment(videoId: string, content: string, parentId: string | undefined, user: User) {
  const db = getDb();
  if (!db) return;
  await addDoc(collection(db, 'videos', videoId, 'comments'), {
    content,
    userId: user.id,
    parentId: parentId ?? null,
    likeCount: 0,
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString(),
    user: { id: user.id, username: user.username, displayName: user.displayName ?? null, avatarUrl: user.avatarUrl ?? null },
  });
}

// ── Uploaded videos ───────────────────────────────────────────────────────────
export async function uploadVideoFile(
  file: File,
  meta: { title: string; description: string; tags: string[]; videoType: string },
  owner: User,
  onProgress: (pct: number) => void,
): Promise<Video> {
  const db = getDb();
  const storage = getStorageInstance();
  if (!db || !storage) throw new Error('Firebase not configured');

  const id = `up-${Date.now()}`;
  const DEMO_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  // Try to upload the real file to Storage (needs Blaze plan). Fall back to a
  // demo stream if Storage isn't available, but always persist metadata.
  let fileUrl = DEMO_HLS;
  try {
    const path = `videos/${owner.id}/${id}-${file.name}`;
    const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
    fileUrl = await new Promise<string>((resolve, reject) => {
      task.on(
        'state_changed',
        (snap) => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 95)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref)),
      );
    });
  } catch {
    // Storage unavailable (e.g. Spark plan) — simulate progress, use demo stream
    for (let p = 20; p <= 95; p += 15) { await new Promise((r) => setTimeout(r, 120)); onProgress(p); }
  }

  const now = new Date().toISOString();
  const video: Video = {
    id,
    title: meta.title,
    description: meta.description,
    thumbnailUrl: `https://picsum.photos/seed/${id}/640/360`,
    hlsManifestUrl: fileUrl, // direct file URL (mp4/webm) — player handles non-HLS
    durationSeconds: 0,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    channelId: owner.id,
    channel: { id: owner.id, name: owner.displayName ?? owner.username, handle: owner.username, avatarUrl: owner.avatarUrl },
    videoType: meta.videoType,
    status: 'published',
    publishedAt: now,
    createdAt: now,
    tags: meta.tags,
    trendingScore: 0,
  };

  await setDoc(doc(db, 'videos', id), { ...video, ownerUid: owner.id, createdAtTs: serverTimestamp() });
  onProgress(100);
  return video;
}

function docToVideo(id: string, v: Record<string, unknown>): Video {
  return {
    id,
    title: String(v.title ?? 'Untitled'),
    description: (v.description as string) ?? '',
    thumbnailUrl: (v.thumbnailUrl as string) ?? `https://picsum.photos/seed/${id}/640/360`,
    hlsManifestUrl: (v.hlsManifestUrl as string) ?? '',
    durationSeconds: Number(v.durationSeconds ?? 0),
    viewCount: Number(v.viewCount ?? 0),
    likeCount: Number(v.likeCount ?? 0),
    commentCount: Number(v.commentCount ?? 0),
    channelId: String(v.channelId ?? ''),
    channel: (v.channel as Video['channel']) ?? undefined,
    videoType: String(v.videoType ?? 'video'),
    status: String(v.status ?? 'published'),
    publishedAt: (v.publishedAt as string) ?? new Date().toISOString(),
    createdAt: (v.createdAt as string) ?? new Date().toISOString(),
    tags: (v.tags as string[]) ?? [],
    trendingScore: Number(v.trendingScore ?? 0),
  };
}

export async function listUploadedVideos(): Promise<Video[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'videos'), orderBy('createdAtTs', 'desc'), limit(100)));
  return snap.docs.map((d) => docToVideo(d.id, d.data() as Record<string, unknown>));
}

export async function listMyVideos(uid: string): Promise<Video[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'videos'), where('ownerUid', '==', uid)));
  return snap.docs.map((d) => docToVideo(d.id, d.data() as Record<string, unknown>));
}

export async function getVideoDoc(id: string): Promise<Video | null> {
  const db = getDb();
  if (!db) return null;
  const d = await getDoc(doc(db, 'videos', id));
  return d.exists() ? docToVideo(d.id, d.data() as Record<string, unknown>) : null;
}

export async function updateVideoDoc(id: string, patch: Partial<Video>) {
  const db = getDb();
  if (!db) return;
  await setDoc(doc(db, 'videos', id), patch, { merge: true });
}

export async function deleteVideoDoc(id: string) {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'videos', id));
}

// ── Messaging ─────────────────────────────────────────────────────────────────
export async function listConversations(uid: string): Promise<Conversation[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'conversations'), where('memberIds', 'array-contains', uid)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Conversation, 'id'>) }));
}

export function listenMessages(conversationId: string, cb: (msgs: Message[]) => void): () => void {
  const db = getDb();
  if (!db) return () => {};
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const v = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          conversationId,
          senderId: String(v.senderId ?? ''),
          type: 'text',
          content: String(v.content ?? ''),
          isEdited: false,
          isDeleted: false,
          createdAt: (v.createdAtIso as string) ?? new Date().toISOString(),
        };
      }),
    );
  });
}

export async function sendFirestoreMessage(conversationId: string, senderId: string, content: string) {
  const db = getDb();
  if (!db) return;
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId,
    content,
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString(),
  });
  await setDoc(
    doc(db, 'conversations', conversationId),
    { lastMessage: { content, createdAt: new Date().toISOString() }, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
