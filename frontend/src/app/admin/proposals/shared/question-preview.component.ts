// TEMPORARY: a question as the players see it (development only).
import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';

/**
 * The question in the look of the quiz screen: the text and the four answer
 * cards with the letter block; the correct answer is shown as after the
 * reveal.
 */
@Component({
  selector: 'app-question-preview',
  template: `
    <div class="screen">
      <div class="top">
        <span class="step">Frage 1 von {{ total() }}</span>
        <span class="time">{{ seconds() }} s</span>
      </div>
      <div class="timer"><span></span></div>
      @if (category()) {
        <span class="category">{{ category() }}</span>
      }
      <p class="text" [class.placeholder]="!text().trim()">
        {{ text().trim() || 'Hier steht deine Frage …' }}
      </p>
      <div class="answers">
        @for (option of options(); track $index; let i = $index) {
          <div class="answer" [class.correct]="i === correctIndex()">
            <span class="letter">{{ letters[i] }}</span>
            <span class="answer-text" [class.placeholder]="!option.trim()">
              {{ option.trim() || 'Antwort ' + letters[i] }}
            </span>
            @if (i === correctIndex()) {
              <css-icon icon="checkmark" size="sm"></css-icon>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    @use '@css-ch/web-design-tokens/colors';
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;

    :host {
      display: block;
    }

    .screen {
      padding: functions.rem(20) functions.rem(16) functions.rem(24);
      border-radius: functions.rem(24);
      border: functions.rem(6) solid colors.$dt-color-darkblue-100;
      background-color: colors.$dt-color-pepper-bright;
      box-shadow: 0 functions.rem(16) functions.rem(40) rgba(0, 50, 125, 0.18);
    }

    .top {
      display: flex;
      justify-content: space-between;
      font-size: functions.rem(13);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: colors.$dt-color-darkblue-100;
    }

    .timer {
      height: functions.rem(4);
      margin-top: functions.rem(8);
      border-radius: functions.rem(2);
      background-color: #dfe8f3;

      span {
        display: block;
        width: 64%;
        height: 100%;
        border-radius: inherit;
        background-color: colors.$dt-color-cyan-100;
      }
    }

    .category {
      display: inline-block;
      margin-top: functions.rem(16);
      font-size: functions.rem(12);
      color: colors.$dt-color-darkblue-70;
    }

    .text {
      margin: functions.rem(6) 0 functions.rem(20);
      font-size: functions.rem(18);
      line-height: 1.25;
      color: colors.$dt-color-darkblue-100;
      overflow-wrap: anywhere;
    }

    .placeholder {
      color: #8098be;
    }

    .answers {
      display: grid;
      gap: functions.rem(8);
    }

    .answer {
      display: flex;
      align-items: center;
      gap: functions.rem(12);
      min-height: functions.rem(46);
      padding-right: functions.rem(12);
      border: functions.rem(1) solid #8098be;
      border-radius: functions.rem(4);
      background-color: colors.$dt-color-white-100;
      overflow: hidden;
      font-size: functions.rem(14);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: colors.$dt-color-darkblue-100;
      transition: background-color 0.25s ease;

      &.correct {
        background-color: colors.$dt-color-basil-dark;
        color: colors.$dt-color-white-100;

        .letter {
          background-color: rgba(255, 255, 255, 0.16);
        }

        .placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
      }

      css-icon {
        margin-left: auto;
      }
    }

    .letter {
      display: grid;
      place-items: center;
      align-self: stretch;
      flex: none;
      width: functions.rem(40);
      background-color: colors.$dt-color-darkblue-100;
      color: colors.$dt-color-white-100;
    }

    .answer-text {
      min-width: 0;
      padding-block: functions.rem(8);
      overflow-wrap: anywhere;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuestionPreviewComponent {
  readonly text = input.required<string>();
  readonly options = input.required<string[]>();
  readonly correctIndex = input.required<number>();
  readonly category = input('');
  readonly total = input(3);
  readonly seconds = input(20);

  protected readonly letters = ANSWER_LETTERS;
}
