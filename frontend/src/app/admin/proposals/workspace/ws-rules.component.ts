// TEMPORARY: proposal J «Workspace», rules (development only).
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
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

const field = (key: NumericKey) => NUMERIC_FIELDS.find((f) => f.key === key)!;

@Component({
  selector: 'app-ws-rules',
  imports: [DuelTimelineComponent, SaveRulesDialogComponent],
  template: `
    <header class="head">
      <div>
        <h1>Spielregeln</h1>
        <p>
          Gelten ab dem nächsten Duell. Vor dem Speichern siehst du alle Änderungen.
        </p>
      </div>
      <css-button
        variant="plain"
        [disabled]="store.isDefault()"
        (click)="store.applyDefaults()"
      >
        <css-icon icon="reload" slot="prefix"></css-icon>
        Empfohlene Werte
      </css-button>
    </header>

    @if (store.form(); as f) {
      <div class="layout">
        <div class="groups">
          @for (group of groups; track group.title) {
            <section class="group">
              <div class="group-head">
                <h2>{{ group.title }}</h2>
                <p>{{ group.text }}</p>
              </div>
              <div class="fields">
                @for (item of group.fields; track item.key) {
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
                @if (group.bonus) {
                  <css-switch
                    label="Tempo-Bonus"
                    hint="Schnelle richtige Antworten geben bis zu 100 Zusatzpunkte."
                    [checked]="f.speedBonusEnabled"
                    (change)="store.setSpeedBonus(checked($event))"
                  ></css-switch>
                }
              </div>
            </section>
          }
        </div>

        <aside class="impact">
          <h2>Auswirkung</h2>
          @if (store.valid()) {
            <app-duel-timeline
              [segments]="store.timeline()"
              [seconds]="store.gameSeconds()"
              [showLabels]="f.questionsPerGame <= 5"
            />
          }
          <dl>
            <div>
              <dt>Dauer eines Duells</dt>
              <dd>max. {{ duration(store.gameSeconds()) }}</dd>
            </div>
            <div>
              <dt>Punkte pro Duell</dt>
              <dd>max. {{ store.maxPoints() }}</dd>
            </div>
            <div>
              <dt>Aktive Fragen</dt>
              <dd [class.bad]="!!store.questionWarning()">
                {{ store.stats()?.activeQuestions ?? '–' }} (nötig:
                {{ f.questionsPerGame }})
              </dd>
            </div>
          </dl>
          @if (store.questionWarning(); as warning) {
            <p class="warning">{{ warning }}</p>
          }
        </aside>
      </div>
    }

    @if (store.dirty()) {
      <div class="savebar" role="region" aria-label="Ungespeicherte Änderungen">
        <span
          >{{ pro.changeCount() }}
          {{ pro.changeCount() === 1 ? 'Änderung' : 'Änderungen' }}</span
        >
        <div class="savebar-actions">
          <css-button (click)="store.discardSettings()">Verwerfen</css-button>
          <css-button
            variant="primary"
            [disabled]="!store.valid()"
            (click)="reviewing.set(true)"
          >
            Prüfen und speichern
          </css-button>
        </div>
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
    @use 'ws';

    :host {
      display: block;
      max-width: functions.rem(1100);
    }

    .head {
      @include ws.head;
    }

    .layout {
      display: grid;
      gap: functions.rem(16);
      align-items: start;

      @media (min-width: 1100px) {
        grid-template-columns: minmax(0, 1fr) functions.rem(360);
      }
    }

    .groups {
      display: grid;
      gap: functions.rem(16);
    }

    .group {
      @include ws.panel;
      display: grid;
      gap: functions.rem(20);
      padding: functions.rem(20);

      @media (min-width: 800px) {
        grid-template-columns: functions.rem(200) 1fr;
      }
    }

    .group-head {
      h2 {
        @include ws.panel-title;
      }

      p {
        margin: functions.rem(4) 0 0;
        font-size: functions.rem(13);
        color: kit.$muted;
      }
    }

    .fields {
      display: grid;
      gap: functions.rem(20);
    }

    .impact {
      @include ws.panel;
      display: grid;
      gap: functions.rem(16);
      padding: functions.rem(20);

      @media (min-width: 1100px) {
        position: sticky;
        top: functions.rem(24);
      }

      h2 {
        @include ws.panel-title;
      }

      dl {
        display: grid;
        gap: functions.rem(10);
        margin: 0;
      }

      div {
        display: flex;
        justify-content: space-between;
        gap: functions.rem(12);
        font-size: functions.rem(14);
      }

      dt {
        color: kit.$muted;
      }

      dd {
        margin: 0;
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;

        &.bad {
          color: kit.$red;
        }
      }
    }

    .warning {
      margin: 0;
      font-size: functions.rem(13);
      color: kit.$red;
    }

    .savebar {
      position: sticky;
      bottom: calc(var(--app-safe-bottom) + #{functions.rem(16)});
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: functions.rem(12);
      margin-top: functions.rem(16);
      padding: functions.rem(10) functions.rem(10) functions.rem(10)
        functions.rem(16);
      border: functions.rem(1) solid kit.$border;
      border-left: functions.rem(4) solid #ffc015;
      border-radius: functions.rem(6);
      background-color: kit.$white;
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$blue;
      box-shadow: 0 functions.rem(12) functions.rem(32) rgba(0, 25, 62, 0.18);
    }

    .savebar-actions {
      display: flex;
      gap: functions.rem(8);
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WsRulesComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly duration = formatDuration;
  protected readonly checked = eventChecked;
  protected readonly reviewing = signal(false);

  protected readonly groups = [
    {
      title: 'Duell',
      text: 'Wie viele Fragen, wie viel Zeit und ob Tempo zählt.',
      fields: [
        field('questionsPerGame'),
        field('questionDurationSec'),
        field('revealDurationSec'),
      ],
      bonus: true,
    },
    {
      title: 'Nach dem Duell',
      text: 'Zeit, um eine Revanche zu fordern.',
      fields: [field('rematchTimeoutSec')],
      bonus: false,
    },
    {
      title: 'Stand-Geräte',
      text: 'Zurück zur Startseite, wenn niemand mehr spielt.',
      fields: [field('idleResetSec')],
      bonus: false,
    },
  ];

  protected setNumber(key: NumericKey, event: Event): void {
    const raw = eventText(event).trim();
    this.store.setNumber(key, raw === '' ? Number.NaN : Number(raw));
  }
}
