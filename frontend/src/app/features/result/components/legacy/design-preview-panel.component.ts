// TEMPORARY: panel to switch between result page designs (development only).
import { Component, model } from '@angular/core';
import type { RematchStatus } from '../../../../core/contracts/game.contract';
import {
  ICON_STYLES,
  NOTICE_STYLES,
  PREVIEW_STATES,
  type ResultIconStyle,
  type ResultNoticeStyle,
} from './design-preview';

@Component({
  selector: 'app-design-preview-panel',
  template: `
    <details class="panel">
      <summary>Vorschau</summary>
      <label>
        Design
        <select
          [value]="legacy() ? 'alt' : 'neu'"
          (change)="legacy.set(value($event) === 'alt')"
        >
          <option value="neu">Neu</option>
          <option value="alt">Alt</option>
        </select>
      </label>
      <label>
        Symbol
        <select [value]="iconStyle()" (change)="iconStyle.set($any(value($event)))">
          @for (option of iconStyles; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </label>
      <label>
        Meldung
        <select
          [value]="noticeStyle()"
          (change)="noticeStyle.set($any(value($event)))"
        >
          @for (option of noticeStyles; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </label>
      <label>
        Zustand
        <select
          [value]="state() ?? ''"
          (change)="state.set($any(value($event)) || null)"
        >
          @for (option of states; track option.value) {
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
      display: grid;
      gap: 0.5rem;
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
export class DesignPreviewPanelComponent {
  readonly legacy = model(false);
  readonly iconStyle = model<ResultIconStyle>('diamond');
  readonly noticeStyle = model<ResultNoticeStyle>('line');
  readonly state = model<RematchStatus | null>(null);

  protected readonly iconStyles = ICON_STYLES;
  protected readonly noticeStyles = NOTICE_STYLES;
  protected readonly states = PREVIEW_STATES;

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
