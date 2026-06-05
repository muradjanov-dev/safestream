import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Video, UserRole, VideoStatus } from '@safestream/database';
import { EventsService, Events } from '@safestream/events';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Video) private readonly videoRepo: Repository<Video>,
    private readonly events: EventsService,
  ) {}

  async getSystemStats() {
    const [totalUsers, totalVideos, bannedUsers, pendingReview] = await Promise.all([
      this.userRepo.count(),
      this.videoRepo.count(),
      this.userRepo.count({ where: { isBanned: true } }),
      this.videoRepo.count({ where: { status: VideoStatus.PENDING_REVIEW } }),
    ]);
    return { totalUsers, totalVideos, bannedUsers, pendingReview };
  }

  async listUsers(page = 1, limit = 50, search?: string) {
    const qb = this.userRepo.createQueryBuilder('user');
    if (search) {
      qb.where('user.email ILIKE :q OR user.username ILIKE :q', { q: `%${search}%` });
    }
    const [users, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();
    return { users, total };
  }

  async banUser(userId: string, reason: string, adminId: string): Promise<void> {
    await this.userRepo.update(userId, { isBanned: true, banReason: reason });
    await this.events.publish(Events.USER_BANNED, { userId, reason, bannedBy: adminId });
    this.logger.warn(`User ${userId} banned by admin ${adminId}: ${reason}`);
  }

  async unbanUser(userId: string): Promise<void> {
    await this.userRepo.update(userId, { isBanned: false, banReason: undefined });
  }

  async promoteToCreator(userId: string): Promise<void> {
    await this.userRepo.update(userId, { role: UserRole.CREATOR });
  }

  async removeVideo(videoId: string, adminId: string, reason: string): Promise<void> {
    await this.videoRepo.update(videoId, { status: VideoStatus.DELETED });
    await this.events.publish(Events.VIDEO_DELETED, { videoId, removedBy: adminId, reason });
  }

  async approveVideo(videoId: string, adminId: string): Promise<void> {
    await this.videoRepo.update(videoId, {
      status: VideoStatus.PUBLISHED,
      publishedAt: new Date(),
    });
    await this.events.publish(Events.VIDEO_PUBLISHED, { videoId, approvedBy: adminId });
  }
}
