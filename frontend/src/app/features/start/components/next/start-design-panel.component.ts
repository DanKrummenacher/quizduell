// TEMPORARY: panel to switch between start page designs (development only).
import { Component, model } from '@angular/core';
import { START_LAYOUTS, type StartLayout } from './start-design';

@Component({
  selector: 'app-start-design-panel',
  template: `
    <details class="panel">
      <summary>Vorschau</summary>
      <label>
        Startseite
        <select [value]="layout()" (change)="layout.set($any(value($event)))">
          @for (option of layouts; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </label>
    </details>
  `,
  styles: `
    .panel {
      position: fixed;
      top: calc(var(--app-safe-top) + 0.75rem);
      right: 0.75rem;
      z-index: 10;
      padding: 0.5rem 0.875rem;
      border: 1px solid #00327d;
      border-radius: 0.75rem;
      background: #fff;
      color: #00327d;
      font-size: 0.8125rem;
      box-shadow: 0 0.25rem 0.75rem rgba(0, 50, 125, 0.12);
    }
    summary {
      font-weight: 700;
      cursor: pointer;
    }
    label {
      display: grid;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }
    select {
      font: inherit;
      padding: 0.25rem;
    }
  `,
})
export class StartDesignPanelComponent {
  readonly layout = model<StartLayout>('today');

  protected readonly layouts = START_LAYOUTS;

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
