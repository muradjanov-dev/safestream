import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from '@safestream/database';
import { NotFoundException } from '@safestream/exceptions';
import { PaginationDto, buildPaginatedResponse } from '@safestream/pagination';

interface CreateMessageDto {
  conversationId: string;
  senderId: string;
  type: MessageType;
  content?: string;
  replyToId?: string;
  attachmentUrl?: string;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
  ) {}

  async create(dto: CreateMessageDto): Promise<Message> {
    const message = this.messageRepo.create(dto);
    return this.messageRepo.save(message);
  }

  async list(conversationId: string, pagination: PaginationDto) {
    const [items, total] = await this.messageRepo.findAndCount({
      where: { conversationId, isDeleted: false },
      order: { createdAt: 'DESC' },
      take: pagination.limit,
      skip: ((pagination.page ?? 1) - 1) * pagination.limit,
    });
    return buildPaginatedResponse(items.reverse(), total, pagination.limit, undefined, pagination.page);
  }

  async update(id: string, userId: string, content: string): Promise<Message> {
    const message = await this.messageRepo.findOneOrFail({ where: { id } });
    if (message.senderId !== userId) throw new NotFoundException('Message', id);
    message.content = content;
    message.isEdited = true;
    return this.messageRepo.save(message);
  }

  async delete(id: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findOneOrFail({ where: { id } });
    if (message.senderId !== userId) throw new NotFoundException('Message', id);
    message.isDeleted = true;
    message.content = null!;
    await this.messageRepo.save(message);
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const message = await this.messageRepo.findOneOrFail({ where: { id: messageId } });
    const reactions = (message.metadata?.reactions as Record<string, string[]>) ?? {};
    if (!reactions[emoji]) reactions[emoji] = [];
    if (!reactions[emoji].includes(userId)) reactions[emoji].push(userId);
    message.metadata = { ...message.metadata, reactions };
    await this.messageRepo.save(message);
  }
}
