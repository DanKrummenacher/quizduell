// TEMPORARY: proposal B «Messe-Leitstand», questions by category (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import '@css-ch/components/spinner';
import '@css-ch/components/switch';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import { QuestionEditorComponent } from '../../questions/question-editor.component';
import {
  draftFrom,
  emptyDraft,
  type QuestionDraft,
} from '../../questions/question-form';
import { apiErrorMessage, ProposalStore, successRate } from '../proposal-store';

type Confirm =
  { kind: 'delete'; question: AdminQuestion } | { kind: 'delete-all' } | null;

@Component({
  selector: 'app-stage-questions',
  imports: [QuestionEditorComponent],
  templateUrl: './stage-questions.component.html',
  styleUrl: './stage-questions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StageQuestionsComponent {
  protected readonly store = inject(ProposalStore);

  protected readonly rate = successRate;
  protected readonly open = signal<ReadonlySet<string>>(new Set());
  protected readonly editing = signal<{
    draft: QuestionDraft;
    id: number | null;
  } | null>(null);
  protected readonly editorError = signal('');
  protected readonly confirm = signal<Confirm>(null);

  /** The questions grouped by category; while searching, all groups open. */
  protected readonly groups = computed(() => {
    const groups = new Map<string, AdminQuestion[]>();
    for (const question of this.store.filtered()) {
      const name = question.category ?? '';
      groups.set(name, [...(groups.get(name) ?? []), question]);
    }
    const searching = this.store.search().trim() !== '';
    return this.store
      .categoryStats()
      .filter((category) => groups.has(category.name))
      .map((category) => ({
        ...category,
        questions: groups.get(category.name)!,
        open: searching || this.open().has(category.name),
      }));
  });

  constructor() {
    // The list shows every question; the filters of the other proposals reset.
    this.store.status.set('all');
    this.store.category.set(null);
  }

  protected toggleGroup(name: string): void {
    this.open.update((open) => {
      const next = new Set(open);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  /** Switches all questions of a category on or off. */
  protected async setGroup(questions: AdminQuestion[], event: Event): Promise<void> {
    const active = eventChecked(event);
    for (const question of questions.filter((q) => q.active !== active)) {
      await this.store.setActive(question, active);
    }
  }

  protected setSearch(event: Event): void {
    this.store.search.set(eventText(event));
  }

  protected toggle(question: AdminQuestion, event: Event): void {
    void this.store.setActive(question, eventChecked(event));
  }

  protected create(): void {
    this.editorError.set('');
    this.editing.set({ draft: emptyDraft(), id: null });
  }

  protected edit(question: AdminQuestion): void {
    this.editorError.set('');
    this.editing.set({ draft: draftFrom(question), id: question.id });
  }

  protected async save(draft: QuestionDraft): Promise<void> {
    const editing = this.editing();
    if (!editing) {
      return;
    }
    this.store.saving.set(true);
    try {
      await this.store.saveQuestion(draft, editing.id);
      this.editing.set(null);
    } catch (error) {
      this.editorError.set(apiErrorMessage(error));
    } finally {
      this.store.saving.set(false);
    }
  }

  protected async confirmAction(): Promise<void> {
    const confirm = this.confirm();
    if (!confirm) {
      return;
    }
    const done =
      confirm.kind === 'delete'
        ? await this.store.deleteQuestion(confirm.question)
        : await this.store.deleteAll();
    if (done) {
      this.confirm.set(null);
      this.editing.set(null);
    }
  }
}
