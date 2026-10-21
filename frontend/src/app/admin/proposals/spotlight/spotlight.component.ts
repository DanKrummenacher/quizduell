// TEMPORARY: proposal D «Spotlight» (development only).
import {
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
import '@css-ch/components/input-stepper';
import '@css-ch/components/switch';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import {
  formatDuration,
  NUMERIC_FIELDS,
  type NumericField,
  type NumericKey,
  ProposalStore,
  successRate,
} from '../proposal-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';

interface Command {
  id: string;
  title: string;
  sub: string;
  icon: string;
  keywords: string;
  run: () => void;
}

type Row =
  | { kind: 'command'; id: string; command: Command }
  | { kind: 'setting'; id: string; field: NumericField }
  | { kind: 'bonus'; id: string }
  | { kind: 'question'; id: string; question: AdminQuestion };

const SAVE_DELAY_MS = 900;

/** Matches every word of the query somewhere in the text. */
function matches(query: string, text: string): boolean {
  const haystack = text.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/**
 * Everything through one line, as in the tools of developers and designers:
 * type what you want («bonus», «kantone», «sekunden»), use the arrow keys
 * and Enter. Settings change right in the result and save themselves.
 */
@Component({
  selector: 'app-spotlight',
  imports: [LogoMarkComponent, ProposalDialogsComponent],
  templateUrl: './spotlight.component.html',
  styleUrl: './spotlight.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '(document:keydown)': 'onGlobalKey($event)' },
})
export class SpotlightComponent {
  protected readonly store = inject(ProposalStore);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly query = signal('');
  protected readonly active = signal(0);
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private saveTimer = 0;

  protected readonly rate = successRate;
  protected readonly duration = formatDuration;

  private readonly commands = computed<Command[]>(() => {
    const bonus = this.store.settings()?.speedBonusEnabled ?? false;
    return [
      {
        id: 'new',
        title: 'Neue Frage erstellen',
        sub: 'Frage mit vier Antworten',
        icon: 'add',
        keywords: 'neu frage erstellen hinzufügen',
        run: () => this.store.openEditor(null),
      },
      {
        id: 'bonus',
        title: bonus ? 'Tempo-Bonus ausschalten' : 'Tempo-Bonus einschalten',
        sub: bonus
          ? 'Jede richtige Antwort gibt 100 Punkte'
          : 'Schnelle Antworten geben bis 100 Punkte mehr',
        icon: 'speed',
        keywords: 'tempo bonus punkte schnell',
        run: () => void this.store.applyAndSave({ speedBonusEnabled: !bonus }),
      },
      {
        id: 'defaults',
        title: 'Empfohlene Spielregeln übernehmen',
        sub: 'Alle Werte auf die Standardwerte',
        icon: 'reload',
        keywords: 'standard empfohlen regeln zurücksetzen werte',
        run: () => {
          this.store.applyDefaults();
          void this.store.saveSettings();
        },
      },
      {
        id: 'import',
        title: 'Beispielfragen importieren',
        sub: 'Startpaket mit Fragen aus vier Kategorien',
        icon: 'download',
        keywords: 'import beispiel fragen startpaket',
        run: () => void this.store.importSamples(),
      },
      {
        id: 'game',
        title: 'Zum Spiel',
        sub: 'Startseite auf diesem Gerät öffnen',
        icon: 'home',
        keywords: 'spiel start startseite öffnen',
        run: () => this.openGame.emit(),
      },
      {
        id: 'logout',
        title: 'Abmelden',
        sub: 'Admin-Sitzung beenden',
        icon: 'logout',
        keywords: 'abmelden logout beenden',
        run: () => this.logout.emit(),
      },
      {
        id: 'delete-all',
        title: 'Alle Fragen löschen',
        sub: 'Mit Bestätigung',
        icon: 'trash',
        keywords: 'alle fragen löschen entfernen',
        run: () => this.store.confirm.set({ kind: 'delete-all' }),
      },
    ];
  });

  /** The result groups for the current query. */
  protected readonly groups = computed(() => {
    const query = this.query().trim();
    const commands = this.commands().filter(
      (c) => !query || matches(query, `${c.title} ${c.keywords}`),
    );
    const settings = query
      ? NUMERIC_FIELDS.filter((f) =>
          matches(query, `${f.label} ${f.short} regeln einstellung ${f.hint}`),
        )
      : [];
    const showBonus =
      !!query && matches(query, 'tempo bonus punkte regeln einstellung');
    const questions = query
      ? (this.store.questions() ?? [])
          .filter((q) =>
            matches(query, `${q.text} ${q.options.join(' ')} ${q.category ?? ''}`),
          )
          .slice(0, 8)
      : [];

    const groups: { title: string; rows: Row[] }[] = [];
    if (questions.length) {
      groups.push({
        title: 'Fragen',
        rows: questions.map((question) => ({
          kind: 'question',
          id: `q${question.id}`,
          question,
        })),
      });
    }
    if (settings.length || showBonus) {
      groups.push({
        title: 'Spielregeln',
        rows: [
          ...settings.map((field): Row => ({
            kind: 'setting',
            id: field.key,
            field,
          })),
          ...(showBonus ? [{ kind: 'bonus', id: 'bonus-switch' } as Row] : []),
        ],
      });
    }
    if (commands.length) {
      groups.push({
        title: query ? 'Aktionen' : 'Schnell erledigt',
        rows: commands.map((command) => ({
          kind: 'command',
          id: command.id,
          command,
        })),
      });
    }
    return groups;
  });

  private readonly rows = computed(() => this.groups().flatMap((g) => g.rows));
  protected readonly activeId = computed(
    () => this.rows()[this.active()]?.id ?? null,
  );

  /** Ideas to type, shown under the empty line. */
  protected readonly hints = ['kantone', 'sekunden', 'bonus', 'logik', 'neu'];

  protected setQuery(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.rows().length;
    if (event.key === 'ArrowDown' && count) {
      event.preventDefault();
      this.active.update((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp' && count) {
      event.preventDefault();
      this.active.update((i) => (i - 1 + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const row = this.rows()[this.active()];
      if (row) {
        this.run(row);
      }
    } else if (event.key === 'Escape') {
      this.setQuery('');
    }
  }

  /** «/» or ⌘K puts the cursor into the line from anywhere. */
  protected onGlobalKey(event: KeyboardEvent): void {
    const typing = (event.target as HTMLElement).closest(
      'input, textarea, css-input-text, css-input-textarea, css-input-stepper',
    );
    if (
      (event.key === '/' && !typing) ||
      (event.key === 'k' && (event.metaKey || event.ctrlKey))
    ) {
      event.preventDefault();
      this.field().nativeElement.focus();
    }
  }

  protected run(row: Row): void {
    if (row.kind === 'command') {
      row.command.run();
    } else if (row.kind === 'question') {
      this.store.openEditor(row.question);
    } else if (row.kind === 'bonus') {
      const bonus = this.store.form()?.speedBonusEnabled ?? false;
      void this.store.applyAndSave({ speedBonusEnabled: !bonus });
    }
  }

  protected toggle(question: AdminQuestion, event: Event): void {
    void this.store.setActive(question, eventChecked(event));
  }

  protected setBonus(event: Event): void {
    void this.store.applyAndSave({ speedBonusEnabled: eventChecked(event) });
  }

  /** A changed value saves itself after a short pause. */
  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      if (this.store.valid() && this.store.dirty()) {
        void this.store.saveSettings();
      }
    }, SAVE_DELAY_MS);
  }

  protected typeHint(hint: string): void {
    this.setQuery(hint);
    this.field().nativeElement.focus();
  }
}
