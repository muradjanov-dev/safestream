import { Entity, Column, Index } from 'typeorm';
import { BaseUuidEntity } from '../base.entity';

@Entity('channels')
@Index(['handle'], { unique: true })
@Index(['ownerId'])
export class Channel extends BaseUuidEntity {
  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ length: 50, unique: true })
  handle: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'banner_url', nullable: true })
  bannerUrl: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'subscriber_count', default: 0 })
  subscriberCount: number;

  @Column({ name: 'total_views', type: 'bigint', default: 0 })
  totalViews: string;

  @Column({ name: 'total_videos', default: 0 })
  totalVideos: number;

  @Column({ name: 'monetization_enabled', default: false })
  monetizationEnabled: boolean;

  @Column({ name: 'country_code', length: 2, nullable: true })
  countryCode: string;

  @Column({ length: 10, default: 'en' })
  language: string;

  @Column({ type: 'text', array: true, default: '{}' })
  categories: string[];

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: Record<string, string>;
}
