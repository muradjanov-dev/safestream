'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '@/lib/api/client';
import { useMessengerStore } from '@/stores/messenger.store';
import { useAuthStore } from '@/stores/auth.store';
import { sendMessage, sendTyping, getSocket } from '@/lib/websocket/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const { user } = useAuthStore();
  const { messages, setMessages, setActiveConversation, typingUsers } = useMessengerStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  const { data } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationsApi.messages(conversationId),
    refetchInterval: false,
  });

  useEffect(() => {
    if (data?.items) setMessages(conversationId, data.items);
  }, [data, conversationId, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[conversationId]]);

  useEffect(() => {
    getSocket();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(conversationId, input.trim());
    setInput('');
    sendTyping(conversationId, false);
  };

  const handleInputChange = (v: string) => {
    setInput(v);
    sendTyping(conversationId, true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(conversationId, false), 2000);
  };

  const convMessages = messages[conversationId] ?? [];
  const typing = typingUsers[conversationId]?.filter((id) => id !== user?.id) ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConversation(null)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="font-semibold">Conversation</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {convMessages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.senderId === user?.id ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm',
              msg.senderId === user?.id
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm',
            )}>
              {msg.isDeleted ? <span className="italic opacity-60">Message deleted</span> : msg.content}
            </div>
          </div>
        ))}
        {typing.length > 0 && (
          <div className="text-xs text-muted-foreground italic">Typing...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
