import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { formatPercent } from '../../../core/format';

import { HINT_TYPE_LABELS, SEVERITY_LABELS } from '../../../core/hint-texts';
import { actionOf, type HintItem, limitOf, measured } from './hint-item';

/**
 * Temporary: a draft of the hints page built from the parts of the questions
 * page – quick tiles, the toolbar, chapters with a table, the selection bar.
 */
@Component({
  selector: 'app-hints-next-list',
  templateUrl: './hints-next-list.component.html',
  styleUrls: [
    '../../questions/questions.component.scss',
    '../../questions/questions-bulk.scss',
    './hints-next-list.scss',
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HintsNextListComponent {
  readonly variant = input('v3');
  readonly items = input.required<HintItem[]>();
  readonly judged = input(0);
  readonly flagged = input(0);

  readonly act = output<HintItem>();
  readonly ignoreMany = output<{ items: HintItem[]; ignored: boolean }>();
  readonly pauseMany = output<HintItem[]>();
  readonly details = output<HintItem>();

  protected readonly measured = measured;
  protected readonly limitOf = limitOf;
  protected readonly actionOf = actionOf;
  protected readonly kinds = HINT_TYPE_LABELS;
  protected readonly severities = SEVERITY_LABELS;
  protected readonly percent = formatPercent;

  protected readonly search = signal('');
  protected readonly status = signal<'open' | 'ignored'>('open');
  protected readonly quick = signal<string | null>(null);
  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly collapsed = signal<Set<string>>(new Set());

  protected readonly quality = computed(() =>
    this.judged()
      ? formatPercent((this.judged() - this.flagged()) / this.judged())
      : '–',
  );

  protected readonly tiles = computed(() => {
    const open = this.items().filter((item) => !item.hint.ignored);
    return [
      {
        id: 'urgent',
        label: 'Bald angehen',
        value: open.filter((item) => item.hint.severity !== 'medium').length,
        note: 'Kritisch und wichtig',
      },
      {
        id: 'questions',
        label: 'Einzelne Fragen',
        value: open.filter((item) => item.question).length,
        note: 'verwirrend, zu schwer, zu leicht',
      },
      {
        id: 'pool',
        label: 'Fragenbestand',
        value: open.filter((item) => !item.question).length,
        note: 'genug Fragen im Spiel',
      },
      {
        id: 'ignored',
        label: 'Ignoriert',
        value: this.items().filter((item) => item.hint.ignored).length,
        note: 'bewusst so gelassen',
      },
    ];
  });

  protected readonly rows = computed(() => {
    const words = this.search().trim().toLowerCase();
    const quick = this.quick();
    return this.items()
      .filter((item) => item.hint.ignored === (this.status() === 'ignored'))
      .filter(
        (item) =>
          !quick ||
          (quick === 'urgent' && item.hint.severity !== 'medium') ||
          (quick === 'questions' && !!item.question) ||
          (quick === 'pool' && !item.question),
      )
      .filter(
        (item) =>
          !words ||
          [
            item.text.title,
            item.question?.text ?? '',
            item.question ? 'f-' + item.question.id : '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(words),
      );
  });

  protected readonly groups = computed(() =>
    this.variant() === 'v7' ? this.byCategory() : this.bySeverity(),
  );
  private readonly byCategory = computed(() => {
    const names = [
      ...new Set(
        this.rows().map((item) => item.question?.category ?? 'Fragenbestand'),
      ),
    ];
    return names.map((name) => {
      const rows = this.rows().filter(
        (item) => (item.question?.category ?? 'Fragenbestand') === name,
      );
      const rated = rows.filter((item) => item.question);
      const average = rated.length
        ? rated.reduce(
            (sum, item) =>
              sum +
              item.question!.stats.correct /
                Math.max(1, item.question!.stats.answers),
            0,
          ) / rated.length
        : null;
      return { name, label: name, rows, average };
    });
  });
  private readonly bySeverity = computed(() =>
    (['critical', 'high', 'medium'] as const)
      .map((severity) => ({
        name: severity,
        label: SEVERITY_LABELS[severity],
        rows: this.rows().filter((item) => item.hint.severity === severity),
        average: null as number | null,
      }))
      .filter((group) => group.rows.length),
  );

  protected readonly count = computed(() => this.selected().size);
  protected readonly chosen = computed(() =>
    this.rows().filter((item) => this.selected().has(item.hint.key)),
  );
  protected readonly pausable = computed(
    () => this.chosen().filter((item) => item.question?.active).length,
  );

  protected setStatus(status: 'open' | 'ignored'): void {
    this.status.set(status);
    this.selected.set(new Set());
  }
  protected pickQuick(id: string): void {
    if (id === 'ignored') {
      this.quick.set(null);
      this.setStatus(this.status() === 'ignored' ? 'open' : 'ignored');
      return;
    }
    this.status.set('open');
    this.quick.set(this.quick() === id ? null : id);
  }
  protected toggleRow(key: string): void {
    const next = new Set(this.selected());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.selected.set(next);
  }
  protected groupState(rows: HintItem[]): 'all' | 'some' | 'none' {
    const hit = rows.filter((row) => this.selected().has(row.hint.key)).length;
    return hit === 0 ? 'none' : hit === rows.length ? 'all' : 'some';
  }
  protected toggleGroupRows(rows: HintItem[]): void {
    const next = new Set(this.selected());
    const all = this.groupState(rows) === 'all';
    for (const row of rows) {
      if (all) {
        next.delete(row.hint.key);
      } else {
        next.add(row.hint.key);
      }
    }
    this.selected.set(next);
  }
  protected toggleGroup(name: string): void {
    const next = new Set(this.collapsed());
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.collapsed.set(next);
  }
  protected selectAll(): void {
    this.selected.set(new Set(this.rows().map((row) => row.hint.key)));
  }
  protected clear(): void {
    this.selected.set(new Set());
  }
  protected bulkIgnore(): void {
    this.ignoreMany.emit({
      items: this.chosen(),
      ignored: this.status() === 'open',
    });
    this.clear();
  }
  protected bulkPause(): void {
    this.pauseMany.emit(this.chosen().filter((item) => item.question?.active));
    this.clear();
  }
  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
