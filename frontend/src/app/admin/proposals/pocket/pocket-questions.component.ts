// TEMPORARY: proposal K «Pocket», the questions tab (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { ProposalPro } from '../pro';
import { ProposalStore, successRate } from '../proposal-store';

type Filter = 'all' | 'active' | 'paused' | 'issues';

@Component({
  selector: 'app-pocket-questions',
  templateUrl: './pocket-questions.component.html',
  styleUrl: './pocket-questions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PocketQuestionsComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  /** Opened from «Fragen mit Hinweisen». */
  readonly issuesOnly = input(false);

  protected readonly rate = successRate;
  protected readonly search = signal('');
  protected readonly filter = signal<Filter>('all');
  protected readonly selecting = signal(false);
  protected readonly moving = signal(false);
  protected readonly confirmDelete = signal(false);

  private readonly issueIds = computed(
    () => new Set(this.pro.issues().flatMap((issue) => issue.ids)),
  );
  protected readonly filters = computed<{ key: Filter; label: string }[]>(() => [
    { key: 'all', label: 'Alle' },
    { key: 'active', label: 'Aktiv' },
    { key: 'paused', label: 'Pausiert' },
    { key: 'issues', label: `Hinweise ${this.issueIds().size}` },
  ]);

  protected readonly groups = computed(() => {
    const term = this.search().trim().toLowerCase();
    const filter = this.filter();
    const visible = (this.store.questions() ?? []).filter(
      (q) =>
        (filter === 'all' ||
          (filter === 'active' && q.active) ||
          (filter === 'paused' && !q.active) ||
          (filter === 'issues' && this.issueIds().has(q.id))) &&
        (!term ||
          [q.text, q.category ?? '', ...q.options].some((v) =>
            v.toLowerCase().includes(term),
          )),
    );
    return this.store
      .categoryStats()
      .map((c) => ({
        ...c,
        items: visible.filter((q) => (q.category ?? '') === c.name),
      }))
      .filter((c) => c.items.length);
  });

  constructor() {
    effect(() => {
      if (this.issuesOnly()) {
        this.filter.set('issues');
      }
    });
  }

  protected typed(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected tap(question: AdminQuestion): void {
    if (this.selecting()) {
      this.pro.toggle(question.id);
    } else {
      this.store.openEditor(question);
    }
  }

  protected stopSelecting(): void {
    this.selecting.set(false);
    this.pro.clear();
  }

  protected async setActive(active: boolean): Promise<void> {
    await this.pro.setActiveMany(this.pro.selectedQuestions(), active);
    this.stopSelecting();
  }

  protected async move(category: string | null): Promise<void> {
    this.moving.set(false);
    await this.pro.setCategoryMany(this.pro.selectedQuestions(), category);
    this.stopSelecting();
  }

  protected async remove(): Promise<void> {
    await this.pro.deleteMany(this.pro.selectedQuestions());
    this.confirmDelete.set(false);
    this.stopSelecting();
  }
}
