import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  type OnModuleInit,
} from '@nestjs/common';
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { eq } from 'drizzle-orm';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import type { AdminSession } from '../contracts/admin.contract.js';
import { DatabaseService } from '../database/database.service.js';
import { adminCredentials } from '../database/schema.js';

const scrypt = promisify(scryptCallback);

/** How long one sign-in lasts. */
export const ADMIN_SESSION_MS = 12 * 60 * 60_000;
const CREDENTIALS_ID = 1;
const KEY_LENGTH = 64;

/**
 * The one admin password and the sessions it opens. The password is stored
 * as an scrypt hash; the first start takes it from the configuration, after
 * that the admin changes it in the app. Sessions are stateless tokens signed
 * with a key derived from the stored hash, so they survive restarts and all
 * become invalid when the password changes.
 */
@Injectable()
export class AdminAuthService implements OnModuleInit {
  private readonly logger = new Logger(AdminAuthService.name);
  private passwordHash = '';
  private key = Buffer.alloc(0);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly database: DatabaseService,
  ) {}

  async onModuleInit(): Promise<void> {
    const [row] = await this.database.db
      .select({ passwordHash: adminCredentials.passwordHash })
      .from(adminCredentials)
      .where(eq(adminCredentials.id, CREDENTIALS_ID));

    if (row && !this.config.adminPasswordReset) {
      this.use(row.passwordHash);
      return;
    }
    if (row) {
      this.logger.warn(
        'ADMIN_PASSWORD_RESET is set: the stored admin password is replaced. Remove the variable again.',
      );
    }
    await this.store(await hashPassword(this.config.adminPassword));
  }

  /** Compares in constant time, whatever the length of the attempt. */
  async checkPassword(attempt: string): Promise<boolean> {
    return verifyPassword(attempt, this.passwordHash);
  }

  /** Stores the new password and makes every open session invalid. */
  async changePassword(current: string, next: string): Promise<void> {
    if (!(await this.checkPassword(current))) {
      // Not 401: the session is fine, only the attempt is wrong.
      throw new ForbiddenException('Das bisherige Passwort stimmt nicht.');
    }
    await this.store(await hashPassword(next));
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

  private async store(passwordHash: string): Promise<void> {
    await this.database.db
      .insert(adminCredentials)
      .values({ id: CREDENTIALS_ID, passwordHash, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: adminCredentials.id,
        set: { passwordHash, updatedAt: new Date() },
      });
    this.use(passwordHash);
  }

  private use(passwordHash: string): void {
    this.passwordHash = passwordHash;
    this.key = createHmac('sha256', passwordHash)
      .update('playduelio-admin-session-v2')
      .digest();
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.key).update(payload).digest('base64url');
  }
}

/** `scrypt$<salt>$<hash>`, both base64url. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(
  attempt: string,
  stored: string,
): Promise<boolean> {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) {
    return false;
  }
  const expected = Buffer.from(hash, 'base64url');
  const given = (await scrypt(
    attempt,
    Buffer.from(salt, 'base64url'),
    expected.length,
  )) as Buffer;
  return expected.length === given.length && timingSafeEqual(expected, given);
}
