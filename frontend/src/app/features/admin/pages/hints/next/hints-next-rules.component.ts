import { NgTemplateOutlet } from '@angular/common';
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

interface SpreadPoint {
  id: number;
  rate: number;
  flagged: boolean;
  text?: string;
  category?: string;
  time?: number;
  lead?: number;
  severity?: string | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** s2: how many values fall in each of `count` bins up to `max`. */
function binsOf(values: number[], count: number, max: number) {
  const out = Array.from({ length: count }, () => 0);
  for (const value of values) {
    out[Math.min(count - 1, Math.floor((value / max) * count))]! += 1;
  }
  const top = Math.max(1, ...out);
  return out.map((n, i) => ({ i, n, h: (n / top) * 100, from: (i / count) * max }));
}

/** s: a point on the half circle of the gauge. */
function onGauge(value: number, r: number) {
  const a = Math.PI * (1 - clamp(value, 0, 1));
  return { x: 120 + r * Math.cos(a), y: 124 - r * Math.sin(a) };
}

/** s6: dots on one line, moved up or down where they would touch. */
function laned<T extends { x: number }>(points: T[], gap: number, count = 5) {
  const lanes: number[] = [];
  const order = [0, -1, 1, -2, 2, -3, 3].slice(0, count);
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

/** r4: an arc of the ring, from one angle to another. */
function arc(r: number, from: number, to: number): string {
  const at = (a: number) =>
    `${(100 + r * Math.sin(a)).toFixed(2)} ${(100 - r * Math.cos(a)).toFixed(2)}`;
  const large = to - from > Math.PI ? 1 : 0;
  return `M ${at(from)} A ${r} ${r} 0 ${large} 1 ${at(to)}`;
}

/**
 * Temporary: drafts of the hints page built from the parts of the rules
 * page – figures, steps, chapters with a head and a value with its menu.
 */
@Component({
  selector: 'app-hints-next-rules',
  imports: [NgTemplateOutlet, AdAnswerDistributionComponent],
  templateUrl: './hints-next-rules.component.html',
  styleUrls: [
    '../../settings/settings.component.scss',
    '../../settings/settings-rules.scss',
    '../../settings/settings-bar.scss',
    './hints-next-rules.scss',
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HintsNextRulesComponent {
  readonly variant = input.required<string>();
  readonly items = input.required<HintItem[]>();
  readonly judged = input(0);
  readonly flagged = input(0);
  readonly spread = input<SpreadPoint[]>([]);
  readonly categories = input<
    { name: string; total: number; bad: number; score: number }[]
  >([]);

  readonly act = output<HintItem>();
  readonly ignore = output<{ item: HintItem; ignored: boolean }>();
  readonly pauseHint = output<HintItem>();
  readonly details = output<HintItem>();

  protected readonly measured = measured;
  protected readonly limitOf = limitOf;
  protected readonly actionOf = actionOf;
  protected readonly kinds = HINT_TYPE_LABELS;
  protected readonly severities = SEVERITY_LABELS;
  protected readonly percent = formatPercent;

  protected readonly showIgnored = signal(false);
  protected readonly menuKey = signal<string | null>(null);
  protected readonly openGroups = signal<Set<string> | null>(null);
  protected readonly openRow = signal<string | null>(null);

  protected readonly open = computed(() =>
    this.items().filter((item) => !item.hint.ignored),
  );
  protected readonly ignored = computed(() =>
    this.items().filter((item) => item.hint.ignored),
  );
  /** y5: the head filters the steps by severity. */
  protected readonly sevFilter = signal<'all' | 'urgent' | 'medium'>('all');
  protected readonly shown = computed(() =>
    (this.showIgnored() ? this.ignored() : this.open()).filter(
      (item) =>
        this.sevFilter() === 'all' ||
        (this.sevFilter() === 'urgent') === (item.hint.severity !== 'medium'),
    ),
  );
  protected readonly urgent = computed(() =>
    this.open().filter((item) => item.hint.severity !== 'medium'),
  );
  protected readonly quality = computed(() =>
    this.judged() ? (this.judged() - this.flagged()) / this.judged() : null,
  );

  protected readonly groups = computed(() =>
    CHECK_GROUPS.map((group) => ({
      ...group,
      items: this.shown().filter((item) => group.types.includes(item.hint.type)),
    })),
  );
  protected readonly bySeverity = computed(() =>
    (['critical', 'high', 'medium'] as const)
      .map((severity) => ({
        severity,
        title: SEVERITY_LABELS[severity],
        note: {
          critical: 'Betrifft das Spiel direkt – zuerst angehen.',
          high: 'Verwirrt Spielende oder entscheidet Duelle unfair.',
          medium: 'Hat Zeit, bei Gelegenheit ansehen.',
        }[severity],
        items: this.shown().filter((item) => item.hint.severity === severity),
      }))
      .filter((group) => group.items.length),
  );

  protected isOpen(id: string, hasItems: boolean): boolean {
    const open = this.openGroups();
    return open ? open.has(id) : hasItems;
  }
  protected toggleGroup(id: string, hasItems: boolean): void {
    if (!hasItems) {
      return;
    }
    const ids: string[] =
      this.variant() === 'v2'
        ? this.bySeverity().map((group) => group.severity)
        : this.groups()
            .filter((group) => group.items.length)
            .map((group) => group.id);
    const next = new Set(this.openGroups() ?? ids);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.openGroups.set(next);
  }

  protected kindOf(item: HintItem): string {
    return HINT_TYPE_LABELS[item.hint.type];
  }

  protected toggleMenu(key: string): void {
    this.menuKey.set(this.menuKey() === key ? null : key);
  }
  protected toggleRow(key: string): void {
    this.openRow.set(this.openRow() === key ? null : key);
  }

  /** v4: the check picked like a preset. */
  protected readonly pickedCheck = signal<string | null>(null);
  protected readonly activeCheck = computed(
    () =>
      this.pickedCheck() ??
      this.groups().find((group) => group.items.length)?.id ??
      CHECK_GROUPS[0]!.id,
  );
  protected readonly checkItems = computed(
    () =>
      this.groups().find((group) => group.id === this.activeCheck())?.items ?? [],
  );
  protected readonly checkTitle = computed(
    () => CHECK_GROUPS.find((group) => group.id === this.activeCheck())?.title ?? '',
  );

  /** v5: one chapter per question, every check in it. */
  protected readonly byQuestion = computed(() => {
    const seen = new Map<number, HintItem[]>();
    for (const item of this.shown()) {
      if (item.question) {
        seen.set(item.question.id, [...(seen.get(item.question.id) ?? []), item]);
      }
    }
    return [...seen].map(([id, items]) => {
      const q = items[0]!.question!;
      const answered = Math.max(1, q.stats.answers);
      const shownCount = q.stats.answers + q.stats.timeouts;
      const total = q.stats.picks.reduce((sum, n) => sum + n, 0) || 1;
      const lure = Math.max(
        0,
        ...q.stats.picks
          .filter((_, i) => i !== q.correctIndex)
          .map((n) => n / total),
      );
      const find = (types: string[]) =>
        items.find((item) => types.includes(item.hint.type)) ?? null;
      return {
        id,
        question: q,
        items,
        worst: items[0]!.hint.severity,
        checks: [
          {
            title: 'Verständlichkeit',
            limit: 'unter richtiger',
            value: `${formatPercent(lure)} beste falsche`,
            item: find(['lure']),
          },
          {
            title: 'Schwierigkeit',
            limit: '30 bis 95 %',
            value: `${formatPercent(q.stats.correct / answered)} richtig`,
            item: find(['hard', 'easy']),
          },
          {
            title: 'Zeit zum Antworten',
            limit: 'unter 20 %',
            value: `${formatPercent(shownCount ? q.stats.timeouts / shownCount : 0)} ohne Antwort`,
            item: find(['timeouts']),
          },
        ],
      };
    });
  });
  protected readonly poolShown = computed(() =>
    this.shown().filter((item) => !item.question),
  );

  /** v6: decisions staged first, carried out together from the bar. */
  protected readonly staged = signal<Map<string, 'act' | 'pause' | 'ignore'>>(
    new Map(),
  );
  protected readonly reviewOpen = signal(false);
  protected readonly stagedRows = computed(() =>
    this.items()
      .filter((item) => this.staged().has(item.hint.key))
      .map((item) => ({ item, what: this.staged().get(item.hint.key)! })),
  );
  protected readonly decisionLabels = {
    act: 'Überarbeiten',
    pause: 'Pausieren',
    ignore: 'Ignorieren',
  };
  protected decisionsFor(item: HintItem): ('act' | 'pause' | 'ignore')[] {
    return item.question?.active ? ['act', 'pause', 'ignore'] : ['act', 'ignore'];
  }
  protected stage(item: HintItem, what: 'act' | 'pause' | 'ignore'): void {
    const next = new Map(this.staged());
    if (next.get(item.hint.key) === what) {
      next.delete(item.hint.key);
    } else {
      next.set(item.hint.key, what);
    }
    this.staged.set(next);
    this.menuKey.set(null);
  }
  protected unstage(key: string): void {
    const next = new Map(this.staged());
    next.delete(key);
    this.staged.set(next);
    if (!next.size) {
      this.reviewOpen.set(false);
    }
  }
  protected discardStaged(): void {
    this.staged.set(new Map());
    this.reviewOpen.set(false);
  }
  protected carryOut(): void {
    for (const row of this.stagedRows()) {
      if (row.what === 'act') {
        this.act.emit(row.item);
      } else if (row.what === 'pause') {
        this.pauseHint.emit(row.item);
      } else {
        this.ignore.emit({ item: row.item, ignored: true });
      }
    }
    this.discardStaged();
  }

  /** v8: a category picked like a preset. */
  protected readonly pickedCategory = signal<string | null>(null);
  protected readonly categoryItems = computed(() =>
    this.shown().filter(
      (item) =>
        !this.pickedCategory() ||
        (item.question?.category ?? 'Fragenbestand') === this.pickedCategory(),
    ),
  );
  protected readonly categoryGroups = computed(() =>
    CHECK_GROUPS.map((group) => ({
      ...group,
      items: this.categoryItems().filter((item) =>
        group.types.includes(item.hint.type),
      ),
    })).filter((group) => group.items.length),
  );

  /** Which head a variant has instead of the figures. */
  protected readonly top = computed(
    () =>
      ({
        v9: 'band',
        v10: 'ring',
        v11: 'histo',
        v12: 'matrix',
        v13: 'side',
        v14: 'goal',
        v15: 'funnel',
        v16: 'cats',
        v17: 'waffle',
        v18: 'spot',
        v19: 'none',
        v20: 'search',
        v21: 'trend',
        v22: 'heat',
        v23: 'whatif',
        v24: 'line',
        v25: 'none',
        v26: 'tabs',
        b1: 'lage',
        b2: 'line',
        b3: 'analyse',
        b4: 'none',
        c1: 'line',
        c2: 'lage',
        c3: 'trend',
        c4: 'tabs',
        d1: 'line',
        d2: 'none',
        d3: 'ring',
        d4: 'sentence',
        z1: 'lage',
        z2: 'line',
        z3: 'band',
        z4: 'sentence',
        z5: 'histo',
        z6: 'goal',
        z7: 'trend',
        z8: 'none',
        y1: 'stepper',
        y2: 'overview-step',
        y3: 'navy',
        y4: 'split',
        y5: 'filter',
        y6: 'meta',
        q1: 'rings',
        q2: 'gauge',
        q3: 'chips',
        q4: 'hero2',
        q5: 'score',
        q6: 'prose',
        r1: 'spectrum',
        r2: 'aurora',
        r3: 'barcode',
        r4: 'donut',
        r5: 'map',
        r6: 'focus',
        s1: 'spec-gauge',
        s2: 'map-margins',
        s3: 'gauge-lg',
        s4: 'switch',
        s5: 'spec-head',
        s6: 'strips',
      })[this.variant()] ?? 'figures',
  );

  /** v9: every judged question in one bar, by what was found. */
  protected readonly band = computed(() => {
    const judged = Math.max(this.judged(), 1);
    const parts = CHECK_GROUPS.filter((group) => group.id !== 'pool').map(
      (group) => ({
        id: group.id,
        title: group.title,
        count: new Set(
          this.open()
            .filter((item) => group.types.includes(item.hint.type))
            .map((item) => item.hint.questionId),
        ).size,
      }),
    );
    return {
      ok: this.judged() - this.flagged(),
      parts: parts.filter((part) => part.count),
      width: (n: number) => (n / judged) * 100,
    };
  });

  /** v10: the ring of the quality. */
  protected readonly ringDash = computed(() => {
    const length = 2 * Math.PI * 54;
    return `${(this.quality() ?? 0) * length} ${length}`;
  });

  /** v11: how many questions fall in each tenth of correct answers. */
  protected readonly histo = computed(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({
      from: i / 10,
      total: 0,
      flagged: 0,
    }));
    for (const point of this.spread()) {
      const bin = bins[Math.min(9, Math.floor(point.rate * 10))]!;
      bin.total += 1;
      bin.flagged += point.flagged ? 1 : 0;
    }
    const max = Math.max(1, ...bins.map((bin) => bin.total));
    return bins.map((bin) => ({
      ...bin,
      height: (bin.total / max) * 100,
      flaggedHeight: (bin.flagged / max) * 100,
      zone: bin.from < 0.3 ? 'low' : bin.from >= 0.9 ? 'high' : 'good',
    }));
  });

  /** v12: categories against the checks, as a matrix of lights. */
  protected readonly matrixChecks = CHECK_GROUPS.filter(
    (group) => group.id !== 'pool',
  );
  protected readonly lights = computed(() =>
    this.categories().map((cat) => ({
      name: cat.name,
      total: cat.total,
      cells: this.matrixChecks.map((check) => {
        const items = this.open().filter(
          (item) =>
            item.question?.category === cat.name &&
            check.types.includes(item.hint.type),
        );
        return {
          id: check.id,
          count: items.length,
          worst: items[0]?.hint.severity ?? null,
        };
      }),
    })),
  );
  protected readonly cell = signal<{ cat: string; check: string } | null>(null);
  protected readonly cellItems = computed(() => {
    const cell = this.cell();
    const group = CHECK_GROUPS.find((g) => g.id === cell?.check);
    return this.shown().filter(
      (item) =>
        !cell ||
        (item.question?.category === cell.cat &&
          !!group?.types.includes(item.hint.type)),
    );
  });
  protected pickCell(cat: string, check: string): void {
    const cell = this.cell();
    this.cell.set(cell?.cat === cat && cell.check === check ? null : { cat, check });
  }

  /** v15: from all active questions down to what needs someone soon. */
  protected readonly funnel = computed(() => {
    const steps = [
      { label: 'Beurteilt', note: 'mind. 20 Antworten', value: this.judged() },
      {
        label: 'Unauffällig',
        note: 'alle Prüfungen bestanden',
        value: this.judged() - this.flagged(),
      },
      { label: 'Auffällig', note: 'mindestens ein Hinweis', value: this.flagged() },
      {
        label: 'Bald angehen',
        note: 'kritisch oder wichtig',
        value: this.urgent().length,
      },
    ];
    const max = Math.max(1, steps[0]!.value);
    return steps.map((step, i) => ({
      ...step,
      width: Math.max(8, (step.value / max) * 100),
      i,
    }));
  });

  /** v17: every judged question as one square. */
  protected readonly squares = computed(() =>
    [...this.spread()].sort(
      (a, b) => Number(b.flagged) - Number(a.flagged) || a.id - b.id,
    ),
  );

  /** v19: a vertical list of checks, the picked one beside. */
  protected readonly railCheck = signal<string | null>(null);
  protected readonly railActive = computed(
    () =>
      this.railCheck() ??
      this.groups().find((group) => group.items.length)?.id ??
      CHECK_GROUPS[0]!.id,
  );
  protected readonly railGroup = computed(
    () => this.groups().find((group) => group.id === this.railActive()) ?? null,
  );

  /** v20: search and chips. */
  protected readonly query = signal('');
  protected readonly chip = signal<string | null>(null);
  protected readonly found = computed(() => {
    const words = this.query().trim().toLowerCase();
    const group = CHECK_GROUPS.find((g) => g.id === this.chip());
    return this.shown()
      .filter((item) => !group || group.types.includes(item.hint.type))
      .filter(
        (item) =>
          !words ||
          [
            item.question?.text ?? '',
            item.question ? 'f-' + item.question.id : '',
            item.text.title,
          ]
            .join(' ')
            .toLowerCase()
            .includes(words),
      );
  });
  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /** v21: the last 14 days against the 14 before, per flagged question. */
  protected readonly trends = computed(() =>
    this.open()
      .filter((item) => item.question)
      .map((item) => {
        const { recent, previous } = item.question!.stats;
        const before = previous.answers ? previous.correct / previous.answers : null;
        const now = recent.answers ? recent.correct / recent.answers : null;
        const diff = before !== null && now !== null ? now - before : null;
        return {
          item,
          before,
          now,
          diff,
          verdict:
            diff === null
              ? 'none'
              : Math.abs(diff) < 0.03
                ? 'same'
                : diff < 0
                  ? 'worse'
                  : 'better',
        };
      }),
  );
  protected trendCount(verdict: string): number {
    return this.trends().filter((row) => row.verdict === verdict).length;
  }

  /** v22: the answers of every flagged question as a row of cells. */
  protected readonly heat = computed(() =>
    this.shown()
      .filter((item) => item.question)
      .map((item) => {
        const q = item.question!;
        const total =
          q.stats.picks.reduce((sum, n) => sum + n, 0) + q.stats.timeouts || 1;
        const lure = item.hint.type === 'lure' ? (item.hint.optionIndex ?? 0) : -1;
        return {
          item,
          cells: [
            ...q.options.map((text, i) => ({
              text,
              share: (q.stats.picks[i] ?? 0) / total,
              kind: i === q.correctIndex ? 'ok' : i === lure ? 'lure' : 'other',
            })),
            { text: 'Ohne Antwort', share: q.stats.timeouts / total, kind: 'time' },
          ],
        };
      }),
  );

  /** v23: what the quality would be with the picked hints fixed. */
  protected readonly fixed = signal<Set<string>>(new Set());
  protected toggleFixed(key: string): void {
    const next = new Set(this.fixed());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.fixed.set(next);
  }
  protected readonly projected = computed(() => {
    if (!this.judged()) {
      return null;
    }
    const still = new Set(
      this.open()
        .filter((item) => item.question && !this.fixed().has(item.hint.key))
        .map((item) => item.hint.questionId),
    ).size;
    return (this.judged() - still) / this.judged();
  });

  /** v26: one tab per check. */
  protected readonly tabCheck = signal<string | null>(null);
  protected readonly tabActive = computed(
    () =>
      this.tabCheck() ??
      this.groups().find((group) => group.items.length)?.id ??
      CHECK_GROUPS[0]!.id,
  );
  protected readonly tabGroup = computed(
    () => this.groups().find((group) => group.id === this.tabActive()) ?? null,
  );

  /** b4: the hint shown beside the rail. */
  protected readonly focusKey = signal<string | null>(null);
  protected readonly focusItem = computed(() => {
    const items = this.railGroup()?.items ?? [];
    return (
      items.find((item) => item.hint.key === this.focusKey()) ?? items[0] ?? null
    );
  });
  protected severityText(item: HintItem): string {
    return SEVERITY_LABELS[item.hint.severity];
  }
  protected pickRail(id: string): void {
    this.railCheck.set(id);
    this.focusKey.set(null);
  }
  protected heatOf(item: HintItem) {
    return (
      this.heat().find((row) => row.item.hint.key === item.hint.key)?.cells ?? []
    );
  }

  /** c1: one chapter per category, its quality in the head. */
  protected readonly catChapters = computed(() => {
    const names = [
      ...new Set(
        this.shown().map((item) => item.question?.category ?? 'Fragenbestand'),
      ),
    ];
    return names.map((name) => {
      const cat = this.categories().find((c) => c.name === name);
      return {
        name,
        cat,
        items: this.shown().filter(
          (item) => (item.question?.category ?? 'Fragenbestand') === name,
        ),
      };
    });
  });

  /** c2: the hint shown beside the list. */
  protected readonly pickKey = signal<string | null>(null);
  protected readonly picked = computed(
    () =>
      this.shown().find((item) => item.hint.key === this.pickKey()) ??
      this.shown()[0] ??
      null,
  );

  /** c3: the worsening first. */
  protected readonly byTrend = computed(() => {
    const rank = { worse: 0, same: 1, none: 2, better: 3 } as Record<string, number>;
    const verdict = new Map(
      this.trends().map((row) => [row.item.hint.key, row.verdict]),
    );
    return [...this.shown()].sort(
      (a, b) =>
        (rank[verdict.get(a.hint.key) ?? 'none'] ?? 2) -
        (rank[verdict.get(b.hint.key) ?? 'none'] ?? 2),
    );
  });
  protected verdictOf(item: HintItem): string {
    return (
      this.trends().find((row) => row.item.hint.key === item.hint.key)?.verdict ??
      'none'
    );
  }

  /** d1: every flagged question with all its measures against the limits. */
  protected readonly measures = computed(() => {
    const seen = new Map<number, HintItem[]>();
    for (const item of this.shown()) {
      if (item.question) {
        seen.set(item.question.id, [...(seen.get(item.question.id) ?? []), item]);
      }
    }
    return [...seen].map(([id, items]) => {
      const q = items[0]!.question!;
      const shown = q.stats.answers + q.stats.timeouts;
      const total = q.stats.picks.reduce((a, b) => a + b, 0) || 1;
      const lure = Math.max(
        0,
        ...q.stats.picks
          .filter((_, i) => i !== q.correctIndex)
          .map((n) => n / total),
      );
      const rate = q.stats.correct / Math.max(1, q.stats.answers);
      const time = shown ? q.stats.timeouts / shown : 0;
      return {
        id,
        q,
        first: items[0]!,
        cells: [
          {
            label: 'Richtig',
            value: formatPercent(rate),
            bad: rate < 0.3 || rate >= 0.95,
            limit: '30–95 %',
          },
          {
            label: 'Beste falsche',
            value: formatPercent(lure),
            bad: lure > rate,
            limit: 'unter richtiger',
          },
          {
            label: 'Ohne Antwort',
            value: formatPercent(time),
            bad: time >= 0.2,
            limit: 'unter 20 %',
          },
          {
            label: 'Ø Zeit',
            value:
              ((q.stats.avgAnswerMs ?? 0) / 1000).toFixed(1).replace('.', ',') +
              ' s',
            bad: false,
            limit: '',
          },
          {
            label: 'Antworten',
            value: String(q.stats.answers),
            bad: false,
            limit: 'mind. 20',
          },
        ],
      };
    });
  });
  protected readonly measureHeads = [
    'Richtig',
    'Beste falsche',
    'Ohne Antwort',
    'Ø Zeit',
    'Antworten',
  ];
  protected readonly measureLimits = [
    '30–95 %',
    'unter richtiger',
    'unter 20 %',
    '',
    'mind. 20',
  ];

  /** d3: the question opened in place. */
  protected readonly openQ = signal<string | null>(null);

  protected readonly passedChecks = computed(
    () => this.groups().filter((g) => !g.items.length).length,
  );

  /** q1, q5: the share of judged questions passing each check. */
  protected readonly checkShares = computed(() =>
    this.groups().map((group) => {
      const bad =
        group.id === 'pool'
          ? group.items.length
          : new Set(group.items.map((i) => i.hint.questionId)).size;
      const pool = group.items.find((i) => !i.question);
      const share =
        group.id === 'pool'
          ? pool
            ? Math.min(1, pool.hint.value / Math.max(1, pool.hint.sample))
            : 1
          : this.judged()
            ? (this.judged() - bad) / this.judged()
            : 1;
      return { ...group, bad, share };
    }),
  );
  protected ringOf(share: number, r: number): string {
    const length = 2 * Math.PI * r;
    return `${share * length} ${length}`;
  }
  /** q2: a half circle gauge. */
  protected gaugeArc(value: number): string {
    const a = Math.PI * (1 - Math.min(1, Math.max(0, value)));
    const x = 100 + 80 * Math.cos(a);
    const y = 100 - 80 * Math.sin(a);
    return `M 20 100 A 80 80 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  /** The first step, without the hint the head already shows (r6). */
  protected readonly stepOne = computed(() =>
    this.variant() === 'r6' ? this.urgent().slice(1) : this.urgent(),
  );
  protected readonly focus = computed(
    () => this.urgent()[0] ?? this.open()[0] ?? null,
  );
  protected readonly focusNext = computed(() =>
    this.open()
      .filter((item) => item !== this.focus())
      .slice(0, 4),
  );

  /** r1: every judged question as a dot on the share of correct answers. */
  protected readonly swarm = computed(() => {
    const lanes: number[] = [];
    const order = [0, -1, 1, -2, 2, -3, 3, -4, 4];
    return [...this.spread()]
      .sort((a, b) => a.rate - b.rate)
      .map((point) => {
        let lane = lanes.findIndex((last) => point.rate - last >= 0.016);
        if (lane < 0) {
          lane = Math.min(lanes.length, order.length - 1);
        }
        lanes[lane] = point.rate;
        return {
          ...point,
          x: Math.min(98.5, Math.max(1.5, point.rate * 100)),
          y: order[lane]!,
          out: point.rate < 0.3 || point.rate >= 0.95,
        };
      });
  });
  protected readonly inZone = computed(
    () => this.spread().filter((p) => p.rate >= 0.3 && p.rate < 0.95).length,
  );

  /** r2: the questions as a row of lights, the flagged first. */
  protected readonly lightsRow = computed(() =>
    [...this.spread()].sort(
      (a, b) => Number(b.flagged) - Number(a.flagged) || a.rate - b.rate,
    ),
  );

  /** r3: per category, every question as a bar of its correct answers. */
  protected readonly barcode = computed(() => {
    const names = [...new Set(this.spread().map((p) => p.category ?? 'Ohne'))];
    return names
      .map((name) => {
        const bars = this.spread()
          .filter((p) => (p.category ?? 'Ohne') === name)
          .sort((a, b) => a.rate - b.rate);
        return { name, bars, bad: bars.filter((b) => b.flagged).length };
      })
      .sort((a, b) => b.bad - a.bad || b.bars.length - a.bars.length);
  });

  /** r4: the categories as one ring, the flagged part of each warm. */
  protected readonly pickedSlice = signal<string | null>(null);
  protected readonly donut = computed(() => {
    const cats = this.categories();
    const total = Math.max(
      1,
      cats.reduce((sum, c) => sum + c.total, 0),
    );
    const gap = cats.length > 1 ? 0.035 : 0;
    let at = 0;
    return cats.map((cat) => {
      const span = (cat.total / total) * Math.PI * 2;
      const from = at + gap / 2;
      const to = Math.min(at + span - gap / 2, from + Math.PI * 2 - 0.001);
      const split = from + (to - from) * (cat.bad / Math.max(1, cat.total));
      at += span;
      return {
        ...cat,
        ok: arc(78, split, to),
        bad: cat.bad ? arc(78, from, split) : null,
        hit: arc(78, from, to),
      };
    });
  });

  protected readonly slicePick = computed(
    () => this.categories().find((c) => c.name === this.pickedSlice()) ?? null,
  );
  protected readonly catsWithBad = computed(
    () => this.categories().filter((c) => c.bad).length,
  );
  protected readonly inField = computed(
    () =>
      this.spread().filter(
        (p) => p.rate >= 0.3 && p.rate < 0.95 && (p.time ?? 0) < 0.2,
      ).length,
  );
  protected readonly Math = Math;

  /** r5: correct answers against unanswered, the limits as a frame. */
  protected readonly mapPoints = computed(() =>
    this.spread().map((p) => ({
      ...p,
      x: Math.min(98, Math.max(2, p.rate * 100)),
      y: Math.min(96, Math.max(4, ((p.time ?? 0) / 0.4) * 100)),
    })),
  );

  /** s: the flagged questions numbered, the most urgent first. */
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
  protected markOf(id: number | null | undefined): number | null {
    return id === null || id === undefined
      ? null
      : (this.marks().get(id)?.n ?? null);
  }
  protected openPoint(id: number): void {
    const mark = this.marks().get(id);
    if (mark) {
      this.details.emit(mark.item);
    }
  }
  protected readonly sView = signal<'spectrum' | 'map'>('spectrum');

  /** s: the spectrum, every question by its share of correct answers. */
  protected readonly sSwarm = computed(() =>
    laned(
      this.spread().map((p) => ({ ...p, x: clamp(p.rate * 100, 1.2, 98.8) })),
      2.1,
    ).map((p) => ({ ...p, n: this.markOf(p.id) })),
  );
  /** s: the map, correct answers against unanswered up to 40 %. */
  protected readonly sMap = computed(() =>
    this.spread().map((p) => ({
      ...p,
      n: this.markOf(p.id),
      x: clamp(p.rate * 100, 1.5, 98.5),
      y: clamp(((p.time ?? 0) / 0.4) * 100, 2.5, 97.5),
    })),
  );
  protected readonly rateBins = computed(() =>
    binsOf(
      this.spread().map((p) => p.rate),
      20,
      1,
    ),
  );
  protected readonly timeBins = computed(() =>
    binsOf(
      this.spread().map((p) => p.time ?? 0),
      8,
      0.4,
    ),
  );

  /** s: the gauge with its scale and the goal of 95 %. */
  protected readonly gaugeTicks = Array.from({ length: 21 }, (_, i) => {
    const inner = onGauge(i / 20, 106);
    const outer = onGauge(i / 20, i % 10 === 0 ? 116 : i % 2 === 0 ? 113 : 110);
    return { i, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
  });
  protected readonly gaugeGoal = (() => {
    const inner = onGauge(0.95, 78);
    const outer = onGauge(0.95, 106);
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
  })();
  protected gaugePath(value: number): string {
    const end = onGauge(value, 92);
    return `M 28 124 A 92 92 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  }
  protected needleOf(value: number): string {
    return `rotate(${(-90 + 180 * clamp(value, 0, 1)).toFixed(1)} 120 124)`;
  }

  /** s6: one line per check, every question on it against the limit. */
  protected readonly strips = computed(() => {
    const flaggedBy = (types: string[]) =>
      new Set(
        this.open()
          .filter((item) => types.includes(item.hint.type))
          .map((item) => item.hint.questionId),
      );
    const rows = [
      {
        id: 'clear',
        title: 'Verständlichkeit',
        limit: 'Richtige Antwort vor der besten falschen',
        types: ['lure'],
        zone: { from: 100 / 3, to: 100 },
        ticks: [
          { at: 0, text: '−50' },
          { at: 100 / 3, text: 'gleich auf' },
          { at: 100, text: '+100 Punkte' },
        ],
        pos: (p: SpreadPoint) => (((p.lead ?? 0) + 0.5) / 1.5) * 100,
        value: (p: SpreadPoint) =>
          `${Math.round((p.lead ?? 0) * 100)} Punkte Vorsprung der richtigen`,
      },
      {
        id: 'level',
        title: 'Schwierigkeit',
        limit: '30 bis 95 % richtige Antworten',
        types: ['hard', 'easy'],
        zone: { from: 30, to: 95 },
        ticks: [
          { at: 0, text: '0 %' },
          { at: 30, text: '30 %' },
          { at: 95, text: '95 %' },
        ],
        pos: (p: SpreadPoint) => p.rate * 100,
        value: (p: SpreadPoint) => `${formatPercent(p.rate)} richtig`,
      },
      {
        id: 'time',
        title: 'Zeit zum Antworten',
        limit: 'Unter 20 % ohne Antwort',
        types: ['timeouts'],
        zone: { from: 0, to: 50 },
        ticks: [
          { at: 0, text: '0 %' },
          { at: 50, text: '20 %' },
          { at: 100, text: '40 % ohne Antwort' },
        ],
        pos: (p: SpreadPoint) => ((p.time ?? 0) / 0.4) * 100,
        value: (p: SpreadPoint) => `${formatPercent(p.time ?? 0)} ohne Antwort`,
      },
    ];
    return rows.map((row) => {
      const bad = flaggedBy(row.types);
      const dots = laned(
        this.spread().map((p) => ({
          id: p.id,
          text: p.text ?? '',
          label: row.value(p),
          bad: bad.has(p.id),
          x: clamp(row.pos(p), 1.2, 98.8),
        })),
        1,
        7,
      ).map((dot) => ({ ...dot, n: dot.bad ? this.markOf(dot.id) : null }));
      return { ...row, dots, bad: dots.filter((dot) => dot.bad).length };
    });
  });
  protected readonly poolItem = computed(
    () => this.open().find((item) => !item.question) ?? null,
  );

  /** y4: the open hints split by severity. */
  protected readonly sevSplit = computed(() => {
    const open = this.open();
    const total = Math.max(1, open.length);
    return (['critical', 'high', 'medium'] as const)
      .map((sev) => ({
        sev,
        label: SEVERITY_LABELS[sev],
        count: open.filter((i) => i.hint.severity === sev).length,
      }))
      .filter((part) => part.count)
      .map((part) => ({ ...part, share: part.count / total }));
  });
  protected readonly checkedAt = new Date().toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  /** v14: a goal for the quality. */
  protected readonly goal = computed(() => {
    const allowed = Math.floor(this.judged() * 0.05);
    return {
      needed: Math.max(0, this.flagged() - allowed),
      reached: this.quality() !== null && (this.quality() ?? 0) >= 0.95,
    };
  });

  @HostListener('document:keydown.escape')
  protected closeMenu(): void {
    this.menuKey.set(null);
  }

  @HostListener('document:mousedown', ['$event'])
  protected onOutside(event: MouseEvent): void {
    if (!(event.target as HTMLElement | null)?.closest('[data-menu]')) {
      this.menuKey.set(null);
    }
  }

  protected run(what: 'act' | 'pause' | 'ignore', item: HintItem): void {
    this.menuKey.set(null);
    if (what === 'act') {
      this.act.emit(item);
    } else if (what === 'pause') {
      this.pauseHint.emit(item);
    } else {
      this.ignore.emit({ item, ignored: !item.hint.ignored });
    }
  }
}
