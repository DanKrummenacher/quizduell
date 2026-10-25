import { Component, inject } from '@angular/core';
import { NotifyService } from '../core/notify.service';
import { AdNoticeCardComponent } from './notice-card.component';

/**
 * The notices of `NotifyService`, stacked under the bar, or under the pause
 * strip while it shows.
 */
@Component({
  selector: 'app-ad-notices',
  imports: [AdNoticeCardComponent],
  template: `
    <div class="stack" role="status" aria-live="polite">
      @for (notice of notify.notices(); track notice.id) {
        <app-ad-notice-card [notice]="notice" (closed)="notify.dismiss(notice.id)" />
      }
    </div>
  `,
  styles: `
    .stack {
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
    :host-context(body:has(.ad-paused)) .stack {
      top: 134px;
    }
    @media (max-width: 640px) {
      .stack {
        right: 16px;
        left: 16px;
        width: auto;
        transform: none;
      }
      :host-context(body:has(.ad-paused)) .stack {
        top: 184px;
      }
    }
  `,
})
export class AdNoticesComponent {
  protected readonly notify = inject(NotifyService);
}
