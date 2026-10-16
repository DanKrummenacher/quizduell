import { Component, inject } from '@angular/core';
import { type QuizHeaderVariant, QuizHeaderStore } from './quiz-header.store';

const OPTIONS: { id: QuizHeaderVariant; name: string }[] = [
  { id: 'cards', name: 'T2 · Duell-Karten' },
  { id: 'faceoff', name: 'T7 · Gegenüber' },
];

/**
 * Temporary helper to compare the two quiz headers locally.
 * Only rendered when `environment.quizHeaderPreview` is set (development).
 */
@Component({
  selector: 'app-quiz-header-preview',
  template: `
    <div class="switch" role="group" aria-label="Quiz-Kopf">
      <span class="label">Quiz-Kopf</span>
      @for (option of options; track option.id) {
        <button
          type="button"
          [attr.aria-pressed]="store.variant() === option.id"
          (click)="store.set(option.id)"
        >
          {{ option.name }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      left: 12px;
      bottom: 12px;
      z-index: 600;
      font-family: 'Museo Sans', helvetica, arial, sans-serif;
    }
    .switch {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      border: 1px solid #8098be;
      border-radius: 999px;
      background: #fff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
    }
    .label {
      padding: 0 8px;
      font-size: 12px;
      font-weight: 700;
      color: #4d70a4;
    }
    button {
      padding: 6px 12px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      font: inherit;
      font-size: 13px;
      color: #00327d;
      cursor: pointer;
    }
    button[aria-pressed='true'] {
      background: #00327d;
      color: #fff;
      font-weight: 700;
    }
  `,
})
export class QuizHeaderPreviewComponent {
  protected readonly store = inject(QuizHeaderStore);
  protected readonly options = OPTIONS;
}
