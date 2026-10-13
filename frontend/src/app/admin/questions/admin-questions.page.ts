import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import '@css-ch/calc-ui-text';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import '@css-ch/components/input-select';
import '@css-ch/components/input-text';
import '@css-ch/components/spinner';
import '@css-ch/components/switch';
import '@css-ch/components/toggle-group';
import type { AdminQuestion } from '../../core/contracts/admin.contract';
import { AdminApi } from '../admin-api.service';
import { type QuestionDraft, draftFrom, emptyDraft, toInput } from './question-form';
import { QuestionEditorComponent } from './question-editor.component';

type StatusFilter = 'all' | 'active' | 'inactive';
type Confirm =
  { kind: 'delete'; question: AdminQuestion } | { kind: 'delete-all' } | null;

const ALL_CATEGORIES = '__all__';

@Component({
  selector: 'app-admin-questions-page',
  imports: [QuestionEditorComponent],
  templateUrl: './admin-questions.page.html',
  styleUrl: './admin-questions.page.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminQuestionsPage {
  private readonly api = inject(AdminApi);

  protected readonly letters = ['A', 'B', 'C', 'D'];
  protected readonly questions = signal<AdminQuestion[] | null>(null);
  protected readonly loadError = signal(false);
  protected readonly message = signal<{
    variant: 'success' | 'error';
    text: string;
  } | null>(null);

  protected readonly search = signal('');
  protected readonly status = signal<StatusFilter>('all');
  protected readonly category = signal(ALL_CATEGORIES);

  protected readonly editing = signal<{
    draft: QuestionDraft;
    id: number | null;
  } | null>(null);
  protected readonly saving = signal(false);
  protected readonly editorError = signal('');
  protected readonly confirm = signal<Confirm>(null);
  protected readonly busy = signal(false);

  protected readonly statusOptions = [
    { label: 'Alle', value: 'all' },
    { label: 'Aktiv', value: 'active' },
    { label: 'Inaktiv', value: 'inactive' },
  ];

  protected readonly categories = computed(() => {
    const names = new Set<string>();
    for (const question of this.questions() ?? []) {
      if (question.category) {
        names.add(question.category);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'de-CH'));
  });

  protected readonly categoryOptions = computed(() => [
    { label: 'Alle Kategorien', value: ALL_CATEGORIES },
    ...this.categories().map((name) => ({ label: name, value: name })),
  ]);

  protected readonly counts = computed(() => {
    const all = this.questions() ?? [];
    return { total: all.length, active: all.filter((q) => q.active).length };
  });

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    const category = this.category();
    return (this.questions() ?? []).filter((question) => {
      if (status === 'active' && !question.active) {
        return false;
      }
      if (status === 'inactive' && question.active) {
        return false;
      }
      if (category !== ALL_CATEGORIES && question.category !== category) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [question.text, question.category ?? '', ...question.options].some(
        (value) => value.toLowerCase().includes(term),
      );
    });
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    try {
      this.questions.set(await this.api.questions());
      this.loadError.set(false);
    } catch {
      this.loadError.set(true);
    }
  }

  protected value(event: Event): string {
    return String((event as CustomEvent<unknown>).detail ?? '');
  }

  protected setStatus(event: Event): void {
    this.status.set(this.value(event) as StatusFilter);
  }

  protected successRate(question: AdminQuestion): string {
    if (question.timesAsked === 0) {
      return 'noch nie gestellt';
    }
    const rate = Math.round((question.timesCorrect / question.timesAsked) * 100);
    return `${rate} % richtig · ${question.timesAsked}× beantwortet`;
  }

  protected create(): void {
    this.editorError.set('');
    this.editing.set({ draft: emptyDraft(), id: null });
  }

  protected edit(question: AdminQuestion): void {
    this.editorError.set('');
    this.editing.set({ draft: draftFrom(question), id: question.id });
  }

  protected async saveDraft(draft: QuestionDraft): Promise<void> {
    const editing = this.editing();
    if (!editing) {
      return;
    }
    this.saving.set(true);
    this.editorError.set('');
    try {
      const input = toInput(draft);
      const saved =
        editing.id === null
          ? await this.api.createQuestion(input)
          : await this.api.updateQuestion(editing.id, input);
      this.upsert(saved);
      this.editing.set(null);
      this.flash(
        'success',
        editing.id === null ? 'Frage erstellt.' : 'Änderungen gespeichert.',
      );
    } catch (error) {
      this.editorError.set(apiErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggleActive(
    question: AdminQuestion,
    event: Event,
  ): Promise<void> {
    const active = Boolean((event as CustomEvent<boolean>).detail);
    try {
      this.upsert(await this.api.setQuestionActive(question.id, active));
    } catch (error) {
      this.flash('error', apiErrorMessage(error));
      await this.load();
    }
  }

  protected async confirmAction(): Promise<void> {
    const confirm = this.confirm();
    if (!confirm) {
      return;
    }
    this.busy.set(true);
    try {
      if (confirm.kind === 'delete') {
        await this.api.deleteQuestion(confirm.question.id);
        this.questions.update((list) =>
          (list ?? []).filter((q) => q.id !== confirm.question.id),
        );
        this.flash('success', 'Frage gelöscht.');
      } else {
        const result = await this.api.deleteAllQuestions();
        this.questions.set([]);
        this.flash('success', `${result.deleted} Fragen gelöscht.`);
      }
      this.confirm.set(null);
    } catch (error) {
      this.flash('error', apiErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async importSamples(): Promise<void> {
    this.busy.set(true);
    try {
      const result = await this.api.importSampleQuestions();
      await this.load();
      this.flash('success', `${result.imported} Beispielfragen importiert.`);
    } catch (error) {
      this.flash('error', apiErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  private upsert(question: AdminQuestion): void {
    this.questions.update((list) => {
      const current = list ?? [];
      const exists = current.some((q) => q.id === question.id);
      return exists
        ? current.map((q) => (q.id === question.id ? question : q))
        : [...current, question];
    });
  }

  private flash(variant: 'success' | 'error', text: string): void {
    this.message.set({ variant, text });
    setTimeout(() => {
      if (this.message()?.text === text) {
        this.message.set(null);
      }
    }, 4_000);
  }
}

function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Der Server ist nicht erreichbar.';
    }
    if (error.status === 400) {
      return 'Die Eingaben sind ungültig. Bitte prüfe alle Felder.';
    }
    if (error.status === 404) {
      return 'Diese Frage gibt es nicht mehr.';
    }
  }
  return 'Das hat nicht geklappt. Bitte versuche es nochmals.';
}
