import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@safestream/redis';

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: string[];
  createdBy: string;
  lastMessageAt?: Date;
  createdAt: Date;
}

interface Participant {
  conversationId: string;
  userId: string;
  lastReadAt?: Date;
  isMuted: boolean;
}

@Injectable()
export class ConversationsService {
  // In production: use TypeORM + DB. Using in-memory store for scaffold clarity.
  private conversations = new Map<string, Conversation>();
  private participants = new Map<string, Participant>();

  constructor(private readonly redis: RedisService) {}

  async create(
    type: 'direct' | 'group',
    participantIds: string[],
    createdBy: string,
    name?: string,
  ): Promise<Conversation> {
    // For direct chats, find existing
    if (type === 'direct' && participantIds.length === 2) {
      const existing = this.findDirectConversation(participantIds[0], participantIds[1]);
      if (existing) return existing;
    }

    const conversation: Conversation = {
      id: uuidv4(),
      type,
      name,
      participants: participantIds,
      createdBy,
      createdAt: new Date(),
    };
    this.conversations.set(conversation.id, conversation);

    participantIds.forEach((userId) => {
      this.participants.set(`${conversation.id}:${userId}`, {
        conversationId: conversation.id,
        userId,
        isMuted: false,
      });
    });

    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter((c) =>
      c.participants.includes(userId),
    );
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    return this.participants.has(`${conversationId}:${userId}`);
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    const key = `${conversationId}:${userId}`;
    const p = this.participants.get(key);
    if (p) {
      p.lastReadAt = new Date();
      this.participants.set(key, p);
    }
  }

  async getOfflineParticipants(conversationId: string, excludeUserId: string): Promise<string[]> {
    const convo = this.conversations.get(conversationId);
    if (!convo) return [];
    const online = await this.redis.getClient().smembers('users:online');
    return convo.participants.filter(
      (uid) => uid !== excludeUserId && !online.includes(uid),
    );
  }

  private findDirectConversation(userA: string, userB: string): Conversation | null {
    return (
      Array.from(this.conversations.values()).find(
        (c) =>
          c.type === 'direct' &&
          c.participants.includes(userA) &&
          c.participants.includes(userB),
      ) ?? null
    );
  }
}
