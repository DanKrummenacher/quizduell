import { Component, input, output } from '@angular/core';

/**
 * Compact on/off switch for dense lists and tables, in the look of the
 * library's `css-switch` but without a visible label (screen readers get it).
 */
@Component({
  selector: 'app-ad-toggle',
  template: `
    <button
      type="button"
      role="switch"
      class="toggle"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label()"
      [disabled]="disabled()"
      (click)="toggled.emit(!checked())"
    >
      <span class="knob"></span>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .toggle {
      position: relative;
      width: 34px;
      height: 20px;
      padding: 0;
      border: 0;
      border-radius: 99px;
      background: #8098be;
      cursor: pointer;
      transition: background-color 0.18s ease;
    }
    .toggle:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .toggle[aria-checked='true'] {
      background: #00875e;
    }
    .knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 30, 80, 0.3);
      transition: transform 0.2s cubic-bezier(0.3, 0.7, 0.4, 1.2);
    }
    .toggle[aria-checked='true'] .knob {
      transform: translateX(14px);
    }
  `,
})
export class AdToggleComponent {
  readonly checked = input.required<boolean>();
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly toggled = output<boolean>();
}
