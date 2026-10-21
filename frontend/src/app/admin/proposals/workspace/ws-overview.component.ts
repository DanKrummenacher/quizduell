// TEMPORARY: proposal J «Workspace», overview (development only).
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/button';
import '@css-ch/components/icon';
import { ProposalPro } from '../pro';
import { durationOf, formatDuration, ProposalStore } from '../proposal-store';
import { WorkspaceNav } from './workspace-nav';

@Component({
  selector: 'app-ws-overview',
  template: `
    <header class="head">
      <div>
        <h1>Übersicht</h1>
        <p>Der Stand des Quiz und was zu tun ist.</p>
      </div>
      @if (store.updatedAt(); as t) {
        <span class="updated">Aktualisiert {{ t.toLocaleTimeString('de-CH') }}</span>
      }
    </header>

    @if (store.stats(); as s) {
      <div class="cards">
        <section class="card" [class.bad]="!store.ready()">
          <span class="card-label">Spielbereit</span>
          <strong class="card-value">{{ store.ready() ? 'Ja' : 'Nein' }}</strong>
          <span class="card-sub">
            {{ s.activeQuestions }} von mindestens {{ s.requiredQuestions }} aktiven
            Fragen
          </span>
        </section>
        <section class="card">
          <span class="card-label"><span class="dot"></span>Jetzt</span>
          <strong class="card-value"
            >{{ s.activeGames }} <small>Duelle</small></strong
          >
          <span class="card-sub"
            >{{ s.playersOnline }} Geräte · {{ s.playersSearching }} suchen</span
          >
        </section>
        <section class="card">
          <span class="card-label">Heute</span>
          <strong class="card-value"
            >{{ s.gamesToday }} <small>Duelle</small></strong
          >
          <span class="card-sub">{{ s.gamesTotal }} insgesamt</span>
        </section>
        <section class="card">
          <span class="card-label">Richtig beantwortet</span>
          <strong class="card-value"
            >{{ store.overallRate() ?? '–' }}<small> %</small></strong
          >
          <span class="card-sub">{{ store.answersTotal() }} Antworten</span>
        </section>
      </div>
    }

    <div class="columns">
      <section class="panel">
        <div class="panel-head">
          <h2>Qualität</h2>
          <span class="muted">{{ pro.issueCount() }} Hinweise</span>
        </div>
        <ul class="issues">
          @for (issue of pro.issues(); track issue.kind) {
            <li>
              <button
                type="button"
                class="issue"
                [disabled]="!issue.ids.length"
                (click)="nav.go('questions', issue.kind)"
              >
                <span
                  class="issue-count"
                  [class]="issue.kind"
                  [class.zero]="!issue.ids.length"
                >
                  {{ issue.ids.length }}
                </span>
                <span class="issue-text">
                  <strong>{{ issue.title }}</strong>
                  <span>{{ issue.text }}</span>
                </span>
                @if (issue.ids.length) {
                  <span class="issue-go">Anzeigen</span>
                }
              </button>
            </li>
          }
        </ul>
      </section>

      <div class="stack">
        <section class="panel">
          <div class="panel-head">
            <h2>Spielregeln</h2>
            <button type="button" class="link" (click)="nav.go('rules')">
              Bearbeiten
            </button>
          </div>
          @if (store.settings(); as r) {
            <dl class="rules">
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
                <dd>{{ r.speedBonusEnabled ? 'an' : 'aus' }}</dd>
              </div>
              <div>
                <dt>Ein Duell dauert</dt>
                <dd>max. {{ duration() }}</dd>
              </div>
            </dl>
          }
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Kategorien</h2>
            <button type="button" class="link" (click)="nav.go('categories')">
              Verwalten
            </button>
          </div>
          <ul class="cats">
            @for (c of store.categoryStats(); track c.name) {
              <li>
                <span class="cat-name">{{ c.name || 'Ohne Kategorie' }}</span>
                <span class="meter" [style.--value]="c.rate ?? 0"></span>
                <span class="cat-num">{{ c.active }}/{{ c.total }}</span>
              </li>
            }
          </ul>
        </section>
      </div>
    </div>
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'interaction';
    @use '../kit';
    @use 'ws';

    :host {
      display: block;
      max-width: functions.rem(1100);
    }

    .head {
      @include ws.head;
    }

    .updated,
    .muted {
      font-size: functions.rem(13);
      color: kit.$muted;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: functions.rem(12);
      margin-bottom: functions.rem(24);

      @media (min-width: 900px) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .card {
      @include ws.panel;
      display: grid;
      gap: functions.rem(4);
      padding: functions.rem(16);
      border-top: functions.rem(3) solid kit.$green;

      &.bad {
        border-top-color: kit.$red;
      }
    }

    .card-label {
      display: inline-flex;
      align-items: center;
      gap: functions.rem(6);
      font-size: functions.rem(13);
      color: kit.$muted;

      .dot {
        @include kit.live-dot(kit.$green);
      }
    }

    .card-value {
      font-size: functions.rem(28);
      font-weight: miscs.$css-ui-font-weight-bold;
      line-height: 1.1;
      color: kit.$blue;

      small {
        font-size: functions.rem(14);
        font-weight: miscs.$css-ui-font-weight-regular;
        color: kit.$muted;
      }
    }

    .card-sub {
      font-size: functions.rem(13);
      color: kit.$muted;
    }

    .columns {
      display: grid;
      gap: functions.rem(16);
      align-items: start;

      @media (min-width: 900px) {
        grid-template-columns: 1.3fr 1fr;
      }
    }

    .stack {
      display: grid;
      gap: functions.rem(16);
    }

    .panel {
      @include ws.panel;
    }

    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: functions.rem(14) functions.rem(16);
      border-bottom: functions.rem(1) solid kit.$line;

      h2 {
        @include ws.panel-title;
      }
    }

    .link {
      padding: 0;
      border: 0;
      background: none;
      font: inherit;
      font-size: functions.rem(13);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$blue;
      cursor: pointer;
    }

    .issues,
    .cats {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .issue {
      display: flex;
      align-items: center;
      gap: functions.rem(14);
      width: 100%;
      padding: functions.rem(14) functions.rem(16);
      border: 0;
      border-bottom: functions.rem(1) solid kit.$line;
      background: none;
      font: inherit;
      color: kit.$blue;
      text-align: left;
      @include interaction.chip;

      &:disabled {
        cursor: default;
        background: none;
      }
    }

    li:last-child .issue {
      border-bottom: 0;
    }

    .issue-count {
      display: grid;
      place-items: center;
      flex: none;
      width: functions.rem(40);
      height: functions.rem(32);
      border-radius: functions.rem(4);
      background-color: #fbe9e5;
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$red;

      &.easy,
      &.never {
        background-color: #fff4d6;
        color: #8a5a00;
      }

      &.zero {
        background-color: #e5f3ee;
        color: kit.$green;
      }
    }

    .issue-text {
      display: grid;
      flex: 1 1 auto;

      span {
        font-size: functions.rem(13);
        color: kit.$muted;
      }
    }

    .issue-go {
      font-size: functions.rem(13);
      font-weight: miscs.$css-ui-font-weight-bold;
    }

    .rules {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: functions.rem(12);
      margin: 0;
      padding: functions.rem(16);

      dt {
        font-size: functions.rem(13);
        color: kit.$muted;
      }

      dd {
        margin: 0;
        font-weight: miscs.$css-ui-font-weight-bold;
        color: kit.$blue;
      }
    }

    .cats {
      padding: functions.rem(8) 0;

      li {
        display: grid;
        grid-template-columns: functions.rem(130) 1fr functions.rem(48);
        align-items: center;
        gap: functions.rem(12);
        padding: functions.rem(8) functions.rem(16);
      }
    }

    .cat-name {
      overflow: hidden;
      font-size: functions.rem(14);
      color: kit.$blue;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .meter {
      @include kit.meter(kit.$green);
    }

    .cat-num {
      font-size: functions.rem(13);
      color: kit.$muted;
      text-align: right;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WsOverviewComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly nav = inject(WorkspaceNav);
  protected readonly duration = computed(() =>
    formatDuration(durationOf(this.store.settings())),
  );
}
