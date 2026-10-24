import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import type { AnalyticsRange } from '../../../../core/contracts/admin.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import {
  change,
  formatDay,
  formatDuration,
  formatInt,
  formatPercent,
  formatRelative,
  formatTime,
  share,
} from '../../core/format';
import { hintText, SEVERITY_LABELS } from '../../core/hint-texts';
import { remote } from '../../core/remote';
import { duelLength, formatSetting, SETTINGS_META } from '../../core/settings-meta';
import { AdLineChartComponent, AdSparklineComponent } from '../../ui/charts';
import { AdKpiComponent } from '../../ui/kpi.component';
import { AdStateComponent } from '../../ui/state.component';

/** Start page: is everything running, how is it played, what needs attention. */
@Component({
  selector: 'app-admin-overview',
  imports: [
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

  protected readonly range = signal<AnalyticsRange>(7);
  protected readonly analytics = remote(() => this.api.analytics(this.range()));
  protected readonly audit = remote(() => this.api.audit(undefined, 5, false));

  protected readonly formatInt = formatInt;
  protected readonly formatRelative = formatRelative;
  protected readonly severityLabels = SEVERITY_LABELS;

  protected setRange(range: AnalyticsRange): void {
    if (range !== this.range()) {
      this.range.set(range);
      void this.analytics.reload();
    }
  }

  protected readonly kpis = computed(() => {
    const a = this.analytics.value();
    if (!a) {
      return null;
    }
    const { current: c, previous: p } = a;
    const completion = share(c.finished, c.games);
    const previousCompletion = share(p.finished, p.games);
    const accuracy = share(c.correct, c.answers);
    const previousAccuracy = share(p.correct, p.answers);
    return {
      games: {
        value: formatInt(c.finished),
        delta: change(c.finished, p.finished),
        trend: a.days.map((d) => d.finished),
        note: `${formatInt(c.rematches)} davon Revanchen`,
      },
      completion: {
        value: formatPercent(completion),
        delta:
          completion !== null && previousCompletion !== null
            ? completion - previousCompletion
            : null,
        trend: a.days.map((d) => share(d.finished, d.finished + d.aborted) ?? 1),
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
    return {
      values: a.days.map((d) => d.finished),
      compare: a.previousDays.map((d) => d.finished),
      labels: a.days.map((d) => formatDay(d.day)),
      every: a.range === 7 ? 1 : a.range === 30 ? 5 : 15,
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

  protected readonly hints = computed(() =>
    (this.data.openHints() ?? []).slice(0, 4).map((hint) => ({
      hint,
      text: hintText(hint, this.data.questionById(hint.questionId)),
    })),
  );

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
