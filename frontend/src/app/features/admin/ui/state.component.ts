import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import '@css-ch/components/icon';

/**
 * What a card or page shows instead of its content: a skeleton while loading,
 * an error with «Erneut versuchen», or an empty state with an explanation.
 */
@Component({
  selector: 'app-ad-state',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @switch (kind()) {
      @case ('loading') {
        <div class="skeleton" aria-busy="true" aria-label="Wird geladen">
          @for (line of lineArray(); track $index) {
            <span
              [style.width.%]="$index === lineArray().length - 1 ? 55 : 100"
            ></span>
          }
        </div>
      }
      @case ('error') {
        <div class="box error" role="alert">
          <css-icon icon="priority-warning" size="md"></css-icon>
          <div>
            <p class="title">Konnte nicht geladen werden</p>
            <p class="text">{{ text() }}</p>
          </div>
          <button type="button" class="retry" (click)="retry.emit()">
            <css-icon icon="reload" size="xs"></css-icon>Erneut versuchen
          </button>
        </div>
      }
      @case ('empty') {
        <div class="box empty">
          <css-icon [attr.icon]="icon()" size="md"></css-icon>
          <div>
            <p class="title">{{ title() }}</p>
            @if (text()) {
              <p class="text">{{ text() }}</p>
            }
          </div>
          <ng-content />
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .skeleton {
      display: grid;
      gap: 12px;
      padding: 4px 0;
    }
    .skeleton span {
      height: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, #eff2f6 25%, #f6f8fa 50%, #eff2f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    @keyframes shimmer {
      to {
        background-position: -200% 0;
      }
    }
    .box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px 16px;
      padding: 18px 20px;
      border-radius: 4px;
      background: #fafbfc;
      color: #00327d;
    }
    .box > css-icon {
      flex: none;
      color: #4d70a4;
    }
    .box > div {
      flex: 1;
      min-width: 200px;
    }
    .error {
      background: #fcefec;
    }
    .error > css-icon {
      color: #a8290f;
    }
    .title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
    }
    .text {
      margin: 3px 0 0;
      color: #4d70a4;
      font-size: 13px;
      line-height: 1.5;
    }
    .retry {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 14px;
      border: 1px solid #00327d;
      border-radius: 99px;
      background: #fff;
      color: #00327d;
      font: inherit;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
    }
    .retry:hover {
      background: #eef3f9;
    }
  `,
})
export class AdStateComponent {
  readonly kind = input.required<'loading' | 'error' | 'empty'>();
  readonly title = input('');
  readonly text = input<string | null>('');
  readonly icon = input('info');
  readonly lines = input(3);
  readonly retry = output<void>();

  protected lineArray(): number[] {
    return Array.from({ length: this.lines() }, (_, i) => i);
  }
}
