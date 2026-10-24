import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import type {
  AnalyticsRange,
  AdminQuestion,
} from '../../../../core/contracts/admin.contract';
import type { EndReason } from '../../../../core/contracts/game.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { download } from '../../core/csv';
import {
  change,
  formatDay,
  formatInt,
  formatPercent,
  formatSeconds,
  formatWeekday,
  share,
} from '../../core/format';
import { MIN_SAMPLE } from '../../core/hint-texts';
import { remote } from '../../core/remote';
import {
  AdColumnChartComponent,
  AdHeatmapComponent,
  AdLineChartComponent,
} from '../../ui/charts';
import { AdKpiComponent } from '../../ui/kpi.component';
import { AdStateComponent } from '../../ui/state.component';

const RANGES: { id: AnalyticsRange; label: string }[] = [
  { id: 7, label: '7 Tage' },
  { id: 30, label: '30 Tage' },
  { id: 90, label: '90 Tage' },
];

const REASONS: Record<EndReason, string> = {
  'opponent-left': 'Verlassen',
  'opponent-disconnected': 'Verbindung verloren',
  expired: 'Keine Fragen geladen',
};

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** How the quiz is played over time, and how the questions perform. */
@Component({
  selector: 'app-admin-analytics',
  imports: [
    RouterLink,
    AdColumnChartComponent,
    AdHeatmapComponent,
    AdKpiComponent,
    AdLineChartComponent,
    AdStateComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AnalyticsComponent {
  private readonly api = inject(AdminApi);
  protected readonly data = inject(AdminData);

  protected readonly ranges = RANGES;
  protected readonly weekdays = WEEKDAYS;
  protected readonly hours = Array.from({ length: 24 }, (_, hour) => hour);
  protected readonly formatInt = formatInt;
  protected readonly formatPercent = formatPercent;

  protected readonly range = signal<AnalyticsRange>(30);
  protected readonly analytics = remote(() => this.api.analytics(this.range()));

  protected setRange(range: AnalyticsRange): void {
    if (range !== this.range()) {
      this.range.set(range);
      void this.analytics.reload();
    }
  }

  protected readonly labelEvery = computed(() =>
    this.range() === 7 ? 1 : this.range() === 30 ? 5 : 14,
  );

  protected readonly kpis = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    const { current: c, previous: p } = a;
    const diff = (x: number | null, y: number | null) =>
      x !== null && y !== null ? x - y : null;
    const abortRate = share(c.aborted, c.games);
    const rematchRate = share(c.rematches, c.finished);
    const accuracy = share(c.correct, c.answers);
    return [
      {
        label: 'Gespielte Duelle',
        value: formatInt(c.finished),
        delta: change(c.finished, p.finished),
        points: false,
        good: 'up' as const,
        trend: a.days.map((d) => d.finished),
        note: '',
      },
      {
        label: 'Abgebrochen',
        value: formatPercent(abortRate),
        delta: diff(abortRate, share(p.aborted, p.games)),
        points: true,
        good: 'down' as const,
        trend: null,
        note: `${formatInt(c.aborted)} Duelle`,
      },
      {
        label: 'Revanchen',
        value: formatPercent(rematchRate),
        delta: diff(rematchRate, share(p.rematches, p.finished)),
        points: true,
        good: 'up' as const,
        trend: null,
        note: `${formatInt(c.rematches)} Duelle`,
      },
      {
        label: 'Antworten',
        value: formatInt(c.answers),
        delta: change(c.answers, p.answers),
        points: false,
        good: 'up' as const,
        trend: a.days.map((d) => d.answers),
        note: '',
      },
      {
        label: 'Richtig beantwortet',
        value: formatPercent(accuracy),
        delta: diff(accuracy, share(p.correct, p.answers)),
        points: true,
        good: null,
        trend: null,
        note: `${formatInt(c.timeouts)}-mal keine Antwort`,
      },
      {
        label: 'Ø Antwortzeit',
        value: formatSeconds(c.avgAnswerMs),
        delta:
          c.avgAnswerMs !== null && p.avgAnswerMs
            ? change(c.avgAnswerMs, p.avgAnswerMs)
            : null,
        points: false,
        good: null,
        trend: null,
        note: '',
      },
    ];
  });

  protected readonly games = computed(() => {
    const a = this.analytics.value();
    return a
      ? {
          values: a.days.map((d) => d.finished),
          compare: a.previousDays.map((d) => d.finished),
          labels: a.days.map((d) =>
            a.range === 7 ? formatWeekday(d.day) : formatDay(d.day),
          ),
          empty: a.current.games + a.previous.games === 0,
        }
      : null;
  });

  protected readonly accuracy = computed(() => {
    const a = this.analytics.value();
    return a
      ? {
          values: a.days.map((d) => (d.answers ? d.correct / d.answers : null)),
          compare: a.previousDays.map((d) =>
            d.answers ? d.correct / d.answers : null,
          ),
          labels: a.days.map((d) => formatDay(d.day)),
          empty: a.current.answers === 0,
        }
      : null;
  });

  protected readonly answers = computed(() => {
    const a = this.analytics.value();
    return a
      ? a.days.map((d) => ({
          label: formatDay(d.day),
          value: d.answers,
          note: `${formatInt(d.timeouts)}-mal keine Antwort`,
        }))
      : null;
  });

  protected readonly modes = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    const total = a.modes.quick + a.modes.friend;
    return [
      { label: 'Schnellspiel', hint: 'Gegner per Zufall', value: a.modes.quick },
      { label: 'Mit Code', hint: 'Gegen Bekannte', value: a.modes.friend },
    ].map((mode) => ({
      ...mode,
      share: formatPercent(share(mode.value, total)),
      width: total ? (mode.value / total) * 100 : 0,
    }));
  });

  protected readonly aborts = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    const total = a.current.aborted;
    return {
      total,
      reasons: a.endReasons
        .map((entry) => ({
          label: REASONS[entry.reason],
          value: entry.count,
          share: formatPercent(share(entry.count, total)),
        }))
        .sort((x, y) => y.value - x.value),
      byQuestion: a.abortsByQuestion.map((value, index) => ({
        label: index === 0 ? 'Start' : `${index}`,
        value,
        note: index === 0 ? 'vor der ersten Frage' : `nach Frage ${index}`,
      })),
    };
  });

  protected readonly categories = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    return a.categories.map((category) => {
      const rate = share(category.correct, category.answers);
      return {
        ...category,
        name: category.category ?? 'Ohne Kategorie',
        rate,
        rateText: formatPercent(rate),
      };
    });
  });

  /** The questions with enough answers, hardest and easiest. */
  protected readonly extremes = computed(() => {
    const judged = (this.data.questions.value() ?? [])
      .filter((q) => q.active && q.stats.answers >= MIN_SAMPLE)
      .map((q) => ({ question: q, rate: q.stats.correct / q.stats.answers }));
    const sorted = [...judged].sort((a, b) => a.rate - b.rate);
    const row = (entry: { question: AdminQuestion; rate: number }) => ({
      id: entry.question.id,
      text: entry.question.text,
      rate: formatPercent(entry.rate),
      width: entry.rate * 100,
      answers: formatInt(entry.question.stats.answers),
    });
    return {
      count: judged.length,
      hardest: sorted.slice(0, 5).map(row),
      easiest: sorted.slice(-5).reverse().map(row),
    };
  });

  protected exportCsv(): void {
    const a = this.analytics.value();
    if (!a) {
      return;
    }
    const lines = [
      'Tag;Duelle beendet;Duelle abgebrochen;Antworten;Richtig;Ohne Antwort',
      ...a.days.map((d) =>
        [d.day, d.finished, d.aborted, d.answers, d.correct, d.timeouts].join(';'),
      ),
    ];
    download(
      `playduelio-auswertung-${a.days.at(-1)?.day ?? ''}.csv`,
      '\uFEFF' + lines.join('\r\n'),
    );
  }
}
