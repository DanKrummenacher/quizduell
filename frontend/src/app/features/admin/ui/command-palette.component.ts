import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  ElementRef,
  HostListener,
  inject,
  Injectable,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import '@css-ch/components/icon';
import { AdminData } from '../core/admin-data.service';
import type { NavItem } from './admin-header.component';

/** Opens the quick search from anywhere in the admin. */
@Injectable({ providedIn: 'root' })
export class CommandPalette {
  readonly open = signal(false);
}

interface Entry {
  id: string;
  group: 'Bereiche' | 'Aktionen' | 'Fragen';
  label: string;
  hint?: string;
  icon: string;
  run: () => void;
}

/**
 * Quick search (⌘K / Ctrl+K): open an area, start an action or find a
 * question by its text, answers, category or F-number.
 */
@Component({
  selector: 'app-ad-command-palette',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
})
export class AdCommandPaletteComponent {
  protected readonly palette = inject(CommandPalette);
  private readonly data = inject(AdminData);
  private readonly router = inject(Router);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  /** The areas of the admin, from the shell. */
  readonly areas = input<readonly NavItem[]>([]);

  protected readonly query = signal('');
  protected readonly active = signal(0);

  constructor() {
    effect(() => {
      const element = this.dialog().nativeElement;
      if (this.palette.open()) {
        if (!element.open) {
          this.query.set('');
          this.active.set(0);
          element.showModal();
          setTimeout(() => this.input().nativeElement.focus());
        }
      } else if (element.open) {
        element.close();
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  protected onGlobalKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.palette.open.update((open) => !open);
    }
  }

  protected readonly entries = computed<Entry[]>(() => {
    const words = this.query()
      .toLocaleLowerCase('de-CH')
      .split(/\s+/)
      .filter(Boolean);
    const matches = (text: string) => {
      const haystack = text.toLocaleLowerCase('de-CH');
      return words.every((word) => haystack.includes(word));
    };
    const go = (path: string, queryParams?: Record<string, string | number>) => () =>
      void this.router.navigate([path], { queryParams });

    const areas: Entry[] = this.areas().map((area) => ({
      id: `area:${area.path}`,
      group: 'Bereiche',
      label: area.label,
      icon: area.icon,
      run: go(area.path),
    }));
    const actions: Entry[] = [
      {
        id: 'new',
        group: 'Aktionen',
        label: 'Neue Frage erfassen',
        icon: 'add',
        run: go('/admin/fragen', { frage: 'neu' }),
      },
      {
        id: 'paused',
        group: 'Aktionen',
        label: 'Pausierte Fragen anzeigen',
        icon: 'pause-circle',
        run: go('/admin/fragen', { filter: 'pausiert' }),
      },
      {
        id: 'game',
        group: 'Aktionen',
        label: 'Spiel in neuem Tab öffnen',
        icon: 'play-circle',
        run: () => window.open('/', '_blank', 'noopener'),
      },
    ];
    const questions: Entry[] = words.length
      ? (this.data.questions.value() ?? [])
          .filter((q) =>
            matches(
              `f-${q.id} ${q.text} ${q.options.join(' ')} ${q.category ?? ''}`,
            ),
          )
          .slice(0, 8)
          .map((q) => ({
            id: `q:${q.id}`,
            group: 'Fragen',
            label: q.text,
            hint: `F-${q.id}${q.active ? '' : ' · pausiert'}`,
            icon: 'items-list',
            run: go('/admin/fragen', { frage: q.id }),
          }))
      : [];
    return [
      ...areas.filter((entry) => matches(entry.label)),
      ...actions.filter((entry) => matches(entry.label)),
      ...questions,
    ];
  });

  protected readonly groups = computed(() => {
    const groups: {
      name: Entry['group'];
      entries: (Entry & { index: number })[];
    }[] = [];
    this.entries().forEach((entry, index) => {
      let group = groups.find((g) => g.name === entry.group);
      if (!group) {
        group = { name: entry.group, entries: [] };
        groups.push(group);
      }
      group.entries.push({ ...entry, index });
    });
    return groups;
  });

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.entries().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.set(count ? (this.active() + 1) % count : 0);
      this.scrollActive();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.set(count ? (this.active() - 1 + count) % count : 0);
      this.scrollActive();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.choose(this.entries()[this.active()]);
    }
  }

  protected choose(entry: Entry | undefined): void {
    if (entry) {
      this.palette.open.set(false);
      entry.run();
    }
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.palette.open.set(false);
    }
  }

  private scrollActive(): void {
    setTimeout(() =>
      this.dialog()
        .nativeElement.querySelector('[aria-selected="true"]')
        ?.scrollIntoView({ block: 'nearest' }),
    );
  }
}
