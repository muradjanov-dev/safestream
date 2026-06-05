'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { ConversationList } from '@/components/messenger/conversation-list';
import { ChatWindow } from '@/components/messenger/chat-window';
import { useMessengerStore } from '@/stores/messenger.store';

export default function MessagesPage() {
  const { activeConversationId } = useMessengerStore();

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex border-t">
        <div className={`w-full md:w-80 border-r flex-shrink-0 ${activeConversationId ? 'hidden md:block' : ''}`}>
          <ConversationList />
        </div>
        <div className={`flex-1 ${!activeConversationId ? 'hidden md:flex md:items-center md:justify-center' : ''}`}>
          {activeConversationId ? (
            <ChatWindow conversationId={activeConversationId} />
          ) : (
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
