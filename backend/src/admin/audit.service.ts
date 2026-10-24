import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, like, lt, ne } from 'drizzle-orm';
import type {
  AdminSettings,
  AuditAction,
  AuditEntry,
  AuditPage,
} from '../contracts/admin.contract.js';
import { DatabaseService } from '../database/database.service.js';
import { auditLog, type AuditRow } from '../database/schema.js';

interface SettingsDetail {
  before: AdminSettings;
  after: AdminSettings;
}

/** Keeps a record of every change made in the admin. */
@Injectable()
export class AuditService {
  constructor(private readonly database: DatabaseService) {}

  async record(
    action: AuditAction,
    summary: string,
    detail?: SettingsDetail,
  ): Promise<void> {
    await this.database.db.insert(auditLog).values({
      action,
      summary: summary.slice(0, 300),
      detail: detail ?? null,
    });
  }

  /** Newest first; `withLogins: false` leaves out the sign-ins. */
  async page(limit: number, before?: number, withLogins = true): Promise<AuditPage> {
    const rows = await this.database.db
      .select()
      .from(auditLog)
      .where(
        and(
          before ? lt(auditLog.id, before) : undefined,
          withLogins ? undefined : ne(auditLog.action, 'login'),
        ),
      )
      .orderBy(desc(auditLog.id))
      .limit(limit + 1);
    const entries = rows.slice(0, limit).map(toEntry);
    return {
      entries,
      nextCursor: rows.length > limit ? (entries.at(-1)?.id ?? null) : null,
    };
  }

  /** When the rules were last changed in the admin, null if never. */
  async lastSettingsChange(): Promise<Date | null> {
    const [row] = await this.database.db
      .select({ at: auditLog.at })
      .from(auditLog)
      .where(like(auditLog.action, 'settings.%'))
      .orderBy(desc(auditLog.id))
      .limit(1);
    return row?.at ?? null;
  }

  /** The settings as they were before the change of entry `id`. */
  async settingsBefore(id: number): Promise<AdminSettings> {
    const [row] = await this.database.db
      .select()
      .from(auditLog)
      .where(eq(auditLog.id, id));
    if (!row) {
      throw new NotFoundException();
    }
    const detail = row.detail as SettingsDetail | null;
    if (!detail?.before) {
      throw new BadRequestException('Dieser Eintrag enthält keine Spielregeln.');
    }
    return detail.before;
  }
}

function toEntry(row: AuditRow): AuditEntry {
  const detail = row.detail as SettingsDetail | null;
  return {
    id: row.id,
    at: row.at.toISOString(),
    action: row.action as AuditAction,
    summary: row.summary,
    ...(detail?.before ? { before: detail.before, after: detail.after } : {}),
  };
}
