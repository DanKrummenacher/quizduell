import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import type {
  AnalyticsRange,
  AuditAction,
} from '../../../../core/contracts/admin.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import {
  change,
  formatDay,
  formatDuration,
  formatFullDay,
  formatInt,
  formatPercent,
  formatRelative,
  formatTime,
  formatToday,
  greeting,
  labelStep,
  share,
} from '../../core/format';
import { every, remote } from '../../core/remote';
import { duelLength, formatSetting, SETTINGS_META } from '../../core/settings-meta';
import { AdLineChartComponent, AdSparklineComponent } from '../../ui/charts';
import { AdKpiComponent } from '../../ui/kpi.component';
import { AdStateComponent } from '../../ui/state.component';
import { AdPageHeadComponent } from '../../ui/page-head.component';

/** Whether a media query matches, kept up to date. */
function mediaQuery(query: string) {
  const list = typeof matchMedia === 'undefined' ? null : matchMedia(query);
  const matches = signal(list?.matches ?? true);
  list?.addEventListener('change', (event) => matches.set(event.matches));
  return matches.asReadonly();
}

type Card = 'chart' | 'live' | 'hints' | 'questions' | 'rules' | 'audit';

type Arrangement = { kind: 'grid' } | { kind: 'split'; main: Card[]; rail: Card[] };

