import { Component, computed, input } from '@angular/core';
import { hostWidth } from './chart-shared';

/** A small line without axes, e.g. in a key figure. */
@Component({
  selector: 'app-ad-sparkline',
  template: `
    @if (width() > 0) {
      <svg [attr.width]="width()" [attr.height]="height()" aria-hidden="true">
        <path [attr.d]="paths().area" [attr.fill]="color()" fill-opacity="0.1" />
        <path
          [attr.d]="paths().line"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        @if (paths().last; as last) {
          <circle
            [attr.cx]="last.x"
            [attr.cy]="last.y"
            r="3.5"
            [attr.fill]="color()"
          />
        }
      </svg>
    }
  `,
  styles: `
    :host {
      display: block;
      contain: inline-size;
    }
    svg {
      display: block;
      overflow: visible;
    }
  `,
})
export class AdSparklineComponent {
  readonly values = input.required<readonly number[]>();
  readonly height = input(36);
  readonly color = input('var(--ad-chart-accent, #0078bb)');
  /** Fixed range (e.g. 0–1 for shares); otherwise min–max of the values. */
  readonly range = input<[number, number] | null>(null);

  protected readonly width = hostWidth();

  protected readonly paths = computed(() => {
    const values = this.values();
    if (values.length < 2) {
      return { line: '', area: '', last: null };
    }
    const [min, max] = this.range() ?? [Math.min(...values), Math.max(...values)];
    const span = max - min || 1;
    const w = this.width();
    const h = this.height();
    const points = values.map((v, i) => ({
      x: (i * (w - 4)) / (values.length - 1) + 2,
      y: 3 + (1 - (v - min) / span) * (h - 6),
    }));
    const line = points
      .map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join('');
    return {
      line,
      area: `${line}L${points[points.length - 1]!.x},${h}L${points[0]!.x},${h}Z`,
      last: points[points.length - 1]!,
    };
  });
}
