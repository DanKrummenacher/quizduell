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
import { QUESTION_LIMITS } from '../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../core/game/answer-letters';
import { eventChecked, eventText } from '../../core/ui/component-events';
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
  protected readonly limits = QUESTION_LIMITS;
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
    options[index] = eventText(event);
    this.update({ options });
  }

  protected readonly text = eventText;
  protected readonly checked = eventChecked;

  protected correctFrom(event: Event): number {
    return Number(eventText(event));
  }

  protected submit(): void {
    this.submitted.set(true);
    if (!hasErrors(validateDraft(this.current()))) {
      this.save.emit(this.current());
    }
  }
}
