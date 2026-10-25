import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import '@css-ch/components/icon';
import type { Notice } from '../core/notify.service';

/**
 * Temporary: the notice after pausing or resuming the game, in the shape of
 * the chosen draft. `still` keeps the preview standing and its timer looping.
 */
@Component({
  selector: 'app-ad-pause-notice',
  imports: [RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    '[attr.data-view]': 'view()',
    '[attr.data-kind]': 'notice().kind',
    '[class.is-still]': 'still()',
    '[style.--life]': 'life()',
  },
  template: `
    @switch (view()) {
      @case ('m4') {
        <div class="pill" role="status">
          <span class="pill-dot" aria-hidden="true"></span>
          <b>{{ title() }}</b>
          <span class="pill-detail">{{ short() }}</span>
          @if (notice().action; as action) {
            <span class="pill-sep" aria-hidden="true"></span>
            <button type="button" class="pill-action" (click)="run()">
              {{ action.label }}
            </button>
          }
          <button
            type="button"
            class="close"
            aria-label="Meldung schliessen"
            (click)="closed.emit()"
          >
            <css-icon icon="close" size="xs"></css-icon>
          </button>
        </div>
      }
      @case ('m5') {
        <div class="card change" role="status">
          <div class="states" aria-hidden="true">
            <span class="state" [attr.data-state]="pause() ? 'run' : 'pause'">
              <i></i>{{ pause() ? 'Läuft' : 'Pausiert' }}
            </span>
            <span class="arrow"></span>
            <span class="state is-now" [attr.data-state]="pause() ? 'pause' : 'run'">
              <i></i>{{ pause() ? 'Pausiert' : 'Läuft' }}
            </span>
          </div>
          <p class="text">
            <b>{{ title() }}</b>
            <span>{{ notice().detail }}</span>
          </p>
          <div class="row">
            @if (notice().action; as action) {
              <button type="button" class="btn" (click)="run()">
                {{ action.label }}
              </button>
            }
            <button type="button" class="btn ghost" (click)="closed.emit()">
              Schliessen
            </button>
          </div>
          <span class="timer" aria-hidden="true"></span>
        </div>
      }
      @case ('m6') {
        <div class="card corner" role="status">
          <span class="icon" aria-hidden="true">
            <css-icon
              [attr.icon]="pause() ? 'pause' : 'play-circle'"
              size="sm"
            ></css-icon>
          </span>
          <p class="text">
            <b>{{ title() }}</b>
            <span>{{ notice().detail }}</span>
          </p>
          <button
            type="button"
            class="close ring"
            aria-label="Meldung schliessen"
            (click)="closed.emit()"
          >
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <circle class="ring-track" cx="16" cy="16" r="14" />
              <circle class="ring-left" cx="16" cy="16" r="14" pathLength="100" />
            </svg>
            <css-icon icon="close" size="xs"></css-icon>
          </button>
          <div class="row">
            @if (notice().action; as action) {
              <button type="button" class="btn" (click)="run()">
                {{ action.label }}
              </button>
            }
            <a class="link" routerLink="/admin/live" (click)="closed.emit()"
              >Zur Live-Ansicht<span aria-hidden="true">→</span></a
            >
          </div>
        </div>
      }
      @default {
        <div class="card" role="status">
          <span class="icon" aria-hidden="true">
            <css-icon
              [attr.icon]="pause() ? 'pause' : 'play-circle'"
              size="sm"
            ></css-icon>
          </span>
          <p class="text">
            <b>{{ title() }}</b>
            <span>{{ notice().detail }}</span>
          </p>
          @if (notice().action; as action) {
            <button type="button" class="btn" (click)="run()">
              {{ action.label }}
            </button>
          }
          <button
            type="button"
            class="close"
            aria-label="Meldung schliessen"
            (click)="closed.emit()"
          >
            <css-icon icon="close" size="xs"></css-icon>
          </button>
          <span class="timer" aria-hidden="true"></span>
        </div>
      }
    }
  `,
  styles: `
    :host {
      --amber: #e0a100;
      --amber-bg: #fff5d6;
      --amber-ink: #7a4f00;
      --green: #00875e;
      --green-bg: #e6f4ef;
      --navy: #00327d;
      --muted: #4d70a4;
      display: block;
      max-width: 100%;
      color: var(--navy);
      font-size: 13.5px;
      line-height: 1.4;
      pointer-events: auto;
      animation: in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes in {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.98);
      }
    }
    :host([data-view='m4']),
    :host([data-view='m6']) {
      animation-name: up;
    }
    @keyframes up {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
    }
    p {
      margin: 0;
    }
    button,
    a {
      font: inherit;
    }

    /* Card, shared by most drafts. */
    .card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      width: 520px;
      max-width: 100%;
      padding: 12px 10px 12px 12px;
      overflow: hidden;
      border: 1px solid rgba(0, 50, 125, 0.1);
      border-radius: 14px;
      background: #fff;
      box-shadow:
        0 1px 2px rgba(0, 50, 125, 0.06),
        0 18px 44px -14px rgba(0, 50, 125, 0.4);
    }
    .icon {
      display: grid;
      flex: none;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--amber-bg);
      color: var(--amber-ink);
    }
    :host([data-kind='resume']) .icon {
      background: var(--green-bg);
      color: var(--green);
    }
    .text {
      display: grid;
      flex: 1;
      min-width: 0;
    }
    .text b {
      font-size: 14.5px;
    }
    .text span {
      color: var(--muted);
    }
    .btn {
      flex: none;
      height: 32px;
      padding: 0 12px;
      border: 1px solid rgba(0, 50, 125, 0.16);
      border-radius: 9px;
      background: #fff;
      color: var(--navy);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn:hover {
      background: #f3f6fa;
    }
    .close {
      position: relative;
      display: grid;
      flex: none;
      place-items: center;
      width: 30px;
      height: 30px;
      padding: 0;
      border: 0;
      border-radius: 8px;
      background: none;
      color: #7d95b9;
      cursor: pointer;
    }
    .close:hover {
      background: #f3f6fa;
      color: var(--navy);
    }
    .timer {
      display: none;
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      height: 3px;
      background: var(--amber);
      transform-origin: left;
      animation: drain var(--life) linear both;
    }
    :host([data-kind='resume']) .timer {
      background: var(--green);
    }
    :host(.is-still) .timer,
    :host(.is-still) .ring-left {
      animation-iteration-count: infinite;
    }
    @keyframes drain {
      to {
        transform: scaleX(0);
      }
    }

    /* m2 Navy: the colour of the bar, amber for the pause. */
    :host([data-view='m2']) .card {
      border: 0;
      background: var(--navy);
      color: #fff;
    }
    :host([data-view='m2']) .icon {
      background: rgba(255, 196, 0, 0.18);
      color: #ffc94d;
    }
    :host([data-view='m2'][data-kind='resume']) .icon {
      background: rgba(0, 224, 157, 0.16);
      color: #00e09d;
    }
    :host([data-view='m2']) .text span {
      color: rgba(255, 255, 255, 0.72);
    }
    :host([data-view='m2']) .btn {
      border-color: rgba(255, 255, 255, 0.3);
      background: transparent;
      color: #fff;
    }
    :host([data-view='m2']) .btn:hover,
    :host([data-view='m2']) .close:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    :host([data-view='m2']) .close {
      color: rgba(255, 255, 255, 0.7);
    }

    /* m3 Ecke oben: at the top right, with the time it stays. */
    :host([data-view='m3']) .card {
      flex-wrap: wrap;
      align-items: flex-start;
      width: 360px;
      padding: 16px;
    }
    :host([data-view='m3']) .text {
      flex-basis: calc(100% - 96px);
    }
    :host([data-view='m3']) .btn {
      order: 5;
      margin-left: 48px;
    }
    :host([data-view='m3']) .timer {
      display: block;
    }

    /* m4 Pille: one calm line at the bottom. */
    .pill {
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 100%;
      height: 44px;
      padding: 0 6px 0 16px;
      border-radius: 99px;
      background: #0b1a33;
      color: #fff;
      white-space: nowrap;
      box-shadow: 0 18px 40px -12px rgba(0, 20, 60, 0.55);
    }
    .pill-dot {
      flex: none;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ffc94d;
      box-shadow: 0 0 0 4px rgba(255, 201, 77, 0.2);
    }
    :host([data-kind='resume']) .pill-dot {
      background: #00e09d;
      box-shadow: 0 0 0 4px rgba(0, 224, 157, 0.2);
    }
    .pill-detail {
      overflow: hidden;
      color: rgba(255, 255, 255, 0.66);
      text-overflow: ellipsis;
    }
    .pill-sep {
      flex: none;
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.18);
    }
    .pill-action {
      flex: none;
      height: 32px;
      padding: 0 10px;
      border: 0;
      border-radius: 99px;
      background: none;
      color: #7fd3f7;
      font-weight: 700;
      cursor: pointer;
    }
    .pill-action:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .pill .close {
      border-radius: 50%;
      color: rgba(255, 255, 255, 0.6);
    }
    .pill .close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    /* m5 Wechsel: what changed, from one state to the other. */
    .change {
      display: grid;
      gap: 12px;
      width: 420px;
      padding: 16px 18px;
    }
    .states {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .state {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 26px;
      padding: 0 10px;
      border-radius: 99px;
      background: #f3f6fa;
      color: var(--muted);
      font-size: 12.5px;
      font-weight: 500;
    }
    .state i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }
    .state[data-state='run'] {
      color: var(--green);
    }
    .state[data-state='pause'] {
      color: var(--amber-ink);
    }
    .state:not(.is-now) {
      opacity: 0.55;
      text-decoration: line-through;
      text-decoration-color: rgba(0, 50, 125, 0.3);
    }
    .state.is-now[data-state='run'] {
      background: var(--green-bg);
    }
    .state.is-now[data-state='pause'] {
      background: var(--amber-bg);
    }
    .arrow {
      width: 18px;
      height: 1.5px;
      background: rgba(0, 50, 125, 0.25);
      position: relative;
    }
    .arrow::after {
      content: '';
      position: absolute;
      top: -3px;
      right: 0;
      width: 6px;
      height: 6px;
      border-top: 1.5px solid rgba(0, 50, 125, 0.25);
      border-right: 1.5px solid rgba(0, 50, 125, 0.25);
      transform: rotate(45deg);
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn.ghost {
      border-color: transparent;
      color: var(--muted);
    }
    .change .timer {
      display: block;
    }

    /* m6 Ecke unten: a card at the bottom right, the time as a ring. */
    .corner {
      display: grid;
      grid-template-columns: 36px minmax(0, 1fr) 32px;
      align-items: start;
      gap: 4px 12px;
      width: 380px;
      padding: 16px 12px 14px 16px;
      border-left: 0;
    }
    .corner::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 4px;
      background: var(--amber);
    }
    :host([data-kind='resume']) .corner::before {
      background: var(--green);
    }
    .corner .row {
      grid-column: 2 / -1;
      gap: 14px;
      margin-top: 8px;
    }
    .link {
      display: inline-flex;
      gap: 6px;
      color: var(--navy);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
    }
    .link:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .ring {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
    .ring svg {
      position: absolute;
      inset: 0;
      transform: rotate(-90deg);
    }
    .ring circle {
      fill: none;
      stroke-width: 2;
    }
    .ring-track {
      stroke: #e8eef7;
    }
    .ring-left {
      stroke: var(--amber);
      stroke-dasharray: 100 100;
      animation: ring var(--life) linear both;
    }
    :host([data-kind='resume']) .ring-left {
      stroke: var(--green);
    }
    @keyframes ring {
      to {
        stroke-dasharray: 0 100;
      }
    }

    /* m7 Glas: frosted over the page, the colour as a glow. */
    :host([data-view='m7']) .card {
      border: 1px solid rgba(255, 255, 255, 0.7);
      background: rgba(255, 255, 255, 0.7);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.9),
        0 24px 50px -18px rgba(0, 50, 125, 0.45);
      backdrop-filter: blur(16px) saturate(1.6);
    }
    :host([data-view='m7']) .icon {
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #ffe08a, #e0a100);
      box-shadow: 0 6px 18px -4px rgba(224, 161, 0, 0.65);
      color: #fff;
    }
    :host([data-view='m7'][data-kind='resume']) .icon {
      background: radial-gradient(circle at 35% 30%, #5ee8b5, #00875e);
      box-shadow: 0 6px 18px -4px rgba(0, 135, 94, 0.55);
    }
    :host([data-view='m7']) .btn {
      border: 0;
      border-radius: 99px;
      background: var(--navy);
      color: #fff;
    }
    :host([data-view='m7']) .btn:hover {
      background: #0a3f94;
    }

    @media (max-width: 640px) {
      .card,
      .change,
      .corner {
        width: 100%;
      }
      .pill-detail {
        display: none;
      }
    }
  `,
})
export class AdPauseNoticeComponent {
  readonly notice = input.required<Notice>();
  readonly view = input.required<string>();
  readonly still = input(false);
  readonly closed = output();

  protected readonly pause = computed(() => this.notice().kind === 'pause');
  protected readonly title = computed(() =>
    this.pause() ? 'Spiel pausiert' : 'Spiel läuft wieder',
  );
  /** The detail in a few words, for the pill. */
  protected readonly short = computed(() =>
    this.pause() ? 'Es starten keine neuen Duelle' : 'Duelle starten wieder',
  );
  /** As long as the notice stays: longer with an action. */
  protected readonly life = computed(() => (this.notice().action ? '7s' : '3.5s'));

  protected run(): void {
    this.notice().action?.run();
    this.closed.emit();
  }
}
