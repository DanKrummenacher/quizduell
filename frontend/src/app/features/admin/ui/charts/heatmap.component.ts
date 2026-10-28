import { Component, computed, input, signal } from '@angular/core';

/** Heatmap (days × hours), one hue from light to dark. */
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
