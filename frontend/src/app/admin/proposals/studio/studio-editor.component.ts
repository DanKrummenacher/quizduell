// TEMPORARY: proposal C «Fragen-Studio», the editor on the page (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/icon';
import '@css-ch/components/input-text';
import '@css-ch/components/input-textarea';
import '@css-ch/components/switch';
import {
  type AdminQuestion,
  QUESTION_LIMITS,
} from '../../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { eventChecked } from '../../../core/ui/component-events';
import {
  draftFrom,
  emptyDraft,
  hasErrors,
  type QuestionDraft,
  validateDraft,
} from '../../questions/question-form';
import { apiErrorMessage, ProposalStore, successRate } from '../proposal-store';
import { QuestionPreviewComponent } from '../shared/question-preview.component';

@Component({
  selector: 'app-studio-editor',
  imports: [QuestionPreviewComponent],
  templateUrl: './studio-editor.component.html',
  styleUrl: './studio-editor.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StudioEditorComponent {
  protected readonly store = inject(ProposalStore);
  /** The question to edit; null for a new one. */
  readonly question = input<AdminQuestion | null>(null);
  readonly saved = output<AdminQuestion>();
  readonly deleted = output<void>();
  readonly back = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly limits = QUESTION_LIMITS;
  protected readonly draft = linkedSignal<QuestionDraft>(() => {
    const question = this.question();
    return question ? draftFrom(question) : emptyDraft();
  });
  protected readonly submitted = linkedSignal(() => (this.question(), false));
  protected readonly serverError = signal('');
  protected readonly confirmDelete = signal(false);

  protected readonly errors = computed(() =>
    this.submitted() ? validateDraft(this.draft()) : {},
  );
  protected readonly dirty = computed(() => {
    const question = this.question();
    const source = question ? draftFrom(question) : emptyDraft();
    return JSON.stringify(source) !== JSON.stringify(this.draft());
  });
  protected readonly rate = computed(() => {
    const question = this.question();
    return question ? successRate(question) : null;
  });
  protected readonly suggestions = computed(() => {
    const current = this.draft().category.trim().toLowerCase();
    return this.store.categories().filter((name) => name.toLowerCase() !== current);
  });

  protected update(patch: Partial<QuestionDraft>): void {
    this.draft.update((draft) => ({ ...draft, ...patch }));
  }

  protected typed(event: Event): string {
    return (event.target as HTMLInputElement).value ?? '';
  }

  protected setOption(index: number, event: Event): void {
    const options = [...this.draft().options];
    options[index] = this.typed(event);
    this.update({ options });
  }

  protected setActive(event: Event): void {
    this.update({ active: eventChecked(event) });
  }

  protected discard(): void {
    const question = this.question();
    this.draft.set(question ? draftFrom(question) : emptyDraft());
    this.submitted.set(false);
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.serverError.set('');
    if (hasErrors(validateDraft(this.draft()))) {
      return;
    }
    this.store.saving.set(true);
    try {
      const saved = await this.store.saveQuestion(
        this.draft(),
        this.question()?.id ?? null,
      );
      this.saved.emit(saved);
    } catch (error) {
      this.serverError.set(apiErrorMessage(error));
    } finally {
      this.store.saving.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const question = this.question();
    if (question && (await this.store.deleteQuestion(question))) {
      this.confirmDelete.set(false);
      this.deleted.emit();
    }
  }
}
