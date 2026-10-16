import { Component, inject, signal } from '@angular/core';
import { type FaceoffOptions, QuizHeaderStore } from './quiz-header.store';

interface Group<K extends keyof FaceoffOptions> {
  key: K;
  label: string;
  options: { value: FaceoffOptions[K]; name: string }[];
}

const GROUPS = [
  {
    key: 'clock',
    label: 'Raute zeigt',
    options: [
      { value: 'seconds', name: 'Sekunden' },
      { value: 'question', name: 'Frage' },
      { value: 'ring', name: 'Raute als Uhr' },
      { value: 'none', name: 'Keine Raute' },
    ],
  } satisfies Group<'clock'>,
  {
    key: 'width',
    label: 'Breite (ab Tablet)',
    options: [
      { value: 'bleed', name: 'Randlos' },
      { value: 'card', name: 'Band' },
      { value: 'column', name: 'Spaltenrand' },
    ],
  } satisfies Group<'width'>,
  {
    key: 'look',
    label: 'Look',
    options: [
      { value: 'classic', name: 'Klassisch' },
      { value: 'contrast', name: 'Kontrast' },
      { value: 'gradient', name: 'Verlauf' },
    ],
  } satisfies Group<'look'>,
  {
    key: 'pop',
    label: 'Punkte-Effekt',
    options: [
      { value: true, name: 'An' },
      { value: false, name: 'Aus' },
    ],
  } satisfies Group<'pop'>,
];

/**
 * Temporary helper to fine-tune the quiz header «Gegenüber» locally.
 * Only rendered when `environment.quizHeaderPreview` is set (development).
 */
@Component({
  selector: 'app-quiz-header-preview',
  template: `
    @if (open()) {
      <div class="panel" role="dialog" aria-label="Quiz-Kopf">
        <div class="head">
          <strong>Quiz-Kopf «Gegenüber»</strong>
          <button
            type="button"
            class="close"
            (click)="open.set(false)"
            aria-label="Schliessen"
          >
            ×
          </button>
        </div>
        @for (group of groups; track group.key) {
          <p class="label">{{ group.label }}</p>
          <div class="seg" role="group" [attr.aria-label]="group.label">
            @for (option of group.options; track option.name) {
              <button
                type="button"
                [attr.aria-pressed]="store.options()[group.key] === option.value"
                (click)="choose(group.key, option.value)"
              >
                {{ option.name }}
              </button>
            }
          </div>
        }
      </div>
    } @else {
      <button type="button" class="toggle" (click)="open.set(true)">
        Quiz-Kopf
      </button>
    }
  `,
  styles: `
    :host {
      position: fixed;
      left: 12px;
      bottom: 12px;
      z-index: 600;
      font-family: 'Museo Sans', helvetica, arial, sans-serif;
      color: #00327d;
    }
    .toggle,
    .panel {
      border: 1px solid #8098be;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
    }
    .toggle {
      padding: 8px 14px;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      color: #00327d;
      cursor: pointer;
    }
    .panel {
      width: min(330px, calc(100vw - 24px));
      padding: 10px 14px 14px;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
    }
    .close {
      border: 0;
      background: none;
      font-size: 22px;
      color: #00327d;
      cursor: pointer;
    }
    .label {
      margin: 10px 0 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #4d70a4;
    }
    .seg {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .seg button {
      padding: 5px 10px;
      border: 1px solid #dfe3ea;
      border-radius: 999px;
      background: #f7f7f4;
      font: inherit;
      font-size: 12px;
      color: #00327d;
      cursor: pointer;
    }
    .seg button[aria-pressed='true'] {
      border-color: #00327d;
      background: #00327d;
      color: #fff;
      font-weight: 700;
    }
  `,
})
export class QuizHeaderPreviewComponent {
  protected readonly store = inject(QuizHeaderStore);
  protected readonly groups = GROUPS;
  protected readonly open = signal(true);

  protected choose(
    key: keyof FaceoffOptions,
    value: FaceoffOptions[keyof FaceoffOptions],
  ): void {
    this.store.set(key, value);
  }
}
