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
    <svg viewBox="0 0 100 100" role="img" aria-label="playduelio">
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
              [attr.cx]="shape.cx"
              [attr.cy]="shape.cy"
              [attr.r]="shape.r"
              [attr.fill]="inverse() ? '#fff' : shape.color"
            />
          } @else {
            <polygon
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

  protected readonly ring = shapeRing();
}
