import { UserRole } from '@safestream/database';

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  sessionId: string;
}
