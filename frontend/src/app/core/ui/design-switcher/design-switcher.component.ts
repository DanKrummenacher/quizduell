import { Component, inject, signal } from '@angular/core';
import { BrandingStore, HEADER_VARIANTS } from '../../branding/branding.store';

/**
 * Temporary helper to compare logo and header designs locally.
 * Only rendered in development builds (see app.component).
 */
@Component({
  selector: 'app-design-switcher',
  template: `
    @if (open()) {
      <div class="panel" role="dialog" aria-label="Design-Vorschau">
        <div class="panel-head">
          <strong>Design-Vorschau</strong>
          <button
            type="button"
            class="close"
            (click)="open.set(false)"
            aria-label="Schliessen"
          >
            ×
          </button>
        </div>

        <p class="label">Header-Variante</p>
        <div class="options">
          @for (option of headers; track option.id) {
            <button
              type="button"
              class="option text"
              [class.active]="branding.header() === option.id"
              (click)="branding.setHeader(option.id)"
            >
              <span>{{ option.id }} · {{ option.name }}</span>
              <small>{{ option.idea }}</small>
            </button>
          }
        </div>
      </div>
    } @else {
      <button type="button" class="toggle" (click)="open.set(true)">
        Design-Vorschau
      </button>
    }
  `,
  styles: `
    :host {
      position: fixed;
      left: 12px;
      bottom: 12px;
      z-index: 1000;
      font-family: 'Museo Sans', helvetica, arial, sans-serif;
      color: #00327d;
    }
    .toggle,
    .panel {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
      border-radius: 8px;
      background: #fff;
      border: 1px solid #8098be;
    }
    .toggle {
      padding: 8px 14px;
      font-size: 14px;
      font-weight: 700;
      color: #00327d;
      cursor: pointer;
    }
    .panel {
      width: min(340px, calc(100vw - 24px));
      max-height: calc(100dvh - 24px);
      overflow: auto;
      padding: 12px 14px 14px;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .close {
      border: 0;
      background: none;
      font-size: 22px;
      color: #00327d;
      cursor: pointer;
    }
    .label {
      margin: 12px 0 6px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #4d70a4;
    }
    .options {
      display: grid;
      gap: 6px;
    }
    .option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border: 1px solid #dfe3ea;
      border-radius: 6px;
      background: #f7f7f4;
      font-size: 13px;
      color: #00327d;
      cursor: pointer;

      &.text {
        align-items: flex-start;
        gap: 2px;
        text-align: left;
      }

      small {
        font-size: 12px;
        font-weight: 300;
        color: #4d70a4;
      }

      &.active {
        border-color: #00327d;
        background: #fff;
        font-weight: 700;
      }
    }
  `,
})
export class DesignSwitcherComponent {
  protected readonly branding = inject(BrandingStore);
  protected readonly open = signal(false);

  protected readonly headers = HEADER_VARIANTS;
}
