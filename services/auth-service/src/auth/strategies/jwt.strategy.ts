import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, RequestUser } from '@safestream/auth';
import { CacheService } from '@safestream/redis';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly cache: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET', 'fallback-secret'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    // Check if token has been blacklisted (logged out)
    const isBlacklisted = await this.cache.exists(
      this.cache.jwtBlacklistKey(payload.jti),
    );
    if (isBlacklisted) throw new UnauthorizedException('Token has been revoked');

    return {
      id: payload.sub,
      email: '',
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
