'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { commentsApi } from '@/lib/api/client';
import { timeAgo } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
}

export function CommentSection({ videoId }: { videoId: string }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [text, setText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => commentsApi.list(videoId),
  });

  const addMutation = useMutation({
    mutationFn: (content: string) => commentsApi.create(videoId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', videoId] });
      setText('');
    },
  });

  const comments: Comment[] = data?.items ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || addMutation.isPending) return;
    addMutation.mutate(text.trim());
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-4">
        {data?.total ?? 0} Comment{data?.total !== 1 ? 's' : ''}
      </h3>

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {(user.displayName ?? user.username)[0].toUpperCase()}
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
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="text-xs px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!text.trim() || addMutation.isPending}
                  className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-full disabled:opacity-50 transition-colors"
                >
                  Comment
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
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
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    {c.likeCount > 0 && c.likeCount}
                  </button>
                  <button className="text-xs text-muted-foreground hover:text-foreground">Reply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
