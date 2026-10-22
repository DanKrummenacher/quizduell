// Bühne: a question in a full-screen flow of three steps.
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { QUESTION_LIMITS } from '../../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import {
  draftFrom,
  emptyDraft,
  hasErrors,
  type QuestionDraft,
  validateDraft,
} from '../../questions/question-form';
import {
  apiErrorMessage,
  ProposalStore,
  successRate,
} from '../../proposals/proposal-store';
import { BuehnePreviewComponent } from './buehne-preview.component';
import { BuehneState } from './buehne-state';

type Step = 0 | 1 | 2;

@Component({
  selector: 'app-buehne-editor',
  imports: [BuehnePreviewComponent],
  templateUrl: './buehne-editor.component.html',
  styleUrl: './buehne-editor.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '(document:keydown.escape)': 'close()' },
})
export class BuehneEditorComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly state = inject(BuehneState);

  protected readonly letters = ANSWER_LETTERS;
  protected readonly limits = QUESTION_LIMITS;
  protected readonly steps = ['Frage', 'Antworten', 'Prüfen'];

  protected readonly question = computed(() => {
    const id = this.state.editing();
    return typeof id === 'number'
      ? ((this.store.questions() ?? []).find((q) => q.id === id) ?? null)
      : null;
  });
  protected readonly isNew = computed(() => this.state.editing() === 'new');
  protected readonly draft = linkedSignal<QuestionDraft>(() => {
    const q = this.question();
    return q
      ? draftFrom(q)
      : { ...emptyDraft(), category: this.state.category() ?? '' };
  });
  protected readonly step = signal<Step>(0);
  protected readonly tried = signal<ReadonlySet<Step>>(new Set());
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly confirmDelete = signal(false);

  private readonly validation = computed(() => validateDraft(this.draft()));
  protected readonly errors = computed(() => {
    const v = this.validation();
    const tried = this.tried();
    return {
      text: tried.has(0) ? v.text : undefined,
      category: tried.has(0) ? v.category : undefined,
      options: tried.has(1) ? v.optionErrors : undefined,
    };
  });
  protected readonly stepValid = computed(() => [
    !this.validation().text && !this.validation().category,
    !this.validation().options,
    !hasErrors(this.validation()),
  ]);
  protected readonly rate = computed(() => {
    const q = this.question();
    return q ? successRate(q) : null;
  });

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected update(patch: Partial<QuestionDraft>): void {
    this.draft.update((d) => ({ ...d, ...patch }));
  }

  protected setOption(index: number, value: string): void {
    const options = [...this.draft().options];
    options[index] = value;
    this.update({ options });
  }

  /** Forward only with a valid step; existing questions may jump freely. */
  protected goTo(step: Step): void {
    if (step > this.step()) {
      for (let s = this.step(); s < step; s++) {
        this.tried.update((set) => new Set(set).add(s));
        if (!this.stepValid()[s]) {
          this.step.set(s);
          return;
        }
      }
    }
    this.step.set(step);
  }

  protected async save(): Promise<void> {
    this.tried.set(new Set([0, 1, 2]));
    if (hasErrors(this.validation())) {
      this.step.set(this.stepValid()[0] ? 1 : 0);
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      await this.store.saveQuestion(this.draft(), this.question()?.id ?? null, {
        quiet: true,
      });
      this.state.say(this.isNew() ? 'Frage erstellt' : 'Änderungen gespeichert');
      this.state.editing.set(null);
    } catch (error) {
      this.error.set(apiErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const q = this.question();
    if (q && (await this.store.deleteQuestion(q))) {
      this.state.editing.set(null);
    }
  }

  protected close(): void {
    this.state.editing.set(null);
  }
}
