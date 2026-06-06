'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { videosApi, channelsApi } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { useInteractionsStore } from '@/stores/interactions.store';
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
  const subscribed = channel ? isSubscribed(video.channelId) : false;

  const requireAuth = (fn: () => void) => () => (user ? fn() : router.push('/login'));

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
            <p className="text-xs text-muted-foreground">
              {channelData?.data ? `${channelData.data.subscriberCount.toLocaleString()} subscribers` : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant={subscribed ? 'outline' : 'default'}
            onClick={requireAuth(() => toggleSubscribe(video.channelId))}
          >
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-full overflow-hidden">
            <Button
              variant="ghost" size="sm"
              className={cn('rounded-none gap-1', liked && 'text-primary')}
              onClick={requireAuth(() => toggleLike(videoId))}
            >
              <ThumbsUp className={cn('h-4 w-4', liked && 'fill-primary')} />
              {formatViewCount(video.likeCount + (liked ? 1 : 0))}
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="ghost" size="sm"
              className={cn('rounded-none', disliked && 'text-destructive')}
              onClick={requireAuth(() => toggleDislike(videoId))}
            >
              <ThumbsDown className={cn('h-4 w-4', disliked && 'fill-destructive')} />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1" onClick={share}>
            {copied ? <><Check className="h-4 w-4" />Copied</> : <><Share2 className="h-4 w-4" />Share</>}
          </Button>
          <Button
            variant={saved ? 'default' : 'outline'} size="sm"
            onClick={requireAuth(() => toggleSave(videoId))}
          >
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </Button>
          <Button variant="ghost" size="icon" title="Report" onClick={requireAuth(() => alert('Thanks — our moderation team will review this video.'))}>
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-muted rounded-lg p-3 text-sm">
        <p className="text-muted-foreground text-xs mb-1">
          {formatViewCount(video.viewCount)} views {video.publishedAt && `· ${timeAgo(video.publishedAt)}`}
        </p>
        {video.description && <p className="whitespace-pre-wrap">{video.description}</p>}
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {video.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                className="text-primary text-xs cursor-pointer hover:underline"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
