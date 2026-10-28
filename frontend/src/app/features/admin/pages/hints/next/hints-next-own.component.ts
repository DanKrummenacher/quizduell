import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../../../core/contracts/admin.contract';
import { formatPercent } from '../../../core/format';
import { HINT_TYPE_LABELS, SEVERITY_LABELS } from '../../../core/hint-texts';
import {
  actionOf,
  CHECK_GROUPS,
  type HintItem,
  limitOf,
  measured,
} from './hint-item';

export interface SpreadPoint {
  id: number;
  rate: number;
  flagged: boolean;
}

interface Segment {
  kind: 'ok' | 'lure' | 'other' | 'time';
  letter: string;
  text: string;
  share: number;
}

/**
 * Temporary: drafts of the hints page with elements of its own – the answers
 * as one split bar, the checks as a strip, the questions on a spectrum.
 */
@Component({
  selector: 'app-hints-next-own',
  imports: [NgTemplateOutlet],
  templateUrl: './hints-next-own.component.html',
  styleUrl: './hints-next-own.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HintsNextOwnComponent {
  readonly variant = input.required<string>();
  readonly items = input.required<HintItem[]>();
  readonly judged = input(0);
  readonly flagged = input(0);
  readonly spread = input<SpreadPoint[]>([]);
  readonly averageRate = input<number | null>(null);

  readonly act = output<HintItem>();
  readonly ignoreOne = output<{ item: HintItem; ignored: boolean }>();
  readonly pauseOne = output<HintItem>();

  protected readonly measured = measured;
  protected readonly limitOf = limitOf;
  protected readonly actionOf = actionOf;
  protected readonly percent = formatPercent;

  protected readonly showIgnored = signal(false);
  protected readonly selectedKey = signal<string | null>(null);
  protected readonly check = signal<string | null>(null);

  protected readonly open = computed(() =>
    this.items().filter((item) => !item.hint.ignored),
  );
  protected readonly ignoredCount = computed(
    () => this.items().filter((item) => item.hint.ignored).length,
  );
  protected readonly shown = computed(() => {
    const group = CHECK_GROUPS.find((g) => g.id === this.check());
    return this.items()
      .filter((item) => item.hint.ignored === this.showIgnored())
      .filter((item) => !group || group.types.includes(item.hint.type));
  });
  protected readonly selected = computed(
    () =>
      this.shown().find((item) => item.hint.key === this.selectedKey()) ??
      this.shown()[0] ??
      null,
  );
  protected readonly quality = computed(() =>
    this.judged() ? (this.judged() - this.flagged()) / this.judged() : null,
  );
  protected readonly checks = computed(() =>
    CHECK_GROUPS.map((group) => ({
      ...group,
      count: this.open().filter((item) => group.types.includes(item.hint.type))
        .length,
    })),
  );
  protected readonly passed = computed(
    () => this.checks().filter((check) => !check.count).length,
  );
  protected readonly urgent = computed(
    () => this.open().filter((item) => item.hint.severity !== 'medium').length,
  );

  /** The spectrum: dots stacked where they would touch. */
  protected readonly dots = computed(() => {
    const lanes: number[] = [];
    return [...this.spread()]
      .sort((a, b) => a.rate - b.rate)
      .map((point) => {
        let lane = lanes.findIndex((last) => point.rate - last >= 0.024);
        if (lane < 0) {
          lane = lanes.length;
        }
        lanes[lane] = point.rate;
        return { ...point, lane: Math.min(lane, 3) };
      });
  });

  protected kindOf(item: HintItem): string {
    return HINT_TYPE_LABELS[item.hint.type];
  }
  protected severityOf(item: HintItem): string {
    return SEVERITY_LABELS[item.hint.severity];
  }

  /** The answers of a question as the parts of one bar. */
  protected segments(item: HintItem): Segment[] {
    const q = item.question;
    if (!q) {
      return [];
    }
    const total =
      q.stats.picks.reduce((sum, n) => sum + n, 0) + q.stats.timeouts || 1;
    const lure = item.hint.type === 'lure' ? (item.hint.optionIndex ?? 0) : -1;
    const parts: Segment[] = q.options.map((text, index) => ({
      kind: index === q.correctIndex ? 'ok' : index === lure ? 'lure' : 'other',
      letter: 'ABCD'[index] ?? '',
      text,
      share: (q.stats.picks[index] ?? 0) / total,
    }));
    parts.push({
      kind: 'time',
      letter: '',
      text: 'Ohne Antwort',
      share: q.stats.timeouts / total,
    });
    return parts.filter((part) => part.share > 0);
  }
  protected facts(q: AdminQuestion) {
    const shown = q.stats.answers + q.stats.timeouts;
    return {
      rate: q.stats.correct / Math.max(1, q.stats.answers),
      timeouts: shown ? q.stats.timeouts / shown : 0,
      seconds: ((q.stats.avgAnswerMs ?? 0) / 1000).toFixed(1).replace('.', ','),
      answers: q.stats.answers,
    };
  }

  protected toggleIgnored(): void {
    this.showIgnored.set(!this.showIgnored());
    this.check.set(null);
    this.selectedKey.set(null);
  }
  protected pickCheck(id: string): void {
    this.showIgnored.set(false);
    this.check.set(this.check() === id ? null : id);
    this.selectedKey.set(null);
  }
}
