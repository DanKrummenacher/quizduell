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
import { formatPercent } from '../../../core/format';
import { HINT_TYPE_LABELS, SEVERITY_LABELS } from '../../../core/hint-texts';
import { actionOf, CHECK_GROUPS, type HintItem } from './hint-item';

interface Bullet {
  value: number;
  label: string;
  band: [number, number] | null;
  compare: { value: number; label: string } | null;
  caption: string;
}

/**
 * Temporary: drafts of the hints page with a refined design – a table with
 * bullet charts, a case view and a report.
 */
@Component({
  selector: 'app-hints-pro',
  imports: [NgTemplateOutlet],
  templateUrl: './hints-pro.component.html',
  styleUrl: './hints-pro.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HintsProComponent {
  readonly variant = input.required<string>();
  readonly items = input.required<HintItem[]>();
  readonly judged = input(0);
  readonly flagged = input(0);

  readonly act = output<HintItem>();
  readonly ignoreOne = output<{ item: HintItem; ignored: boolean }>();
  readonly pauseOne = output<HintItem>();

  protected readonly percent = formatPercent;
  protected readonly actionOf = actionOf;

  protected readonly showIgnored = signal(false);
  protected readonly check = signal<string | null>(null);
  protected readonly pickKey = signal<string | null>(null);

  protected readonly open = computed(() =>
    this.items().filter((i) => !i.hint.ignored),
  );
  protected readonly ignored = computed(() =>
    this.items().filter((i) => i.hint.ignored),
  );
  protected readonly shown = computed(() => {
    const group = CHECK_GROUPS.find((g) => g.id === this.check());
    return (this.showIgnored() ? this.ignored() : this.open()).filter(
      (item) => !group || group.types.includes(item.hint.type),
    );
  });
  protected readonly picked = computed(
    () =>
      this.shown().find((i) => i.hint.key === this.pickKey()) ??
      this.shown()[0] ??
      null,
  );
  protected readonly urgent = computed(
    () => this.open().filter((i) => i.hint.severity !== 'medium').length,
  );
  protected readonly quality = computed(() =>
    this.judged() ? (this.judged() - this.flagged()) / this.judged() : null,
  );
  protected readonly checks = computed(() =>
    CHECK_GROUPS.map((group) => ({
      ...group,
      items: this.open().filter((i) => group.types.includes(i.hint.type)),
    })),
  );

  protected readonly passed = computed(
    () => this.checks().filter((c) => !c.items.length).length,
  );

  protected kind(item: HintItem): string {
    return HINT_TYPE_LABELS[item.hint.type];
  }
  protected severity(item: HintItem): string {
    return SEVERITY_LABELS[item.hint.severity];
  }

  /** The measured value on its scale, with the healthy band. */
  protected bullet(item: HintItem): Bullet {
    const { hint, question: q } = item;
    const rate = q ? q.stats.correct / Math.max(1, q.stats.answers) : 0;
    switch (hint.type) {
      case 'lure':
        return {
          value: hint.value,
          label: formatPercent(hint.value),
          band: null,
          compare: { value: rate, label: formatPercent(rate) },
          caption: 'wählen die falsche Antwort, richtig: ' + formatPercent(rate),
        };
      case 'hard':
      case 'easy':
        return {
          value: hint.value,
          label: formatPercent(hint.value),
          band: [0.3, 0.95],
          compare: null,
          caption: 'richtig · gut ist 30 bis 95 %',
        };
      case 'timeouts':
        return {
          value: hint.value,
          label: formatPercent(hint.value),
          band: [0, 0.2],
          compare: null,
          caption: 'ohne Antwort · gut ist unter 20 %',
        };
      default:
        return {
          value: Math.min(1, hint.value / Math.max(1, hint.sample)),
          label: String(hint.value),
          band: null,
          compare: null,
          caption: `aktive Fragen · empfohlen ${hint.sample}`,
        };
    }
  }

  /** The answers of a question, the biggest first. */
  protected answers(item: HintItem) {
    const q = item.question;
    if (!q) {
      return [];
    }
    const total = q.stats.picks.reduce((a, b) => a + b, 0) + q.stats.timeouts || 1;
    const lure = item.hint.type === 'lure' ? (item.hint.optionIndex ?? 0) : -1;
    return [
      ...q.options.map((text, i) => ({
        letter: 'ABCD'[i] ?? '',
        text,
        share: (q.stats.picks[i] ?? 0) / total,
        kind: i === q.correctIndex ? 'ok' : i === lure ? 'lure' : 'other',
      })),
      {
        letter: '–',
        text: 'Ohne Antwort',
        share: q.stats.timeouts / total,
        kind: 'time',
      },
    ];
  }

  protected toggleIgnored(): void {
    this.showIgnored.set(!this.showIgnored());
    this.pickKey.set(null);
  }
}
