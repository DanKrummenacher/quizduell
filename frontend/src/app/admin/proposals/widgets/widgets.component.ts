// TEMPORARY: proposal P «Widgets» (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import '@css-ch/components/input-stepper';
import '@css-ch/components/switch';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import { emptyDraft, hasErrors, validateDraft } from '../../questions/question-form';
import { ProposalPro } from '../pro';
import {
  apiErrorMessage,
  formatDuration,
  NUMERIC_FIELDS,
  type NumericKey,
  ProposalStore,
  successRate,
} from '../proposal-store';
import { ImportDialogComponent } from '../shared/import-dialog.component';
import { readJson, writeJson } from '../shared/json-store';
import { ProposalDialogsComponent } from '../shared/proposal-dialogs.component';
import { SaveRulesDialogComponent } from '../shared/save-rules-dialog.component';

type WidgetId =
  | 'status'
  | 'live'
  | 'today'
  | 'quick'
  | 'questions'
  | 'rules'
  | 'categories'
  | 'quality'
  | 'recent'
  | 'files';
type Size = 's' | 'm' | 'l';

interface Placed {
  id: WidgetId;
  size: Size;
}

const LAYOUT_KEY = 'playduelio.admin.widgets';

const CATALOGUE: { id: WidgetId; title: string; text: string; size: Size }[] = [
  {
    id: 'status',
    title: 'Spielbereit',
    text: 'Ob das Quiz gespielt werden kann',
    size: 's',
  },
  { id: 'live', title: 'Jetzt', text: 'Geräte, Duelle und Suchende', size: 's' },
  { id: 'today', title: 'Heute', text: 'Duelle heute und insgesamt', size: 's' },
  {
    id: 'quick',
    title: 'Schnell erfassen',
    text: 'Eine Frage direkt im Dashboard anlegen',
    size: 'm',
  },
  {
    id: 'questions',
    title: 'Fragen',
    text: 'Suchen, an- und ausschalten, bearbeiten',
    size: 'm',
  },
  {
    id: 'rules',
    title: 'Spielregeln',
    text: 'Die wichtigsten Regeln direkt ändern',
    size: 'm',
  },
  {
    id: 'categories',
    title: 'Kategorien',
    text: 'Ganze Kategorien an- und ausschalten',
    size: 's',
  },
  {
    id: 'quality',
    title: 'Qualität',
    text: 'Zu schwer, zu leicht, doppelt',
    size: 's',
  },
  {
    id: 'recent',
    title: 'Zuletzt bearbeitet',
    text: 'Die letzten Änderungen',
    size: 's',
  },
  {
    id: 'files',
    title: 'Import und Export',
    text: 'CSV, Beispielfragen, alles löschen',
    size: 's',
  },
];

const DEFAULT_LAYOUT: Placed[] = [
  { id: 'status', size: 's' },
  { id: 'live', size: 's' },
  { id: 'today', size: 's' },
  { id: 'questions', size: 'm' },
  { id: 'quick', size: 'm' },
  { id: 'rules', size: 'm' },
  { id: 'categories', size: 'm' },
  { id: 'quality', size: 's' },
  { id: 'recent', size: 's' },
  { id: 'files', size: 's' },
];

/**
 * A dashboard everyone arranges for their own work: widgets for the live
 * state, a quick entry, the rules and the questions; added, moved, sized
 * and removed in «Anpassen». The arrangement stays in this browser.
 */
