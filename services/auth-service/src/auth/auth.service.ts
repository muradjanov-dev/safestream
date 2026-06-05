import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '@safestream/database';
import { JwtPayload } from '@safestream/auth';
import { CacheService, RedisService } from '@safestream/redis';
import { EventsService, Events } from '@safestream/events';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SessionsService } from '../sessions/sessions.service';
import { MfaService } from '../mfa/mfa.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
    private readonly redis: RedisService,
    private readonly events: EventsService,
    private readonly sessions: SessionsService,
    private readonly mfa: MfaService,
  ) {}

  async register(dto: RegisterDto, ipAddress: string): Promise<{ message: string }> {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictException(
        existing.email === dto.email
          ? 'Email already registered'
          : 'Username already taken',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verificationToken = uuidv4();

    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      displayName: dto.displayName || dto.username,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
    });
    await this.userRepo.save(user);

    // Store email verification token in Redis (24h)
    await this.redis.set(
      `email:verify:${verificationToken}`,
      user.id,
      86400,
    );

    await this.events.publish(Events.USER_REGISTERED, {
      userId: user.id,
      email: user.email,
      verificationToken,
    });

    return { message: 'Registration successful. Check your email to verify your account.' };
  }

  async login(dto: LoginDto, ipAddress: string, userAgent: string): Promise<TokenPair> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        `Account banned${user.banReason ? ': ' + user.banReason : ''}`,
      );
    }

    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        throw new BadRequestException('MFA code required');
      }
      const valid = await this.mfa.verifyCode(user.mfaSecret!, dto.mfaCode);
      if (!valid) throw new UnauthorizedException('Invalid MFA code');
    }

    // Update last login
    await this.userRepo.update(user.id, {
      lastLoginAt: new Date(),
      loginCount: () => 'login_count + 1',
    });

    return this.issueTokens(user, ipAddress, userAgent);
  }

  async refresh(refreshToken: string, ipAddress: string): Promise<TokenPair> {
    const session = await this.sessions.findByRefreshToken(refreshToken);
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findOne({ where: { id: session.userId } });
    if (!user || user.isBanned) throw new UnauthorizedException('Access denied');

    // Rotate refresh token
    await this.sessions.deactivate(session.id);
    return this.issueTokens(user, ipAddress, session.userAgent);
  }

  async logout(userId: string, sessionId: string, jti: string): Promise<void> {
    // Blacklist current access token until expiry
    const ttl = this.config.get<number>('JWT_ACCESS_TTL_SECONDS', 900);
    await this.redis.set(this.cache.jwtBlacklistKey(jti), '1', ttl);
    await this.sessions.deactivate(sessionId);
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.redis.get(`email:verify:${token}`);
    if (!userId) throw new BadRequestException('Invalid or expired verification token');

    await this.userRepo.update(userId, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
    await this.redis.del(`email:verify:${token}`);

    await this.events.publish(Events.USER_EMAIL_VERIFIED, { userId });
  }

  private async issueTokens(
    user: User,
    ipAddress: string,
    userAgent: string,
  ): Promise<TokenPair> {
    const jti = uuidv4();
    const sessionId = uuidv4();

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      sessionId,
      jti,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.sessions.createRefreshToken(user.id, sessionId, ipAddress, userAgent),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
      },
    };
  }
}
