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
  formatDuration,
  formatFullDay,
  formatInt,
  formatPercent,
  formatSeconds,
  formatWeekday,
  labelStep,
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
import { AdPageHeadComponent } from '../../ui/page-head.component';

const RANGES: { id: AnalyticsRange; label: string }[] = [
  { id: 7, label: '7 Tage' },
  { id: 30, label: '30 Tage' },
  { id: 90, label: '90 Tage' },
  { id: 0, label: 'Alle' },
];

const REASONS: Record<EndReason, string> = {
  'opponent-left': 'Verlassen',
  'opponent-disconnected': 'Verbindung verloren',
  expired: 'Keine Fragen geladen',
};

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAY_NAMES = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];

type Metric = 'games' | 'aborted' | 'rematches' | 'answers' | 'accuracy' | 'time';

/** Hard below 45 %, easy above 85 %, as on the overview. */
function toneOf(rate: number | null): 'hard' | 'fair' | 'easy' | 'none' {
  return rate === null
    ? 'none'
    : rate < 0.45
      ? 'hard'
      : rate > 0.85
        ? 'easy'
        : 'fair';
}

/** How the quiz is played over time, and how the questions perform. */
@Component({
  selector: 'app-admin-analytics',
  imports: [
    AdPageHeadComponent,
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

  /** The key figures choose what the large chart shows. */
  protected readonly metric = signal<Metric>('games');
  protected readonly pickable: readonly Metric[] = [
    'games',
    'aborted',
    'answers',
    'accuracy',
  ];

  protected pick(metric: Metric): void {
    if (this.pickable.includes(metric)) {
      this.metric.set(metric);
    }
  }

  /** The large chart: duels per day, or the picked figure per day. */
  protected readonly lead = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    const metric = this.metric();
    const rate = (days: typeof a.days, part: 'aborted' | 'correct') =>
      days.map((d) => {
        const whole = part === 'aborted' ? d.finished + d.aborted : d.answers;
        return whole ? d[part] / whole : null;
      });
    const series = {
      games: {
        title: 'Duelle pro Tag',
        subtitle: 'Zu Ende gespielt',
        unit: 'Duelle',
        percent: false,
        values: a.days.map((d) => d.finished) as (number | null)[],
        compare: a.previousDays.map((d) => d.finished) as (number | null)[],
      },
      aborted: {
        title: 'Abgebrochen pro Tag',
        subtitle: 'Anteil der Duelle, die nicht zu Ende gespielt wurden',
        unit: '',
        percent: true,
        values: rate(a.days, 'aborted'),
        compare: rate(a.previousDays, 'aborted'),
      },
      answers: {
        title: 'Antworten pro Tag',
        subtitle: 'Alle gegebenen Antworten',
        unit: 'Antworten',
        percent: false,
        values: a.days.map((d) => d.answers) as (number | null)[],
        compare: a.previousDays.map((d) => d.answers) as (number | null)[],
      },
      accuracy: {
        title: 'Richtig beantwortet pro Tag',
        subtitle: 'Anteil richtiger Antworten',
        unit: '',
        percent: true,
        values: rate(a.days, 'correct'),
        compare: rate(a.previousDays, 'correct'),
      },
    }[metric as 'games' | 'aborted' | 'answers' | 'accuracy'];
    return {
      ...series,
      compare: a.range === 0 ? null : series.compare,
      labels: a.days.map((d) =>
        a.range === 7 ? formatWeekday(d.day) : formatDay(d.day),
      ),
      empty: a.current.games + a.previous.games === 0,
    };
  });

  /** One sentence per chapter. */
  protected readonly report = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    const c = a.current;
    const delta = change(c.finished, a.previous.finished);
    const trend =
      a.range === 0 || delta === null
        ? ''
        : ` – ${Math.round(Math.abs(delta) * 100)} % ${delta >= 0 ? 'mehr' : 'weniger'} als im Zeitraum davor`;
    let peak = { weekday: 0, hour: 0, value: 0 };
    a.heatmap.forEach((row, weekday) =>
      row.forEach((value, hour) => {
        if (value > peak.value) {
          peak = { weekday, hour, value };
        }
      }),
    );
    const usage =
      `${formatInt(c.finished)} Duelle${trend}.` +
      (peak.value
        ? ` Am meisten gespielt wird am ${WEEKDAY_NAMES[peak.weekday]} um ${peak.hour} Uhr.`
        : '');
    const accuracy = share(c.correct, c.answers);
    const answers = c.answers
      ? `${formatInt(c.answers)} Antworten, ${formatPercent(accuracy)} davon richtig, im Schnitt nach ${formatSeconds(c.avgAnswerMs)}.`
      : 'Noch keine Antworten im Zeitraum.';
    const hardest = this.extremes().hardest[0];
    const questions = hardest
      ? `Am schwersten ist «${hardest.text}» mit ${hardest.rate} richtigen Antworten.`
      : 'Noch keine Frage hat genug Antworten für eine Einschätzung.';
    return { usage, answers, questions };
  });

  /** The modes as a ring, with what else describes the duels. */
  protected readonly modeView = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    const total = a.modes.quick + a.modes.friend;
    let offset = 0;
    const modes = [
      {
        key: 'quick',
        label: 'Schnellspiel',
        hint: 'Gegner per Zufall',
        value: a.modes.quick,
      },
      {
        key: 'friend',
        label: 'Mit Code',
        hint: 'Gegen Bekannte',
        value: a.modes.friend,
      },
    ].map((mode) => {
      const part = total ? mode.value / total : 0;
      // A small gap between the two parts of the ring.
      const entry = {
        ...mode,
        share: formatPercent(total ? part : null),
        arc: `${Math.max(part * 100 - 1.2, 0)} 100`,
        start: -offset * 100 - 0.6,
      };
      offset += part;
      return entry;
    });
    return {
      modes,
      rematchShare: formatPercent(share(a.current.rematches, a.current.finished)),
      abortShare: formatPercent(share(a.current.aborted, a.current.games)),
      duration: formatDuration(a.current.avgDurationMs),
    };
  });

  /** Hardest or easiest questions in one card. */
  protected readonly ranking = signal<'hardest' | 'easiest'>('hardest');

  /** Phones label fewer days under a chart, so the labels never touch. */
  private readonly narrow = (() => {
    const list =
      typeof matchMedia === 'undefined' ? null : matchMedia('(max-width: 480px)');
    const matches = signal(list?.matches ?? false);
    list?.addEventListener('change', (event) => matches.set(event.matches));
    return matches.asReadonly();
  })();

  protected readonly labelEvery = computed(() => {
    const days = this.analytics.value()?.days.length ?? this.range();
    return this.narrow()
      ? Math.max(labelStep(days), Math.ceil(days / 4))
      : labelStep(days);
  });

  /** «seit 1. Oktober» for the range «Alle», once loaded. */
  protected readonly since = computed(() => {
    const first = this.analytics.value()?.days[0]?.day;
    return this.range() === 0 && first ? formatFullDay(first) : null;
  });

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
        key: 'games' as Metric,
        label: 'Gespielte Duelle',
        value: formatInt(c.finished),
        delta: change(c.finished, p.finished),
        points: false,
        good: 'up' as const,
        trend: a.days.map((d) => d.finished),
        note: '',
      },
      {
        key: 'aborted' as Metric,
        label: 'Abgebrochen',
        value: formatPercent(abortRate),
        delta: diff(abortRate, share(p.aborted, p.games)),
        points: true,
        good: 'down' as const,
        trend: null,
        note: `${formatInt(c.aborted)} Duelle`,
      },
      {
        key: 'rematches' as Metric,
        label: 'Revanchen',
        value: formatPercent(rematchRate),
        delta: diff(rematchRate, share(p.rematches, p.finished)),
        points: true,
        good: 'up' as const,
        trend: null,
        note: `${formatInt(c.rematches)} Duelle`,
      },
      {
        key: 'answers' as Metric,
        label: 'Antworten',
        value: formatInt(c.answers),
        delta: change(c.answers, p.answers),
        points: false,
        good: 'up' as const,
        trend: a.days.map((d) => d.answers),
        note: '',
      },
      {
        key: 'accuracy' as Metric,
        label: 'Richtig beantwortet',
        value: formatPercent(accuracy),
        delta: diff(accuracy, share(p.correct, p.answers)),
        points: true,
        good: null,
        trend: null,
        note: `${formatInt(c.timeouts)}-mal keine Antwort`,
      },
      {
        key: 'time' as Metric,
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
        tone: toneOf(rate),
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
      tone: toneOf(entry.rate),
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
