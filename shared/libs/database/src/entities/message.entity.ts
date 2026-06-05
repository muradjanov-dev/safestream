import { Entity, Column, Index } from 'typeorm';
import { BaseUuidEntity } from '../base.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  SYSTEM = 'system',
}

@Entity('messages')
@Index(['conversationId'])
@Index(['senderId'])
export class Message extends BaseUuidEntity {
  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Column({ name: 'reply_to_id', nullable: true })
  replyToId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: MessageType.TEXT,
    enum: MessageType,
  })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'attachment_url', nullable: true })
  attachmentUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ name: 'is_encrypted', default: false })
  isEncrypted: boolean;
}
