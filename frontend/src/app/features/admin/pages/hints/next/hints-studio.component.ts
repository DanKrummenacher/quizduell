import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { formatPercent } from '../../../core/format';
import { HINT_TYPE_LABELS, SEVERITY_LABELS } from '../../../core/hint-texts';
import { AdAnswerDistributionComponent } from '../../../ui/answer-distribution.component';
import {
  actionOf,
  CHECK_GROUPS,
  type HintItem,
  limitOf,
  measured,
} from './hint-item';

export interface StudioPoint {
  id: number;
  rate: number;
  flagged: boolean;
  text?: string;
  category?: string;
  time?: number;
  lead?: number;
  severity?: string | null;
}

type Filter = 'all' | 'urgent' | 'later';
type SortKey = 'severity' | 'rate' | 'lead' | 'time' | 'text';

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Dots on one line, moved up or down where they would touch. */
function laned<T extends { x: number }>(points: T[], gap: number) {
  const lanes: number[] = [];
  const order = [0, -1, 1, -2, 2, -3, 3];
  return [...points]
    .sort((a, b) => a.x - b.x)
    .map((point) => {
      let lane = lanes.findIndex((last) => point.x - last >= gap);
      if (lane < 0) {
        lane = Math.min(lanes.length, order.length - 1);
      }
      lanes[lane] = point.x;
      return { ...point, lane: order[lane]! };
    });
}

/**
 * Temporary: four whole page drafts of the hints page, built only from the
 * parts of the admin – cards, badges, round buttons, tables.
 */
