// Bühne: what happens at the stand right now.
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import { ProposalPro } from '../../proposals/pro';
import {
  durationOf,
  formatDuration,
  ProposalStore,
} from '../../proposals/proposal-store';
import { BuehneState } from './buehne-state';

@Component({
  selector: 'app-buehne-live',
  template: `
    @if (store.stats(); as s) {
      <section class="hero" [class.running]="s.activeGames > 0">
        <div class="hero-text">
          <span class="eyebrow">Jetzt am Stand</span>
          <strong class="big">{{ s.activeGames }}</strong>
          <span class="big-label">{{
            s.activeGames === 1 ? 'Duell läuft' : 'Duelle laufen'
          }}</span>
        </div>
        <div class="duel" aria-hidden="true">
          <span class="orb a"><css-icon icon="avatar" size="lg"></css-icon></span>
          <span class="vs">VS</span>
          <span class="orb b"><css-icon icon="avatar" size="lg"></css-icon></span>
        </div>
        <dl class="chips">
          <div>
            <dt>Geräte</dt>
            <dd>{{ s.playersOnline }}</dd>
          </div>
          <div>
            <dt>Suchen Gegner</dt>
            <dd>{{ s.playersSearching }}</dd>
          </div>
          <div>
            <dt>Duelle heute</dt>
            <dd>{{ s.gamesToday }}</dd>
          </div>
        </dl>
      </section>

      <section class="ready" [class.bad]="!store.ready()">
        <span class="ready-icon">
          <css-icon
            [icon]="store.ready() ? 'checkmark' : 'priority-warning'"
          ></css-icon>
        </span>
        <div class="ready-text">
          <h2>
            {{ store.ready() ? 'Bereit für Besucher' : 'Noch nicht spielbar' }}
          </h2>
          <p>
            @if (store.ready()) {
              {{ s.activeQuestions }} Fragen im Spiel · ein Duell dauert höchstens
              {{ duration() }}
            } @else {
              Es braucht mindestens {{ s.requiredQuestions }} aktive Fragen – es
              fehlen {{ store.missingQuestions() }}.
            }
          </p>
        </div>
        @if (!store.ready()) {
          <button type="button" class="cta" (click)="state.go('questions')">
            Fragen aktivieren
          </button>
        }
      </section>

      <div class="tiles">
        <button type="button" class="tile" (click)="state.editing.set('new')">
          <span class="tile-icon"><css-icon icon="add"></css-icon></span>
          <strong>Neue Frage</strong>
          <span>In drei Schritten erfassen</span>
        </button>
        <button
          type="button"
          class="tile"
          (click)="state.onlyIssues.set(true); state.go('questions')"
        >
          <span class="tile-icon warn"
            ><css-icon icon="priority-warning"></css-icon
          ></span>
          <strong>Fragen prüfen</strong>
          <span
            >{{ pro.issueCount() }}
            {{ pro.issueCount() === 1 ? 'Frage braucht' : 'Fragen brauchen' }} einen
            Blick</span
          >
        </button>
        <button type="button" class="tile" (click)="state.go('rules')">
          <span class="tile-icon green"><css-icon icon="speed"></css-icon></span>
          <strong>Spielart wählen</strong>
          <span
            >{{ store.settings()?.questionsPerGame }} Fragen à
            {{ store.settings()?.questionDurationSec }} s</span
          >
        </button>
        <button type="button" class="tile" (click)="openGame.emit()">
          <span class="tile-icon cyan"><css-icon icon="ipad"></css-icon></span>
          <strong>Startseite öffnen</strong>
          <span>Dieses Gerät wird zum Spielgerät</span>
        </button>
      </div>

      <p class="foot">
        {{ s.gamesTotal }} Duelle seit Beginn · {{ store.overallRate() ?? '–' }} %
        der Antworten richtig
      </p>
    } @else {
      <div class="loading"><span></span><span></span><span></span></div>
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use 'buehne' as b;

    :host {
      display: grid;
      gap: functions.rem(16);
    }

    .hero {
      @include b.glass;
      position: relative;
      display: grid;
      gap: functions.rem(20);
      padding: functions.rem(28) functions.rem(24) functions.rem(22);
      overflow: hidden;

      @media (min-width: 760px) {
        grid-template-columns: 1fr auto;
        align-items: center;
        padding: functions.rem(36) functions.rem(40) functions.rem(28);
      }

      &::before {
        content: '';
        position: absolute;
        inset: auto -20% -60% 30%;
        height: 120%;
        background: radial-gradient(
          closest-side,
          rgba(0, 164, 224, 0.35),
          transparent
        );
        pointer-events: none;
      }
    }

    .eyebrow {
      @include b.eyebrow;
      color: b.$on-dark;
    }

    .hero-text {
      display: grid;
    }

    .big {
      font-size: clamp(#{functions.rem(72)}, 12vw, #{functions.rem(120)});
      font-weight: miscs.$css-ui-font-weight-bold;
      line-height: 1;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }

    .big-label {
      font-size: functions.rem(20);
      color: b.$on-dark;
    }

    .duel {
      display: flex;
      align-items: center;
      gap: functions.rem(14);
    }

    .orb {
      display: grid;
      place-items: center;
      width: functions.rem(76);
      height: functions.rem(76);
      border-radius: 50%;
      background-color: b.$white;
      color: b.$blue;
      opacity: 0.35;
      transition: opacity 0.4s ease;

      &.b {
        background-color: b.$cyan;
        color: b.$white;
      }

      .running & {
        opacity: 1;
        animation: breathe 2.6s ease-in-out infinite;
      }

      .running &.b {
        animation-delay: 1.3s;
      }
    }

    .vs {
      font-size: functions.rem(18);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: b.$on-dark;
    }

    .chips {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: functions.rem(8);
      margin: 0;

      @media (min-width: 760px) {
        grid-column: 1 / -1;
      }

      div {
        padding: functions.rem(12) functions.rem(14);
        border-radius: b.$radius-sm;
        background-color: rgba(255, 255, 255, 0.08);
      }

      dt {
        font-size: functions.rem(13);
        color: b.$on-dark;
      }

      dd {
        margin: functions.rem(2) 0 0;
        font-size: functions.rem(26);
        font-weight: miscs.$css-ui-font-weight-bold;
      }
    }

    .ready {
      @include b.card;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: functions.rem(16);
      padding: functions.rem(20) functions.rem(22);
    }

    .ready-icon {
      display: grid;
      place-items: center;
      flex: none;
      width: functions.rem(52);
      height: functions.rem(52);
      border-radius: 50%;
      background-color: b.$green;
      color: b.$white;

      .bad & {
        background-color: b.$red;
      }
    }

    .ready-text {
      flex: 1 1 functions.rem(220);

      h2 {
        margin: 0;
        font-size: functions.rem(20);
        font-weight: miscs.$css-ui-font-weight-bold;
      }

      p {
        margin: functions.rem(4) 0 0;
        color: b.$ink-2;
      }
    }

    .cta {
      @include b.button(b.$blue, b.$white);
    }

    .tiles {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: functions.rem(12);

      @media (min-width: 900px) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .tile {
      @include b.card;
      display: grid;
      align-content: start;
      gap: functions.rem(4);
      min-height: functions.rem(150);
      padding: functions.rem(18);
      border: 0;
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition: transform 0.15s ease;
      @include b.focus;

      &:active {
        transform: scale(0.98);
      }

      strong {
        margin-top: functions.rem(10);
        font-size: functions.rem(17);
      }

      span:last-child {
        font-size: functions.rem(14);
        line-height: 1.35;
        color: b.$ink-2;
      }
    }

    .tile-icon {
      display: grid;
      place-items: center;
      width: functions.rem(48);
      height: functions.rem(48);
      border-radius: functions.rem(14);
      background-color: b.$blue;
      color: b.$white;

      &.warn {
        background-color: #e09a00;
      }

      &.green {
        background-color: b.$green;
      }

      &.cyan {
        background-color: b.$mid;
      }
    }

    .foot {
      margin: functions.rem(8) 0 0;
      font-size: functions.rem(14);
      color: b.$on-dark;
      text-align: center;
    }

    .loading {
      display: flex;
      justify-content: center;
      gap: functions.rem(8);
      padding: functions.rem(80);

      span {
        width: functions.rem(10);
        height: functions.rem(10);
        border-radius: 50%;
        background-color: b.$on-dark;
        animation: blink 1s ease-in-out infinite alternate;

        &:nth-child(2) {
          animation-delay: 0.2s;
        }

        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }

    @keyframes breathe {
      50% {
        box-shadow: 0 0 0 functions.rem(12) rgba(255, 255, 255, 0);
      }

      0%,
      100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.35);
      }
    }

    @keyframes blink {
      to {
        opacity: 0.2;
      }
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BuehneLiveComponent {
  protected readonly store = inject(ProposalStore);
  protected readonly pro = inject(ProposalPro);
  protected readonly state = inject(BuehneState);
  readonly openGame = output<void>();

  protected readonly duration = computed(() =>
    formatDuration(durationOf(this.store.settings())),
  );
}
