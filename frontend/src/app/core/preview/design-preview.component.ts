import { Component, DOCUMENT, inject, signal } from '@angular/core';
import {
  DesignPreviewStore,
  HEADER_VARIANTS,
  LARGE_SCREEN_OPTIONS,
} from './design-preview.store';

/**
 * Temporary helper to compare header and large-screen variants locally.
 * Only rendered when `environment.designPreview` is set (development).
 */
@Component({
  selector: 'app-design-preview',
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
        <p class="meta">Fenster {{ width() }} px · Schrift {{ fontSize() }} px</p>

        <p class="label">Header (eine Variante)</p>
        <div class="options">
          @for (option of headers; track option.id) {
            <button
              type="button"
              class="option"
              [class.active]="store.header() === option.id"
              (click)="store.setHeader(option.id)"
            >
              <span>{{ option.name }}</span>
              <small>{{ option.idea }}</small>
            </button>
          }
        </div>

        <p class="label">Grosse Bildschirme (kombinierbar)</p>
        <div class="options">
          @for (option of largeOptions; track option.id) {
            <button
              type="button"
              class="option"
              [class.active]="store.large().includes(option.id)"
              [attr.aria-pressed]="store.large().includes(option.id)"
              (click)="store.toggleLarge(option.id)"
            >
              <span
                >{{ store.large().includes(option.id) ? '☑' : '☐' }}
                {{ option.name }}</span
              >
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
      // Below dialogs, so it never covers their buttons.
      z-index: 600;
      font-family: 'Museo Sans', helvetica, arial, sans-serif;
      font-size: 14px;
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
    .meta {
      margin: 4px 0 0;
      font-size: 12px;
      color: #4d70a4;
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
      align-items: flex-start;
      gap: 2px;
      padding: 8px 10px;
      border: 1px solid #dfe3ea;
      border-radius: 6px;
      background: #f7f7f4;
      font-size: 13px;
      font-weight: 700;
      color: #00327d;
      text-align: left;
      cursor: pointer;

      small {
        font-size: 12px;
        font-weight: 300;
        color: #33507f;
      }
      &.active {
        border-color: #00327d;
        background: #e6edf7;
        box-shadow: inset 3px 0 0 #00a4e0;
      }
    }
  `,
})
export class DesignPreviewComponent {
  protected readonly store = inject(DesignPreviewStore);
  protected readonly headers = HEADER_VARIANTS;
  protected readonly largeOptions = LARGE_SCREEN_OPTIONS;
  protected readonly open = signal(false);
  protected readonly width = signal(0);
  protected readonly fontSize = signal(0);

  constructor() {
    const document = inject(DOCUMENT);
    const view = document.defaultView;
    const measure = () => {
      this.width.set(view?.innerWidth ?? 0);
      this.fontSize.set(
        parseFloat(
          view?.getComputedStyle(document.documentElement).fontSize ?? '16',
        ),
      );
    };
    measure();
    view?.addEventListener('resize', measure);
    // The font size also changes with the large-screen options.
    new MutationObserver(measure).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-large'],
    });
  }
}
