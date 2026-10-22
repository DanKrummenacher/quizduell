// Atelier: a question opened in place, with a live preview.
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
import '@css-ch/components/icon';
import {
  type AdminQuestion,
  QUESTION_LIMITS,
} from '../../../core/contracts/admin.contract';
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
import { AtelierState } from './atelier-state';

@Component({
  selector: 'app-atelier-editor',
  templateUrl: './atelier-editor.component.html',
  styleUrl: './atelier-editor.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '(keydown)': 'onKey($event)' },
})
export class AtelierEditorComponent {
  protected readonly store = inject(ProposalStore);
  private readonly state = inject(AtelierState);
  /** The question; null for a new one. */
  readonly question = input<AdminQuestion | null>(null);
  readonly closed = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly limits = QUESTION_LIMITS;
  protected readonly draft = linkedSignal<QuestionDraft>(() => {
    const q = this.question();
    return q
      ? draftFrom(q)
      : { ...emptyDraft(), category: this.state.category() ?? '' };
  });
  protected readonly tried = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly confirmDelete = signal(false);
  private readonly first = viewChild<ElementRef<HTMLTextAreaElement>>('first');

  protected readonly errors = computed(() =>
    this.tried() ? validateDraft(this.draft()) : {},
  );
  protected readonly dirty = computed(() => {
    const q = this.question();
    return (
      JSON.stringify(
        q
          ? draftFrom(q)
          : { ...emptyDraft(), category: this.state.category() ?? '' },
      ) !== JSON.stringify(this.draft())
    );
  });
  protected readonly rate = computed(() => {
    const q = this.question();
    return q ? successRate(q) : null;
  });
  protected readonly suggestions = computed(() => {
    const current = this.draft().category.trim().toLowerCase();
    return this.store
      .categories()
      .filter((c) => c.toLowerCase() !== current)
      .slice(0, 6);
  });

  constructor() {
    afterNextRender(() => this.first()?.nativeElement.focus());
  }

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

  protected async save(): Promise<void> {
    this.tried.set(true);
    this.error.set('');
    if (hasErrors(validateDraft(this.draft()))) {
      return;
    }
    const before = this.question();
    this.saving.set(true);
    try {
      const saved = await this.store.saveQuestion(this.draft(), before?.id ?? null, {
        quiet: true,
      });
      if (before) {
        const previous = draftFrom(before);
        this.state.toast('Änderungen gespeichert', () =>
          this.store
            .saveQuestion(previous, saved.id, { quiet: true })
            .then(() => undefined),
        );
      } else {
        this.state.toast('Frage erstellt');
      }
      this.closed.emit();
    } catch (error) {
      this.error.set(apiErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const q = this.question();
    if (q && (await this.store.deleteQuestion(q))) {
      this.store.message.set(null);
      this.state.toast('Frage gelöscht');
      this.closed.emit();
    }
  }

  protected cancel(): void {
    this.closed.emit();
  }

  /** ⌘↵ saves, Esc closes without saving. */
  protected onKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void this.save();
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      this.cancel();
    }
  }
}
