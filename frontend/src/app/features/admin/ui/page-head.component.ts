import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import { filter } from 'rxjs';
import { sessionStore } from '../../../core/platform/safe-storage';
import { ADMIN_AREAS, type AdminArea, areaOf } from '../core/admin-areas';
import { AdminData } from '../core/admin-data.service';

const RECENT = 'playduelio.admin.recent';

/**
 * Head of every admin page: the path with the area switcher and the areas
 * opened last, the title, a line below it (projected with `headDesc`) and the
 * actions of the page (the rest of the content). Behind it the light of the bar
 * and the icon of the area.
 */
@Component({
  selector: 'app-ad-page-head',
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="ph">
      @if (area(); as a) {
        <span class="ph-bg" aria-hidden="true">
          <span class="ph-symbol"
            ><css-icon [attr.icon]="a.icon" size="xl"></css-icon
          ></span>
        </span>
        <nav class="ph-crumbs" aria-label="Pfad">
          <span>Admin</span>
          <span aria-hidden="true">/</span>
          <span>{{ a.group }}</span>
          <span aria-hidden="true">/</span>
          <div class="ph-switch">
            <button
              type="button"
              aria-haspopup="true"
              aria-current="page"
              [attr.aria-expanded]="switchOpen()"
              (click)="switchOpen.set(!switchOpen()); $event.stopPropagation()"
            >
              {{ a.label }}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m5 6.5 3-3 3 3M5 9.5l3 3 3-3" />
              </svg>
            </button>
            @if (switchOpen()) {
              <div class="ph-menu" role="menu">
                @for (group of groups; track group) {
                  <span class="ph-menu-label">{{ group }}</span>
                  @for (entry of areasOf(group); track entry.path) {
                    <a
                      role="menuitem"
                      [routerLink]="entry.path"
                      [class.is-active]="entry.path === a.path"
                      (click)="closeSwitch()"
                    >
                      <span class="ph-menu-icon"
                        ><css-icon [attr.icon]="entry.icon" size="xs"></css-icon
                      ></span>
                      <span class="ph-menu-text">
                        <span>{{ entry.label }}</span>
                        <small>{{ entry.description }}</small>
                      </span>
                      @if (markOf(entry); as m) {
                        <span class="ph-menu-mark" [attr.data-tone]="m.tone"
                          ><i></i>{{ m.text }}</span
                        >
                      }
                    </a>
                  }
                }
              </div>
            }
          </div>
          @if (recents().length) {
            <span class="ph-recent">
              <span>Zuletzt</span>
              @for (recent of recents(); track recent.path) {
                <a [routerLink]="recent.path"
                  ><css-icon [attr.icon]="recent.icon" size="xs"></css-icon
                  >{{ recent.label }}</a
                >
              }
            </span>
          }
        </nav>
      }
      <div class="ph-row">
        <div class="ph-text">
          <h1>{{ title() }}</h1>
          <div class="ph-desc"><ng-content select="[headDesc]" /></div>
        </div>
        <div class="ph-actions"><ng-content /></div>
      </div>
    </header>
  `,
  styleUrls: ['./page-head.component.scss', './page-head-menu.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdPageHeadComponent {
  readonly title = input.required<string>();

  private readonly data = inject(AdminData);
  private readonly router = inject(Router);
  private readonly url = signal(this.router.url);
  protected readonly area = computed(() => areaOf(this.url()));

  /** The menu of the last step of the path, which opens every area. */
  protected readonly switchOpen = signal(false);
  protected readonly groups = ['Betrieb', 'Inhalte', 'Analyse'] as const;

  protected areasOf(group: string): AdminArea[] {
    return ADMIN_AREAS.filter((area) => area.group === group);
  }

  /** What is going on in an area, beside it in the menu. */
  protected markOf(area: AdminArea): { tone: string; text: string } | null {
    const live = this.data.live();
    const open = this.data.openHints();
    switch (area.path) {
      case '/admin/live': {
        const running =
          live?.duels.filter((d) => d.phase !== 'finished').length ?? 0;
        return running > 0 ? { tone: 'live', text: `${running} live` } : null;
      }
      case '/admin/hinweise':
        if (area.soon) {
          return { tone: 'soon', text: 'Bald' };
        }
        return open?.length ? { tone: 'alert', text: String(open.length) } : null;
      case '/admin/fragen':
        return this.data.playable() === false ? { tone: 'warn', text: '!' } : null;
      default:
        return null;
    }
  }

  /** The areas opened last in this tab, newest first. */
  private readonly visited = signal<string[]>(
    JSON.parse(sessionStore.get(RECENT) ?? '[]') as string[],
  );
  protected readonly recents = computed(() =>
    this.visited()
      .filter((path) => path !== this.area()?.path)
      .slice(0, 3)
      .map((path) => ADMIN_AREAS.find((area) => area.path === path))
      .filter((area): area is AdminArea => area !== undefined),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.url.set(this.router.url);
        this.remember();
      });
    this.remember();
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  protected closeSwitch(): void {
    this.switchOpen.set(false);
  }

  private remember(): void {
    const path = this.area()?.path;
    if (!path) {
      return;
    }
    const next = [path, ...this.visited().filter((p) => p !== path)].slice(0, 5);
    this.visited.set(next);
    sessionStore.set(RECENT, JSON.stringify(next));
  }
}
