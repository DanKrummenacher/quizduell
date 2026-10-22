// Redaktion: one question as a block of the document. Edited in place and
// saved by itself shortly after the last change, once it is complete.
import {
  afterNextRender,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
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
import { RedaktionState } from './redaktion-state';

type Status = 'saved' | 'editing' | 'saving' | 'incomplete' | 'error';

const SAVE_DELAY_MS = 900;

@Component({
  selector: 'app-redaktion-block',
  templateUrl: './redaktion-block.component.html',
  styleUrl: './redaktion-block.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    '[class.focused]': 'focused()',
    '[class.new]': 'id() === null',
    '(focusin)': 'onFocus()',
    '(focusout)': 'onBlur($event)',
  },
})
export class RedaktionBlockComponent implements OnInit {
  private readonly store = inject(ProposalStore);
  private readonly state = inject(RedaktionState);
  /** The question, or null for a new block. */
  readonly question = input<AdminQuestion | null>(null);
  readonly category = input('');
  readonly number = input(1);
  readonly created = output<number>();
  readonly removed = output<void>();

  protected readonly letters = ANSWER_LETTERS;
  protected readonly limits = QUESTION_LIMITS;
  protected readonly draft = signal<QuestionDraft>(emptyDraft());
  protected readonly id = signal<number | null>(null);
  protected readonly status = signal<Status>('saved');
  protected readonly message = signal('');
  protected readonly focused = signal(false);
  protected readonly confirmDelete = signal(false);
  private timer = 0;
  private savedJson = '';
  /** The saved version before the changes of this visit, for «Rückgängig». */
  protected readonly original = signal<QuestionDraft | null>(null);

  protected readonly live = computed(() => {
    const id = this.id();
    return id === null
      ? null
      : ((this.store.questions() ?? []).find((q) => q.id === id) ?? null);
  });
  protected readonly rate = computed(() => {
    const q = this.live();
    return q ? successRate(q) : null;
  });

  constructor() {
    // The question field gets the height of its text.
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() => {
      const area = host.nativeElement.querySelector('textarea');
      if (area) {
        area.style.height = `${area.scrollHeight}px`;
        // A new block gets the cursor right away.
        if (this.id() === null) {
          area.focus();
        }
      }
    });
    inject(DestroyRef).onDestroy(() => {
      // Leaving the page: a pending, complete change is still saved.
      if (this.status() === 'editing') {
        clearTimeout(this.timer);
        void this.save();
      }
    });
  }

  ngOnInit(): void {
    const q = this.question();
    const draft = q ? draftFrom(q) : { ...emptyDraft(), category: this.category() };
    this.draft.set(draft);
    this.id.set(q?.id ?? null);
    this.savedJson = q ? JSON.stringify(draft) : '';
    this.original.set(q ? draft : null);
    this.status.set(q ? 'saved' : 'incomplete');
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** Lets a text area grow with its text. */
  protected grow(event: Event): void {
    const area = event.target as HTMLTextAreaElement;
    area.style.height = 'auto';
    area.style.height = `${area.scrollHeight}px`;
  }

  protected update(patch: Partial<QuestionDraft>): void {
    this.draft.update((d) => ({ ...d, ...patch }));
    this.state.focused.set(this.draft());
    this.schedule();
  }

  protected setOption(index: number, value: string): void {
    const options = [...this.draft().options];
    options[index] = value;
    this.update({ options });
  }

  protected onFocus(): void {
    this.focused.set(true);
    this.state.focused.set(this.draft());
  }

  protected onBlur(event: FocusEvent): void {
    const host = (event.currentTarget as HTMLElement | null) ?? null;
    if (!host?.contains(event.relatedTarget as Node | null)) {
      this.focused.set(false);
      this.confirmDelete.set(false);
    }
  }

  private schedule(): void {
    clearTimeout(this.timer);
    if (JSON.stringify(this.draft()) === this.savedJson) {
      this.status.set('saved');
      return;
    }
    this.status.set('editing');
    this.timer = window.setTimeout(() => void this.save(), SAVE_DELAY_MS);
  }

  private async save(): Promise<void> {
    const draft = this.draft();
    const errors = validateDraft(draft);
    if (hasErrors(errors)) {
      this.status.set('incomplete');
      this.message.set(
        errors.text ??
          (errors.optionErrors?.some(Boolean)
            ? 'Alle vier Antworten ausfüllen, jede nur einmal.'
            : (errors.category ?? '')),
      );
      return;
    }
    this.status.set('saving');
    try {
      const saved = await this.store.saveQuestion(draft, this.id(), { quiet: true });
      this.savedJson = JSON.stringify(draft);
      if (this.id() === null) {
        this.id.set(saved.id);
        this.created.emit(saved.id);
      }
      // Typed on while saving: save again.
      if (JSON.stringify(this.draft()) !== this.savedJson) {
        this.schedule();
      } else {
        this.status.set('saved');
      }
    } catch (error) {
      this.status.set('error');
      this.message.set(apiErrorMessage(error));
    }
  }

  /** Back to the version from before this visit, saved at once. */
  protected undo(): void {
    const original = this.original();
    if (original) {
      this.draft.set(original);
      this.state.focused.set(original);
      clearTimeout(this.timer);
      void this.save();
    }
  }

  protected readonly changedSinceVisit = computed(() => {
    const original = this.original();
    return !!original && JSON.stringify(original) !== JSON.stringify(this.draft());
  });

  protected async remove(): Promise<void> {
    const q = this.live();
    if (!q) {
      this.removed.emit();
      return;
    }
    if (await this.store.deleteQuestion(q)) {
      this.store.message.set(null);
      this.removed.emit();
    }
  }
}
