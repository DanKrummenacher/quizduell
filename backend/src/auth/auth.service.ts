import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import type { LoginResponse } from '../contracts/admin.contract.js';

export const ADMIN_SESSION_HOURS = 12;

@Injectable()
export class AuthService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly jwtService: JwtService,
  ) {}

  async login(password: string): Promise<LoginResponse> {
    if (!this.config.adminPassword) {
      throw new ForbiddenException('Admin login is disabled');
    }
    if (!safeEqual(password, this.config.adminPassword)) {
      throw new UnauthorizedException('Wrong password');
    }
    const expiresInSec = ADMIN_SESSION_HOURS * 3600;
    const token = await this.jwtService.signAsync(
      { sub: 'admin' },
      { expiresIn: expiresInSec },
    );
    return { token, expiresAt: Date.now() + expiresInSec * 1000 };
  }

  async verify(token: string): Promise<boolean> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(token);
      return payload.sub === 'admin';
    } catch {
      return false;
    }
  }
}

/** Constant-time comparison that does not leak the password length. */
function safeEqual(a: string, b: string): boolean {
  const hash = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(a), hash(b));
}
