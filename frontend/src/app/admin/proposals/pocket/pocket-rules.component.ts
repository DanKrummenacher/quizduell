// TEMPORARY: proposal K «Pocket», the rules tab (development only).
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import '@css-ch/components/switch';
import { eventChecked } from '../../../core/ui/component-events';
import { ProposalPro } from '../pro';
import {
  formatDuration,
  NUMERIC_FIELDS,
  type NumericField,
  type NumericKey,
  ProposalStore,
} from '../proposal-store';
import { DuelTimelineComponent } from '../shared/duel-timeline.component';
import { SaveRulesDialogComponent } from '../shared/save-rules-dialog.component';

@Component({
  selector: 'app-pocket-rules',
  imports: [DuelTimelineComponent, SaveRulesDialogComponent],
  template: `
    <h1 class="title">Regeln</h1>

    @if (store.form(); as f) {
      <div class="summary">
        @if (store.valid()) {
          <app-duel-timeline
            [segments]="store.timeline()"
            [seconds]="store.gameSeconds()"
            [showLabels]="false"
          />
        }
      </div>

      <span class="label">Duell</span>
      <ul class="group">
        @for (item of duel; track item.key) {
          <li>
            <button type="button" class="row" (click)="open.set(item)">
              <span class="grow">{{ item.label }}</span>
              <span class="value" [class.changed]="changed(item.key)"
                >{{ f[item.key] }}{{ item.unit ? ' ' + item.unit : '' }}</span
              >
              <css-icon class="chev" icon="angle-right" size="sm"></css-icon>
            </button>
          </li>
        }
        <li class="row switch-row">
          <span class="grow">Tempo-Bonus</span>
          <css-switch
            [label]="f.speedBonusEnabled ? 'An' : 'Aus'"
            [checked]="f.speedBonusEnabled"
            (change)="store.setSpeedBonus(checked($event))"
          ></css-switch>
        </li>
      </ul>
      <p class="foot">
        Ein Duell dauert höchstens {{ duration() }} · bis
        {{ store.maxPoints() }} Punkte.
      </p>

      <span class="label">Am Stand</span>
      <ul class="group">
        @for (item of around; track item.key) {
          <li>
            <button type="button" class="row" (click)="open.set(item)">
              <span class="grow">{{ item.label }}</span>
              <span class="value" [class.changed]="changed(item.key)"
                >{{ f[item.key] }}{{ item.unit ? ' ' + item.unit : '' }}</span
              >
              <css-icon class="chev" icon="angle-right" size="sm"></css-icon>
            </button>
          </li>
        }
      </ul>

      <ul class="group spaced">
        <li>
          <button
            type="button"
            class="row link"
            [disabled]="store.isDefault()"
            (click)="store.applyDefaults()"
          >
            Empfohlene Werte übernehmen
          </button>
        </li>
      </ul>

      @if (store.questionWarning(); as warning) {
        <p class="warning">{{ warning }}</p>
      }

      @if (store.dirty()) {
        <div class="savebar">
          <button type="button" class="discard" (click)="store.discardSettings()">
            Verwerfen
          </button>
          <button
            type="button"
            class="save"
            [disabled]="!store.valid()"
            (click)="reviewing.set(true)"
          >
            {{ pro.changeCount() }}
            {{ pro.changeCount() === 1 ? 'Änderung' : 'Änderungen' }} sichern
          </button>
        </div>
      }
    }

    @if (open(); as item) {
      <button
        type="button"
        class="scrim"
        tabindex="-1"
        aria-label="Schliessen"
        (click)="open.set(null)"
      ></button>
      <div class="sheet" role="dialog" [attr.aria-label]="item.label">
        <span class="grabber"></span>
        <h2>{{ item.label }}</h2>
        <div class="big">
          <button
            type="button"
            aria-label="Weniger"
            [disabled]="value(item.key) <= store.limit(item.key).min"
            (click)="step(item.key, -1)"
          >
            −
          </button>
          <output>
            {{ value(item.key) }}<small>{{ item.unit }}</small>
          </output>
          <button
            type="button"
            aria-label="Mehr"
            [disabled]="value(item.key) >= store.limit(item.key).max"
            (click)="step(item.key, 1)"
          >
            +
          </button>
        </div>
        <p class="hint">{{ item.hint }}</p>
        <p class="limits">
          Erlaubt: {{ store.limit(item.key).min }} bis
          {{ store.limit(item.key).max }}
        </p>
        <button type="button" class="done" (click)="open.set(null)">Fertig</button>
      </div>
    }

    @if (reviewing()) {
      <app-save-rules-dialog (dismiss)="reviewing.set(false)" />
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';
    @use 'pocket';

    :host {
      display: block;
      padding-top: functions.rem(24);
    }

    .title {
      @include pocket.large-title;
    }

    .summary {
      margin: 0 functions.rem(16);
      padding: functions.rem(16);
      border-radius: functions.rem(12);
      background-color: kit.$white;
    }

    .label {
      @include pocket.section-label;
    }

    .group {
      @include pocket.group;

      &.spaced {
        margin-top: functions.rem(24);
      }
    }

    li + li .row,
    li + li.row {
      box-shadow: inset 0 functions.rem(1) 0 pocket.$sep;
    }

    .row {
      @include pocket.row-button;

      &.link {
        justify-content: center;
        font-weight: miscs.$css-ui-font-weight-bold;

        &:disabled {
          color: #a6b4c9;
          cursor: default;
        }
      }
    }

    .switch-row {
      cursor: default;
    }

    .grow {
      flex: 1 1 auto;
    }

    .value {
      color: kit.$muted;

      &.changed {
        font-weight: miscs.$css-ui-font-weight-bold;
        color: #b77800;
      }
    }

    .chev {
      color: #a6b4c9;
    }

    .foot {
      margin: functions.rem(8) functions.rem(32) 0;
      font-size: functions.rem(13);
      color: kit.$muted;
    }

    .warning {
      margin: functions.rem(16) functions.rem(32) 0;
      font-size: functions.rem(14);
      color: kit.$red;
    }

    .savebar {
      position: fixed;
      left: 50%;
      bottom: calc(var(--app-safe-bottom) + #{functions.rem(76)});
      z-index: 9;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: functions.rem(8);
      width: min(calc(100% - #{functions.rem(24)}), #{functions.rem(456)});
      transform: translateX(-50%);

      button {
        height: functions.rem(52);
        padding: 0 functions.rem(18);
        border: 0;
        border-radius: functions.rem(14);
        font: inherit;
        font-size: functions.rem(16);
        font-weight: miscs.$css-ui-font-weight-bold;
        cursor: pointer;
        box-shadow: 0 functions.rem(8) functions.rem(24) rgba(0, 25, 62, 0.25);
      }
    }

    .discard {
      background-color: kit.$white;
      color: kit.$blue;
    }

    .save {
      background-color: kit.$blue;
      color: kit.$white;

      &:disabled {
        opacity: 0.5;
      }
    }

    .scrim {
      position: fixed;
      inset: 0;
      z-index: 15;
      padding: 0;
      border: 0;
      background-color: rgba(0, 25, 62, 0.35);
    }

    .sheet {
      position: fixed;
      bottom: 0;
      left: 50%;
      z-index: 16;
      display: grid;
      gap: functions.rem(12);
      width: min(100%, #{functions.rem(480)});
      padding: functions.rem(8) functions.rem(20)
        calc(var(--app-safe-bottom) + #{functions.rem(20)});
      border-radius: functions.rem(16) functions.rem(16) 0 0;
      background-color: kit.$white;
      text-align: center;
      transform: translateX(-50%);
      animation: sheet-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;

      h2 {
        margin: 0;
        font-size: functions.rem(18);
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
      }
    }

    .grabber {
      justify-self: center;
      width: functions.rem(40);
      height: functions.rem(5);
      border-radius: functions.rem(3);
      background-color: #c5cfdd;
    }

    .big {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: functions.rem(24);
      margin: functions.rem(8) 0;

      button {
        width: functions.rem(64);
        height: functions.rem(64);
        border: 0;
        border-radius: 50%;
        background-color: kit.$fill;
        font: inherit;
        font-size: functions.rem(30);
        color: kit.$blue;
        cursor: pointer;

        &:disabled {
          opacity: 0.35;
          cursor: default;
        }

        &:active:not(:disabled) {
          background-color: #dfe8f3;
        }
      }

      output {
        min-width: functions.rem(110);
        font-size: functions.rem(52);
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
        font-variant-numeric: tabular-nums;

        small {
          margin-left: functions.rem(4);
          font-size: functions.rem(20);
          color: kit.$muted;
        }
      }
    }

    .hint,
    .limits {
      margin: 0;
      font-size: functions.rem(14);
      color: kit.$muted;
    }

    .done {
      height: functions.rem(52);
      margin-top: functions.rem(8);
      border: 0;
      border-radius: functions.rem(14);
      background-color: kit.$blue;
      font: inherit;
      font-size: functions.rem(16);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$white;
      cursor: pointer;
    }

    @keyframes sheet-up {
      from {
        transform: translate(-50%, 100%);
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PocketRulesComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly duel = NUMERIC_FIELDS.slice(0, 3);
  protected readonly around = NUMERIC_FIELDS.slice(3);
  protected readonly checked = eventChecked;
  protected readonly open = signal<NumericField | null>(null);
  protected readonly reviewing = signal(false);
  protected readonly duration = computed(() =>
    formatDuration(this.store.gameSeconds()),
  );

  protected value(key: NumericKey): number {
    return this.store.form()?.[key] ?? 0;
  }

  protected changed(key: NumericKey): boolean {
    return this.store.form()?.[key] !== this.store.settings()?.[key];
  }

  protected step(key: NumericKey, delta: number): void {
    const limit = this.store.limit(key);
    this.store.setNumber(
      key,
      Math.min(limit.max, Math.max(limit.min, this.value(key) + delta)),
    );
  }
}
