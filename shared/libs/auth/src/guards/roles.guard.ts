import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@safestream/database';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../interfaces/request-user.interface';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.USER]: 1,
  [UserRole.PREMIUM]: 2,
  [UserRole.CREATOR]: 3,
  [UserRole.SUPER_ADMIN]: 10,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    if (!user) throw new ForbiddenException('Authentication required');

    const hasRole = requiredRoles.some(
      (role) => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role],
    );

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
