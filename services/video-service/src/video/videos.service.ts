import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Video, VideoStatus, ModerationStatus } from '@safestream/database';
import { NotFoundException } from '@safestream/exceptions';
import { CacheService } from '@safestream/redis';
import { EventsService, Events } from '@safestream/events';
import { StorageService } from '@safestream/storage';
import { PaginationDto, buildPaginatedResponse } from '@safestream/pagination';
import { CreateVideoDto, UpdateVideoDto, RecordViewDto } from './dto/create-video.dto';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video) private readonly videoRepo: Repository<Video>,
    private readonly cache: CacheService,
    private readonly events: EventsService,
    private readonly storage: StorageService,
  ) {}

  async findById(id: string, requestUserId?: string): Promise<Video> {
    const cached = await this.cache.getOrSet(
      this.cache.videoKey(id),
      () => this.videoRepo.findOne({ where: { id } }),
      300,
    );
    if (!cached || cached.status !== VideoStatus.PUBLISHED) {
      throw new NotFoundException('Video', id);
    }
    return cached;
  }

  async create(dto: CreateVideoDto, uploaderId: string): Promise<Video> {
    const video = this.videoRepo.create({
      ...dto,
      uploaderId,
      status: VideoStatus.UPLOADING,
    });
    return this.videoRepo.save(video);
  }

  async update(id: string, dto: UpdateVideoDto, userId: string): Promise<Video> {
    const video = await this.videoRepo.findOneOrFail({ where: { id } });
    if (video.uploaderId !== userId) throw new ForbiddenException();
    Object.assign(video, dto);
    const updated = await this.videoRepo.save(video);
    await this.cache.invalidate(this.cache.videoKey(id));
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const video = await this.videoRepo.findOneOrFail({ where: { id } });
    if (video.uploaderId !== userId) throw new ForbiddenException();
    video.status = VideoStatus.DELETED;
    await this.videoRepo.save(video);
    await this.cache.invalidate(this.cache.videoKey(id));
  }

  async recordView(id: string, dto: RecordViewDto, userId?: string): Promise<void> {
    await this.videoRepo.increment({ id }, 'viewCount', 1);
    await this.cache.invalidate(this.cache.videoKey(id));

    await this.events.publish(Events.VIDEO_VIEW, {
      videoId: id,
      userId: userId ?? null,
      sessionId: dto.sessionId ?? 'anon',
      watchedSeconds: dto.watchedSeconds ?? 0,
      completed: false,
      deviceType: 'web',
      countryCode: 'UZ',
    });
  }

  async list(pagination: PaginationDto, filters: {
    channelId?: string;
    videoType?: string;
    search?: string;
  }) {
    const qb = this.videoRepo
      .createQueryBuilder('video')
      .where('video.status = :status', { status: VideoStatus.PUBLISHED })
      .orderBy('video.publishedAt', 'DESC');

    if (filters.channelId) qb.andWhere('video.channelId = :channelId', { channelId: filters.channelId });
    if (filters.videoType) qb.andWhere('video.videoType = :type', { type: filters.videoType });
    if (filters.search) {
      qb.andWhere(
        '(video.title ILIKE :q OR video.description ILIKE :q)',
        { q: `%${filters.search}%` },
      );
    }

    const total = await qb.getCount();
    const items = await qb.take(pagination.limit).skip(((pagination.page ?? 1) - 1) * pagination.limit).getMany();
    return buildPaginatedResponse(items, total, pagination.limit, undefined, pagination.page);
  }

  async getTrending(limit = 20): Promise<Video[]> {
    return this.cache.getOrSet(
      this.cache.trendingKey('24h'),
      () =>
        this.videoRepo
          .createQueryBuilder('video')
          .where('video.status = :status', { status: VideoStatus.PUBLISHED })
          .andWhere("video.publishedAt > NOW() - INTERVAL '7 days'")
          .orderBy('video.trendingScore', 'DESC')
          .take(limit)
          .getMany(),
      300,
    );
  }

  @Cron('*/5 * * * *')
  async updateTrendingScores(): Promise<void> {
    await this.videoRepo.query(`
      UPDATE videos
      SET trending_score = (
        (CAST(view_count AS FLOAT) * 1.0
         + like_count * 3.0
         + comment_count * 5.0
         + share_count * 8.0)
        * EXP(-EXTRACT(EPOCH FROM (NOW() - published_at)) / 86400.0)
      )
      WHERE status = 'published'
      AND published_at > NOW() - INTERVAL '7 days'
    `);
    await this.cache.invalidate(this.cache.trendingKey('24h'));
  }

  async markTranscoded(
    videoId: string,
    hlsManifestUrl: string,
    durationSeconds: number,
  ): Promise<void> {
    await this.videoRepo.update(videoId, {
      hlsManifestUrl,
      durationSeconds,
      status: VideoStatus.PENDING_REVIEW,
    });

    await this.events.publish(Events.VIDEO_TRANSCODED, {
      videoId,
      hlsManifestUrl,
      qualities: ['360p', '720p', '1080p'],
      durationSeconds,
    });
  }

  async publish(videoId: string, adminId: string): Promise<void> {
    await this.videoRepo.update(videoId, {
      status: VideoStatus.PUBLISHED,
      moderationStatus: ModerationStatus.APPROVED,
      publishedAt: new Date(),
    });
    await this.cache.invalidate(this.cache.videoKey(videoId));
    await this.events.publish(Events.VIDEO_PUBLISHED, { videoId, approvedBy: adminId });
  }
}
