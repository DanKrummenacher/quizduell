import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import '@css-ch/components/icon';
import { noticePreview, noticeView } from '../core/live-demo';
import { NotifyService, type Notice } from '../core/notify.service';
import { AdPauseNoticeComponent } from './pause-notice.component';

/** The notices of `NotifyService`, stacked at the top of the page. */
@Component({
  selector: 'app-ad-notices',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [AdPauseNoticeComponent],
  template: `
    <div class="pause-layer" [attr.data-view]="view.value()">
      @if (preview(); as notice) {
        <app-ad-pause-notice
          [notice]="notice"
          [view]="view.value()"
          [still]="true"
          (closed)="previewStore.set('off')"
        />
      }
      @for (notice of notify.notices(); track notice.id) {
        @if (notice.kind) {
          <app-ad-pause-notice
            [notice]="notice"
            [view]="view.value()"
            (closed)="notify.dismiss(notice.id)"
          />
        }
      }
    </div>
    <div class="stack" role="status" aria-live="polite">
      @for (notice of notify.notices(); track notice.id) {
        @if (!notice.kind) {
          <div class="notice" [class.error]="notice.tone === 'error'">
            <css-icon
              [attr.icon]="
                notice.tone === 'error' ? 'priority-warning' : 'checkmark-circle'
              "
              size="sm"
            ></css-icon>
            <span class="text">{{ notice.text }}</span>
            @if (notice.action; as action) {
              <button
                type="button"
                class="action"
                (click)="action.run(); notify.dismiss(notice.id)"
              >
                {{ action.label }}
              </button>
            }
            <button
              type="button"
              class="close"
              aria-label="Meldung schliessen"
              (click)="notify.dismiss(notice.id)"
            >
              <css-icon icon="close" size="xs"></css-icon>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    /* The pause and resume notice, where the other notices stand. */
    .pause-layer {
      position: fixed;
      top: 80px;
      left: 50%;
      z-index: 71;
      display: grid;
      justify-items: center;
      gap: 10px;
      width: min(540px, calc(100vw - 32px));
      transform: translateX(-50%);
      pointer-events: none;
    }
    /* Under the pause strip while it shows. */
    :host-context(body:has(.ad-paused)) .pause-layer,
    :host-context(body:has(.ad-paused)) .stack {
      top: 134px;
    }
    @media (max-width: 640px) {
      .pause-layer {
        right: 16px;
        left: 16px;
        width: auto;
        transform: none;
      }
      :host-context(body:has(.ad-paused)) .pause-layer,
      :host-context(body:has(.ad-paused)) .stack {
        top: 184px;
      }
    }
    .stack {
      position: fixed;
      top: 80px;
      left: 50%;
      z-index: 70;
      display: grid;
      justify-items: center;
      gap: 8px;
      width: min(560px, calc(100vw - 32px));
      transform: translateX(-50%);
      pointer-events: none;
    }
    .notice {
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 100%;
      min-height: 44px;
      padding: 6px 8px 6px 16px;
      border-radius: 22px;
      background: #00327d;
      color: #fff;
      font-size: 14px;
      line-height: 1.4;
      box-shadow:
        0 0 0 1px rgba(0, 50, 125, 0.08),
        0 14px 36px -8px rgba(0, 50, 125, 0.4);
      pointer-events: auto;
      animation: notice-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes notice-in {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
    }
    .notice > css-icon {
      flex: none;
      color: #00e09d;
    }
    .notice.error {
      background: #a8290f;
    }
    .notice.error > css-icon {
      color: #fff;
    }
    .text {
      flex: 1;
      min-width: 0;
      padding: 4px 0;
    }
    .action {
      flex: none;
      height: 30px;
      padding: 0 12px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 99px;
      background: transparent;
      color: #fff;
      font: inherit;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
    }
    .action:hover {
      background: rgba(255, 255, 255, 0.14);
    }
    .close {
      display: grid;
      flex: none;
      place-items: center;
      width: 30px;
      height: 30px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
    }
    .close:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
    }
    .notice :focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
  `,
})
export class AdNoticesComponent {
  protected readonly notify = inject(NotifyService);
  /** Temporary: the notice drafts and their standing preview. */
  protected readonly view = noticeView;
  protected readonly previewStore = noticePreview;
  protected readonly preview = computed<Notice | null>(() => {
    switch (noticePreview.value()) {
      case 'pause':
        return {
          id: -1,
          text: 'Spiel pausiert',
          tone: 'success',
          kind: 'pause',
          detail: '5 laufende Duelle spielen noch zu Ende.',
          action: { label: 'Rückgängig', run: () => undefined },
        };
      case 'resume':
        return {
          id: -2,
          text: 'Spiel läuft wieder',
          tone: 'success',
          kind: 'resume',
          detail: 'Neue Duelle und Revanchen starten wieder.',
        };
      default:
        return null;
    }
  });
}
