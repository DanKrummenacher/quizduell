import { Component, computed, input, signal } from '@angular/core';
import { CHART_STYLES, compact, hostWidth, niceTicks } from './chart-shared';

export interface ColumnDatum {
  label: string;
  value: number;
  /** Optional second line in the tooltip. */
  note?: string;
}

@Component({
  selector: 'app-ad-column-chart',
  template: `
    @if (width() > 0) {
      <svg
        [attr.width]="width()"
        [attr.height]="height()"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        @if (axis()) {
          @for (tick of geometry().ticks; track tick.value) {
            <line
              class="grid"
              [attr.x1]="pad.left"
              [attr.x2]="width() - 4"
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
        } @else {
          <line
            class="grid"
            [attr.x1]="0"
            [attr.x2]="width()"
            [attr.y1]="geometry().base"
            [attr.y2]="geometry().base"
          />
        }
        @for (bar of geometry().bars; track bar.label; let i = $index) {
          <g (pointerenter)="hover.set(i)" (pointerleave)="hover.set(null)">
            <rect
              [attr.x]="bar.slotX"
              [attr.y]="0"
              [attr.width]="bar.slot"
              [attr.height]="geometry().base"
              fill="transparent"
            />
            <path
              [attr.d]="bar.path"
              [attr.fill]="
                i === highlight() || hover() === i ? color() : mutedColor()
              "
              [attr.fill-opacity]="hover() !== null && hover() !== i ? 0.55 : 1"
            />
            @if (
              showLabels() &&
              (labelEvery() === 1 ||
                (data().length - 1 - i) % labelEvery() === 0 ||
                i === highlight())
            ) {
              <text
                class="tick"
                [attr.x]="bar.cx"
                [attr.y]="height() - 4"
                text-anchor="middle"
              >
                {{ bar.label }}
              </text>
            }
          </g>
        }
        @if (highlightBar(); as bar) {
          <text
            class="tick value"
            [attr.x]="bar.cx"
            [attr.y]="bar.top - 6"
            text-anchor="middle"
          >
            {{ bar.valueText }}
          </text>
        }
      </svg>
    }
    @if (hoverBar(); as bar) {
      <div class="tip" [style.left.px]="tipX(bar.cx)" [style.top.px]="bar.top">
        <span>{{ bar.label }}</span
        ><br /><b>{{ bar.valueText }}</b>
        @if (bar.note) {
          <br /><span>{{ bar.note }}</span>
        }
      </div>
    }
  `,
  styles:
    CHART_STYLES +
    `.value { fill: var(--ad-chart-ink, #00327d); font-weight: 700; }`,
})
export class AdColumnChartComponent {
  readonly data = input.required<readonly ColumnDatum[]>();
  readonly height = input(180);
  readonly color = input('var(--ad-chart-accent, #0078bb)');
  /** Colour of the bars that are not highlighted. */
  readonly mutedColor = input('var(--ad-chart-accent, #0078bb)');
  readonly highlight = input<number | null>(null);
  readonly unit = input('');
  readonly axis = input(true);
  readonly showLabels = input(true);
  readonly labelEvery = input(1);
  readonly ariaLabel = input('Säulendiagramm');

  protected readonly width = hostWidth();
  protected readonly hover = signal<number | null>(null);

  protected get pad() {
    return {
      top: 18,
      bottom: this.showLabels() ? 22 : 4,
      left: this.axis() ? 40 : 0,
    };
  }

  protected readonly geometry = computed(() => {
    const data = this.data();
    const width = this.width();
    const height = this.height();
    const pad = this.pad;
    const max = Math.max(...data.map((d) => d.value), 1);
    const ticks = niceTicks(max);
    const top = ticks[ticks.length - 1]!;
    const base = height - pad.bottom;
    const slot = (width - pad.left - 4) / Math.max(data.length, 1);
    const thickness = Math.min(24, slot * 0.62);
    const y = (v: number) => pad.top + (1 - v / top) * (base - pad.top);
    const format = new Intl.NumberFormat('de-CH');
    return {
      base,
      ticks: ticks.map((value) => ({ value, y: y(value), label: compact(value) })),
      bars: data.map((d, i) => {
        const cx = pad.left + slot * (i + 0.5);
        const x = cx - thickness / 2;
        const barTop = Math.min(y(d.value), base - 1);
        const r = Math.min(4, (base - barTop) / 2, thickness / 2);
        const path = `M${x},${base}V${barTop + r}Q${x},${barTop} ${x + r},${barTop}H${x + thickness - r}Q${x + thickness},${barTop} ${x + thickness},${barTop + r}V${base}Z`;
        return {
          ...d,
          cx,
          slot,
          slotX: pad.left + slot * i,
          top: barTop,
          path,
          valueText: `${format.format(d.value)}${this.unit() ? ' ' + this.unit() : ''}`,
        };
      }),
    };
  });

  protected tipX(x: number): number {
    return Math.min(Math.max(x, 72), this.width() - 72);
  }

  protected readonly highlightBar = computed(() => {
    const index = this.highlight();
    return index === null || this.hover() !== null
      ? null
      : (this.geometry().bars[index] ?? null);
  });

  protected readonly hoverBar = computed(() => {
    const index = this.hover();
    return index === null ? null : (this.geometry().bars[index] ?? null);
  });
}
