import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseUuidEntity } from '../base.entity';

export enum VideoType {
  VIDEO = 'video',
  SHORT = 'short',
  LIVE = 'live',
  PREMIUM = 'premium',
}

export enum VideoStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  DELETED = 'deleted',
  DRAFT = 'draft',
}

export enum VideoVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PREMIUM_ONLY = 'premium_only',
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FLAGGED = 'flagged',
  REJECTED = 'rejected',
}

@Entity('videos')
@Index(['channelId'])
@Index(['status'])
@Index(['videoType'])
@Index(['trendingScore'])
@Index(['publishedAt'])
export class Video extends BaseUuidEntity {
  @Column({ name: 'channel_id' })
  channelId: string;

  @Column({ name: 'uploader_id' })
  uploaderId: string;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl: string;

  @Column({
    name: 'video_type',
    type: 'varchar',
    length: 20,
    default: VideoType.VIDEO,
    enum: VideoType,
  })
  videoType: VideoType;

  @Column({
    type: 'varchar',
    length: 20,
    default: VideoStatus.PROCESSING,
    enum: VideoStatus,
  })
  status: VideoStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: VideoVisibility.PUBLIC,
    enum: VideoVisibility,
  })
  visibility: VideoVisibility;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds: number;

  @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
  fileSizeBytes: string;

  @Column({ name: 'original_filename', nullable: true })
  originalFilename: string;

  @Column({ name: 'storage_path', nullable: true })
  storagePath: string;

  @Column({ name: 'hls_manifest_url', nullable: true })
  hlsManifestUrl: string;

  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

  @Column({ name: 'is_age_restricted', default: false })
  isAgeRestricted: boolean;

  @Column({ name: 'content_rating', length: 10, default: 'G' })
  contentRating: string;

  @Column({
    name: 'moderation_score',
    type: 'float',
    nullable: true,
  })
  moderationScore: number;

  @Column({
    name: 'moderation_status',
    type: 'varchar',
    length: 20,
    default: ModerationStatus.PENDING,
    enum: ModerationStatus,
  })
  moderationStatus: ModerationStatus;

  @Column({ name: 'view_count', type: 'bigint', default: 0 })
  viewCount: string;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ name: 'dislike_count', default: 0 })
  dislikeCount: number;

  @Column({ name: 'comment_count', default: 0 })
  commentCount: number;

  @Column({ name: 'share_count', default: 0 })
  shareCount: number;

  @Column({ name: 'save_count', default: 0 })
  saveCount: number;

  @Column({ name: 'trending_score', type: 'float', default: 0 })
  trendingScore: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date;

  @Column({ name: 'tags', type: 'text', array: true, default: '{}' })
  tags: string[];
}
