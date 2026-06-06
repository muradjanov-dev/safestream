'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conversationsApi, appendMessage, type Message } from '@/lib/api/client';
import { useMessengerStore } from '@/stores/messenger.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const REPLIES = [
  'Thanks for your message! 😊',
  'Great question — we’ll cover that in an upcoming video!',
  'Appreciate the support! 🙌',
  'That’s a good idea, I’ll pass it to the team.',
  'Glad you’re enjoying the channel!',
];

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const { messages, setMessages, addMessage, setActiveConversation, conversations } = useMessengerStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conv = conversations.find((c) => c.id === conversationId);
  const peer = conv?.participants.find((p) => p.id !== 'me') ?? conv?.participants[0];

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

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const mine: Message = {
      id: `${conversationId}-${Date.now()}`,
      conversationId, senderId: 'me', type: 'text', content: text,
      isEdited: false, isDeleted: false, createdAt: new Date().toISOString(),
    };
    addMessage(conversationId, mine);
    appendMessage(conversationId, mine);
    setInput('');

    // Simulate a reply from the other participant
    setTimeout(() => {
      const reply: Message = {
        id: `${conversationId}-${Date.now()}-r`,
        conversationId, senderId: peer?.id ?? 'peer', type: 'text',
        content: REPLIES[Math.floor(Math.random() * REPLIES.length)],
        isEdited: false, isDeleted: false, createdAt: new Date().toISOString(),
      };
      addMessage(conversationId, reply);
      appendMessage(conversationId, reply);
    }, 1200);
  };

  const convMessages = messages[conversationId] ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConversation(null)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="font-semibold">{peer?.displayName ?? peer?.username ?? 'Conversation'}</p>
        {peer?.isOnline && <span className="text-xs text-green-500">● online</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {convMessages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.senderId === 'me' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm',
              msg.senderId === 'me'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm',
            )}>
              {msg.isDeleted ? <span className="italic opacity-60">Message deleted</span> : msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
