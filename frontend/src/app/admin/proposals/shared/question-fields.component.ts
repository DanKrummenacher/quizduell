// TEMPORARY: the fields of a question, shared by the proposals J–L (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  model,
} from '@angular/core';
import '@css-ch/components/input-text';
import '@css-ch/components/input-textarea';
import '@css-ch/components/switch';
import { QUESTION_LIMITS } from '../../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { eventChecked } from '../../../core/ui/component-events';
import type { QuestionDraft, QuestionErrors } from '../../questions/question-form';

/**
 * Question, four answers, category and state. The correct answer is set
 * with its letter block, as the players see it in the game.
 */
@Component({
  selector: 'app-question-fields',
  template: `
    @let d = draft();
    @let e = errors();
    <div class="fields" [class.compact]="compact()">
      <css-input-textarea
        label="Frage"
        placeholder="z.B. Wie viele Kantone hat die Schweiz?"
        rows="3"
        [maxlength]="limits.text.max"
        character-counter
        [value]="d.text"
        [errorMessage]="e.text"
        (input)="update({ text: typed($event) })"
      />

      <fieldset class="answers">
        <legend>
          Antworten
          <span class="hint"
            >Buchstaben antippen, um die richtige Antwort zu wählen</span
          >
        </legend>
        @for (option of d.options; track $index; let i = $index) {
          <div class="answer" [class.correct]="d.correctIndex === i">
            <button
              type="button"
              class="letter"
              [attr.aria-pressed]="d.correctIndex === i"
              [attr.aria-label]="'Antwort ' + letters[i] + ' ist richtig'"
              (click)="update({ correctIndex: i })"
            >
              {{ letters[i] }}
            </button>
            <css-input-text
              class="answer-input"
              [label]="
                'Antwort ' + letters[i] + (d.correctIndex === i ? ' · richtig' : '')
              "
              [maxlength]="limits.option.max"
              [value]="option"
              [errorMessage]="e.optionErrors?.[i] ?? undefined"
              (input)="setOption(i, $event)"
            />
          </div>
        }
      </fieldset>

      <div class="category">
        <css-input-text
          label="Kategorie (optional)"
          placeholder="z.B. Logik"
          [maxlength]="limits.category.max"
          [value]="d.category"
          [errorMessage]="e.category"
          (input)="update({ category: typed($event) })"
        />
        @if (suggestions().length) {
          <div class="chips" aria-label="Vorhandene Kategorien">
            @for (name of suggestions(); track name) {
              <button
                type="button"
                class="chip"
                (click)="update({ category: name })"
              >
                {{ name }}
              </button>
            }
          </div>
        }
      </div>

      <css-switch
        label="Aktiv – wird im Spiel verwendet"
        [checked]="d.active"
        (change)="update({ active: checked($event) })"
      />
    </div>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'interaction';
    @use '../kit';

    .fields {
      display: grid;
      gap: functions.rem(24);

      &.compact {
        gap: functions.rem(20);
      }
    }

    .answers {
      display: grid;
      gap: functions.rem(12);
      margin: 0;
      padding: 0;
      border: 0;

      legend {
        margin-bottom: functions.rem(8);
        padding: 0;
        font-size: functions.rem(16);
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
      }
    }

    .hint {
      display: block;
      font-size: functions.rem(13);
      font-weight: miscs.$css-ui-font-weight-regular;
      color: kit.$muted;
    }

    .answer {
      display: flex;
      align-items: flex-end;
      gap: functions.rem(12);
    }

    .letter {
      display: grid;
      place-items: center;
      flex: none;
      width: functions.rem(44);
      height: functions.rem(44);
      border: 0;
      border-radius: functions.rem(4);
      background-color: kit.$blue;
      color: kit.$white;
      font: inherit;
      font-size: functions.rem(16);
      font-weight: miscs.$css-ui-font-weight-bold;
      cursor: pointer;
      transition: background-color 0.2s ease;

      .correct & {
        background-color: kit.$green;
      }
    }

    .answer-input {
      flex: 1 1 auto;
      min-width: 0;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: functions.rem(6);
      margin-top: functions.rem(10);
    }

    .chip {
      @include kit.tag;
      padding: functions.rem(4) functions.rem(10);
      background-color: kit.$white;
      font: inherit;
      font-size: functions.rem(13);
      @include interaction.chip;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuestionFieldsComponent {
  readonly draft = model.required<QuestionDraft>();
  readonly errors = input<QuestionErrors>({});
  readonly categories = input<string[]>([]);
  readonly compact = input(false);

  protected readonly letters = ANSWER_LETTERS;
  protected readonly limits = QUESTION_LIMITS;
  protected readonly checked = eventChecked;
  protected readonly suggestions = computed(() => {
    const current = this.draft().category.trim().toLowerCase();
    return this.categories().filter((name) => name.toLowerCase() !== current);
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
}
