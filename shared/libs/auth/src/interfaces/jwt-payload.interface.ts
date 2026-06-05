import { UserRole } from '@safestream/database';

export interface JwtPayload {
  sub: string;        // userId
  role: UserRole;
  sessionId: string;
  jti: string;        // unique token ID (for blacklisting)
  iat?: number;
  exp?: number;
}
