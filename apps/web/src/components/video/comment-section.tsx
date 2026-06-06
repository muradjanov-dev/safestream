'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useCountersStore } from '@/stores/counters.store';
import { commentsApi } from '@/lib/api/client';
import { timeAgo, cn } from '@/lib/utils';
import { ThumbsUp } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  parentId?: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
}

export function CommentSection({ videoId }: { videoId: string }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const bumpVideo = useCountersStore((s) => s.bumpVideo);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => commentsApi.list(videoId),
  });

  const addMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      commentsApi.create(videoId, content, parentId),
    onSuccess: () => {
      bumpVideo(videoId, 'commentCount', 1);
      qc.invalidateQueries({ queryKey: ['comments', videoId] });
      setText(''); setReplyText(''); setReplyingTo(null);
    },
  });

  const all: Comment[] = data?.items ?? [];
  const topLevel = all.filter((c) => !c.parentId);
  const repliesOf = (id: string) => all.filter((c) => c.parentId === id);

  const toggleLike = (id: string) => {
    if (!user) { router.push('/login'); return; }
    setLiked((m) => ({ ...m, [id]: !m[id] }));
  };

  const submitTop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || addMutation.isPending) return;
    addMutation.mutate({ content: text.trim() });
  };

  const renderComment = (c: Comment, isReply = false) => (
    <div key={c.id} className={cn('flex gap-3', isReply && 'ml-11')}>
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
        {c.user.avatarUrl ? (
          <img src={c.user.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          (c.user.displayName ?? c.user.username)[0].toUpperCase()
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{c.user.displayName ?? c.user.username}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
        </div>
        <p className="text-sm">{c.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => toggleLike(c.id)}
            className={cn('text-xs flex items-center gap-1 hover:text-foreground', liked[c.id] ? 'text-primary' : 'text-muted-foreground')}
          >
            <ThumbsUp className={cn('w-3.5 h-3.5', liked[c.id] && 'fill-primary')} />
            {c.likeCount + (liked[c.id] ? 1 : 0) || ''}
          </button>
          {!isReply && (
            <button
              onClick={() => { user ? setReplyingTo(replyingTo === c.id ? null : c.id) : router.push('/login'); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reply
            </button>
          )}
        </div>

        {replyingTo === c.id && (
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${c.user.displayName ?? c.user.username}...`}
              className="flex-1 border-b border-muted-foreground/30 pb-1 text-sm bg-transparent focus:outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && replyText.trim()) addMutation.mutate({ content: replyText.trim(), parentId: c.id });
              }}
            />
            <button
              onClick={() => replyText.trim() && addMutation.mutate({ content: replyText.trim(), parentId: c.id })}
              disabled={!replyText.trim() || addMutation.isPending}
              className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-full disabled:opacity-50"
            >
              Reply
            </button>
          </div>
        )}

        {repliesOf(c.id).map((r) => renderComment(r, true))}
      </div>
    </div>
  );

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-4">
        {topLevel.length} Comment{topLevel.length !== 1 ? 's' : ''}
      </h3>

      {user ? (
        <form onSubmit={submitTop} className="flex gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : (user.displayName ?? user.username)[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border-b border-muted-foreground/30 pb-1 text-sm bg-transparent focus:outline-none focus:border-primary transition-colors"
            />
            {text && (
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setText('')} className="text-xs px-3 py-1.5 rounded-full hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={!text.trim() || addMutation.isPending} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-full disabled:opacity-50 transition-colors">Comment</button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <button onClick={() => router.push('/login')} className="text-sm text-muted-foreground mb-6 hover:text-primary">
          Sign in to comment
        </button>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-5">{topLevel.map((c) => renderComment(c))}</div>
      )}
    </div>
  );
}
