// TEMPORARY: proposal L «Klassik», settings in sections (development only).
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import '@css-ch/components/input-stepper';
import '@css-ch/components/switch';
import { eventChecked, eventText } from '../../../core/ui/component-events';
import { ProposalPro } from '../pro';
import {
  formatDuration,
  NUMERIC_FIELDS,
  type NumericKey,
  ProposalStore,
} from '../proposal-store';
import { DuelTimelineComponent } from '../shared/duel-timeline.component';
import { SaveRulesDialogComponent } from '../shared/save-rules-dialog.component';
import { ClassicSavebarComponent } from './classic-savebar.component';

const field = (key: NumericKey) => NUMERIC_FIELDS.find((f) => f.key === key)!;

@Component({
  selector: 'app-classic-settings',
  imports: [
    DuelTimelineComponent,
    SaveRulesDialogComponent,
    ClassicSavebarComponent,
  ],
  template: `
    @if (store.dirty()) {
      <app-classic-savebar
        [text]="
          pro.changeCount() +
          (pro.changeCount() === 1 ? ' Änderung' : ' Änderungen') +
          ' nicht gespeichert'
        "
        [disabled]="!store.valid()"
        [saving]="store.saving()"
        (save)="reviewing.set(true)"
        (discard)="store.discardSettings()"
      />
    }

    <header class="head">
      <h1>Einstellungen</h1>
      <button
        type="button"
        class="button"
        [disabled]="store.isDefault()"
        (click)="store.applyDefaults()"
      >
        Empfohlene Werte
      </button>
    </header>

    @if (store.form(); as f) {
      @for (section of sections; track section.title) {
        <div class="section">
          <div class="intro">
            <h2>{{ section.title }}</h2>
            <p>{{ section.text }}</p>
          </div>
          <div class="card">
            @for (item of section.fields; track item.key) {
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
            @if (section.bonus) {
              <css-switch
                label="Tempo-Bonus"
                hint="Schnelle richtige Antworten geben bis zu 100 Zusatzpunkte."
                [checked]="f.speedBonusEnabled"
                (change)="store.setSpeedBonus(checked($event))"
              ></css-switch>
              @if (store.valid()) {
                <div class="timeline">
                  <app-duel-timeline
                    [segments]="store.timeline()"
                    [seconds]="store.gameSeconds()"
                    [showLabels]="f.questionsPerGame <= 5"
                  />
                </div>
              }
              <p class="note">
                Ein Duell dauert höchstens {{ duration(store.gameSeconds()) }} und
                bringt bis zu {{ store.maxPoints() }} Punkte.
              </p>
              @if (store.questionWarning(); as warning) {
                <p class="warning">{{ warning }}</p>
              }
            }
          </div>
        </div>
      }
    }

    @if (reviewing()) {
      <app-save-rules-dialog (dismiss)="reviewing.set(false)" />
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';
    @use 'classic';

    .head {
      @include classic.head;
    }

    .button {
      @include classic.button;
    }

    .section {
      display: grid;
      gap: functions.rem(12) functions.rem(32);
      padding: functions.rem(24) 0;
      border-top: functions.rem(1) solid #dfe5ee;

      @media (min-width: 900px) {
        grid-template-columns: functions.rem(280) minmax(0, 1fr);
      }
    }

    .intro {
      h2 {
        margin: 0;
        font-size: functions.rem(17);
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
      }

      p {
        margin: functions.rem(6) 0 0;
        font-size: functions.rem(14);
        line-height: 1.45;
        color: kit.$muted;
      }
    }

    .card {
      @include classic.card;
      display: grid;
      gap: functions.rem(24);
      padding: functions.rem(24);
    }

    .timeline {
      padding-top: functions.rem(20);
      border-top: functions.rem(1) solid #eef1f6;
    }

    .note {
      margin: 0;
      font-size: functions.rem(14);
      color: kit.$muted;
    }

    .warning {
      margin: 0;
      color: kit.$red;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClassicSettingsComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly duration = formatDuration;
  protected readonly checked = eventChecked;
  protected readonly reviewing = signal(false);

  protected readonly sections = [
    {
      title: 'Spielablauf',
      text: 'Wie viele Fragen ein Duell hat, wie viel Zeit die Spieler bekommen und ob Tempo zählt. Gilt ab dem nächsten Duell.',
      fields: [
        field('questionsPerGame'),
        field('questionDurationSec'),
        field('revealDurationSec'),
      ],
      bonus: true,
    },
    {
      title: 'Nach dem Duell',
      text: 'Wie lange beide eine Revanche fordern können.',
      fields: [field('rematchTimeoutSec')],
      bonus: false,
    },
    {
      title: 'Stand-Geräte',
      text: 'Geräte am Stand springen zurück zur Startseite, wenn niemand mehr spielt. So steht nie ein halbes Spiel herum.',
      fields: [field('idleResetSec')],
      bonus: false,
    },
  ];

  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }
}
