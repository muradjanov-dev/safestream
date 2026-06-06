import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { useMessengerStore } from '@/stores/messenger.store';
import type { Message } from '@/lib/api/client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3005';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().user?.id ?? '';
    socket = io(`${WS_URL}/messenger`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
    bindEvents(socket);
  }
  return socket;
}

function bindEvents(s: Socket) {
  const store = useMessengerStore.getState();

  s.on('message:new', (message: Message) => {
    store.addMessage(message.conversationId, message);
  });

  s.on('typing:indicator', ({ userId, conversationId, isTyping }: { userId: string; conversationId: string; isTyping: boolean }) => {
    store.setTyping(conversationId, userId, isTyping);
  });

  s.on('user:online',  ({ userId }: { userId: string }) => store.setUserOnline(userId, true));
  s.on('user:offline', ({ userId }: { userId: string }) => store.setUserOnline(userId, false));

  s.on('connect_error', (err) => {
    console.warn('WebSocket error:', err.message);
  });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function sendMessage(conversationId: string, content: string, type = 'text') {
  getSocket().emit('message:send', { conversationId, content, type });
}

export function sendTyping(conversationId: string, isTyping: boolean) {
  getSocket().emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
}
