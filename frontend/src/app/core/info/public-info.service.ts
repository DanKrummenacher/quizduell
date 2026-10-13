import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { PublicInfo } from '../contracts/game.contract';

const FALLBACK: PublicInfo = {
  questionsPerGame: 7,
  questionDurationSec: 20,
  speedBonusEnabled: true,
  idleResetSec: 120,
  playable: true,
};

/** Public game configuration (number of questions, time per question, …). */
@Injectable({ providedIn: 'root' })
export class PublicInfoService {
  private readonly http = inject(HttpClient);
  private readonly infoSignal = signal<PublicInfo>(FALLBACK);
  private readonly loadedSignal = signal(false);
  private readonly reachableSignal = signal(true);

  readonly info = this.infoSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();
  /** False if the server could not be reached on the last refresh. */
  readonly reachable = this.reachableSignal.asReadonly();

  async refresh(): Promise<void> {
    try {
      const info = await firstValueFrom(
        this.http
          .get<PublicInfo>(`${environment.apiUrl}/api/info`)
          .pipe(timeout(20_000)),
      );
      this.infoSignal.set(info);
      this.reachableSignal.set(true);
    } catch {
      this.reachableSignal.set(false);
    } finally {
      this.loadedSignal.set(true);
    }
  }
}
