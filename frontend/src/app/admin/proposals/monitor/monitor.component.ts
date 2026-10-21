// TEMPORARY: proposal G «Monitor» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import '@css-ch/components/icon';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { RulesDrawerComponent } from '../board/rules-drawer.component';
import { formatDuration, ProposalStore, successRate } from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';

interface Sample {
  at: number;
  devices: number;
  duels: number;
  searching: number;
  today: number;
}

/** Ten minutes of samples at the refresh rate of five seconds. */
const MAX_SAMPLES = 120;
const TICKER_MS = 7_000;

/**
 * A dark live wall for a big screen at the stand or a second monitor:
 * the numbers large, how they developed since the page was opened, the
 * categories and the hardest questions as a ticker. Few controls in a dock.
 */
@Component({
  selector: 'app-monitor',
  imports: [
    DatePipe,
    LogoMarkComponent,
    RulesDrawerComponent,
    ProposalDialogsComponent,
  ],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MonitorComponent {
  protected readonly store = inject(ProposalStore);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly samples = signal<Sample[]>([]);
  protected readonly now = signal(new Date());
  protected readonly tick = signal(0);
  protected readonly rulesOpen = signal(false);
  protected readonly rate = successRate;
  protected readonly duration = formatDuration;

  protected readonly since = computed(() => this.samples()[0] ?? null);
  protected readonly todayDelta = computed(() => {
    const first = this.since();
    const stats = this.store.stats();
    return first && stats ? stats.gamesToday - first.today : 0;
  });
  protected readonly peakDevices = computed(() =>
    Math.max(0, ...this.samples().map((s) => s.devices)),
  );

  /** Sparkline paths for the devices and the running duels. */
  protected readonly lines = computed(() => {
    const samples = this.samples();
    const max = Math.max(2, ...samples.map((s) => Math.max(s.devices, s.duels)));
    const path = (value: (s: Sample) => number) =>
      samples
        .map((s, i) => {
          const x = samples.length < 2 ? 0 : (i / (samples.length - 1)) * 100;
          const y = 38 - (value(s) / max) * 34;
          return `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
    return {
      devices: path((s) => s.devices),
      duels: path((s) => s.duels),
      area: samples.length > 1 ? `${path((s) => s.devices)} L100 40 L0 40 Z` : '',
    };
  });

  /** The current question of the ticker, as a list so it animates in. */
  protected readonly tickerItems = computed(() => {
    const hardest = this.store.hardest();
    return hardest.length ? [hardest[this.tick() % hardest.length]!] : [];
  });

  constructor() {
    effect(() => {
      const s = this.store.stats();
      if (!s) {
        return;
      }
      this.samples.update((list) =>
        [
          ...list,
          {
            at: Date.now(),
            devices: s.playersOnline,
            duels: s.activeGames,
            searching: s.playersSearching,
            today: s.gamesToday,
          },
        ].slice(-MAX_SAMPLES),
      );
    });
    const clock = setInterval(() => this.now.set(new Date()), 1_000);
    const ticker = setInterval(() => this.tick.update((t) => t + 1), TICKER_MS);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(clock);
      clearInterval(ticker);
    });
  }

  protected fullscreen(): void {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen?.();
    }
  }
}
