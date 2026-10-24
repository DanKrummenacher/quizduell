import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { localStore } from '../../../../core/platform/safe-storage';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { AdminSessionService } from '../../core/admin-session.service';
import { ConfirmService } from '../../core/confirm.service';
import { every } from '../../core/remote';
import { AdminHeaderComponent, type NavItem } from '../../ui/admin-header.component';
import { AdCommandPaletteComponent } from '../../ui/command-palette.component';

/** Newest change of the history this browser has seen. */
const SEEN_CHANGE = 'playduelio.admin.seen.change';

/** Signed-in frame: the brand bar with the areas and the page below. */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, AdminHeaderComponent, AdCommandPaletteComponent],
  providers: [AdminData],
  template: `
    <div class="ad-frame">
      <app-admin-header [items]="items()" (signOut)="signOut()" />
      <router-outlet />
    </div>
    <app-ad-command-palette [areas]="items()" />
  `,
  styleUrl: './admin-shell.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AdminShellComponent {
  protected readonly data = inject(AdminData);
  private readonly session = inject(AdminSessionService);
  private readonly confirm = inject(ConfirmService);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);

  private readonly path = signal(this.router.url.split('?')[0] ?? '');
  /** Newest change of the history, and the newest one seen here. */
  private readonly latestChange = signal<number | null>(null);
  private readonly seenChange = signal(Number(localStore.get(SEEN_CHANGE) ?? 0));

  protected readonly items = computed<NavItem[]>(() => {
    const live = this.data.live();
    const hints = this.data.openHints();
    return [
      {
        path: '/admin',
        label: 'Übersicht',
        icon: 'home',
        group: 'Betrieb',
        description: 'Die Lage auf einen Blick',
      },
      {
        path: '/admin/live',
        label: 'Live',
        icon: 'heartbeat',
        group: 'Betrieb',
        description: 'Laufende Duelle in Echtzeit',
        count: live ? live.duels.filter((d) => d.phase !== 'finished').length : null,
        live: true,
      },
      {
        path: '/admin/hinweise',
        label: 'Hinweise',
        icon: 'bulb',
        group: 'Betrieb',
        description: 'Was Aufmerksamkeit braucht',
        count: hints?.length ?? null,
      },
      {
        path: '/admin/fragen',
        label: 'Fragen',
        icon: 'items-list',
        group: 'Inhalte',
        description: 'Katalog pflegen, prüfen und importieren',
        warn: this.data.playable() === false,
      },
      {
        path: '/admin/regeln',
        label: 'Spielregeln',
        icon: 'settings',
        group: 'Inhalte',
        description: 'Ablauf und Zeiten eines Duells',
      },
      {
        path: '/admin/auswertung',
        label: 'Auswertung',
        icon: 'statistic',
        group: 'Analyse',
        description: 'Nutzung und Fragen über die Zeit',
      },
      {
        path: '/admin/verlauf',
        label: 'Verlauf',
        icon: 'time',
        group: 'Analyse',
        description: 'Jede Änderung im Admin',
        fresh: (this.latestChange() ?? 0) > this.seenChange(),
      },
    ];
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.path.set(this.router.url.split('?')[0] ?? ''));
    // Opening the history marks its changes as seen, also when the newest one
    // arrives after the page opened.
    effect(() => {
      const path = this.path();
      const latest = this.latestChange();
      untracked(() => {
        if (
          path === '/admin/verlauf' &&
          latest !== null &&
          latest > this.seenChange()
        ) {
          this.seenChange.set(latest);
          localStore.set(SEEN_CHANGE, String(latest));
        }
      });
    });

    void this.data.refreshLive();
    every(15_000, () => void this.data.refreshLive());
    // Hints change with every played duel.
    every(60_000, () => void this.data.hints.reload());
    void this.refreshLatestChange();
    every(60_000, () => void this.refreshLatestChange());
  }

  private async refreshLatestChange(): Promise<void> {
    try {
      const page = await this.api.audit(undefined, 1, false);
      this.latestChange.set(page.entries[0]?.id ?? 0);
    } catch {
      // The history stays without a mark until the next try.
    }
  }

  protected async signOut(): Promise<void> {
    const sure = await this.confirm.ask({
      title: 'Abmelden?',
      text: 'Auf diesem Gerät musst du danach das Admin-Passwort wieder eingeben.',
      confirm: 'Abmelden',
    });
    if (sure) {
      this.session.logout('signed-out');
    }
  }
}
