import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import '@css-ch/components/icon';
import type { Notice } from '../core/notify.service';

/**
 * One notice as a white card: an icon in its tone, what happened, the detail,
 * an optional action and the close button.
 */
@Component({
  selector: 'app-ad-notice-card',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { '[attr.data-tone]': 'tone()' },
  template: `
    <div class="card">
      <span class="icon" aria-hidden="true">
        <css-icon [attr.icon]="icon()" size="sm"></css-icon>
      </span>
      <p class="text">
        <b>{{ title() }}</b>
        @if (detail()) {
          <span>{{ detail() }}</span>
        }
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
    :host([data-tone='success']) .icon {
      background: #e6f4ef;
      color: #00875e;
    }
    :host([data-tone='error']) .icon {
      background: #fcefec;
      color: #a8290f;
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
export class AdNoticeCardComponent {
  readonly notice = input.required<Notice>();
  readonly closed = output();

  protected readonly tone = computed(() =>
    this.notice().kind === 'pause'
      ? 'pause'
      : this.notice().tone === 'error'
        ? 'error'
        : 'success',
  );
  protected readonly icon = computed(() => {
    switch (this.notice().kind) {
      case 'pause':
        return 'pause';
      case 'resume':
        return 'play-circle';
      default:
        return this.notice().tone === 'error'
          ? 'priority-warning'
          : 'checkmark-circle';
    }
  });
  protected readonly title = computed(() => {
    switch (this.notice().kind) {
      case 'pause':
        return 'Spiel pausiert';
      case 'resume':
        return 'Spiel läuft wieder';
      default:
        return this.parts()[0];
    }
  });
  protected readonly detail = computed(
    () => this.notice().detail ?? this.parts()[1] ?? null,
  );
  /** «Done – what it means» reads as a title with its detail below. */
  private readonly parts = computed(() => {
    const [head = '', ...rest] = this.notice().text.split(' – ');
    const tail = rest.join(' – ');
    return tail
      ? [head, tail.charAt(0).toUpperCase() + tail.slice(1) + '.']
      : [head];
  });

  protected run(): void {
    this.notice().action?.run();
    this.closed.emit();
  }
}
