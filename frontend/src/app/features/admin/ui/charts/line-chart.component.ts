import { Component, computed, input, signal } from '@angular/core';
import {
  CHART_STYLES,
  compact,
  hostWidth,
  niceTicks,
  pathOf,
  toRuns,
} from './chart-shared';

/** Line chart with an area wash, a crosshair and a tooltip. */
@Component({
  selector: 'app-ad-line-chart',
  template: `
    @if (width() > 0) {
      <svg
        [attr.width]="width()"
        [attr.height]="height()"
        role="img"
        [attr.aria-label]="ariaLabel()"
        (pointermove)="onMove($event)"
        (pointerleave)="hover.set(null)"
      >
        @for (tick of geometry().ticks; track tick.value) {
          <line
            class="grid"
            [attr.x1]="pad.left"
            [attr.x2]="width() - pad.right"
            [attr.y1]="tick.y"
            [attr.y2]="tick.y"
          />
          <text
            class="tick"
            [attr.x]="pad.left - 8"
            [attr.y]="tick.y + 4"
            text-anchor="end"
          >
            {{ tick.label }}
          </text>
        }
        @for (label of geometry().xLabels; track label.x) {
          <text
            class="tick"
            [attr.x]="label.x"
            [attr.y]="height() - 4"
            text-anchor="middle"
          >
            {{ label.text }}
          </text>
        }
        @if (compare()) {
          <path
            [attr.d]="geometry().comparePath"
            fill="none"
            stroke="#c5ccd8"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        }
        @if (area()) {
          <path
            [attr.d]="geometry().area"
            [attr.fill]="color()"
            fill-opacity="0.08"
          />
        }
        <path
          [attr.d]="geometry().line"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        @if (geometry().last; as last) {
          <circle
            [attr.cx]="last.x"
            [attr.cy]="last.y"
            r="6"
            class="ring"
            fill="var(--ad-chart-surface, #fff)"
          />
          <circle
            [attr.cx]="last.x"
            [attr.cy]="last.y"
            r="4"
            [attr.fill]="color()"
          />
        }
        @if (hoverPoint(); as point) {
          <line
            class="grid"
            [attr.x1]="point.x"
            [attr.x2]="point.x"
            [attr.y1]="pad.top"
            [attr.y2]="height() - pad.bottom"
          />
        }
        @if (hoverPoint()?.dot && hoverPoint(); as point) {
          <circle
            [attr.cx]="point.x"
            [attr.cy]="point.y"
            r="6"
            fill="var(--ad-chart-surface, #fff)"
          />
          <circle
            [attr.cx]="point.x"
            [attr.cy]="point.y"
            r="4"
            [attr.fill]="color()"
          />
        }
      </svg>
    }
    @if (hoverPoint(); as point) {
      <div class="tip" [style.left.px]="tipX(point.x)" [style.top.px]="point.y">
        <span>{{ point.label }}</span
        ><br />
        @if (point.compareText !== null) {
          <i [style.background]="color()"></i>
        }
        <b>{{ point.text }}</b>
        @if (point.compareText !== null) {
          <br /><i style="background: #c5ccd8"></i
          ><span>{{ compareLabel() }}: {{ point.compareText }}</span>
        }
      </div>
    }
  `,
  styles: CHART_STYLES,
})
export class AdLineChartComponent {
  /** Values; null leaves a gap (e.g. a day without answers). */
  readonly values = input.required<readonly (number | null)[]>();
  readonly labels = input<readonly string[]>([]);
  readonly height = input(200);
  readonly color = input('var(--ad-chart-accent, #0078bb)');
  readonly unit = input('');
  readonly ariaLabel = input('Verlauf');
  /** Show every n-th x label, counted from the end. */
  readonly labelEvery = input(5);
  readonly percent = input(false);
  /** The previous period, drawn as a grey line behind the values. */
  readonly compare = input<readonly (number | null)[] | null>(null);
  readonly compareLabel = input('Vorperiode');
  /** Draw the wash under the line. */
  readonly area = input(true);

  protected readonly pad = { top: 12, right: 12, bottom: 24, left: 44 };
  protected readonly width = hostWidth();
  protected readonly hover = signal<number | null>(null);

  protected readonly geometry = computed(() => {
    const values = this.values();
    const width = this.width();
    const height = this.height();
    const { top, right, bottom, left } = this.pad;
    const compare = this.compare() ?? [];
    const numbers = [...values, ...compare].filter((v): v is number => v !== null);
    const max = this.percent() ? 1 : Math.max(...numbers, 1);
    const ticks = this.percent() ? [0, 0.25, 0.5, 0.75, 1] : niceTicks(max);
    const ceiling = ticks[ticks.length - 1]!;
    const x = (i: number) =>
      left + (i * (width - left - right)) / Math.max(values.length - 1, 1);
    const y = (v: number) => top + (1 - v / ceiling) * (height - top - bottom);
    const base = height - bottom;
    const points = values.map((v, i) => (v === null ? null : { x: x(i), y: y(v) }));
    const runs = toRuns(points);
    const comparePoints = compare.map((v, i) =>
      v === null ? null : { x: x(i), y: y(v) },
    );
    const labels = this.labels();
    const every = this.labelEvery();
    return {
      points,
      line: runs.map((run) => pathOf(run)).join(''),
      area: runs
        .map(
          (run) =>
            `${pathOf(run)}L${run.at(-1)!.x.toFixed(1)},${base}L${run[0]!.x.toFixed(1)},${base}Z`,
        )
        .join(''),
      comparePath: toRuns(comparePoints)
        .map((run) => pathOf(run))
        .join(''),
      last: points.at(-1) ?? null,
      ticks: ticks.map((value) => ({
        value,
        y: y(value),
        label: this.percent() ? `${Math.round(value * 100)} %` : compact(value),
      })),
      xLabels: labels
        .map((text, i) => ({ text, x: x(i), i }))
        .filter((label) => (labels.length - 1 - label.i) % every === 0),
    };
  });

  protected readonly hoverPoint = computed(() => {
    const index = this.hover();
    if (index === null) {
      return null;
    }
    const value = this.values()[index];
    const point = this.geometry().points[index];
    const previous = this.compare()?.[index];
    const fallbackY = this.height() - this.pad.bottom;
    const x =
      this.pad.left +
      (index * (this.width() - this.pad.left - this.pad.right)) /
        Math.max(this.values().length - 1, 1);
    return {
      x: point?.x ?? x,
      y: point?.y ?? fallbackY,
      dot: point !== null && point !== undefined,
      label: this.labels()[index] ?? '',
      text:
        value === null || value === undefined ? 'keine Daten' : this.format(value),
      compareText:
        previous === undefined
          ? null
          : previous === null
            ? 'keine Daten'
            : this.format(previous),
    };
  });

  /** Keeps the tooltip inside the chart near the edges. */
  protected tipX(x: number): number {
    return Math.min(Math.max(x, 72), this.width() - 72);
  }

  private format(value: number): string {
    return this.percent()
      ? `${Math.round(value * 100)} %`
      : `${new Intl.NumberFormat('de-CH').format(value)}${this.unit() ? ' ' + this.unit() : ''}`;
  }

  protected onMove(event: PointerEvent): void {
    const svg = event.currentTarget as SVGElement;
    const x = event.clientX - svg.getBoundingClientRect().left;
    const count = this.values().length;
    if (count === 0) {
      return;
    }
    const inner = this.width() - this.pad.left - this.pad.right;
    const index = Math.round(((x - this.pad.left) / inner) * (count - 1));
    this.hover.set(Math.min(Math.max(index, 0), count - 1));
  }
}
