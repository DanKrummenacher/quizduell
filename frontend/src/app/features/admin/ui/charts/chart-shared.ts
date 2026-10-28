// Small hand-drawn SVG charts of the admin. They follow one set of rules: thin
// marks, 2px lines, a light wash under lines, hairline grids, labels in text
// colours and a tooltip on hover. Colours come from CSS custom properties set
// by the admin page: --ad-chart-ink, --ad-chart-muted, --ad-chart-grid,
// --ad-chart-surface, --ad-chart-accent.
import {
  afterNextRender,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';

/**
 * Tracks the rendered width of the host, so lines stay crisp at any size.
 * It is 0 until measured; charts draw nothing before, so a guessed width can
 * never push the page wider than the screen.
 */
export function hostWidth() {
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
export function niceTicks(max: number, count = 4): number[] {
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

export function compact(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`
    : `${value}`;
}

export const CHART_STYLES = `
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

export interface Point {
  x: number;
  y: number;
}

/** Splits points into connected runs at the gaps. */
export function toRuns(points: readonly (Point | null)[]): Point[][] {
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

export function pathOf(run: readonly Point[]): string {
  // A single point still gets a visible stub.
  const points =
    run.length === 1 ? [run[0]!, { x: run[0]!.x + 0.1, y: run[0]!.y }] : run;
  return points
    .map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join('');
}