@Component({
  selector: 'app-widgets',
  imports: [
    LogoMarkComponent,
    ProposalDialogsComponent,
    ImportDialogComponent,
    SaveRulesDialogComponent,
  ],
  templateUrl: './widgets.component.html',
  styleUrl: './widgets.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WidgetsComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  readonly openGame = output<void>();
  readonly logout = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly rate = successRate;
  protected readonly duration = formatDuration;
  protected readonly checked = eventChecked;
  protected readonly ruleFields = NUMERIC_FIELDS.slice(0, 3);

  protected readonly layout = signal<Placed[]>(this.restore());
  protected readonly editing = signal(false);
  protected readonly dragging = signal<number | null>(null);
  protected readonly importing = signal(false);
  protected readonly reviewing = signal(false);
  protected readonly search = signal('');

  protected readonly hidden = computed(() =>
    CATALOGUE.filter((w) => !this.layout().some((p) => p.id === w.id)),
  );
  protected readonly titles = Object.fromEntries(
    CATALOGUE.map((w) => [w.id, w.title]),
  ) as Record<WidgetId, string>;

  // Quick entry
  protected readonly quick = signal(emptyDraft());
  protected readonly quickTried = signal(false);
  protected readonly quickErrors = computed(() =>
    this.quickTried() ? validateDraft(this.quick()) : {},
  );
  protected readonly quickSaving = signal(false);

  protected readonly found = computed(() => {
    const term = this.search().trim().toLowerCase();
    return (this.store.questions() ?? [])
      .filter(
        (q) =>
          !term ||
          [q.text, q.category ?? '', ...q.options].some((v) =>
            v.toLowerCase().includes(term),
          ),
      )
      .slice(0, 8);
  });
  protected readonly recent = computed(() =>
    [...(this.store.questions() ?? [])]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5),
  );

  // -- Layout ----------------------------------------------------------------
  protected add(id: WidgetId): void {
    const size = CATALOGUE.find((w) => w.id === id)?.size ?? 's';
    this.save([...this.layout(), { id, size }]);
  }

  protected remove(index: number): void {
    this.save(this.layout().filter((_, i) => i !== index));
  }

  protected resize(index: number): void {
    const order: Size[] = ['s', 'm', 'l'];
    this.save(
      this.layout().map((p, i) =>
        i === index
          ? { ...p, size: order[(order.indexOf(p.size) + 1) % order.length]! }
          : p,
      ),
    );
  }

  protected shift(index: number, step: number): void {
    const target = index + step;
    if (target >= 0 && target < this.layout().length) {
      this.place(index, target);
    }
  }

  protected reset(): void {
    this.save([...DEFAULT_LAYOUT]);
  }

  protected dragStart(event: DragEvent, index: number): void {
    this.dragging.set(index);
    event.dataTransfer?.setData('text/plain', String(index));
  }

  protected dragOver(event: DragEvent): void {
    if (this.dragging() !== null) {
      event.preventDefault();
    }
  }

  protected drop(event: DragEvent, index: number): void {
    event.preventDefault();
    const from = this.dragging();
    this.dragging.set(null);
    if (from !== null && from !== index) {
      this.place(from, index);
    }
  }

  private place(from: number, to: number): void {
    const next = [...this.layout()];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    this.save(next);
  }

  private save(layout: Placed[]): void {
    this.layout.set(layout);
    writeJson(LAYOUT_KEY, layout);
  }

  private restore(): Placed[] {
    const stored = readJson<Placed[]>(LAYOUT_KEY);
    const known = new Set(CATALOGUE.map((w) => w.id));
    return Array.isArray(stored) && stored.every((p) => known.has(p.id))
      ? stored
      : [...DEFAULT_LAYOUT];
  }

  // -- Widgets ---------------------------------------------------------------
  protected date(value: string): string {
    return new Date(value).toLocaleString('de-CH', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  protected typed(event: Event): string {
    return (event.target as HTMLInputElement).value ?? '';
  }

  protected setQuickOption(index: number, value: string): void {
    this.quick.update((d) => {
      const options = [...d.options];
      options[index] = value;
      return { ...d, options };
    });
  }

  protected async addQuick(): Promise<void> {
    this.quickTried.set(true);
    if (hasErrors(validateDraft(this.quick()))) {
      return;
    }
    this.quickSaving.set(true);
    try {
      await this.store.saveQuestion(this.quick(), null);
      this.quick.set({ ...emptyDraft(), category: this.quick().category });
      this.quickTried.set(false);
    } catch (error) {
      this.store.flash('error', apiErrorMessage(error));
    } finally {
      this.quickSaving.set(false);
    }
  }

  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }
}
