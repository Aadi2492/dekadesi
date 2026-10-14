import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/** Shared API-key gate for Phase 4 admin endpoints. Use a secret manager in production. */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configured = process.env.ADMIN_API_KEY;
    const supplied = context.switchToHttp().getRequest().headers['x-admin-api-key'];
    if (!configured || typeof supplied !== 'string' || supplied.length !== configured.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(configured))) {
      throw new UnauthorizedException('Valid admin API key required');
    }
    return true;
  }
}
