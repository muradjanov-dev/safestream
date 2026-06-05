import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsJwtGuard } from '@safestream/auth';
import { MessagesService } from '../messages/messages.service';
import { ConversationsService } from '../conversations/conversations.service';
import { EventsService, Events } from '@safestream/events';
import { RedisService } from '@safestream/redis';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { MessageType } from '@safestream/database';

class SendMessageDto {
  @IsString() conversationId: string;
  @IsEnum(MessageType) type: MessageType;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() replyToId?: string;
  @IsOptional() @IsString() attachmentUrl?: string;
}

@WebSocketGateway({
  namespace: '/messenger',
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class MessengerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessengerGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly messages: MessagesService,
    private readonly conversations: ConversationsService,
    private readonly events: EventsService,
    private readonly redis: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        client.handshake.headers?.authorization?.toString().replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;

      const existing = this.userSockets.get(payload.sub) ?? new Set();
      existing.add(client.id);
      this.userSockets.set(payload.sub, existing);

      // Join all user's conversation rooms
      const userConvos = await this.conversations.getUserConversations(payload.sub);
      userConvos.forEach((c) => client.join(`conversation:${c.id}`));

      // Mark user as online
      await this.redis.sadd('users:online', payload.sub);
      this.server.emit('user:online', { userId: payload.sub });

      this.logger.debug(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        // Remove from online set
        const redisClient = this.redis.getClient();
        await redisClient.srem('users:online', userId);
        this.server.emit('user:offline', { userId });
      }
    }
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const userId = client.data.userId as string;

    // Verify user is participant
    const isMember = await this.conversations.isParticipant(dto.conversationId, userId);
    if (!isMember) return { error: 'Not a participant' };

    const message = await this.messages.create({
      conversationId: dto.conversationId,
      senderId: userId,
      type: dto.type,
      content: dto.content,
      replyToId: dto.replyToId,
      attachmentUrl: dto.attachmentUrl,
    });

    // Broadcast to all participants
    this.server
      .to(`conversation:${dto.conversationId}`)
      .emit('message:new', message);

    // Notify offline participants via push
    await this.events.publish(Events.NOTIFY_PUSH, {
      userIds: await this.conversations.getOfflineParticipants(dto.conversationId, userId),
      title: 'New message',
      body: dto.content?.slice(0, 80) ?? 'You have a new message',
      data: { type: 'message', conversationId: dto.conversationId },
    });

    return { success: true, data: message };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.to(`conversation:${data.conversationId}`).emit('typing:indicator', {
      userId: client.data.userId,
      conversationId: data.conversationId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.to(`conversation:${data.conversationId}`).emit('typing:indicator', {
      userId: client.data.userId,
      conversationId: data.conversationId,
      isTyping: false,
    });
  }

  @SubscribeMessage('message:read')
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    await this.conversations.markRead(data.conversationId, client.data.userId as string);
    client.to(`conversation:${data.conversationId}`).emit('message:read_receipt', {
      userId: client.data.userId,
      conversationId: data.conversationId,
      messageId: data.messageId,
    });
  }

  // Called from notification service to push a real-time notification
  emitToUser(userId: string, event: string, data: unknown) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    sockets.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }
}
