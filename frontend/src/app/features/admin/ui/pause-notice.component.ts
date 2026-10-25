import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import type { Notice } from '../core/notify.service';

/** The notice after the game was paused or let run again. */
@Component({
  selector: 'app-ad-pause-notice',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[attr.data-kind]': 'notice().kind' },
  template: `
    <div class="card">
      <span class="icon" aria-hidden="true">
        <css-icon
          [attr.icon]="pause() ? 'pause' : 'play-circle'"
          size="sm"
        ></css-icon>
      </span>
      <p class="text">
        <b>{{ pause() ? 'Spiel pausiert' : 'Spiel läuft wieder' }}</b>
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
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-width: 100%;
      color: #00327d;
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
    p {
      margin: 0;
    }
    button {
      font: inherit;
    }
    .card {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 520px;
      max-width: 100%;
      padding: 12px 10px 12px 12px;
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
      background: #fff5d6;
      color: #7a4f00;
    }
    :host([data-kind='resume']) .icon {
      background: #e6f4ef;
      color: #00875e;
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
      color: #4d70a4;
    }
    .btn {
      flex: none;
      height: 32px;
      padding: 0 12px;
      border: 1px solid rgba(0, 50, 125, 0.16);
      border-radius: 9px;
      background: #fff;
      color: #00327d;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn:hover {
      background: #f3f6fa;
    }
    .close {
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
      color: #00327d;
    }
    .btn:focus-visible,
    .close:focus-visible {
      outline: 2px solid #0078bb;
      outline-offset: 2px;
    }
    @media (max-width: 640px) {
      .card {
        width: 100%;
      }
    }
  `,
})
export class AdPauseNoticeComponent {
  readonly notice = input.required<Notice>();
  readonly closed = output();

  protected readonly pause = computed(() => this.notice().kind === 'pause');

  protected run(): void {
    this.notice().action?.run();
    this.closed.emit();
  }
}
