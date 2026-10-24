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
import { ADMIN_AREAS } from '../../core/admin-areas';
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
  styleUrls: ['./admin-shell.component.scss', './admin-shell-surfaces.scss'],
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
    return ADMIN_AREAS.map((area): NavItem => {
      switch (area.path) {
        case '/admin/live':
          return {
            ...area,
            count: live
              ? live.duels.filter((d) => d.phase !== 'finished').length
              : null,
            live: true,
          };
        case '/admin/hinweise':
          return { ...area, count: hints?.length ?? null };
        case '/admin/fragen':
          return { ...area, warn: this.data.playable() === false };
        case '/admin/verlauf':
          return { ...area, fresh: (this.latestChange() ?? 0) > this.seenChange() };
        default:
          return { ...area };
      }
    });
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
