import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

/** Lets only requests with a valid admin session token through. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerToken(request.headers.authorization);
    if (!token || !(await this.authService.verify(token))) {
      throw new UnauthorizedException();
    }
    return true;
  }
}

/** The token of an `Authorization: Bearer <token>` header, if present. */
export function bearerToken(header: string | undefined): string | null {
  const [scheme, token] = (header ?? '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}
