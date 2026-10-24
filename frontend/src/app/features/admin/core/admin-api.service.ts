import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, type Observable, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AdminQuestion,
  AdminSettings,
  AdminSettingsView,
  Analytics,
  AnalyticsRange,
  AuditPage,
  BulkRequest,
  BulkResult,
  Hint,
  ImportRequest,
  ImportResult,
  LiveSnapshot,
  QuestionDay,
  PauseRequest,
  QuestionInput,
  TrashedQuestion,
  QuestionUpdate,
} from '../../../core/contracts/admin.contract';
import { AdminSessionService } from './admin-session.service';

/** An API error with a message people can read. */
export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const BASE = `${environment.apiUrl}/api/admin`;

/** All calls of the admin to the server. Errors arrive as `AdminApiError`. */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly session = inject(AdminSessionService);

  live(): Promise<LiveSnapshot> {
    return this.call(this.http.get<LiveSnapshot>(`${BASE}/live`, this.options()));
  }

  analytics(range: AnalyticsRange): Promise<Analytics> {
    return this.call(
      this.http.get<Analytics>(`${BASE}/analytics?range=${range}`, this.options()),
    );
  }

  questions(): Promise<AdminQuestion[]> {
    return this.call(
      this.http.get<AdminQuestion[]>(`${BASE}/questions`, this.options()),
    );
  }

  questionHistory(id: number, days = 30): Promise<QuestionDay[]> {
    return this.call(
      this.http.get<QuestionDay[]>(
        `${BASE}/questions/${id}/history?days=${days}`,
        this.options(),
      ),
    );
  }

  createQuestion(input: QuestionInput): Promise<AdminQuestion> {
    return this.call(
      this.http.post<AdminQuestion>(`${BASE}/questions`, input, this.options()),
    );
  }

  updateQuestion(id: number, input: QuestionUpdate): Promise<AdminQuestion> {
    return this.call(
      this.http.put<AdminQuestion>(`${BASE}/questions/${id}`, input, this.options()),
    );
  }

  deleteQuestion(id: number): Promise<void> {
    return this.call(
      this.http.delete<void>(`${BASE}/questions/${id}`, this.options()),
    );
  }

  trash(): Promise<TrashedQuestion[]> {
    return this.call(
      this.http.get<TrashedQuestion[]>(`${BASE}/trash`, this.options()),
    );
  }

  restoreQuestion(id: number): Promise<AdminQuestion> {
    return this.call(
      this.http.post<AdminQuestion>(
        `${BASE}/trash/${id}/restore`,
        {},
        this.options(),
      ),
    );
  }

  /** Deletes a question in the trash for good; without an id, all of them. */
  purgeTrash(id?: number): Promise<void> {
    return this.call(
      this.http.delete<void>(
        id === undefined ? `${BASE}/trash` : `${BASE}/trash/${id}`,
        this.options(),
      ),
    );
  }

  bulk(request: BulkRequest): Promise<BulkResult> {
    return this.call(
      this.http.post<BulkResult>(`${BASE}/questions/bulk`, request, this.options()),
    );
  }

  importQuestions(request: ImportRequest): Promise<ImportResult> {
    return this.call(
      this.http.post<ImportResult>(
        `${BASE}/questions/import`,
        request,
        this.options(),
      ),
      60_000,
    );
  }

  settings(): Promise<AdminSettingsView> {
    return this.call(
      this.http.get<AdminSettingsView>(`${BASE}/settings`, this.options()),
    );
  }

  updateSettings(settings: AdminSettings): Promise<AdminSettingsView> {
    return this.call(
      this.http.put<AdminSettingsView>(`${BASE}/settings`, settings, this.options()),
    );
  }

  /** Stops or allows new duels; running duels play to the end. */
  setPause(paused: boolean): Promise<PauseRequest> {
    return this.call(
      this.http.put<PauseRequest>(`${BASE}/pause`, { paused }, this.options()),
    );
  }

  hints(): Promise<Hint[]> {
    return this.call(this.http.get<Hint[]>(`${BASE}/hints`, this.options()));
  }

  ignoreHint(key: string): Promise<void> {
    return this.call(
      this.http.post<void>(
        `${BASE}/hints/${encodeURIComponent(key)}/ignore`,
        {},
        this.options(),
      ),
    );
  }

  restoreHint(key: string): Promise<void> {
    return this.call(
      this.http.delete<void>(
        `${BASE}/hints/${encodeURIComponent(key)}/ignore`,
        this.options(),
      ),
    );
  }

  audit(before?: number, limit = 50, logins = true): Promise<AuditPage> {
    const query = `limit=${limit}${before ? `&before=${before}` : ''}${logins ? '' : '&logins=false'}`;
    return this.call(
      this.http.get<AuditPage>(`${BASE}/audit?${query}`, this.options()),
    );
  }

  restoreSettings(auditId: number): Promise<AdminSettingsView> {
    return this.call(
      this.http.post<AdminSettingsView>(
        `${BASE}/audit/${auditId}/restore`,
        {},
        this.options(),
      ),
    );
  }

  private options(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.session.token() ?? ''}`,
      }),
    };
  }

  private async call<T>(request: Observable<T>, timeoutMs = 20_000): Promise<T> {
    try {
      return await firstValueFrom(request.pipe(timeout(timeoutMs)));
    } catch (error) {
      throw this.toError(error);
    }
  }

  private toError(error: unknown): AdminApiError {
    if (!(error instanceof HttpErrorResponse)) {
      return new AdminApiError(
        'Der Server antwortet nicht. Bitte später erneut versuchen.',
        0,
      );
    }
    if (error.status === 401) {
      this.session.logout('expired');
      return new AdminApiError('Die Anmeldung ist abgelaufen.', 401);
    }
    if (error.status === 0) {
      return new AdminApiError(
        'Keine Verbindung zum Server. Bitte die Internetverbindung prüfen.',
        0,
      );
    }
    if (error.status === 404) {
      return new AdminApiError(
        'Nicht mehr vorhanden – vielleicht schon gelöscht.',
        404,
      );
    }
    if (error.status === 429) {
      return new AdminApiError('Zu viele Anfragen. Bitte kurz warten.', 429);
    }
    const body = error.error as { message?: unknown } | null;
    const message: unknown = Array.isArray(body?.message)
      ? (body.message as unknown[])[0]
      : body?.message;
    if (
      error.status === 400 &&
      typeof message === 'string' &&
      /^[A-ZÄÖÜ].*\.$/.test(message)
    ) {
      // The server's own German sentences («Zwei Antworten sind gleich.»);
      // validator messages start with a lowercase property name.
      return new AdminApiError(message, 400);
    }
    if (error.status === 400) {
      return new AdminApiError('Die Eingabe ist ungültig.', 400);
    }
    return new AdminApiError(
      'Auf dem Server ist ein Fehler aufgetreten.',
      error.status,
    );
  }
}
