import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { LoginRequest, LoginResponse } from '../core/contracts/admin.contract';
import { sessionStore } from '../core/platform/safe-storage';

const STORAGE_KEY = 'playduelio.adminSession';

interface AdminSession {
  token: string;
  expiresAt: number;
}

/** Admin login session, kept per browser tab. */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<AdminSession | null>(readSession());

  readonly token = computed(() => this.session()?.token ?? null);

  isLoggedIn(): boolean {
    const session = this.session();
    if (session && session.expiresAt <= Date.now()) {
      this.forgetSession();
      return false;
    }
    return session !== null;
  }

  async login(password: string): Promise<void> {
    const request: LoginRequest = { password };
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(
        `${environment.apiUrl}/api/admin/auth/login`,
        request,
      ),
    );
    const session = { token: response.token, expiresAt: response.expiresAt };
    sessionStore.set(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  /** Ends the session on the server (token becomes invalid) and locally. */
  async logout(): Promise<void> {
    const token = this.token();
    this.forgetSession();
    if (token) {
      try {
        await firstValueFrom(
          this.http.post<void>(`${environment.apiUrl}/api/admin/auth/logout`, null, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
      } catch {
        // The session expires on its own; nothing else to do.
      }
    }
  }

  /** Forgets the session locally (e.g. after it expired). */
  forgetSession(): void {
    sessionStore.remove(STORAGE_KEY);
    this.session.set(null);
  }
}

function readSession(): AdminSession | null {
  try {
    const raw = sessionStore.get(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as AdminSession) : null;
    return parsed &&
      typeof parsed.token === 'string' &&
      parsed.expiresAt > Date.now()
      ? parsed
      : null;
  } catch {
    return null;
  }
}
