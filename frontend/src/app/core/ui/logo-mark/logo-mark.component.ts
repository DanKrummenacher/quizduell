import { Component, computed, inject, input } from '@angular/core';
import { BrandingStore, type LogoVariant } from '../../branding/branding.store';
import {
  DARK,
  dotWheel,
  LIGHT,
  polygon,
  shapeRing,
} from '../../branding/logo-shapes';

/** playduelio logo mark. With `tile` it is drawn as a white app-icon tile. */
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
        @switch (variant()) {
          @case (1) {
            @for (shape of ring; track $index) {
              @if (shape.kind === 'circle') {
                <circle
                  [attr.cx]="shape.cx"
                  [attr.cy]="shape.cy"
                  [attr.r]="shape.r"
                  [attr.fill]="shape.color"
                />
              } @else {
                <polygon
                  [attr.points]="shape.points"
                  [attr.fill]="shape.color"
                  stroke-linejoin="round"
                />
              }
            }
          }
          @case (2) {
            <circle cx="31" cy="50" r="19" [attr.fill]="dark" />
            <polygon [attr.points]="diamond" [attr.fill]="light" />
          }
          @case (3) {
            <g fill="none" stroke-width="9" stroke-linecap="round">
              <circle cx="37" cy="42" r="13" [attr.stroke]="dark" />
              <line x1="24" y1="42" x2="24" y2="82" [attr.stroke]="dark" />
              <circle cx="63" cy="58" r="13" [attr.stroke]="light" />
              <line x1="76" y1="18" x2="76" y2="58" [attr.stroke]="light" />
            </g>
          }
          @default {
            @for (shape of wheel; track $index) {
              @if (shape.kind === 'circle') {
                <circle
                  [attr.cx]="shape.cx"
                  [attr.cy]="shape.cy"
                  [attr.r]="shape.r"
                  [attr.fill]="shape.color"
                />
              } @else {
                <polygon [attr.points]="shape.points" [attr.fill]="shape.color" />
              }
            }
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
  private readonly branding = inject(BrandingStore);

  /** Draws the mark on a white rounded tile like an app icon. */
  readonly tile = input(false);
  /** Overrides the selected variant (used by the design preview). */
  readonly design = input<LogoVariant | null>(null);

  protected readonly variant = computed(() => this.design() ?? this.branding.logo());
  protected readonly dark = DARK;
  protected readonly light = LIGHT;
  protected readonly ring = shapeRing();
  protected readonly wheel = dotWheel();
  protected readonly diamond = polygon(71, 50, 21, 4);
}