@Component({
  selector: 'app-hints-studio',
  imports: [AdAnswerDistributionComponent],
  templateUrl: './hints-studio.component.html',
  styleUrl: './hints-studio.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HintsStudioComponent {
  readonly variant = input.required<string>();
  readonly items = input.required<HintItem[]>();
  readonly judged = input(0);
  readonly flagged = input(0);
  readonly spread = input<StudioPoint[]>([]);

  readonly act = output<HintItem>();
  readonly ignore = output<{ item: HintItem; ignored: boolean }>();
  readonly pauseHint = output<HintItem>();
  readonly details = output<HintItem>();

  protected readonly kinds = HINT_TYPE_LABELS;
  protected readonly severities = SEVERITY_LABELS;
  protected readonly percent = formatPercent;
  protected readonly measured = measured;
  protected readonly limitOf = limitOf;
  protected readonly actionOf = actionOf;
  protected readonly Math = Math;

  protected readonly showIgnored = signal(false);
  protected readonly open = computed(() =>
    this.items().filter((item) => !item.hint.ignored),
  );
  protected readonly ignoredItems = computed(() =>
    this.items().filter((item) => item.hint.ignored),
  );
  protected readonly urgent = computed(() =>
    this.open().filter((item) => item.hint.severity !== 'medium'),
  );
  protected readonly quality = computed(() =>
    this.judged() ? (this.judged() - this.flagged()) / this.judged() : null,
  );
  protected readonly checkedAt = new Date().toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  /** Every flagged question has a number, the most urgent first. */
  protected readonly marks = computed(() => {
    const map = new Map<number, { n: number; item: HintItem }>();
    for (const item of this.open()) {
      const id = item.hint.questionId;
      if (id !== null && !map.has(id)) {
        map.set(id, { n: map.size + 1, item });
      }
    }
    return map;
  });
  protected markOf(id: number | null): number | null {
    return id === null ? null : (this.marks().get(id)?.n ?? null);
  }
  protected tone(severity: string | null | undefined): string {
    return severity === 'medium' ? 'warning' : severity ? 'danger' : 'ok';
  }

  // t1: the map and the list, linked.
  protected readonly filter = signal<Filter>('all');
  protected readonly listed = computed(() => {
    const base = this.showIgnored() ? this.ignoredItems() : this.open();
    const filter = this.filter();
    return base.filter(
      (item) =>
        filter === 'all' ||
        (filter === 'urgent') === (item.hint.severity !== 'medium'),
    );
  });
  protected readonly pickedKey = signal<string | null>(null);
  protected readonly picked = computed(
    () =>
      this.listed().find((item) => item.hint.key === this.pickedKey()) ??
      this.listed()[0] ??
      null,
  );
  protected readonly hoverId = signal<number | null>(null);
  protected readonly mapPoints = computed(() =>
    this.spread().map((p) => {
      const mark = this.marks().get(p.id);
      return {
        ...p,
        n: mark?.n ?? null,
        item: mark?.item ?? null,
        x: clamp(p.rate * 100, 1.5, 98.5),
        y: clamp(((p.time ?? 0) / 0.4) * 100, 2.5, 97.5),
      };
    }),
  );
  protected pick(item: HintItem): void {
    this.pickedKey.set(item.hint.key);
  }
  protected pickPoint(item: HintItem | null): void {
    if (item) {
      this.filter.set('all');
      this.showIgnored.set(false);
      this.pick(item);
    }
  }
  protected count(filter: Filter): number {
    const base = this.showIgnored() ? this.ignoredItems() : this.open();
    return base.filter(
      (item) =>
        filter === 'all' ||
        (filter === 'urgent') === (item.hint.severity !== 'medium'),
    ).length;
  }

  // t2: the report, one section per check.
  protected readonly sections = computed(() => {
    const rows = [
      {
        id: 'clear',
        zone: { from: 100 / 3, to: 100 },
        ticks: [
          { at: 0, text: '−50 Punkte' },
          { at: 100 / 3, text: 'gleich auf' },
          { at: 100, text: '+100 Punkte' },
        ],
        axis: 'Vorsprung der richtigen vor der besten falschen Antwort',
        pos: (p: StudioPoint) => (((p.lead ?? 0) + 0.5) / 1.5) * 100,
        label: (p: StudioPoint) =>
          `${Math.round((p.lead ?? 0) * 100)} Punkte Vorsprung der richtigen`,
      },
      {
        id: 'level',
        zone: { from: 30, to: 95 },
        ticks: [
          { at: 0, text: '0 %' },
          { at: 30, text: '30 %' },
          { at: 95, text: '95 %' },
        ],
        axis: 'Anteil richtiger Antworten',
        pos: (p: StudioPoint) => p.rate * 100,
        label: (p: StudioPoint) => `${formatPercent(p.rate)} richtig`,
      },
      {
        id: 'time',
        zone: { from: 0, to: 50 },
        ticks: [
          { at: 0, text: '0 %' },
          { at: 50, text: '20 %' },
          { at: 100, text: '40 %' },
        ],
        axis: 'Anteil ohne Antwort',
        pos: (p: StudioPoint) => ((p.time ?? 0) / 0.4) * 100,
        label: (p: StudioPoint) => `${formatPercent(p.time ?? 0)} ohne Antwort`,
      },
    ];
    const shown = this.showIgnored() ? this.ignoredItems() : this.open();
    return CHECK_GROUPS.map((group) => {
      const items = shown.filter((item) => group.types.includes(item.hint.type));
      const row = rows.find((r) => r.id === group.id) ?? null;
      const bad = new Set(items.map((item) => item.hint.questionId));
      const dots = row
        ? laned(
            this.spread().map((p) => ({
              id: p.id,
              text: p.text ?? '',
              label: row.label(p),
              bad: bad.has(p.id),
              x: clamp(row.pos(p), 1, 99),
            })),
            1.1,
          ).map((dot) => ({ ...dot, n: dot.bad ? this.markOf(dot.id) : null }))
        : [];
      return { ...group, items, row, dots };
    });
  });
  protected readonly passed = computed(
    () => this.sections().filter((section) => !section.items.length).length,
  );

  // t3: one hint after the other.
  protected readonly index = signal(0);
  protected readonly queue = computed(() =>
    this.showIgnored() ? this.ignoredItems() : this.open(),
  );
  protected readonly done = signal<Set<string>>(new Set());
  protected readonly current = computed(() => {
    const queue = this.queue();
    return queue.length ? queue[clamp(this.index(), 0, queue.length - 1)]! : null;
  });
  protected go(step: number): void {
    const length = this.queue().length;
    if (length) {
      this.index.set(clamp(this.index() + step, 0, length - 1));
    }
  }
  protected decide(what: 'act' | 'pause' | 'ignore', item: HintItem): void {
    if (what === 'act') {
      this.act.emit(item);
    } else if (what === 'pause') {
      this.pauseHint.emit(item);
    } else {
      this.ignore.emit({ item, ignored: !item.hint.ignored });
    }
    const done = new Set(this.done());
    done.add(item.hint.key);
    this.done.set(done);
    this.go(1);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (this.variant() !== 't3' || target?.closest('input, textarea, select')) {
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'j') {
      this.go(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'k') {
      this.go(-1);
    }
  }

  // t4: every question in a table, sortable.
  protected readonly showAll = signal(false);
  protected readonly sortKey = signal<SortKey>('severity');
  protected readonly sortUp = signal(true);
  protected readonly rows = computed(() => {
    const marks = this.marks();
    const rows = this.spread()
      .map((p) => {
        const mark = marks.get(p.id);
        return {
          ...p,
          n: mark?.n ?? null,
          item: mark?.item ?? null,
          rank: mark ? (SEVERITY_RANK[mark.item.hint.severity] ?? 3) : 4,
          hard: p.rate < 0.3,
          easy: p.rate >= 0.95,
          slow: (p.time ?? 0) >= 0.2,
          lure: (p.lead ?? 0) < 0,
        };
      })
      .filter((row) => this.showAll() || row.item);
    const key = this.sortKey();
    const dir = this.sortUp() ? 1 : -1;
    const value = (row: (typeof rows)[number]): number | string =>
      key === 'severity'
        ? row.rank * 1000 + (row.n ?? 0)
        : key === 'rate'
          ? row.rate
          : key === 'lead'
            ? (row.lead ?? 0)
            : key === 'time'
              ? (row.time ?? 0)
              : (row.text ?? '');
    return rows.sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      return (
        (typeof va === 'string'
          ? va.localeCompare(vb as string)
          : va - (vb as number)) * dir
      );
    });
  });
  protected readonly poolItem = computed(
    () => this.open().find((item) => !item.question) ?? null,
  );
  protected sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortUp.set(!this.sortUp());
    } else {
      this.sortKey.set(key);
      this.sortUp.set(key === 'severity' || key === 'text' || key === 'rate');
    }
  }
  protected sortState(key: SortKey): string {
    return this.sortKey() !== key
      ? 'none'
      : this.sortUp()
        ? 'ascending'
        : 'descending';
  }
  protected readonly strip = computed(() =>
    laned(
      this.spread().map((p) => ({
        id: p.id,
        bad: p.flagged,
        x: clamp(p.rate * 100, 1, 99),
      })),
      1.6,
    ),
  );
}
