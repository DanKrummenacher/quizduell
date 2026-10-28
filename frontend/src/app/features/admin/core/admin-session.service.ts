import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { AdminSession } from '../../../core/contracts/admin.contract';
import { localStore } from '../../../core/platform/safe-storage';

const STORAGE_KEY = 'playduelio.admin.session';
export const LOGIN_PATH = '/admin/anmelden';

export type LoginResult = 'ok' | 'wrong' | 'throttled' | 'offline';

/**
 * The admin sign-in: one shared password, a signed token that lasts 12 hours.
 * The token is kept in local storage so a reload or a second tab stays signed
 * in; it expires on its own and when the password changes on the server.
 */
@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<AdminSession | null>(readStored());
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  /** Why the last session ended, shown once on the sign-in page. */
  readonly endReason = signal<'expired' | 'signed-out' | null>(null);

  readonly token = computed(() => this.session()?.token ?? null);
  readonly signedIn = computed(() => this.token() !== null);

  constructor() {
    this.scheduleExpiry();
    // Signing out in one tab signs out all tabs.
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        this.session.set(readStored());
        this.scheduleExpiry();
        if (!this.session()) {
          void this.router.navigateByUrl(LOGIN_PATH);
        }
      }
    });
  }

  async login(password: string): Promise<LoginResult> {
    try {
      const session = await firstValueFrom(
        this.http
          .post<AdminSession>(`${environment.apiUrl}/api/admin/login`, { password })
          .pipe(timeout(20_000)),
      );
      this.session.set(session);
      localStore.set(STORAGE_KEY, JSON.stringify(session));
      this.endReason.set(null);
      this.scheduleExpiry();
      return 'ok';
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 || error.status === 400) {
          return 'wrong';
        }
        if (error.status === 429) {
          return 'throttled';
        }
      }
      return 'offline';
    }
  }

  /** Takes over a session the server issued, e.g. after a password change. */
  replace(session: AdminSession): void {
    this.session.set(session);
    localStore.set(STORAGE_KEY, JSON.stringify(session));
    this.scheduleExpiry();
  }

  /** Ends the session; `expired` when the server no longer accepts it. */
  logout(reason: 'expired' | 'signed-out' = 'signed-out'): void {
    if (!this.session()) {
      return;
    }
    this.session.set(null);
    localStore.remove(STORAGE_KEY);
    this.endReason.set(reason);
    this.scheduleExpiry();
    const current = this.router.url;
    void this.router.navigate([LOGIN_PATH], {
      queryParams:
        reason === 'expired' && current.startsWith('/admin')
          ? { weiter: current }
          : {},
    });
  }

  private scheduleExpiry(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    const expiresAt = this.session()?.expiresAt;
    if (expiresAt) {
      // Timers cannot wait longer than ~24 days; sessions last 12 hours.
      const delay = Math.min(expiresAt - Date.now(), 2 ** 31 - 1);
      this.expiryTimer = setTimeout(
        () => this.logout('expired'),
        Math.max(delay, 0),
      );
    }
  }
}

function readStored(): AdminSession | null {
  try {
    const value = JSON.parse(
      localStore.get(STORAGE_KEY) ?? 'null',
    ) as AdminSession | null;
    return value && typeof value.token === 'string' && value.expiresAt > Date.now()
      ? value
      : null;
  } catch {
    return null;
  }
}
