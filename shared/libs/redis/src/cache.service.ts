import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 3600,
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    const value = await factory();
    await this.redis.set(key, JSON.stringify(value), ttlSeconds);
    return value;
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    for (const key of keys) {
      await this.redis.del(key);
    }
  }

  userFeedKey(userId: string): string {
    return `feed:user:${userId}`;
  }

  videoKey(videoId: string): string {
    return `video:${videoId}`;
  }

  channelKey(channelId: string): string {
    return `channel:${channelId}`;
  }

  trendingKey(period: string, category?: string): string {
    return `trending:${period}${category ? `:${category}` : ''}`;
  }

  jwtBlacklistKey(jti: string): string {
    return `jwt:blacklist:${jti}`;
  }

  rateLimitKey(ip: string, endpoint: string): string {
    return `ratelimit:${ip}:${endpoint}`;
  }

  onlineUsersKey(): string {
    return 'users:online';
  }
}
