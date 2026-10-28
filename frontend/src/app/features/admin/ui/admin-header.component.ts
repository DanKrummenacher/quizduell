import {
  afterNextRender,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import '@css-ch/components/icon';
import { filter } from 'rxjs';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import type { AdminArea } from '../core/admin-areas';
import { AutofocusDirective } from './autofocus.directive';
import { CommandPalette } from './command-palette.component';

/** An area in the bar, with what is going on there. */
export interface NavItem extends AdminArea {
  /** Running duels (live) or open hints. */
  count?: number | null;
  /** The count is of running duels. */
  live?: boolean;
  /** Something needs fixing here (e.g. too few questions to play). */
  warn?: boolean;
  /** Something new since the last visit of the area. */
  fresh?: boolean;
}

/** A mark next to an area: what is going on there, in a word or a number. */
export interface NavMark {
  tone: 'alert' | 'warn' | 'live' | 'new' | 'soon';
  text: string;
  label: string;
}

/** The steps of the bar, widest first (see fit()). */
const PHONE = 5;
const STEPS = [0, 1, 2, 3, 4] as const;

/**
 * The quiz's bar as the admin's top bar: navy with the gradient edge, the
 * logo with the lock, the areas with a sliding pill, the search and two
 * actions. It narrows step by step only when the row would overflow:
 *   0 full · 1 search as a button · 2 names only · 3 tighter · 4 icons only
 *   5 phone – logo, search and a button that opens every area from below.
 */
@Component({
  selector: 'app-admin-header',
  imports: [AutofocusDirective, LogoMarkComponent, RouterLink, RouterLinkActive],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss', './admin-header-sheet.scss'],
})
export class AdminHeaderComponent {
  readonly items = input<readonly NavItem[]>([]);
  readonly signOut = output<void>();

  protected readonly palette = inject(CommandPalette);
  protected readonly isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  protected readonly sheetOpen = signal(false);
  /** Position of the pill under the active area. */
  protected readonly marker = signal<{ left: number; width: number } | null>(null);

  private readonly bar = viewChild<ElementRef<HTMLElement>>('bar');
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly groups = computed(() => {
    const groups: { name: NavItem['group']; items: NavItem[] }[] = [];
    for (const item of this.items()) {
      let group = groups.find((g) => g.name === item.group);
      if (!group) {
        group = { name: item.group, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
    return groups;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.sheetOpen.set(false);
        this.measureSoon();
      });
    afterNextRender(() => this.layout());
    // Counts arrive later and change the width of the areas.
    effect(() => {
      this.items();
      this.measureSoon();
    });
    let observer: ResizeObserver | null = null;
    effect(() => {
      const track = this.track()?.nativeElement;
      observer?.disconnect();
      if (track) {
        observer = new ResizeObserver(() => this.layout());
        observer.observe(track);
      }
    });
    this.destroyRef.onDestroy(() => observer?.disconnect());
  }

  /**
   * Marks only where they say something: open hints, too few questions to
   * play, running duels and new changes in the history.
   */
  protected markOf(item: NavItem): NavMark | null {
    const count = item.count ?? 0;
    if (item.soon) {
      return { tone: 'soon', text: 'Bald', label: 'Bald verfügbar' };
    }
    if (item.warn) {
      return { tone: 'warn', text: '!', label: 'Zu wenige Fragen im Spiel' };
    }
    if (item.live) {
      return count > 0
        ? {
            tone: 'live',
            text: `${count} live`,
            label: count === 1 ? '1 laufendes Duell' : `${count} laufende Duelle`,
          }
        : null;
    }
    if (item.fresh && item.path === '/admin/verlauf') {
      return {
        tone: 'new',
        text: 'Neu',
        label: 'Neue Änderungen seit dem letzten Besuch',
      };
    }
    if (count > 0) {
      return {
        tone: 'alert',
        text: String(count),
        label: count === 1 ? '1 offener Hinweis' : `${count} offene Hinweise`,
      };
    }
    return null;
  }

  protected measureSoon(): void {
    setTimeout(() => this.layout());
  }

  @HostListener('window:resize')
  protected layout(): void {
    this.fit();
    this.measure();
  }

  /** Keeps the widest step whose row does not overflow; phones get the last. */
  private fit(): void {
    const bar = this.bar()?.nativeElement;
    const row = bar?.querySelector<HTMLElement>('.row');
    if (!bar || !row) {
      return;
    }
    const fits = (): boolean => row.scrollWidth <= row.clientWidth;
    let step: number = PHONE;
    if (window.innerWidth > 640) {
      for (const candidate of STEPS) {
        bar.dataset['fit'] = String(candidate);
        if (fits()) {
          step = candidate;
          break;
        }
      }
    }
    bar.dataset['fit'] = String(step);
    // On phones the search stays a field as long as there is room.
    bar.dataset['search'] = 'full';
    if (step === PHONE && !fits()) {
      bar.dataset['search'] = 'icon';
    }
  }

  private measure(): void {
    const track = this.track()?.nativeElement;
    const active = track?.querySelector<HTMLElement>('.item.is-active');
    if (!track || !active) {
      this.marker.set(null);
      return;
    }
    // Relative to the track, also when the area sits inside a group.
    const from = track.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    this.marker.set({ left: box.left - from.left, width: box.width });
  }

  @HostListener('document:keydown.escape')
  protected closeSheet(): void {
    this.sheetOpen.set(false);
  }
}
