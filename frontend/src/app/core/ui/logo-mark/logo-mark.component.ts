import { Component, input } from '@angular/core';
import { shapeRing } from '../../branding/logo-shapes';

/**
 * playduelio logo mark: eight geometric shapes on a ring in the brand gradient.
 * With `tile` it is drawn on a white rounded tile like an app icon; with
 * `inverse` the shapes are white (for dark backgrounds).
 */
@Component({
  selector: 'app-logo-mark',
  template: `
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="playduelio"
      [class.animated]="animated()"
      [class.spin]="spin()"
    >
      @if (tile()) {
        <rect x="1" y="1" width="98" height="98" rx="23" class="tile" />
      }
      <g
        [attr.transform]="
          tile() ? 'translate(50 50) scale(0.74) translate(-50 -50)' : null
        "
      >
        @for (shape of ring; track $index) {
          @if (shape.kind === 'circle') {
            <circle
              class="shape"
              [style.animation-delay.ms]="$index * 90"
              [attr.cx]="shape.cx"
              [attr.cy]="shape.cy"
              [attr.r]="shape.r"
              [attr.fill]="inverse() ? '#fff' : shape.color"
            />
          } @else {
            <polygon
              class="shape"
              [style.animation-delay.ms]="$index * 90"
              [attr.points]="shape.points"
              [attr.fill]="inverse() ? '#fff' : shape.color"
            />
          }
        }
      </g>
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
      overflow: visible;
    }
    /* Shapes pop in one after another (start page hero). */
    .animated .shape {
      transform-box: fill-box;
      transform-origin: center;
      animation: pop-in 520ms cubic-bezier(0.2, 1.4, 0.4, 1) both;
    }
    @keyframes pop-in {
      from {
        opacity: 0;
        transform: scale(0.2);
      }
    }
    /* Very slow rotation (decorative watermark). */
    .spin .ring {
      transform-origin: 50px 50px;
      animation: spin 90s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .animated .shape,
      .spin .ring {
        animation: none;
      }
    }
    .tile {
      fill: #fff;
      stroke: #dfe3ea;
      stroke-width: 1.5;
      filter: drop-shadow(0 2px 3px rgba(0, 50, 125, 0.12));
    }
  `,
})
export class LogoMarkComponent {
  readonly tile = input(false);
  readonly inverse = input(false);
  /** Shapes appear one after another when shown. */
  readonly animated = input(false);
  /** Slowly rotates the ring (for decorative use). */
  readonly spin = input(false);

  protected readonly ring = shapeRing();
}
