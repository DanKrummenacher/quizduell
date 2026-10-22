// Atelier: the overview, what is going on and what needs a look.
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
} from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../../proposals/pro';
import {
  durationOf,
  formatDuration,
  ProposalStore,
} from '../../proposals/proposal-store';
import { AtelierState } from './atelier-state';

@Component({
  selector: 'app-atelier-overview',
  template: `
    <header class="head">
      <div>
        <h1>{{ greeting() }}</h1>
        <p>{{ today }}</p>
      </div>
      <button type="button" class="primary" (click)="state.newQuestion()">
        <css-icon icon="add" size="sm"></css-icon>Neue Frage <kbd>N</kbd>
      </button>
    </header>

    @if (store.stats(); as s) {
      <section class="metrics" aria-label="Kennzahlen">
        <div class="metric">
          <span class="m-label">Spielbereit</span>
          <span class="m-value" [class.bad]="!store.ready()">
            <css-icon
              [icon]="store.ready() ? 'checkmark-circle' : 'priority-warning'"
              size="sm"
            ></css-icon>
            {{ store.ready() ? 'Ja' : 'Nein' }}
          </span>
          <span class="m-sub"
            >{{ s.activeQuestions }} aktive Fragen · nötig
            {{ s.requiredQuestions }}</span
          >
          <span class="bar"><span [style.width.%]="readiness()"></span></span>
        </div>
        <div class="metric">
          <span class="m-label"><span class="pulse"></span>Jetzt</span>
          <span class="m-value"
            >{{ s.activeGames }}
            <small>{{ s.activeGames === 1 ? 'Duell' : 'Duelle' }}</small></span
          >
          <span class="m-sub"
            >{{ s.playersOnline }}
            {{ s.playersOnline === 1 ? 'Gerät' : 'Geräte' }} verbunden ·
            {{ s.playersSearching }} suchen</span
          >
        </div>
        <div class="metric">
          <span class="m-label">Heute</span>
          <span class="m-value">{{ s.gamesToday }} <small>Duelle</small></span>
          <span class="m-sub">{{ s.gamesTotal }} seit Beginn</span>
        </div>
        <div class="metric">
          <span class="m-label">Richtig beantwortet</span>
          <span class="m-value"
            >{{ store.overallRate() ?? '–' }}<small> %</small></span
          >
          <span class="m-sub">aus {{ store.answersTotal() }} Antworten</span>
        </div>
      </section>
    }

    <div class="columns">
      <section class="panel">
        <header class="panel-head">
          <h2>Zu prüfen</h2>
          <span class="muted"
            >{{ pro.issueCount() }}
            {{ pro.issueCount() === 1 ? 'Frage' : 'Fragen' }}</span
          >
        </header>
        <ul class="list">
          @for (issue of pro.issues(); track issue.kind) {
            <li>
              <button
                type="button"
                class="row"
                [disabled]="!issue.ids.length"
                (click)="state.showQuestions({ issue: issue.kind })"
              >
                <span
                  class="count"
                  [class]="issue.ids.length ? issue.kind : 'none'"
                  >{{ issue.ids.length }}</span
                >
                <span class="row-text">
                  <strong>{{ issue.title }}</strong>
                  <span>{{ issue.text }}</span>
                </span>
                @if (issue.ids.length) {
                  <css-icon class="chev" icon="angle-right" size="sm"></css-icon>
                }
              </button>
            </li>
          }
        </ul>
      </section>

      <div class="stack">
        <section class="panel">
          <header class="panel-head">
            <h2>Spielregeln</h2>
            <button type="button" class="link" (click)="state.go('rules')">
              Ändern
            </button>
          </header>
          @if (store.settings(); as r) {
            <dl class="facts">
              <div>
                <dt>Fragen pro Duell</dt>
                <dd>{{ r.questionsPerGame }}</dd>
              </div>
              <div>
                <dt>Zeit pro Frage</dt>
                <dd>{{ r.questionDurationSec }} s</dd>
              </div>
              <div>
                <dt>Tempo-Bonus</dt>
                <dd>{{ r.speedBonusEnabled ? 'An' : 'Aus' }}</dd>
              </div>
              <div>
                <dt>Ein Duell dauert</dt>
                <dd>max. {{ duration() }}</dd>
              </div>
            </dl>
          }
        </section>

        <section class="panel">
          <header class="panel-head">
            <h2>Zuletzt geändert</h2>
            <button type="button" class="link" (click)="state.showQuestions()">
              Alle Fragen
            </button>
          </header>
          <ul class="list">
            @for (q of recent(); track q.id) {
              <li>
                <button
                  type="button"
                  class="row compact"
                  (click)="state.showQuestions(); state.open.set(q.id)"
                >
                  <span class="row-text">
                    <strong class="ellipsis">{{ q.text }}</strong>
                    <span
                      >{{ q.category || 'Ohne Kategorie' }} ·
                      {{ ago(q.updatedAt) }}</span
                    >
                  </span>
                </button>
              </li>
            } @empty {
              <li class="empty">Noch keine Fragen.</li>
            }
          </ul>
        </section>
      </div>
    </div>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'atelier' as a;

    :host {
      display: block;
      max-width: functions.rem(1080);
    }

    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: functions.rem(16);
      margin-bottom: functions.rem(28);

      h1 {
        @include a.title;
        font-size: functions.rem(26);
      }

      p {
        margin: functions.rem(4) 0 0;
        color: a.$ink-3;
      }
    }

    .primary {
      @include a.button-primary;
      height: functions.rem(36);

      kbd {
        @include a.kbd;
        border-color: rgba(255, 255, 255, 0.3);
        background: none;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .metrics {
      @include a.panel;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-bottom: functions.rem(20);

      @media (min-width: 900px) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .metric {
      display: grid;
      align-content: start;
      gap: functions.rem(6);
      padding: functions.rem(18) functions.rem(20);
      box-shadow:
        inset functions.rem(-1) 0 0 a.$line,
        inset 0 functions.rem(-1) 0 a.$line;
    }

    .m-label {
      display: inline-flex;
      align-items: center;
      gap: functions.rem(8);
      @include a.label;

      .pulse {
        @include a.pulse(a.$green);
      }
    }

    .m-value {
      display: inline-flex;
      align-items: baseline;
      gap: functions.rem(6);
      font-size: functions.rem(28);
      font-weight: miscs.$css-ui-font-weight-bold;
      line-height: 1.1;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;

      small {
        font-size: functions.rem(14);
        font-weight: miscs.$css-ui-font-weight-regular;
        letter-spacing: 0;
        color: a.$ink-3;
      }

      css-icon {
        align-self: center;
        color: a.$green;
      }

      &.bad,
      &.bad css-icon {
        color: a.$red;
      }
    }

    .m-sub {
      @include a.text-sm;
      color: a.$ink-3;
    }

    .bar {
      display: block;
      height: functions.rem(4);
      margin-top: functions.rem(4);
      border-radius: functions.rem(2);
      background-color: a.$sunken;
      overflow: hidden;

      span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background-color: a.$green;
      }
    }

    .columns {
      display: grid;
      gap: functions.rem(20);
      align-items: start;

      @media (min-width: 960px) {
        grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
      }
    }

    .stack {
      display: grid;
      gap: functions.rem(20);
    }

    .panel {
      @include a.panel;
      overflow: hidden;
    }

    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: functions.rem(14) functions.rem(18);
      border-bottom: functions.rem(1) solid a.$line;

      h2 {
        margin: 0;
        font-size: functions.rem(14);
        font-weight: miscs.$css-ui-font-weight-bold;
      }
    }

    .muted {
      @include a.text-sm;
      color: a.$ink-3;
    }

    .link {
      @include a.ghost;
      height: functions.rem(28);
      padding: 0 functions.rem(8);
    }

    .list {
      margin: 0;
      padding: functions.rem(4) 0;
      list-style: none;
    }

    .row {
      display: flex;
      align-items: center;
      gap: functions.rem(14);
      width: 100%;
      padding: functions.rem(10) functions.rem(18);
      border: 0;
      background: none;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
      @include a.focus-ring;

      &:hover:not(:disabled) {
        background-color: a.$bg;
      }

      &:disabled {
        cursor: default;
      }

      &.compact {
        padding-block: functions.rem(8);
      }
    }

    .count {
      display: grid;
      place-items: center;
      flex: none;
      min-width: functions.rem(32);
      height: functions.rem(24);
      padding: 0 functions.rem(6);
      border-radius: functions.rem(6);
      font-size: functions.rem(13);
      font-weight: miscs.$css-ui-font-weight-bold;
      font-variant-numeric: tabular-nums;

      &.hard,
      &.duplicate {
        background-color: a.$red-soft;
        color: a.$red;
      }

      &.easy,
      &.never {
        background-color: a.$amber-soft;
        color: a.$amber;
      }

      &.none {
        background-color: a.$sunken;
        color: a.$ink-3;
      }
    }

    .row-text {
      display: grid;
      flex: 1 1 auto;
      min-width: 0;

      strong {
        font-size: functions.rem(14);
      }

      span {
        @include a.text-sm;
        color: a.$ink-3;
      }
    }

    .ellipsis {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chev {
      color: a.$ink-3;
    }

    .facts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: functions.rem(14) functions.rem(16);
      margin: 0;
      padding: functions.rem(16) functions.rem(18);

      dt {
        @include a.text-sm;
        color: a.$ink-3;
      }

      dd {
        margin: 0;
        font-size: functions.rem(15);
        font-weight: miscs.$css-ui-font-weight-bold;
      }
    }

    .empty {
      padding: functions.rem(16) functions.rem(18);
      color: a.$ink-3;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AtelierOverviewComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(AtelierState);
  readonly greeting = input('');

  protected readonly today = new Date().toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  protected readonly duration = computed(() =>
    formatDuration(durationOf(this.store.settings())),
  );
  protected readonly readiness = computed(() => {
    const s = this.store.stats();
    return s
      ? Math.min(100, (s.activeQuestions / Math.max(1, s.requiredQuestions)) * 100)
      : 0;
  });
  protected readonly recent = computed(() =>
    [...(this.store.questions() ?? [])]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5),
  );

  /** «vor 5 Min.», «gestern», or the date. */
  protected ago(value: string): string {
    const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
    if (minutes < 1) {
      return 'gerade eben';
    }
    if (minutes < 60) {
      return `vor ${minutes} Min.`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `vor ${hours} Std.`;
    }
    return hours < 48 ? 'gestern' : new Date(value).toLocaleDateString('de-CH');
  }
}
