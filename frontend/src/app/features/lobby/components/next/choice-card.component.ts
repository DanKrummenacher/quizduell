import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import '@css-ch/components/icon';

/** A tappable choice in the style of the quiz answers. */
@Component({
  selector: 'app-choice-card',
  template: `
    <button type="button" class="choice" (click)="choose.emit()">
      <span class="choice-block" aria-hidden="true">
        <css-icon [attr.icon]="icon()" size="lg"></css-icon>
      </span>
      <span class="choice-text">
        <span class="choice-title">{{ heading() }}</span>
        <span class="choice-description">{{ description() }}</span>
      </span>
      <css-icon
        icon="angle-right"
        class="choice-chevron"
        aria-hidden="true"
      ></css-icon>
    </button>
  `,
  styles: `
    @use 'screen';

    :host {
      display: block;
    }

    .choice {
      @include screen.choice-card;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ChoiceCardComponent {
  readonly icon = input.required<string>();
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  readonly choose = output<void>();
}