/** Start page: is everything running, how is it played, what needs attention. */
@Component({
  selector: 'app-admin-overview',
  imports: [
    AdPageHeadComponent,
    NgTemplateOutlet,
    RouterLink,
    AdKpiComponent,
    AdLineChartComponent,
    AdSparklineComponent,
    AdStateComponent,
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OverviewComponent {
  private readonly api = inject(AdminApi);
  protected readonly data = inject(AdminData);

  /** The time, for the greeting; refreshed every minute. */
  private readonly now = signal(new Date());

  constructor() {
    every(60_000, () => this.now.set(new Date()));
  }

  /** «Guten Abend, Admin», and the time and date under it. */
  protected readonly head = computed(() => {
    const now = this.now();
    return {
      title: `${greeting(now)}, Admin`,
      date: `${formatTime(now.getTime())} Uhr · ${formatToday(now)}`,
    };
  });

  /** Each category with its hit rate over all answers. */
  protected readonly rates = computed(() => {
    const categories = this.analytics.value()?.categories;
    if (!categories) {
      return null;
    }
    return categories
      .filter((c) => c.active > 0)
      .sort((a, b) => b.active - a.active)
      .slice(0, 6)
      .map((c) => {
        const rate = c.answers ? c.correct / c.answers : null;
        return {
          name: c.category ?? 'Ohne Kategorie',
          active: c.active,
          rate,
          percent: formatPercent(rate),
          tone:
            rate === null
              ? 'none'
              : rate < 0.45
                ? 'hard'
                : rate > 0.85
                  ? 'easy'
                  : 'fair',
        };
      });
  });

  /** An icon for each kind of change. */
  protected readonly auditIcons: Record<AuditAction, string> = {
    login: 'unlock',
    'password.change': 'lock',
    'game.pause': 'pause-circle',
    'game.resume': 'play-circle',
    'settings.update': 'settings',
    'settings.restore': 'undo',
    'question.create': 'add',
    'question.update': 'edit',
    'question.delete': 'trash',
    'question.restore': 'undo',
    'trash.purge': 'trash',
    'questions.bulk': 'items-list',
    'questions.import': 'upload',
    'hint.ignore': 'hide',
    'hint.restore': 'view',
  };

  /** The key figures choose what the large chart shows. */
  protected readonly metric = signal<'games' | 'completion' | 'accuracy'>('games');

  protected pick(metric: 'games' | 'completion' | 'accuracy'): void {
    this.metric.set(metric);
  }

  /** Wide enough for a main column beside a rail. */
  private readonly wide = mediaQuery('(min-width: 1101px)');
  /** Phones: fewer date labels under the chart, so they never touch. */
  private readonly narrow = mediaQuery('(max-width: 480px)');

  private readonly chartCard = viewChild.required<TemplateRef<unknown>>('chartCard');
  private readonly liveCard = viewChild.required<TemplateRef<unknown>>('liveCard');
  private readonly hintsCard = viewChild.required<TemplateRef<unknown>>('hintsCard');
  private readonly questionsCard =
    viewChild.required<TemplateRef<unknown>>('questionsCard');
  private readonly rulesCard = viewChild.required<TemplateRef<unknown>>('rulesCard');
  private readonly auditCard = viewChild.required<TemplateRef<unknown>>('auditCard');

  protected cardOf(card: Card): TemplateRef<unknown> {
    const cards: Record<Card, () => TemplateRef<unknown>> = {
      chart: this.chartCard,
      live: this.liveCard,
      hints: this.hintsCard,
      questions: this.questionsCard,
      rules: this.rulesCard,
      audit: this.auditCard,
    };
    return cards[card]();
  }

  /**
   * How the cards are set, after what they hold: a grid with three cards of
   * one height in a row, or a main column and a rail. The plan that leaves
   * the least empty space wins, so the page fits whatever it shows.
   */
  protected readonly arrangement = computed<Arrangement>(() => {
    // Narrow screens stack the cards in their order.
    if (!this.wide()) {
      return { kind: 'grid' };
    }
    const height: Record<Card, number> = {
      chart: 336,
      live: 336,
      hints: 300,
      questions: 150 + (this.catalog()?.categories.length ?? 4) * 42,
      rules: 370,
      audit: 110 + Math.max(this.audit.value()?.entries.length ?? 1, 1) * 46,
    };
    const sum = (cards: Card[]) =>
      cards.reduce((total, card) => total + height[card], 0) +
      (cards.length - 1) * 20;
    const row = [height.hints, height.questions, height.rules];
    const plans: { plan: Arrangement; waste: number }[] = [
      {
        plan: { kind: 'grid' },
        waste: row.reduce((w, h) => w + (Math.max(...row) - h), 0) / 3,
      },
    ];
    const splits: [Card[], Card[]][] = [
      [
        ['chart', 'questions', 'audit'],
        ['live', 'hints', 'rules'],
      ],
      [
        ['chart', 'hints', 'audit'],
        ['live', 'questions', 'rules'],
      ],
      [
        ['chart', 'questions', 'hints'],
        ['live', 'rules', 'audit'],
      ],
    ];
    for (const [main, rail] of splits) {
      plans.push({
        plan: { kind: 'split', main, rail },
        waste: Math.abs(sum(main) - sum(rail)),
      });
    }
    return plans.reduce((best, next) => (next.waste < best.waste ? next : best))
      .plan;
  });

  protected readonly range = signal<AnalyticsRange>(7);
  protected readonly analytics = remote(() => this.api.analytics(this.range()));
  protected readonly audit = remote(() => this.api.audit(undefined, 5, false));

  protected readonly formatInt = formatInt;
  protected readonly formatRelative = formatRelative;

  protected setRange(range: AnalyticsRange): void {
    if (range !== this.range()) {
      this.range.set(range);
      void this.analytics.reload();
    }
  }

  /** «1. Oktober 2026» for the range «Alle», once loaded. */
  protected readonly since = computed(() => {
    const first = this.analytics.value()?.days[0]?.day;
    return this.range() === 0 && first ? formatFullDay(first) : null;
  });

  protected readonly kpis = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    // A trend line only where something happened.
    const trend = (values: number[]) => (values.some((v) => v > 0) ? values : null);
    const { current: c, previous: p } = a;
    const completion = share(c.finished, c.games);
    const previousCompletion = share(p.finished, p.games);
    const accuracy = share(c.correct, c.answers);
    const previousAccuracy = share(p.correct, p.answers);
    return {
      games: {
        value: formatInt(c.finished),
        delta: change(c.finished, p.finished),
        trend: trend(a.days.map((d) => d.finished)),
        note: `${formatInt(c.rematches)} davon Revanchen`,
      },
      completion: {
        value: formatPercent(completion),
        delta:
          completion !== null && previousCompletion !== null
            ? completion - previousCompletion
            : null,
        trend:
          c.games > 0
            ? a.days.map((d) => share(d.finished, d.finished + d.aborted) ?? 1)
            : null,
        note: `${formatInt(c.aborted)} abgebrochen`,
      },
      accuracy: {
        value: formatPercent(accuracy),
        delta:
          accuracy !== null && previousAccuracy !== null
            ? accuracy - previousAccuracy
            : null,
        trend: a.days.filter((d) => d.answers > 0).map((d) => d.correct / d.answers),
        note: `${formatInt(c.answers)} Antworten`,
      },
      duration: {
        value: formatDuration(c.avgDurationMs),
        delta:
          c.avgDurationMs !== null && p.avgDurationMs
            ? change(c.avgDurationMs, p.avgDurationMs)
            : null,
        note: `Ø Antwortzeit ${c.avgAnswerMs === null ? '–' : formatDuration(c.avgAnswerMs)}`,
      },
    };
  });

  protected readonly chart = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    const metric = this.metric();
    const rate = (days: typeof a.days, part: 'finished' | 'correct') =>
      days.map((d) => {
        const whole = part === 'finished' ? d.finished + d.aborted : d.answers;
        return whole ? d[part] / whole : null;
      });
    const series =
      metric === 'games'
        ? {
            title: 'Duelle pro Tag',
            subtitle: 'Zu Ende gespielte Duelle',
            unit: 'Duelle',
            percent: false,
            values: a.days.map((d) => d.finished) as (number | null)[],
            compare: a.previousDays.map((d) => d.finished) as (number | null)[],
          }
        : metric === 'completion'
          ? {
              title: 'Zu Ende gespielt pro Tag',
              subtitle: 'Anteil der Duelle, die nicht abgebrochen wurden',
              unit: '',
              percent: true,
              values: rate(a.days, 'finished'),
              compare: rate(a.previousDays, 'finished'),
            }
          : {
              title: 'Richtige Antworten pro Tag',
              subtitle: 'Anteil richtiger Antworten',
              unit: '',
              percent: true,
              values: rate(a.days, 'correct'),
              compare: rate(a.previousDays, 'correct'),
            };
    return {
      ...series,
      compare: a.range === 0 ? null : series.compare,
      labels: a.days.map((d) => formatDay(d.day)),
      every: this.narrow()
        ? Math.max(labelStep(a.days.length), Math.ceil(a.days.length / 4))
        : labelStep(a.days.length),
      total: a.current.finished,
      empty: a.current.games === 0 && a.previous.games === 0,
    };
  });

  protected readonly live = computed(() => {
    const live = this.data.live();
    if (!live) {
      return null;
    }
    const running = live.duels.filter((d) => d.phase !== 'finished');
    return {
      duels: running.length,
      players: running.reduce((sum, d) => sum + d.players.length, 0),
      searching: live.searching.length,
      waiting: live.waiting.length,
      history: live.history.map((s) => s.games),
      peak: live.peak,
      updated: formatTime(live.serverNow, true),
    };
  });

  /** Until the hints launch, the card names the checks that will run. */
  protected readonly soonChecks = [
    {
      icon: 'bulb',
      title: 'Verständlichkeit',
      limit: 'keine falsche Antwort vor der richtigen',
    },
    { icon: 'statistic', title: 'Schwierigkeit', limit: '30 bis 95 % richtig' },
    { icon: 'time', title: 'Zeit zum Antworten', limit: 'unter 20 % ohne Antwort' },
    { icon: 'items-list', title: 'Fragenbestand', limit: 'genug aktive Fragen' },
  ];

  protected readonly critical = computed(
    () => this.data.openHints()?.find((hint) => hint.type === 'pool-empty') ?? null,
  );

  protected readonly catalog = computed(() => {
    const questions = this.data.questions.value();
    if (!questions) {
      return null;
    }
    const active = questions.filter((q) => q.active);
    const byCategory = new Map<string, number>();
    for (const question of active) {
      const name = question.category ?? 'Ohne Kategorie';
      byCategory.set(name, (byCategory.get(name) ?? 0) + 1);
    }
    const categories = [...byCategory]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const top = categories.slice(0, 5);
    const rest = categories.slice(5).reduce((sum, c) => sum + c.count, 0);
    if (rest > 0) {
      top.push({ name: `${categories.length - 5} weitere`, count: rest });
    }
    const max = Math.max(...top.map((c) => c.count), 1);
    return {
      total: questions.length,
      active: active.length,
      paused: questions.length - active.length,
      categories: top.map((c) => ({ ...c, width: (c.count / max) * 100 })),
    };
  });

  protected readonly rules = computed(() => {
    const view = this.data.settings.value();
    if (!view) {
      return null;
    }
    const typicalMs = this.analytics.value()?.current.avgAnswerMs ?? undefined;
    const length = duelLength(view.settings, typicalMs);
    return {
      items: SETTINGS_META.map((meta) => ({
        label: meta.label,
        value: formatSetting(meta.key, view.settings[meta.key]),
      })),
      typical: formatDuration(length.typical),
      max: formatDuration(length.max),
      updatedAt: view.updatedAt,
    };
  });
}
