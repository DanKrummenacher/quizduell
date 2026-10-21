// TEMPORARY: proposal K «Pocket», the live tab (development only).
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, output } from '@angular/core';
import '@css-ch/components/icon';
import { LogoMarkComponent } from '../../../core/ui/logo-mark/logo-mark.component';
import { ProposalPro } from '../pro';
import { durationOf, formatDuration, ProposalStore } from '../proposal-store';
import type { PocketTab } from './pocket.component';

@Component({
  selector: 'app-pocket-live',
  imports: [LogoMarkComponent],
  template: `
    <div class="top">
      <app-logo-mark class="logo" />
      <span class="time">{{
        store
          .updatedAt()
          ?.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
      }}</span>
    </div>
    <h1 class="title">Live</h1>

    @if (store.stats(); as s) {
      <section class="hero" [class.bad]="!store.ready()">
        <span class="hero-icon">
          <css-icon
            [icon]="store.ready() ? 'checkmark' : 'priority-warning'"
          ></css-icon>
        </span>
        <div>
          <strong>{{
            store.ready() ? 'Bereit für Besucher' : 'Nicht spielbar'
          }}</strong>
          <span>
            @if (store.ready()) {
              {{ s.activeQuestions }} Fragen im Spiel · Duell max. {{ duration() }}
            } @else {
              Es fehlen {{ store.missingQuestions() }} aktive Fragen
            }
          </span>
        </div>
      </section>

      <div class="tiles">
        <div class="tile">
          <strong>{{ s.activeGames }}</strong
          ><span>Duelle jetzt</span>
        </div>
        <div class="tile">
          <strong>{{ s.playersOnline }}</strong
          ><span>Geräte</span>
        </div>
        <div class="tile">
          <strong>{{ s.playersSearching }}</strong
          ><span>suchen</span>
        </div>
        <div class="tile wide">
          <strong>{{ s.gamesToday }}</strong
          ><span>Duelle heute · {{ s.gamesTotal }} insgesamt</span>
        </div>
      </div>

      <span class="label">Schnell</span>
      <ul class="group">
        <li>
          <button type="button" class="row" (click)="store.openEditor(null)">
            <span class="tile-icon"><css-icon icon="add" size="sm"></css-icon></span>
            <span class="grow">Neue Frage</span>
            <css-icon class="chev" icon="angle-right" size="sm"></css-icon>
          </button>
        </li>
        <li>
          <button type="button" class="row" (click)="go.emit('issues')">
            <span class="tile-icon warn"
              ><css-icon icon="priority-warning" size="sm"></css-icon
            ></span>
            <span class="grow">Fragen mit Hinweisen</span>
            <span class="value">{{ pro.issueCount() }}</span>
            <css-icon class="chev" icon="angle-right" size="sm"></css-icon>
          </button>
        </li>
        <li>
          <button type="button" class="row" (click)="go.emit('rules')">
            <span class="tile-icon green"
              ><css-icon icon="settings" size="sm"></css-icon
            ></span>
            <span class="grow">Spielregeln</span>
            <span class="value"
              >{{ store.settings()?.questionsPerGame }} ×
              {{ store.settings()?.questionDurationSec }} s</span
            >
            <css-icon class="chev" icon="angle-right" size="sm"></css-icon>
          </button>
        </li>
      </ul>
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';
    @use 'pocket';

    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: functions.rem(16) functions.rem(20) 0;

      .logo {
        width: functions.rem(28);
        height: functions.rem(28);
      }
    }

    .time {
      font-size: functions.rem(14);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$muted;
    }

    .title {
      @include pocket.large-title;
    }

    .hero {
      display: flex;
      align-items: center;
      gap: functions.rem(14);
      margin: 0 functions.rem(16);
      padding: functions.rem(16);
      border-radius: functions.rem(12);
      background-color: kit.$green;
      color: kit.$white;

      &.bad {
        background-color: kit.$red;
      }

      strong {
        display: block;
        font-size: functions.rem(18);
      }

      span {
        font-size: functions.rem(14);
        opacity: 0.9;
      }
    }

    .hero-icon {
      display: grid;
      place-items: center;
      flex: none;
      width: functions.rem(44);
      height: functions.rem(44);
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.2);
      opacity: 1 !important;
    }

    .tiles {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: functions.rem(10);
      margin: functions.rem(12) functions.rem(16) 0;
    }

    .tile {
      display: grid;
      gap: functions.rem(2);
      padding: functions.rem(14);
      border-radius: functions.rem(12);
      background-color: kit.$white;

      &.wide {
        grid-column: 1 / -1;
        grid-template-columns: auto 1fr;
        align-items: baseline;
        gap: functions.rem(10);
      }

      strong {
        font-size: functions.rem(30);
        font-weight: miscs.$css-ui-font-weight-bold;
        line-height: 1;
        color: kit.$blue;
      }

      span {
        font-size: functions.rem(13);
        color: kit.$muted;
      }
    }

    .label {
      @include pocket.section-label;
    }

    .group {
      @include pocket.group;
    }

    .row {
      @include pocket.row-button;
    }

    li + li .row {
      box-shadow: inset 0 functions.rem(1) 0 pocket.$sep;
    }

    .tile-icon {
      @include pocket.icon-tile;

      &.warn {
        background-color: #d08b00;
      }

      &.green {
        background-color: kit.$green;
      }
    }

    .grow {
      flex: 1 1 auto;
    }

    .value {
      color: kit.$muted;
    }

    .chev {
      color: #a6b4c9;
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PocketLiveComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  readonly go = output<PocketTab | 'issues'>();

  protected duration(): string {
    return formatDuration(durationOf(this.store.settings()));
  }
}
