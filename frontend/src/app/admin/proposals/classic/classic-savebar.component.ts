// TEMPORARY: proposal L «Klassik», the save bar over the header (development only).
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import '@css-ch/components/icon';

/**
 * As in large shop systems: as soon as something changed, a bar lies over
 * the header with «Verwerfen» and «Speichern», so saving is never forgotten.
 */
@Component({
  selector: 'app-classic-savebar',
  template: `
    <div class="bar" role="region" aria-label="Ungespeicherte Änderungen">
      <span class="text">
        <css-icon icon="priority-warning" size="sm"></css-icon>
        {{ text() }}
      </span>
      <div class="actions">
        <button
          type="button"
          class="discard"
          [disabled]="saving()"
          (click)="discard.emit()"
        >
          Verwerfen
        </button>
        <button
          type="button"
          class="save"
          [disabled]="disabled() || saving()"
          (click)="save.emit()"
        >
          {{ saving() ? 'Speichert …' : 'Speichern' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';

    .bar {
      position: fixed;
      inset: 0 0 auto;
      z-index: 18;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: functions.rem(8) functions.rem(16);
      min-height: calc(var(--app-safe-top) + #{functions.rem(64)});
      padding: var(--app-safe-top) functions.rem(16) 0;
      background-color: #001b45;
      color: kit.$white;
      animation: drop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;

      @media (min-width: 900px) {
        padding-inline: functions.rem(32);
      }
    }

    .text {
      display: inline-flex;
      align-items: center;
      gap: functions.rem(8);
      font-weight: miscs.$css-ui-font-weight-bold;

      css-icon {
        color: #ffc015;
      }
    }

    .actions {
      display: flex;
      gap: functions.rem(8);
    }

    button {
      height: functions.rem(40);
      padding: 0 functions.rem(18);
      border-radius: functions.rem(20);
      font: inherit;
      font-size: functions.rem(15);
      font-weight: miscs.$css-ui-font-weight-bold;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: default;
      }
    }

    .discard {
      border: functions.rem(1) solid rgba(255, 255, 255, 0.5);
      background: none;
      color: kit.$white;
    }

    .save {
      border: 0;
      background-color: kit.$white;
      color: kit.$blue;
    }

    @keyframes drop {
      from {
        transform: translateY(-100%);
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClassicSavebarComponent {
  readonly text = input('Ungespeicherte Änderungen');
  readonly saving = input(false);
  readonly disabled = input(false);
  readonly save = output<void>();
  readonly discard = output<void>();
}
