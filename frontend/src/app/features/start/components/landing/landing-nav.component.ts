import { Component, input } from '@angular/core';
import { LogoMarkComponent } from '../../../../core/ui/logo-mark/logo-mark.component';

/** TEMPORARY (landing concepts): a light top bar instead of the game header. */
@Component({
  selector: 'app-landing-nav',
  imports: [LogoMarkComponent],
  template: `
    <nav class="nav" aria-label="playduelio">
      <span class="lockup">
        <app-logo-mark class="logo" [inverse]="dark()" />
        <span class="wordmark"><span class="light">play</span>duelio</span>
      </span>
      <span class="live"><i></i>Live · 1 gegen 1</span>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      z-index: 2;
      padding: calc(1rem + var(--app-safe-top)) 1.25rem 0;
    }
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 72rem;
      margin: 0 auto;
    }
    .lockup {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .logo {
      width: 1.75rem;
      height: 1.75rem;
    }
    .wordmark {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #00327d;
    }
    .light {
      font-weight: 300;
    }
    .live {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      border: 1px solid #d5deea;
      border-radius: 999px;
      font-size: 0.8125rem;
      color: #00327d;
    }
    .live i {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: #00a4e0;
      animation: ping 1.8s ease-out infinite;
    }
    :host(.is-dark) .wordmark,
    :host(.is-dark) .live {
      color: #fff;
    }
    :host(.is-dark) .live {
      border-color: rgba(255, 255, 255, 0.25);
    }
    @media (min-width: 900px) {
      :host {
        padding: calc(1.5rem + var(--app-safe-top)) 3rem 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .live i {
        animation: none;
      }
    }
    @keyframes ping {
      0% {
        box-shadow: 0 0 0 0 rgba(0, 164, 224, 0.5);
      }
      70%,
      100% {
        box-shadow: 0 0 0 0.45rem rgba(0, 164, 224, 0);
      }
    }
  `,
  host: { '[class.is-dark]': 'dark()' },
})
export class LandingNavComponent {
  readonly dark = input(false);
}
