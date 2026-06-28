import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY, ROLES_KEY, REQUIRE_KYC_KEY } from './decorators';
import { JwtPayload } from '@taxi/database';
import { UserStatus } from '@taxi/database';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Missing access token');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = payload;

      const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (requiredRoles?.length && !requiredRoles.some((r) => payload.roles.includes(r))) {
        throw new ForbiddenException('Insufficient permissions');
      }

      const requireKyc = this.reflector.getAllAndOverride<boolean>(REQUIRE_KYC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (requireKyc && payload.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException({
          message: 'Identity verification required',
          error: 'IDENTITY_KYC_REQUIRED',
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: { headers: { authorization?: string } }): string | null {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
