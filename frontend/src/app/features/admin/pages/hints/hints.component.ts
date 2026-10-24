import {
  Component,
  DestroyRef,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import type { Hint, HintType } from '../../../../core/contracts/admin.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { formatInt, formatPercent, share } from '../../core/format';
import { HINT_TYPE_LABELS, hintText, SEVERITY_LABELS } from '../../core/hint-texts';
import { NotifyService } from '../../core/notify.service';
import { AdAnswerDistributionComponent } from '../../ui/answer-distribution.component';
import { AdStateComponent } from '../../ui/state.component';
import { messageOf } from '../questions/questions.component';

const TYPE_ICONS: Record<HintType, string> = {
  'pool-empty': 'priority-warning',
  'pool-small': 'items-list',
  lure: 'target',
  hard: 'arrow-down',
  easy: 'arrow-up',
  timeouts: 'time',
};

/**
 * What the admin found on its own: too few questions, answers that mislead,
 * questions that are too hard, too easy or too long. Each finding explains
 * itself and offers the fitting action.
 */
@Component({
  selector: 'app-admin-hints',
  imports: [RouterLink, AdAnswerDistributionComponent, AdStateComponent],
  templateUrl: './hints.component.html',
  styleUrl: './hints.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HintsComponent {
  protected readonly data = inject(AdminData);
  private readonly api = inject(AdminApi);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly icons = TYPE_ICONS;
  protected readonly severityLabels = SEVERITY_LABELS;
  protected readonly typeLabels = HINT_TYPE_LABELS;
  protected readonly formatInt = formatInt;

  protected readonly tab = signal<'open' | 'ignored'>('open');
  protected readonly type = signal<HintType | null>(null);
  protected readonly selectedKey = signal<string | null>(null);
  protected readonly busy = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const key = params.get('hinweis');
        if (key) {
          this.selectedKey.set(key);
          const hint = this.data.hints.value()?.find((h) => h.key === key);
          if (hint?.ignored) {
            this.tab.set('ignored');
          }
        }
      });
  }

  protected readonly counts = computed(() => {
    const all = this.data.hints.value() ?? [];
    return {
      open: all.filter((hint) => !hint.ignored).length,
      ignored: all.filter((hint) => hint.ignored).length,
    };
  });

  private readonly inTab = computed(() =>
    (this.data.hints.value() ?? []).filter(
      (hint) => hint.ignored === (this.tab() === 'ignored'),
    ),
  );

  protected readonly types = computed(() => {
    const counts = new Map<HintType, number>();
    for (const hint of this.inTab()) {
      counts.set(hint.type, (counts.get(hint.type) ?? 0) + 1);
    }
    return [...counts].map(([id, count]) => ({
      id,
      count,
      label: HINT_TYPE_LABELS[id],
    }));
  });

  protected readonly list = computed(() =>
    this.inTab()
      .filter((hint) => this.type() === null || hint.type === this.type())
      .map((hint) => this.describe(hint)),
  );

  protected readonly selected = computed(() => {
    const list = this.list();
    const key = this.selectedKey();
    return list.find((item) => item.hint.key === key) ?? list[0] ?? null;
  });

  protected setTab(tab: 'open' | 'ignored'): void {
    this.tab.set(tab);
    this.type.set(null);
    this.select(null);
  }

  /** From the list: show the detail, which sits below the list on narrow screens. */
  protected open(key: string): void {
    this.select(key);
    if (window.matchMedia('(max-width: 1024px)').matches) {
      setTimeout(() =>
        document
          .querySelector('.detail')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  }

  protected select(key: string | null): void {
    this.selectedKey.set(key);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { hinweis: key },
      replaceUrl: true,
    });
  }

  private describe(hint: Hint) {
    const question = this.data.questionById(hint.questionId);
    const stats = question?.stats;
    return {
      hint,
      question,
      text: hintText(hint, question),
      rate: stats ? formatPercent(share(stats.correct, stats.answers)) : null,
    };
  }

  protected async ignore(hint: Hint, ignored: boolean): Promise<void> {
    this.busy.set(true);
    try {
      if (ignored) {
        await this.api.ignoreHint(hint.key);
      } else {
        await this.api.restoreHint(hint.key);
      }
      await this.data.hints.reload();
      this.notify.success(
        ignored ? 'Hinweis ignoriert' : 'Hinweis ist wieder offen',
        ignored
          ? { label: 'Rückgängig', run: () => void this.ignore(hint, false) }
          : undefined,
      );
      this.select(null);
    } catch (error) {
      this.notify.error(messageOf(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async pause(hint: Hint): Promise<void> {
    if (hint.questionId === null) {
      return;
    }
    const id = hint.questionId;
    this.busy.set(true);
    try {
      await this.api.bulk({ ids: [id], action: 'deactivate' });
      await this.data.reloadQuestions();
      this.notify.success(`F-${id} pausiert – kommt in keinem Duell mehr vor`, {
        label: 'Rückgängig',
        run: () =>
          void this.api
            .bulk({ ids: [id], action: 'activate' })
            .then(() => this.data.reloadQuestions()),
      });
      this.select(null);
    } catch (error) {
      this.notify.error(messageOf(error));
    } finally {
      this.busy.set(false);
    }
  }
}
