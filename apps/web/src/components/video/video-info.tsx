'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videosApi, channelsApi } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Flag } from 'lucide-react';
import { formatViewCount, timeAgo } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function VideoInfo({ videoId }: { videoId: string }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: videoData } = useQuery({ queryKey: ['video', videoId], queryFn: () => videosApi.getOne(videoId) });
  const video = videoData?.data;

  const { data: channelData } = useQuery({
    queryKey: ['channel', video?.channelId],
    queryFn: () => channelsApi.getOne(video!.channelId),
    enabled: !!video?.channelId,
  });
  const channel = channelData?.data;

  const likeMutation = useMutation({
    mutationFn: () => videosApi.like(videoId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['video', videoId] }),
  });
  const subscribeMutation = useMutation({
    mutationFn: () => channelsApi.subscribe(channel!.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['channel', video?.channelId] }),
  });

  if (!video) return null;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold leading-tight">{video.title}</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={channel?.avatarUrl} />
            <AvatarFallback>{channel?.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{channel?.name}</p>
            <p className="text-xs text-muted-foreground">{channel?.subscriberCount.toLocaleString()} subscribers</p>
          </div>
          {user && (
            <Button size="sm" variant="default" onClick={() => subscribeMutation.mutate()}>Subscribe</Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-full overflow-hidden">
            <Button variant="ghost" size="sm" className="rounded-none gap-1" onClick={() => likeMutation.mutate()}>
              <ThumbsUp className="h-4 w-4" />{video.likeCount.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="sm" className="rounded-none" onClick={() => videosApi.dislike(videoId)}>
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" />Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => videosApi.save(videoId)}>
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
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
              <span key={tag} className="text-primary text-xs cursor-pointer hover:underline">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
