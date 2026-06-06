'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import { useQuery } from '@tanstack/react-query';
import { feedApi, type Video } from '@/lib/api/client';
import { useInteractionsStore } from '@/stores/interactions.store';
import { formatViewCount } from '@/lib/utils';
import { Heart, MessageCircle, Bookmark, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShortsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['feed', 'shorts'], queryFn: () => feedApi.shorts() });
  const shorts = data?.items ?? [];

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-black text-white">Loading shorts…</div>;
  }

  return (
    <div className="fixed inset-0 bg-black overflow-y-auto snap-y snap-mandatory">
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1 text-white/90 hover:text-white bg-black/40 rounded-full px-3 py-1.5 text-sm backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>
      {shorts.map((s) => (
        <ShortItem key={s.id} video={s} />
      ))}
    </div>
  );
}

function ShortItem({ video }: { video: Video }) {
  const ref = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [visible, setVisible] = useState(false);
  const { isLiked, isSaved, toggleLike, toggleSave } = useInteractionsStore();
  const liked = isLiked(video.id);
  const saved = isSaved(video.id);

  useEffect(() => {
    const el = ref.current;
    if (!el || !video.hlsManifestUrl) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(video.hlsManifestUrl);
      hls.attachMedia(el);
    } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = video.hlsManifestUrl;
    }
    return () => hlsRef.current?.destroy();
  }, [video.hlsManifestUrl]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="h-screen w-full snap-start flex items-center justify-center relative">
      <video
        ref={ref}
        className="h-full w-auto max-w-full object-contain"
        loop
        muted
        playsInline
        poster={video.thumbnailUrl}
        onClick={(e) => {
          const v = e.currentTarget;
          v.paused ? v.play() : v.pause();
        }}
      />
      {!visible && <div className="absolute inset-0 flex items-center justify-center text-white/30 text-6xl">▶</div>}

      {/* Right action rail */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 text-white">
        <button onClick={() => toggleLike(video.id)} className="flex flex-col items-center gap-1">
          <span className={cn('p-3 rounded-full bg-white/10 backdrop-blur', liked && 'bg-red-500')}>
            <Heart className={cn('h-6 w-6', liked && 'fill-white')} />
          </span>
          <span className="text-xs">{formatViewCount(video.likeCount + (liked ? 1 : 0))}</span>
        </button>
        <Link href={`/watch/${video.id}`} className="flex flex-col items-center gap-1">
          <span className="p-3 rounded-full bg-white/10 backdrop-blur"><MessageCircle className="h-6 w-6" /></span>
          <span className="text-xs">{formatViewCount(video.commentCount)}</span>
        </Link>
        <button onClick={() => toggleSave(video.id)} className="flex flex-col items-center gap-1">
          <span className={cn('p-3 rounded-full bg-white/10 backdrop-blur', saved && 'bg-primary')}>
            <Bookmark className={cn('h-6 w-6', saved && 'fill-white')} />
          </span>
          <span className="text-xs">Save</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-4 right-20 bottom-10 text-white">
        <p className="font-semibold">@{video.channel?.handle}</p>
        <p className="text-sm mt-1 line-clamp-2">{video.title}</p>
        <p className="text-xs text-white/70 mt-1">{formatViewCount(video.viewCount)} views</p>
      </div>
    </section>
  );
}
