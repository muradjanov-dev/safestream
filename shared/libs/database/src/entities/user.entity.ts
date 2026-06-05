import {
  Entity,
  Column,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseUuidEntity } from '../base.entity';

export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  PREMIUM = 'premium',
  CREATOR = 'creator',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User extends BaseUuidEntity {
  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'display_name', length: 100, nullable: true })
  displayName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.USER,
    enum: UserRole,
  })
  role: UserRole;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_banned', default: false })
  isBanned: boolean;

  @Column({ name: 'ban_reason', nullable: true })
  banReason: string;

  @Column({ name: 'ban_expires_at', type: 'timestamptz', nullable: true })
  banExpiresAt: Date;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfa_secret', nullable: true })
  mfaSecret: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'login_count', default: 0 })
  loginCount: number;

  @Column({ name: 'country_code', length: 2, nullable: true })
  countryCode: string;

  @Column({ length: 10, default: 'en' })
  language: string;

  @Column({ length: 50, default: 'UTC' })
  timezone: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;
}
