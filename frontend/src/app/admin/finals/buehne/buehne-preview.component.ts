// Bühne: the question as on the quiz screen of a phone.
import { Component, input } from '@angular/core';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';

@Component({
  selector: 'app-buehne-preview',
  template: `
    <div class="phone">
      <div class="phone-top">
        <span>Frage 1 von {{ total() }}</span>
        <span>{{ seconds() }} s</span>
      </div>
      <div class="phone-timer"><span></span></div>
      <p class="phone-q">{{ text() }}</p>
      @for (option of options(); track $index; let i = $index) {
        <div class="phone-a" [class.right]="i === correctIndex()">
          <b>{{ letters[i] }}</b
          ><span>{{ option }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    @use '@css-ch/web-design-tokens/colors';
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'buehne' as b;

    :host {
      display: block;
      width: min(100%, functions.rem(360));
    }

    .phone {
      display: grid;
      gap: functions.rem(8);
      padding: functions.rem(18) functions.rem(16) functions.rem(20);
      border: functions.rem(8) solid b.$blue;
      border-radius: functions.rem(28);
      background-color: colors.$dt-color-pepper-bright;
    }

    .phone-top {
      display: flex;
      justify-content: space-between;
      font-size: functions.rem(13);
      font-weight: miscs.$css-ui-font-weight-bold;
    }

    .phone-timer {
      height: functions.rem(4);
      border-radius: functions.rem(2);
      background-color: #dfe8f3;

      span {
        display: block;
        width: 60%;
        height: 100%;
        border-radius: inherit;
        background-color: b.$cyan;
      }
    }

    .phone-q {
      margin: functions.rem(8) 0;
      font-size: functions.rem(19);
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .phone-a {
      display: flex;
      align-items: center;
      min-height: functions.rem(46);
      overflow: hidden;
      border: functions.rem(1) solid #8098be;
      border-radius: functions.rem(4);
      background-color: b.$white;
      font-size: functions.rem(14);
      font-weight: miscs.$css-ui-font-weight-bold;

      b {
        display: grid;
        place-items: center;
        align-self: stretch;
        width: functions.rem(40);
        background-color: b.$blue;
        color: b.$white;
      }

      span {
        padding: functions.rem(6) functions.rem(12);
      }

      &.right {
        background-color: b.$green;
        color: b.$white;

        b {
          background-color: rgba(255, 255, 255, 0.16);
        }
      }
    }
  `,
})
export class BuehnePreviewComponent {
  readonly text = input.required<string>();
  readonly options = input.required<string[]>();
  readonly correctIndex = input.required<number>();
  readonly total = input(3);
  readonly seconds = input(20);

  protected readonly letters = ANSWER_LETTERS;
}
