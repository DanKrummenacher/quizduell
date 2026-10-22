// Atelier: the command palette (⌘K) – find any question, go anywhere.
import {
  afterNextRender,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../../proposals/pro';
import { ProposalStore } from '../../proposals/proposal-store';
import { AtelierState } from './atelier-state';

interface Item {
  id: string;
  group: string;
  icon: string;
  title: string;
  hint?: string;
  run: () => void;
}

@Component({
  selector: 'app-atelier-palette',
  template: `
    <button
      type="button"
      class="scrim"
      tabindex="-1"
      aria-label="Schliessen"
      (click)="close()"
    ></button>
    <div
      class="palette"
      role="dialog"
      aria-modal="true"
      aria-label="Suchen und Befehle"
    >
      <label class="line">
        <css-icon icon="search" size="sm"></css-icon>
        <span class="visually-hidden">Suchen</span>
        <input
          #field
          role="combobox"
          aria-expanded="true"
          aria-controls="atelier-palette-list"
          [attr.aria-activedescendant]="
            items()[active()] ? 'pal-' + items()[active()]!.id : null
          "
          placeholder="Frage, Kategorie oder Befehl …"
          autocomplete="off"
          [value]="query()"
          (input)="query.set(field.value); active.set(0)"
          (keydown)="onKey($event)"
        />
        <kbd>Esc</kbd>
      </label>
      <ul class="list" id="atelier-palette-list" role="listbox">
        @for (item of items(); track item.id; let i = $index) {
          @if (i === 0 || items()[i - 1]!.group !== item.group) {
            <li class="group" role="presentation">{{ item.group }}</li>
          }
          <li
            role="option"
            class="item"
            [id]="'pal-' + item.id"
            [class.active]="i === active()"
            [attr.aria-selected]="i === active()"
            tabindex="-1"
            (click)="run(item)"
            (keydown.enter)="run(item)"
            (pointermove)="active.set(i)"
          >
            <css-icon [icon]="item.icon" size="sm"></css-icon>
            <span class="title">{{ item.title }}</span>
            @if (item.hint) {
              <span class="hint">{{ item.hint }}</span>
            }
          </li>
        } @empty {
          <li class="none">Nichts gefunden.</li>
        }
      </ul>
    </div>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'atelier' as a;

    .scrim {
      position: fixed;
      inset: 0;
      z-index: 70;
      padding: 0;
      border: 0;
      background-color: rgba(10, 22, 44, 0.32);
      backdrop-filter: blur(2px);
    }

    .palette {
      position: fixed;
      top: 14vh;
      left: 50%;
      z-index: 71;
      width: min(calc(100vw - #{functions.rem(24)}), functions.rem(620));
      overflow: hidden;
      border-radius: functions.rem(12);
      background-color: a.$surface;
      box-shadow: a.$shadow-pop;
      transform: translateX(-50%);
      animation: pop 0.18s a.$ease both;
    }

    .line {
      display: flex;
      align-items: center;
      gap: functions.rem(10);
      padding: 0 functions.rem(14) 0 functions.rem(16);
      border-bottom: functions.rem(1) solid a.$line;
      color: a.$ink-3;

      input {
        flex: 1 1 auto;
        height: functions.rem(54);
        border: 0;
        outline: none;
        background: none;
        font: inherit;
        font-size: functions.rem(17);
        color: a.$ink;
      }

      kbd {
        @include a.kbd;
      }
    }

    .list {
      max-height: min(56vh, functions.rem(440));
      margin: 0;
      padding: functions.rem(6);
      overflow-y: auto;
      list-style: none;
    }

    .group {
      padding: functions.rem(10) functions.rem(10) functions.rem(4);
      @include a.label;
    }

    .item {
      display: flex;
      align-items: center;
      gap: functions.rem(10);
      min-height: functions.rem(38);
      padding: 0 functions.rem(10);
      border-radius: a.$radius-sm;
      font-size: functions.rem(14);
      color: a.$ink;
      cursor: pointer;

      css-icon {
        flex: none;
        color: a.$ink-3;
      }

      &.active {
        background-color: a.$accent-soft;

        css-icon {
          color: a.$accent;
        }
      }
    }

    .title {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .hint {
      flex: none;
      font-size: functions.rem(12);
      color: a.$ink-3;
    }

    .none {
      padding: functions.rem(24);
      color: a.$ink-3;
      text-align: center;
    }

    @keyframes pop {
      from {
        opacity: 0;
        transform: translate(-50%, functions.rem(-6)) scale(0.98);
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AtelierPaletteComponent {
  private readonly store = inject(ProposalStore);
  private readonly pro = inject(ProposalPro);
  private readonly state = inject(AtelierState);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly query = signal('');
  protected readonly active = signal(0);
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  protected readonly items = computed<Item[]>(() => {
    const q = this.query().trim().toLowerCase();
    const hit = (text: string) =>
      !q || q.split(/\s+/).every((w) => text.toLowerCase().includes(w));
    const questions: Item[] = q
      ? (this.store.questions() ?? [])
          .filter((x) => hit(`${x.text} ${x.options.join(' ')} ${x.category ?? ''}`))
          .slice(0, 6)
          .map((x) => ({
            id: `q${x.id}`,
            group: 'Fragen',
            icon: 'items-list',
            title: x.text,
            hint: x.active ? (x.category ?? '') : 'pausiert',
            run: () => {
              this.state.showQuestions();
              this.state.open.set(x.id);
            },
          }))
      : [];
    const categories: Item[] = this.store
      .categoryStats()
      .filter((c) => q && hit(c.name || 'ohne kategorie'))
      .map((c) => ({
        id: `c${c.name}`,
        group: 'Kategorien',
        icon: 'bulleted-list',
        title: c.name || 'Ohne Kategorie',
        hint: `${c.total} Fragen`,
        run: () => this.state.showQuestions({ category: c.name }),
      }));
    const commands: Item[] = [
      {
        id: 'new',
        group: 'Befehle',
        icon: 'add',
        title: 'Neue Frage',
        hint: 'N',
        run: () => this.state.newQuestion(),
      },
      {
        id: 'overview',
        group: 'Befehle',
        icon: 'statistic',
        title: 'Übersicht öffnen',
        run: () => this.state.go('overview'),
      },
      {
        id: 'questions',
        group: 'Befehle',
        icon: 'items-list',
        title: 'Alle Fragen',
        run: () => this.state.showQuestions(),
      },
      {
        id: 'issues',
        group: 'Befehle',
        icon: 'priority-warning',
        title: 'Zu schwere Fragen zeigen',
        run: () => this.state.showQuestions({ issue: 'hard' }),
      },
      {
        id: 'rules',
        group: 'Befehle',
        icon: 'settings',
        title: 'Spielregeln öffnen',
        run: () => this.state.go('rules'),
      },
      {
        id: 'export',
        group: 'Befehle',
        icon: 'download',
        title: 'Fragen als CSV exportieren',
        run: () => this.pro.exportCsv(),
      },
      {
        id: 'samples',
        group: 'Befehle',
        icon: 'upload',
        title: 'Beispielfragen laden',
        run: () => void this.store.importSamples(),
      },
      {
        id: 'game',
        group: 'Befehle',
        icon: 'home',
        title: 'Zum Spiel',
        run: () => this.openGame.emit(),
      },
      {
        id: 'logout',
        group: 'Befehle',
        icon: 'logout',
        title: 'Abmelden',
        run: () => this.logout.emit(),
      },
    ].filter((c) => hit(c.title));
    return [...questions, ...categories, ...commands];
  });

  constructor() {
    afterNextRender(() => this.field().nativeElement.focus());
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.items().length;
    if (event.key === 'ArrowDown' && count) {
      event.preventDefault();
      this.active.update((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp' && count) {
      event.preventDefault();
      this.active.update((i) => (i - 1 + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.items()[this.active()];
      if (item) {
        this.run(item);
      }
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  protected run(item: Item): void {
    this.close();
    item.run();
  }

  protected close(): void {
    this.state.paletteOpen.set(false);
  }
}
