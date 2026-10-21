// TEMPORARY: proposal A «Cockpit», questions as a table (development only).
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
import '@css-ch/components/input-select';
import '@css-ch/components/input-text';
import '@css-ch/components/spinner';
import '@css-ch/components/switch';
import '@css-ch/components/toggle-group';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import { QuestionEditorComponent } from '../../questions/question-editor.component';
import {
  draftFrom,
  emptyDraft,
  type QuestionDraft,
} from '../../questions/question-form';
import {
  apiErrorMessage,
  ProposalStore,
  type StatusFilter,
  successRate,
} from '../proposal-store';

const ALL = '__all__';
const NONE = '__none__';

type Confirm =
  { kind: 'delete'; question: AdminQuestion } | { kind: 'delete-all' } | null;

@Component({
  selector: 'app-cockpit-questions',
  imports: [QuestionEditorComponent],
  templateUrl: './cockpit-questions.component.html',
  styleUrl: './cockpit-questions.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CockpitQuestionsComponent {
  protected readonly store = inject(ProposalStore);

  protected readonly rate = successRate;
  protected readonly editing = signal<{
    draft: QuestionDraft;
    id: number | null;
  } | null>(null);
  protected readonly editorError = signal('');
  protected readonly confirm = signal<Confirm>(null);
  protected readonly statusOptions = [
    { label: 'Alle', value: 'all' },
    { label: 'Aktiv', value: 'active' },
    { label: 'Inaktiv', value: 'inactive' },
  ];
  protected readonly categoryOptions = computed(() => [
    { label: 'Alle Kategorien', value: ALL },
    ...this.store.categories().map((name) => ({ label: name, value: name })),
    ...(this.store.categoryStats().some((c) => c.name === '')
      ? [{ label: 'Ohne Kategorie', value: NONE }]
      : []),
  ]);
  protected readonly categoryValue = computed(() => {
    const category = this.store.category();
    return category === null ? ALL : category === '' ? NONE : category;
  });

  protected setSearch(event: Event): void {
    this.store.search.set(eventText(event));
  }

  protected setCategory(event: Event): void {
    const value = eventText(event);
    this.store.category.set(value === ALL ? null : value === NONE ? '' : value);
  }

  protected setStatus(event: Event): void {
    this.store.status.set(eventText(event) as StatusFilter);
  }

  protected resetFilters(): void {
    this.store.search.set('');
    this.store.status.set('all');
    this.store.category.set(null);
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
    }
  }
}
