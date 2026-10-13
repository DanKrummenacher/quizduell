import { Component } from '@angular/core';

let nextId = 0;

/** playduelio lightning mark, used in place of a company logo. */
@Component({
  selector: 'app-logo-mark',
  template: `
    <svg viewBox="0 0 96 96" role="img" aria-label="playduelio">
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
  `,
  styles: `
    :host {
      display: inline-block;
      width: 1.75rem;
      height: 1.75rem;
      flex-shrink: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class LogoMarkComponent {
  protected readonly gradientId = `logo-mark-${nextId++}`;
}
