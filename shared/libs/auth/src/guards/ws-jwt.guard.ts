import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });
      client.data.user = { id: payload.sub, role: payload.role, sessionId: payload.sessionId };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
