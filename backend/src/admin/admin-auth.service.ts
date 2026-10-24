import { Inject, Injectable } from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import type { AdminSession } from '../contracts/admin.contract.js';

/** How long one sign-in lasts. */
export const ADMIN_SESSION_MS = 12 * 60 * 60_000;

/**
 * Signs admin sessions with a key derived from the admin password. Tokens are
 * stateless, survive restarts and all become invalid when the password changes.
 */
@Injectable()
export class AdminAuthService {
  private readonly passwordHash: Buffer;
  private readonly key: Buffer;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.passwordHash = sha256(config.adminPassword);
    this.key = createHmac('sha256', config.adminPassword)
      .update('playduelio-admin-session-v1')
      .digest();
  }

  /** Compares in constant time, whatever the length of the attempt. */
  checkPassword(attempt: string): boolean {
    return timingSafeEqual(sha256(attempt), this.passwordHash);
  }

  issue(now = Date.now()): AdminSession {
    const expiresAt = now + ADMIN_SESSION_MS;
    const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString(
      'base64url',
    );
    return { token: `${payload}.${this.sign(payload)}`, expiresAt };
  }

  /** Returns the expiry of a valid token, otherwise null. */
  verify(token: string, now = Date.now()): number | null {
    const [payload, signature, ...rest] = token.split('.');
    if (!payload || !signature || rest.length > 0) {
      return null;
    }
    const expected = Buffer.from(this.sign(payload));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
      return null;
    }
    try {
      const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
        exp: unknown;
      };
      return typeof exp === 'number' && exp > now ? exp : null;
    } catch {
      return null;
    }
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.key).update(payload).digest('base64url');
  }
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}
