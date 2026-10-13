import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  AdminQuestion,
  AdminSettings,
  AdminSettingsResponse,
  DashboardStats,
  DeleteResult,
  ImportResult,
  QuestionInput,
} from '../core/contracts/admin.contract';

const BASE = `${environment.apiUrl}/api/admin`;

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);

  dashboard(): Promise<DashboardStats> {
    return firstValueFrom(this.http.get<DashboardStats>(`${BASE}/dashboard`));
  }

  questions(): Promise<AdminQuestion[]> {
    return firstValueFrom(this.http.get<AdminQuestion[]>(`${BASE}/questions`));
  }

  createQuestion(input: QuestionInput): Promise<AdminQuestion> {
    return firstValueFrom(this.http.post<AdminQuestion>(`${BASE}/questions`, input));
  }

  updateQuestion(id: number, input: QuestionInput): Promise<AdminQuestion> {
    return firstValueFrom(
      this.http.put<AdminQuestion>(`${BASE}/questions/${id}`, input),
    );
  }

  setQuestionActive(id: number, active: boolean): Promise<AdminQuestion> {
    return firstValueFrom(
      this.http.patch<AdminQuestion>(`${BASE}/questions/${id}/active`, { active }),
    );
  }

  deleteQuestion(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${BASE}/questions/${id}`));
  }

  deleteAllQuestions(): Promise<DeleteResult> {
    return firstValueFrom(this.http.delete<DeleteResult>(`${BASE}/questions`));
  }

  importSampleQuestions(): Promise<ImportResult> {
    return firstValueFrom(
      this.http.post<ImportResult>(`${BASE}/questions/import-samples`, {}),
    );
  }

  settings(): Promise<AdminSettingsResponse> {
    return firstValueFrom(this.http.get<AdminSettingsResponse>(`${BASE}/settings`));
  }

  saveSettings(settings: AdminSettings): Promise<AdminSettingsResponse> {
    return firstValueFrom(
      this.http.put<AdminSettingsResponse>(`${BASE}/settings`, settings),
    );
  }
}
