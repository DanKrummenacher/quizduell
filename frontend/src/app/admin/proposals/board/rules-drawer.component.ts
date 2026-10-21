// TEMPORARY: proposal E «Board», the rules sliding in from the side (development only).
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  output,
} from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import '@css-ch/components/input-stepper';
import '@css-ch/components/switch';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import { NUMERIC_FIELDS, type NumericKey, ProposalStore } from '../proposal-store';
import { DuelTimelineComponent } from '../shared/duel-timeline.component';

@Component({
  selector: 'app-rules-drawer',
  imports: [DuelTimelineComponent],
  template: `
    <button
      type="button"
      class="scrim"
      tabindex="-1"
      aria-label="Schliessen"
      [class.open]="open()"
      (click)="dismiss.emit()"
    ></button>
    <aside
      class="drawer"
      [class.open]="open()"
      aria-label="Spielregeln"
      [attr.aria-hidden]="!open()"
      [attr.inert]="open() ? null : ''"
    >
      <div class="head">
        <h2 class="title">Spielregeln</h2>
        <button
          type="button"
          class="close"
          aria-label="Schliessen"
          (click)="dismiss.emit()"
        >
          <css-icon icon="close" size="sm"></css-icon>
        </button>
      </div>

      @if (store.form(); as f) {
        <div class="body">
          @if (store.valid()) {
            <app-duel-timeline
              [segments]="store.timeline()"
              [seconds]="store.gameSeconds()"
              [showLabels]="false"
            />
          }
          @for (item of fields; track item.key) {
            <css-input-stepper
              [label]="item.label"
              [hint]="item.hint"
              [value]="'' + f[item.key]"
              [attr.min-number]="store.limit(item.key).min"
              [attr.max-number]="store.limit(item.key).max"
              [attr.error-message]="store.errors()[item.key] ?? null"
              (change)="setNumber(item.key, $event)"
            ></css-input-stepper>
          }
          <css-switch
            label="Tempo-Bonus"
            hint="Schnelle richtige Antworten geben bis zu 100 Zusatzpunkte."
            [checked]="f.speedBonusEnabled"
            (change)="store.setSpeedBonus(checked($event))"
          ></css-switch>
          @if (store.questionWarning(); as warning) {
            <p class="warning">{{ warning }}</p>
          }
        </div>

        <div class="foot">
          <css-button
            variant="plain"
            [disabled]="store.isDefault() || store.saving()"
            (click)="store.applyDefaults()"
          >
            Empfohlen
          </css-button>
          @if (store.dirty()) {
            <css-button
              [disabled]="store.saving()"
              (click)="store.discardSettings()"
            >
              Verwerfen
            </css-button>
          }
          <css-button
            variant="primary"
            [disabled]="!store.dirty() || !store.valid()"
            [loading]="store.saving()"
            (click)="store.saveSettings()"
          >
            Speichern
          </css-button>
        </div>
      }
    </aside>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';

    .scrim {
      padding: 0;
      border: 0;
      position: fixed;
      inset: 0;
      z-index: 15;
      background-color: rgba(0, 25, 62, 0.32);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;

      &.open {
        opacity: 1;
        pointer-events: auto;
      }
    }

    .drawer {
      position: fixed;
      inset: 0 0 0 auto;
      z-index: 16;
      display: flex;
      flex-direction: column;
      width: min(100vw, functions.rem(420));
      padding-top: var(--app-safe-top);
      background-color: kit.$white;
      box-shadow: functions.rem(-16) 0 functions.rem(40) rgba(0, 50, 125, 0.18);
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      &.open {
        transform: none;
      }
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: functions.rem(16) functions.rem(16) functions.rem(16)
        functions.rem(24);
      border-bottom: functions.rem(1) solid kit.$line;
    }

    .title {
      @include kit.section-title;
      font-size: functions.rem(20);
    }

    .close {
      display: grid;
      place-items: center;
      width: functions.rem(40);
      height: functions.rem(40);
      border: 0;
      border-radius: 50%;
      background: none;
      color: kit.$blue;
      cursor: pointer;

      &:hover {
        background-color: kit.$fill;
      }
    }

    .body {
      display: grid;
      flex: 1 1 auto;
      align-content: start;
      gap: functions.rem(24);
      padding: functions.rem(24);
      overflow-y: auto;
    }

    .warning {
      margin: 0;
      color: kit.$red;
    }

    .foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: functions.rem(8);

      css-button:first-child {
        margin-right: auto;
      }
      padding: functions.rem(16) functions.rem(24)
        calc(var(--app-safe-bottom) + #{functions.rem(16)});
      border-top: functions.rem(1) solid kit.$line;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RulesDrawerComponent {
  protected readonly store = inject(ProposalStore);
  readonly open = input(false);
  readonly dismiss = output<void>();

  protected readonly fields = NUMERIC_FIELDS;
  protected readonly checked = eventChecked;

  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }
}
