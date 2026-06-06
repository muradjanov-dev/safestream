'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { videosApi, channelsApi } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { useInteractionsStore } from '@/stores/interactions.store';
import { useCountersStore } from '@/stores/counters.store';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Flag, Check } from 'lucide-react';
import { formatViewCount, timeAgo, cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function VideoInfo({ videoId }: { videoId: string }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const {
    isLiked, isDisliked, isSaved, isSubscribed,
    toggleLike, toggleDislike, toggleSave, toggleSubscribe,
  } = useInteractionsStore();
  const { videos, channels, bumpVideo, bumpChannel } = useCountersStore();

  const { data: videoData } = useQuery({ queryKey: ['video', videoId], queryFn: () => videosApi.getOne(videoId) });
  const video = videoData?.data;

  const { data: channelData } = useQuery({
    queryKey: ['channel', video?.channelId],
    queryFn: () => channelsApi.getOne(video!.channel?.handle ?? ''),
    enabled: !!video?.channelId,
  });
  const channel = channelData?.data ?? video?.channel;

  if (!video) return null;

  const liked = isLiked(videoId);
  const disliked = isDisliked(videoId);
  const saved = isSaved(videoId);
  const subscribed = isSubscribed(video.channelId);

  // Live counts (base videos start at 0; counts come from the counters store)
  const likeCount = videos[videoId]?.likeCount ?? 0;
  const viewCount = videos[videoId]?.viewCount ?? 0;
  const subCount = channels[video.channelId]?.subscriberCount ?? 0;

  const needAuth = () => { if (!user) { router.push('/login'); return true; } return false; };

  const handleLike = () => {
    if (needAuth()) return;
    const wasLiked = liked, wasDisliked = disliked;
    toggleLike(videoId);
    bumpVideo(videoId, 'likeCount', wasLiked ? -1 : 1);
    if (!wasLiked && wasDisliked) bumpVideo(videoId, 'dislikeCount', -1);
  };
  const handleDislike = () => {
    if (needAuth()) return;
    const wasLiked = liked, wasDisliked = disliked;
    toggleDislike(videoId);
    bumpVideo(videoId, 'dislikeCount', wasDisliked ? -1 : 1);
    if (!wasDisliked && wasLiked) bumpVideo(videoId, 'likeCount', -1);
  };
  const handleSubscribe = () => {
    if (needAuth()) return;
    const was = subscribed;
    toggleSubscribe(video.channelId);
    bumpChannel(video.channelId, was ? -1 : 1);
  };

  const share = async () => {
    const url = `${window.location.origin}/watch/${videoId}`;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold leading-tight">{video.title}</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={channel?.avatarUrl} />
            <AvatarFallback>{channel?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{channel?.name}</p>
            <p className="text-xs text-muted-foreground">{formatViewCount(subCount)} subscribers</p>
          </div>
          <Button size="sm" variant={subscribed ? 'outline' : 'default'} onClick={handleSubscribe}>
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-full overflow-hidden">
            <Button variant="ghost" size="sm" className={cn('rounded-none gap-1', liked && 'text-primary')} onClick={handleLike}>
              <ThumbsUp className={cn('h-4 w-4', liked && 'fill-primary')} />
              {formatViewCount(likeCount)}
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="sm" className={cn('rounded-none', disliked && 'text-destructive')} onClick={handleDislike}>
              <ThumbsDown className={cn('h-4 w-4', disliked && 'fill-destructive')} />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1" onClick={share}>
            {copied ? <><Check className="h-4 w-4" />Copied</> : <><Share2 className="h-4 w-4" />Share</>}
          </Button>
          <Button variant={saved ? 'default' : 'outline'} size="sm" onClick={() => (needAuth() ? null : toggleSave(videoId))}>
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </Button>
          <Button variant="ghost" size="icon" title="Report" onClick={() => (needAuth() ? null : alert('Thanks — our moderation team will review this video.'))}>
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-muted rounded-lg p-3 text-sm">
        <p className="text-muted-foreground text-xs mb-1">
          {formatViewCount(viewCount)} views {video.publishedAt && `· ${timeAgo(video.publishedAt)}`}
        </p>
        {video.description && <p className="whitespace-pre-wrap">{video.description}</p>}
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {video.tags.map((tag) => (
              <button key={tag} onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)} className="text-primary text-xs cursor-pointer hover:underline">
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
