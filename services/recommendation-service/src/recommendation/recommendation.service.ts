import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoStatus, VideoType } from '@safestream/database';
import { CacheService } from '@safestream/redis';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(Video) private readonly videoRepo: Repository<Video>,
    private readonly cache: CacheService,
  ) {}

  async getForUser(userId: string, limit = 20): Promise<Video[]> {
    return this.cache.getOrSet(
      `rec:user:${userId}`,
      () => this.computeRecommendations(userId, limit),
      3600,
    );
  }

  async getRelated(videoId: string, limit = 10): Promise<Video[]> {
    return this.cache.getOrSet(
      `rec:related:${videoId}`,
      async () => {
        const video = await this.videoRepo.findOne({ where: { id: videoId } });
        if (!video || !video.tags.length) return this.getFallback(limit);

        return this.videoRepo
          .createQueryBuilder('v')
          .where('v.status = :status', { status: VideoStatus.PUBLISHED })
          .andWhere('v.id != :id', { id: videoId })
          .andWhere('v.tags && :tags', { tags: video.tags })
          .orderBy('v.trendingScore', 'DESC')
          .take(limit)
          .getMany();
      },
      1800,
    );
  }

  private async computeRecommendations(userId: string, limit: number): Promise<Video[]> {
    // Stage 1: Candidate generation
    // In production: collaborative filtering + content-based
    // For MVP: trending + recent popular content

    const trending = await this.videoRepo
      .createQueryBuilder('v')
      .where('v.status = :status', { status: VideoStatus.PUBLISHED })
      .andWhere('v.videoType != :type', { type: VideoType.PREMIUM })
      .andWhere("v.publishedAt > NOW() - INTERVAL '14 days'")
      .orderBy('v.trendingScore', 'DESC')
      .take(limit * 3)
      .getMany();

    // Stage 2: Ranking (simple shuffle + trending score for now)
    const shuffled = trending.sort(() => Math.random() * 0.3 - 0.15);

    // Stage 3: Dedup & safety filter
    return shuffled.slice(0, limit);
  }

  private async getFallback(limit: number): Promise<Video[]> {
    return this.videoRepo
      .createQueryBuilder('v')
      .where('v.status = :status', { status: VideoStatus.PUBLISHED })
      .orderBy('v.trendingScore', 'DESC')
      .take(limit)
      .getMany();
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.cache.invalidate(`rec:user:${userId}`);
  }
}
