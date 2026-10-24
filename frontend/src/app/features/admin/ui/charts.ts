// Small hand-drawn SVG charts of the admin. They follow one set of rules: thin
// marks, 2px lines, a light wash under lines, hairline grids, labels in text
// colours and a tooltip on hover. Colours come from CSS custom properties set
// by the admin page: --ad-chart-ink, --ad-chart-muted, --ad-chart-grid,
// --ad-chart-surface, --ad-chart-accent.
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Tracks the rendered width of the host, so lines stay crisp at any size.
 * It is 0 until measured; charts draw nothing before, so a guessed width can
 * never push the page wider than the screen.
 */
function hostWidth() {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const width = signal(0);
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    width.set(Math.max(Math.round(element.getBoundingClientRect().width), 40));
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        width.set(Math.max(Math.round(entry.contentRect.width), 40));
      }
    });
    observer.observe(element);
    destroyRef.onDestroy(() => observer.disconnect());
  });
  return width;
}

/** Rounded axis maximum and the tick values below it. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) {
    return [0, 1];
  }
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  // Counts never get fractional steps («0.25 Duelle»).
  const step = Math.max(
    1,
    [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= raw) ?? raw,
  );
  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 0.999; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }
  return ticks;
}

function compact(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`
    : `${value}`;
}

const CHART_STYLES = `
  :host {
    display: block;
    position: relative;
    contain: inline-size;
    color: var(--ad-chart-ink, #0e1a33);
  }
  svg {
    display: block;
    overflow: visible;
  }
  .grid {
    stroke: var(--ad-chart-grid, #eef0f3);
    stroke-width: 1;
    shape-rendering: crispEdges;
  }
  .tick {
    fill: var(--ad-chart-muted, #737d92);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .tip {
    position: absolute;
    z-index: 5;
    pointer-events: none;
    transform: translate(-50%, calc(-100% - 12px));
    padding: 7px 10px;
    border-radius: 6px;
    white-space: nowrap;
    font-size: 12px;
    line-height: 1.4;
    background: var(--ad-chart-tip-bg, #0e1a33);
    color: var(--ad-chart-tip-ink, #fff);
    box-shadow: 0 8px 24px -4px rgba(16, 24, 40, 0.3);
    font-variant-numeric: tabular-nums;
  }
  .tip b {
    font-weight: 700;
  }
  .tip span {
    opacity: 0.7;
  }
  .tip i {
    display: inline-block;
    width: 8px;
    height: 2px;
    margin-right: 6px;
    vertical-align: middle;
    border-radius: 1px;
  }
`;

// ---------------------------------------------------------------------------
// Line chart with area wash, crosshair and tooltip
// ---------------------------------------------------------------------------

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

interface Point {
  x: number;
  y: number;
}

/** Splits points into connected runs at the gaps. */
function toRuns(points: readonly (Point | null)[]): Point[][] {
  const runs: Point[][] = [];
  let run: Point[] = [];
  for (const point of points) {
    if (point) {
      run.push(point);
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) {
    runs.push(run);
  }
  return runs;
}

function pathOf(run: readonly Point[]): string {
  // A single point still gets a visible stub.
  const points =
    run.length === 1 ? [run[0]!, { x: run[0]!.x + 0.1, y: run[0]!.y }] : run;
  return points
    .map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join('');
}

// ---------------------------------------------------------------------------
// Column chart
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Heatmap (days × hours), one hue from light to dark
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-ad-heatmap',
  template: `
    <div class="heatmap" [style.--cols]="columns().length">
      <span></span>
      @for (column of columns(); track column) {
        <span class="col">{{ column }}</span>
      }
      @for (row of values(); track $index; let r = $index) {
        <span class="row">{{ rows()[r] }}</span>
        @for (value of row; track $index; let c = $index) {
          <span
            class="cell"
            tabindex="0"
            [style.background]="cellColor(value)"
            [attr.aria-label]="
              rows()[r] + ' ' + columns()[c] + ' Uhr: ' + value + ' Duelle'
            "
            (pointerenter)="hover.set({ r, c, value })"
            (pointerleave)="hover.set(null)"
            (focus)="hover.set({ r, c, value })"
            (blur)="hover.set(null)"
          ></span>
        }
      }
    </div>
    <p class="caption">
      @if (hover(); as cell) {
        <b
          >{{ rows()[cell.r] }}, {{ columns()[cell.c] }}–{{
            columns()[cell.c]! + 1
          }}
          Uhr:</b
        >
        {{ cell.value }} Duelle
      } @else {
        Wenig
        <span class="scale">
          @for (step of [0.08, 0.3, 0.55, 0.8, 1]; track step) {
            <i [style.background]="cellColor(step * max())"></i>
          }
        </span>
        Viel
      }
    </p>
  `,
  styles: `
    :host {
      display: block;
      color: var(--ad-chart-muted, #4d70a4);
      font-size: 11px;
    }
    .heatmap {
      display: grid;
      grid-template-columns: 2rem repeat(var(--cols), minmax(0, 1fr));
      gap: 3px;
    }
    .col {
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .row {
      align-self: center;
    }
    .cell {
      aspect-ratio: var(--ad-cell-ratio, 1.6);
      border-radius: 3px;
      outline-offset: 1px;
    }
    .caption {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 10px 0 0 2rem;
      min-height: 16px;
    }
    .caption b {
      color: var(--ad-chart-ink, #00327d);
      font-weight: 700;
    }
    .scale {
      display: inline-flex;
      gap: 3px;
    }
    .scale i {
      width: 14px;
      height: 10px;
      border-radius: 2px;
    }
  `,
})
export class AdHeatmapComponent {
  readonly values = input.required<readonly (readonly number[])[]>();
  readonly rows = input.required<readonly string[]>();
  readonly columns = input.required<readonly number[]>();
  /** RGB of the hue, e.g. «0, 120, 187». */
  readonly rgb = input('0, 120, 187');

  protected readonly hover = signal<{ r: number; c: number; value: number } | null>(
    null,
  );
  protected readonly max = computed(() => Math.max(...this.values().flat(), 1));

  protected cellColor(value: number): string {
    const share = value / this.max();
    return `rgba(${this.rgb()}, ${(0.06 + share * 0.94).toFixed(3)})`;
  }
}
