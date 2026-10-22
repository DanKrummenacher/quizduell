// Redaktion: the rules as sentences with values to change in place.
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../../proposals/pro';
import {
  formatDuration,
  type NumericKey,
  ProposalStore,
} from '../../proposals/proposal-store';
import { SaveRulesDialogComponent } from '../../proposals/shared/save-rules-dialog.component';

@Component({
  selector: 'app-redaktion-rules',
  imports: [NgTemplateOutlet, SaveRulesDialogComponent],
  template: `
    <header class="head">
      <span class="crumb">Einstellungen</span>
      <h1>Spielregeln</h1>
      <p class="lead">
        Die Zahlen lassen sich direkt im Text ändern. Neue Regeln gelten ab dem
        nächsten Duell.
      </p>
    </header>

    @if (store.form(); as f) {
      <div class="prose">
        <p>
          Ein Duell hat
          <ng-container
            *ngTemplateOutlet="num; context: { key: 'questionsPerGame' }"
          />
          Fragen. Für jede Frage bleiben
          <ng-container
            *ngTemplateOutlet="num; context: { key: 'questionDurationSec' }"
          />
          Sekunden, danach wird die richtige Antwort
          <ng-container
            *ngTemplateOutlet="num; context: { key: 'revealDurationSec' }"
          />
          Sekunden lang gezeigt.
        </p>
        <p>
          Eine richtige Antwort gibt 100 Punkte,
          <button
            type="button"
            class="token"
            [class.changed]="
              f.speedBonusEnabled !== store.settings()?.speedBonusEnabled
            "
            [attr.aria-pressed]="f.speedBonusEnabled"
            (click)="store.setSpeedBonus(!f.speedBonusEnabled)"
          >
            {{
              f.speedBonusEnabled
                ? 'und wer schnell ist, bekommt bis zu 100 dazu'
                : 'egal wie schnell'
            }}</button
          >. So sind bis zu <strong>{{ store.maxPoints() }} Punkte</strong> möglich.
        </p>
        <p>
          Nach dem Duell haben beide
          <ng-container
            *ngTemplateOutlet="num; context: { key: 'rematchTimeoutSec' }"
          />
          Sekunden, um eine Revanche zu fordern.
        </p>
        <p>
          Geräte am Stand springen nach
          <ng-container *ngTemplateOutlet="num; context: { key: 'idleResetSec' }" />
          Sekunden ohne Bedienung zurück zur Startseite<span class="aside">
            (0 = nie)</span
          >.
        </p>
      </div>

      <ng-template #num let-key="key">
        <span
          class="field"
          [class.changed]="changed(key)"
          [class.bad]="hasError(key)"
        >
          <input
            type="number"
            inputmode="numeric"
            [attr.aria-label]="label(key)"
            [min]="store.limit(key).min"
            [max]="store.limit(key).max"
            [style.width.ch]="width(key)"
            [value]="value(key)"
            (input)="set(key, $event)"
          />
        </span>
      </ng-template>

      <aside class="summary">
        <css-icon icon="time" size="sm"></css-icon>
        <span>
          Ein Duell dauert damit höchstens <strong>{{ duration() }}</strong>
          @if (store.questionWarning(); as warning) {
            <span class="warning">· {{ warning }}</span>
          }
          @for (key of invalid(); track key) {
            <span class="warning"
              >· {{ label(key) }}: {{ store.errors()[key] }}</span
            >
          }
        </span>
      </aside>

      <div class="actions">
        <button
          type="button"
          class="quiet"
          [disabled]="store.isDefault()"
          (click)="store.applyDefaults()"
        >
          Empfohlene Werte einsetzen
        </button>
        @if (store.dirty()) {
          <button type="button" class="quiet" (click)="store.discardSettings()">
            Verwerfen
          </button>
          <button
            type="button"
            class="solid"
            [disabled]="!store.valid()"
            (click)="reviewing.set(true)"
          >
            {{ pro.changeCount() }}
            {{ pro.changeCount() === 1 ? 'Änderung' : 'Änderungen' }} übernehmen
          </button>
        }
      </div>
    }

    @if (reviewing()) {
      <app-save-rules-dialog (dismiss)="reviewing.set(false)" />
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'redaktion' as r;

    :host {
      display: block;
    }

    .head {
      margin-bottom: functions.rem(28);

      h1 {
        @include r.doc-title;
        margin-top: functions.rem(4);
      }
    }

    .crumb {
      font-size: functions.rem(13);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: r.$ink-3;
    }

    .lead {
      margin: functions.rem(10) 0 0;
      font-size: functions.rem(16);
      color: r.$ink-2;
    }

    .prose p {
      margin: 0 0 functions.rem(22);
      font-size: functions.rem(22);
      line-height: 1.75;
      color: r.$ink;
    }

    .field {
      display: inline-block;
      border-bottom: functions.rem(2) solid r.$accent;
      border-radius: functions.rem(4) functions.rem(4) 0 0;
      background-color: r.$hover;
      transition: background-color 0.15s ease;

      &:hover,
      &:focus-within {
        background-color: #e6edf6;
      }

      &.changed {
        border-color: #e0a100;
        background-color: #fff6dc;
      }

      &.bad {
        border-color: r.$red;
        background-color: #fdecea;
      }

      input {
        min-width: 2ch;
        padding: 0 functions.rem(6);
        border: 0;
        outline: none;
        background: none;
        font: inherit;
        font-weight: miscs.$css-ui-font-weight-bold;
        color: inherit;
        text-align: center;
        appearance: textfield;

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          appearance: none;
        }
      }
    }

    .token {
      padding: 0 functions.rem(6);
      border: 0;
      border-bottom: functions.rem(2) solid r.$accent;
      border-radius: functions.rem(4) functions.rem(4) 0 0;
      background-color: r.$hover;
      font: inherit;
      font-weight: miscs.$css-ui-font-weight-bold;
      color: inherit;
      cursor: pointer;
      @include r.focus;

      &.changed {
        border-color: #e0a100;
        background-color: #fff6dc;
      }
    }

    .aside {
      color: r.$ink-3;
    }

    .summary {
      display: flex;
      gap: functions.rem(10);
      margin-top: functions.rem(8);
      padding: functions.rem(14) functions.rem(16);
      border-radius: functions.rem(10);
      background-color: r.$side;
      font-size: functions.rem(15);
      color: r.$ink-2;

      strong {
        color: r.$ink;
      }
    }

    .warning {
      color: r.$red;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: functions.rem(8);
      margin-top: functions.rem(20);
    }

    .quiet {
      @include r.quiet-button;
      height: functions.rem(34);
    }

    .solid {
      @include r.solid-button;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RedaktionRulesComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly reviewing = signal(false);
  protected readonly duration = computed(() =>
    this.store.valid() ? formatDuration(this.store.gameSeconds()) : '–',
  );
  protected readonly invalid = computed(
    () => Object.keys(this.store.errors()) as NumericKey[],
  );

  private readonly labels: Record<NumericKey, string> = {
    questionsPerGame: 'Fragen pro Duell',
    questionDurationSec: 'Sekunden pro Frage',
    revealDurationSec: 'Sekunden für die Auflösung',
    rematchTimeoutSec: 'Sekunden für die Revanche',
    idleResetSec: 'Sekunden bis zum Zurücksetzen',
  };

  protected label(key: NumericKey): string {
    return this.labels[key];
  }

  protected value(key: NumericKey): number {
    return this.store.form()?.[key] ?? 0;
  }

  protected hasError(key: NumericKey): boolean {
    return !!this.store.errors()[key];
  }

  protected width(key: NumericKey): number {
    return Math.max(2, String(this.store.form()?.[key] ?? '').length) + 1;
  }

  protected changed(key: NumericKey): boolean {
    return this.store.form()?.[key] !== this.store.settings()?.[key];
  }

  protected set(key: NumericKey, event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }
}
