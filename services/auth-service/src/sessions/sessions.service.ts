import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

interface UserSession {
  id: string;
  userId: string;
  refreshToken: string;
  isActive: boolean;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

@Injectable()
export class SessionsService {
  private sessions = new Map<string, UserSession>();

  constructor(private readonly config: ConfigService) {}

  async createRefreshToken(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<string> {
    const rawToken = uuidv4();
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    this.sessions.set(sessionId, {
      id: sessionId,
      userId,
      refreshToken: tokenHash,
      isActive: true,
      expiresAt,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    });

    return rawToken;
  }

  async findByRefreshToken(rawToken: string): Promise<UserSession | null> {
    for (const session of this.sessions.values()) {
      if (session.isActive && (await bcrypt.compare(rawToken, session.refreshToken))) {
        return session;
      }
    }
    return null;
  }

  async findByUser(userId: string): Promise<Omit<UserSession, 'refreshToken'>[]> {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId && s.isActive)
      .map(({ refreshToken: _rt, ...rest }) => rest);
  }

  async deactivate(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
    }
  }

  async revokeForUser(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new ForbiddenException('Session not found');
    }
    await this.deactivate(sessionId);
  }
}
