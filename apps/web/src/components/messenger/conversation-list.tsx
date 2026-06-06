'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMessengerStore } from '@/stores/messenger.store';
import { conversationsApi } from '@/lib/api/client';
import { timeAgo } from '@/lib/utils';

export function ConversationList() {
  const { activeConversationId, setActiveConversation, setConversations } = useMessengerStore();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.list(),
    refetchInterval: false,
  });

  const conversations = data?.items ?? [];

  useEffect(() => {
    if (data?.items) setConversations(data.items);
  }, [data, setConversations]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
        <div className="text-4xl mb-3">💬</div>
        <p className="text-sm font-medium">No conversations yet</p>
        <p className="text-xs mt-1">Start chatting with other users</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((c: any) => {
        const other = c.participants?.find((p: any) => p.id !== c.currentUserId) ?? c.participants?.[0];
        const isActive = c.id === activeConversationId;
        const hasUnread = (c.unreadCount ?? 0) > 0;

        return (
          <button
            key={c.id}
            onClick={() => setActiveConversation(c.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
              isActive ? 'bg-muted' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold overflow-hidden">
                {other?.avatarUrl ? (
                  <img src={other.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (other?.displayName ?? other?.username ?? '?')[0].toUpperCase()
                )}
              </div>
              {other?.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-1">
                <span className={`text-sm truncate ${hasUnread ? 'font-semibold' : 'font-medium'}`}>
                  {other?.displayName ?? other?.username ?? 'Unknown'}
                </span>
                {c.lastMessage && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {timeAgo(c.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <p className={`text-xs truncate ${hasUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {c.lastMessage?.content ?? 'No messages yet'}
                </p>
                {hasUnread && (
                  <span className="ml-auto flex-shrink-0 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                    {c.unreadCount > 9 ? '9+' : c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
