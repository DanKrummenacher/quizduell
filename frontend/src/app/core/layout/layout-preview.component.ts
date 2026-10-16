import { Component, DOCUMENT, inject, signal } from '@angular/core';
import { LAYOUT_CONCEPTS, LayoutConceptStore } from './layout-concept.store';

/**
 * Temporary helper to compare large-screen layouts locally.
 * Only rendered when `environment.layoutPreview` is set (development).
 */
@Component({
  selector: 'app-layout-preview',
  template: `
    @if (open()) {
      <div class="panel" role="dialog" aria-label="Layout-Vorschau">
        <div class="panel-head">
          <strong>Layout-Vorschau</strong>
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
        <div class="options">
          @for (option of concepts; track option.id) {
            <button
              type="button"
              class="option"
              [class.active]="store.concept() === option.id"
              (click)="store.set(option.id)"
            >
              <span>{{ option.name }}</span>
              <small>{{ option.idea }}</small>
            </button>
          }
        </div>
      </div>
    } @else {
      <button type="button" class="toggle" (click)="open.set(true)">
        Layout-Vorschau
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
      margin: 4px 0 10px;
      font-size: 12px;
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
export class LayoutPreviewComponent {
  protected readonly store = inject(LayoutConceptStore);
  protected readonly concepts = LAYOUT_CONCEPTS;
  protected readonly open = signal(false);
  protected readonly width = signal(0);
  protected readonly fontSize = signal(0);

  constructor() {
    const document = inject(DOCUMENT);
    const view = document.defaultView;
    const measure = () => {
      this.width.set(view?.innerWidth ?? 0);
      this.fontSize.set(
        Math.round(
          parseFloat(
            view?.getComputedStyle(document.documentElement).fontSize ?? '16',
          ) * 100,
        ) / 100,
      );
    };
    measure();
    view?.addEventListener('resize', measure);
    // The font size also changes when switching concepts.
    new MutationObserver(measure).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-layout'],
    });
  }
}
