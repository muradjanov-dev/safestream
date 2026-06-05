import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '@safestream/database';
import { NotFoundException } from '@safestream/exceptions';
import { CacheService } from '@safestream/redis';
import { EventsService, Events } from '@safestream/events';
import { StorageService } from '@safestream/storage';
import { PaginationDto, buildPaginatedResponse } from '@safestream/pagination';

export class CreateChannelDto {
  handle: string;
  name: string;
  description?: string;
  categories?: string[];
}

export class UpdateChannelDto {
  name?: string;
  description?: string;
  categories?: string[];
  socialLinks?: Record<string, string>;
}

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel) private readonly channelRepo: Repository<Channel>,
    private readonly cache: CacheService,
    private readonly events: EventsService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateChannelDto, ownerId: string): Promise<Channel> {
    const existing = await this.channelRepo.findOne({ where: { handle: dto.handle } });
    if (existing) throw new ForbiddenException('Handle already taken');

    const channel = this.channelRepo.create({ ...dto, ownerId });
    const saved = await this.channelRepo.save(channel);
    await this.events.publish(Events.CHANNEL_CREATED, { channelId: saved.id, ownerId });
    return saved;
  }

  async findByHandle(handle: string): Promise<Channel> {
    const channel = await this.cache.getOrSet(
      this.cache.channelKey(handle),
      () => this.channelRepo.findOne({ where: { handle, isActive: true } }),
      600,
    );
    if (!channel) throw new NotFoundException('Channel', handle);
    return channel;
  }

  async update(id: string, dto: UpdateChannelDto, userId: string): Promise<Channel> {
    const channel = await this.channelRepo.findOneOrFail({ where: { id } });
    if (channel.ownerId !== userId) throw new ForbiddenException();
    Object.assign(channel, dto);
    const updated = await this.channelRepo.save(channel);
    await this.cache.invalidate(this.cache.channelKey(channel.handle));
    return updated;
  }

  async subscribe(channelId: string, userId: string): Promise<void> {
    await this.channelRepo.increment({ id: channelId }, 'subscriberCount', 1);
    await this.cache.invalidate(this.cache.channelKey(channelId));
    await this.events.publish(Events.CHANNEL_SUBSCRIBED, { channelId, userId });
  }

  async unsubscribe(channelId: string, userId: string): Promise<void> {
    await this.channelRepo.decrement({ id: channelId }, 'subscriberCount', 1);
    await this.cache.invalidate(this.cache.channelKey(channelId));
    await this.events.publish(Events.CHANNEL_UNSUBSCRIBED, { channelId, userId });
  }

  async getAnalytics(channelId: string, ownerId: string) {
    const channel = await this.channelRepo.findOneOrFail({ where: { id: channelId } });
    if (channel.ownerId !== ownerId) throw new ForbiddenException();
    return {
      subscriberCount: channel.subscriberCount,
      totalViews: channel.totalViews,
      totalVideos: channel.totalVideos,
    };
  }
}
