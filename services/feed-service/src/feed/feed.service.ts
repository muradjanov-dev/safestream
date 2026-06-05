import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoStatus, VideoType } from '@safestream/database';
import { CacheService } from '@safestream/redis';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Video) private readonly videoRepo: Repository<Video>,
    private readonly cache: CacheService,
  ) {}

  async getHomeFeed(userId: string | null, limit = 20, cursor?: string) {
    // Personalized: blend recommended + trending + subscribed
    // For MVP: return recent trending videos
    return this.cache.getOrSet(
      userId ? `feed:home:${userId}` : 'feed:home:anon',
      () =>
        this.videoRepo
          .createQueryBuilder('video')
          .where('video.status = :status', { status: VideoStatus.PUBLISHED })
          .andWhere('video.videoType != :type', { type: VideoType.PREMIUM })
          .orderBy('video.trendingScore', 'DESC')
          .addOrderBy('video.publishedAt', 'DESC')
          .take(limit)
          .getMany(),
      userId ? 3600 : 300,
    );
  }

  async getTrending(category?: string, limit = 20) {
    const qb = this.videoRepo
      .createQueryBuilder('video')
      .where('video.status = :status', { status: VideoStatus.PUBLISHED })
      .andWhere("video.publishedAt > NOW() - INTERVAL '7 days'")
      .orderBy('video.trendingScore', 'DESC')
      .take(limit);

    if (category) qb.andWhere(':category = ANY(video.tags)', { category });

    return this.cache.getOrSet(
      this.cache.trendingKey('24h', category),
      () => qb.getMany(),
      300,
    );
  }

  async getShortsFeed(userId: string | null, limit = 20) {
    return this.cache.getOrSet(
      userId ? `feed:shorts:${userId}` : 'feed:shorts:anon',
      () =>
        this.videoRepo
          .createQueryBuilder('video')
          .where('video.status = :status', { status: VideoStatus.PUBLISHED })
          .andWhere('video.videoType = :type', { type: VideoType.SHORT })
          .orderBy('video.trendingScore', 'DESC')
          .take(limit)
          .getMany(),
      userId ? 1800 : 300,
    );
  }

  async getSubscriptionsFeed(userId: string, subscribedChannelIds: string[], limit = 20) {
    if (!subscribedChannelIds.length) return [];
    return this.videoRepo
      .createQueryBuilder('video')
      .where('video.status = :status', { status: VideoStatus.PUBLISHED })
      .andWhere('video.channelId IN (:...channelIds)', { channelIds: subscribedChannelIds })
      .orderBy('video.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getExploreFeed(category: string, limit = 20) {
    return this.videoRepo
      .createQueryBuilder('video')
      .where('video.status = :status', { status: VideoStatus.PUBLISHED })
      .andWhere(':category = ANY(video.tags)', { category })
      .orderBy('video.trendingScore', 'DESC')
      .take(limit)
      .getMany();
  }
}
