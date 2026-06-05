import { Entity, Column, Index } from 'typeorm';
import { BaseUuidEntity } from '../base.entity';

@Entity('comments')
@Index(['videoId'])
@Index(['parentId'])
@Index(['userId'])
export class Comment extends BaseUuidEntity {
  @Column({ name: 'video_id' })
  videoId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ name: 'is_hidden', default: false })
  isHidden: boolean;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ name: 'reply_count', default: 0 })
  replyCount: number;

  @Column({ name: 'moderation_status', length: 20, default: 'approved' })
  moderationStatus: string;
}
