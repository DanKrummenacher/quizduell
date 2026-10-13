import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/calc-ui-text';
import '@css-ch/components/spinner';
import type { DashboardStats } from '../../core/contracts/admin.contract';
import { AdminApi } from '../admin-api.service';

const REFRESH_MS = 5_000;

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminDashboardPage {
  private readonly api = inject(AdminApi);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly error = signal(false);
  protected readonly updatedAt = signal<Date | null>(null);

  protected readonly missingQuestions = computed(() => {
    const stats = this.stats();
    return stats ? Math.max(0, stats.requiredQuestions - stats.activeQuestions) : 0;
  });

  protected readonly liveCards = computed(() => {
    const s = this.stats();
    if (!s) {
      return [];
    }
    return [
      { label: 'Geräte verbunden', value: s.playersOnline, icon: 'iphone' },
      { label: 'Laufende Duelle', value: s.activeGames, icon: 'lightning-strike' },
      { label: 'Suchen gerade Gegner', value: s.playersSearching, icon: 'search' },
    ];
  });

  protected readonly totalCards = computed(() => {
    const s = this.stats();
    if (!s) {
      return [];
    }
    return [
      { label: 'Duelle heute', value: s.gamesToday, icon: 'appointment' },
      { label: 'Duelle insgesamt', value: s.gamesTotal, icon: 'trophy' },
      { label: 'Aktive Fragen', value: s.activeQuestions, icon: 'items-list' },
    ];
  });

  constructor() {
    void this.load();
    const timer = setInterval(() => void this.load(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected async load(): Promise<void> {
    try {
      this.stats.set(await this.api.dashboard());
      this.updatedAt.set(new Date());
      this.error.set(false);
    } catch {
      this.error.set(true);
    }
  }
}
