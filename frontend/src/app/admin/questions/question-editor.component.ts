import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/flyout';
import '@css-ch/components/input-text';
import '@css-ch/components/input-textarea';
import '@css-ch/components/switch';
import '@css-ch/components/toggle-group';
import { ANSWER_LETTERS } from '../../features/game/game.models';
import {
  type QuestionDraft,
  type QuestionErrors,
  hasErrors,
  validateDraft,
} from './question-form';

/** Dialog to create or edit a question. */
@Component({
  selector: 'app-question-editor',
  templateUrl: './question-editor.component.html',
  styleUrl: './question-editor.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuestionEditorComponent {
  readonly initial = input.required<QuestionDraft>();
  readonly isNew = input(true);
  readonly categories = input<string[]>([]);
  readonly saving = input(false);
  readonly serverError = input('');
  readonly save = output<QuestionDraft>();
  readonly dismiss = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly draft = signal<QuestionDraft | null>(null);
  protected readonly submitted = signal(false);

  protected readonly current = computed(() => this.draft() ?? this.initial());
  protected readonly errors = computed<QuestionErrors>(() =>
    this.submitted() ? validateDraft(this.current()) : {},
  );
  protected readonly correctOptions = computed(() =>
    this.letters.map((letter, index) => ({ label: letter, value: String(index) })),
  );
  protected readonly suggestions = computed(() => {
    const current = this.current().category.trim().toLowerCase();
    return this.categories().filter(
      (category) => category.toLowerCase() !== current,
    );
  });

  protected update(patch: Partial<QuestionDraft>): void {
    this.draft.set({ ...this.current(), ...patch });
  }

  protected updateOption(index: number, event: Event): void {
    const options = [...this.current().options];
    options[index] = (event as CustomEvent<string>).detail ?? '';
    this.update({ options });
  }

  protected text(event: Event): string {
    return (event as CustomEvent<string>).detail ?? '';
  }

  protected checked(event: Event): boolean {
    return Boolean((event as CustomEvent<boolean>).detail);
  }

  protected correctFrom(event: Event): number {
    return Number((event as CustomEvent<string>).detail ?? 0);
  }

  protected submit(): void {
    this.submitted.set(true);
    if (!hasErrors(validateDraft(this.current()))) {
      this.save.emit(this.current());
    }
  }
}
