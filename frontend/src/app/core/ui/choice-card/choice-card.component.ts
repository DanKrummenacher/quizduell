import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import '@css-ch/components/icon';

/** Large tappable card used for menu choices. Place it inside a <button>. */
@Component({
  selector: 'app-choice-card',
  template: `
    <span class="icon"><css-icon [icon]="icon()" size="xl" weight="regular" /></span>
    <span class="text">
      <span class="title">{{ title() }}</span>
      <span class="description">{{ description() }}</span>
    </span>
    <css-icon class="chevron" icon="angle-right" size="md" />
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--css-space-xs);
      width: 100%;
      min-height: 5.5rem;
      padding: var(--css-space-xs) var(--css-space-sm) var(--css-space-xs)
        var(--css-space-xs);
      text-align: left;
    }
    .icon {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: var(--css-border-radius-md);
      background: var(--css-colorstyle-brand-gradient);
      color: var(--css-color-text-inverse);
    }
    .text {
      display: flex;
      flex-direction: column;
      gap: var(--css-space-3xs);
      flex: 1;
      min-width: 0;
    }
    .title {
      font: var(--css-textstyle-headline-sm);
      font-size: 1.125rem;
      color: var(--css-color-text-default);
    }
    .description {
      font: var(--css-textstyle-body-sm);
      color: var(--css-color-text-strong);
    }
    .chevron {
      flex-shrink: 0;
      color: var(--css-color-text-muted);
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ChoiceCardComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
