import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import type { LoginResponse } from '../contracts/admin.contract.js';

export const ADMIN_SESSION_HOURS = 12;
const ALGORITHM = 'HS256';

interface AdminTokenPayload {
  sub?: string;
  jti?: string;
  exp?: number;
}

@Injectable()
export class AuthService {
  /** Logged-out sessions (token id → expiry in ms), kept until they expire. */
  private readonly revoked = new Map<string, number>();

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
      { expiresIn: expiresInSec, jwtid: randomUUID(), algorithm: ALGORITHM },
    );
    return { token, expiresAt: Date.now() + expiresInSec * 1000 };
  }

  async verify(token: string): Promise<boolean> {
    const payload = await this.decode(token);
    return (
      payload !== null && payload.sub === 'admin' && !this.isRevoked(payload.jti)
    );
  }

  /** Ends a session immediately, even though the token has not expired yet. */
  async logout(token: string): Promise<void> {
    const payload = await this.decode(token);
    if (payload?.jti && payload.exp) {
      this.revoked.set(payload.jti, payload.exp * 1000);
    }
  }

  private async decode(token: string): Promise<AdminTokenPayload | null> {
    try {
      return await this.jwtService.verifyAsync<AdminTokenPayload>(token, {
        algorithms: [ALGORITHM],
      });
    } catch {
      return null;
    }
  }

  private isRevoked(jti: string | undefined): boolean {
    const now = Date.now();
    for (const [id, expiresAt] of this.revoked) {
      if (expiresAt <= now) {
        this.revoked.delete(id);
      }
    }
    return jti !== undefined && this.revoked.has(jti);
  }
}

/** Constant-time comparison that does not leak the password length. */
function safeEqual(a: string, b: string): boolean {
  const hash = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(a), hash(b));
}
