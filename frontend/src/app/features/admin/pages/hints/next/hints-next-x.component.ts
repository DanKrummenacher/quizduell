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
import type { HintType } from '../../../../../core/contracts/admin.contract';
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

/**
 * Temporary: drafts of the hints page made only of the shared admin parts –
 * cards with a head, the table, the segmented control and the answers.
 */
@Component({
  selector: 'app-hints-next-x',
  imports: [NgTemplateOutlet, AdAnswerDistributionComponent],
  templateUrl: './hints-next-x.component.html',
  styleUrl: './hints-next-x.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HintsNextXComponent {
  readonly variant = input.required<string>();
  readonly items = input.required<HintItem[]>();
  readonly judged = input(0);
  readonly flagged = input(0);

  readonly act = output<HintItem>();
  readonly ignoreOne = output<{ item: HintItem; ignored: boolean }>();
  readonly pauseOne = output<HintItem>();

  protected readonly measured = measured;
  protected readonly limitOf = limitOf;
  protected readonly actionOf = actionOf;
  protected readonly percent = formatPercent;

  protected readonly status = signal<'open' | 'ignored'>('open');
  protected readonly type = signal<HintType | ''>('');
  protected readonly openKey = signal<string | null>(null);
  protected readonly focusKey = signal<string | null>(null);
  /** x2: hints set aside to fix later, only on this page. */
  protected readonly later = signal<Set<string>>(new Set());

  protected readonly open = computed(() =>
    this.items().filter((item) => !item.hint.ignored),
  );
  protected readonly ignored = computed(() =>
    this.items().filter((item) => item.hint.ignored),
  );
  protected readonly rows = computed(() =>
    (this.status() === 'open' ? this.open() : this.ignored()).filter(
      (item) => !this.type() || item.hint.type === this.type(),
    ),
  );
  protected readonly types = computed(() => [
    ...new Set(this.items().map((item) => item.hint.type)),
  ]);
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

  protected readonly columns = computed(() => {
    const later = this.later();
    const open = this.open();
    return [
      {
        id: 'todo',
        title: 'Offen',
        note: 'Das Dringendste zuerst',
        items: open.filter((item) => !later.has(item.hint.key)),
      },
      {
        id: 'later',
        title: 'Vorgemerkt',
        note: 'Wird bald überarbeitet',
        items: open.filter((item) => later.has(item.hint.key)),
      },
      {
        id: 'ignored',
        title: 'Ignoriert',
        note: 'Bewusst so gelassen',
        items: this.ignored(),
      },
    ];
  });

  protected readonly focus = computed(
    () =>
      this.open().find((item) => item.hint.key === this.focusKey()) ??
      this.open()[0] ??
      null,
  );
  protected readonly rest = computed(() =>
    this.open().filter((item) => item.hint.key !== this.focus()?.hint.key),
  );

  protected kindOf(item: HintItem): string {
    return HINT_TYPE_LABELS[item.hint.type];
  }
  protected typeLabel(type: HintType): string {
    return HINT_TYPE_LABELS[type];
  }
  protected severityOf(item: HintItem): string {
    return SEVERITY_LABELS[item.hint.severity];
  }
  protected toggle(key: string): void {
    this.openKey.set(this.openKey() === key ? null : key);
  }
  protected setStatus(status: 'open' | 'ignored'): void {
    this.status.set(status);
    this.openKey.set(null);
  }
  protected onType(event: Event): void {
    this.type.set((event.target as HTMLSelectElement).value as HintType | '');
  }
  protected setLater(key: string, on: boolean): void {
    const next = new Set(this.later());
    if (on) {
      next.add(key);
    } else {
      next.delete(key);
    }
    this.later.set(next);
  }
}
