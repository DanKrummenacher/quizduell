import { Component, input } from '@angular/core';

/** playduelio logo: lightning mark plus wordmark. */
@Component({
  selector: 'app-brand',
  template: `
    <svg class="mark" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.2" stop-color="#00327d" />
          <stop offset="0.7" stop-color="#0078bb" />
          <stop offset="1" stop-color="#00a4e0" />
        </linearGradient>
      </defs>
      <rect
        width="96"
        height="96"
        rx="22"
        [attr.fill]="'url(#' + gradientId + ')'"
      />
      <path
        d="M55 13 26 54h19l-6 29 31-43H51z"
        fill="#fff"
        stroke="#fff"
        stroke-width="3"
        stroke-linejoin="round"
      />
    </svg>
    @if (!compact()) {
      <span class="wordmark"><span class="play">play</span>duelio</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      font-size: var(--brand-size, 1.25rem);
      line-height: 1;
      color: var(--css-color-text-default);
      user-select: none;
    }
    .mark {
      width: 1.6em;
      height: 1.6em;
      flex-shrink: 0;
    }
    .wordmark {
      font-weight: var(--css-font-weight-bold);
      letter-spacing: -0.01em;
    }
    .play {
      font-weight: var(--css-font-weight-light);
    }
  `,
  host: { role: 'img', '[attr.aria-label]': '"playduelio"' },
})
export class BrandComponent {
  readonly compact = input(false);
  protected readonly gradientId = `brand-gradient-${Math.random().toString(36).slice(2, 8)}`;
}
