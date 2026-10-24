import { Component, computed, input } from '@angular/core';
import { AdSparklineComponent } from './charts';

/**
 * One key figure: label, value, the change to the previous period and an
 * optional trend line. `good` says which direction is good; without it the
 * change is shown neutral.
 */
@Component({
  selector: 'app-ad-kpi',
  imports: [AdSparklineComponent],
  template: `
    <p class="label">{{ label() }}</p>
    <p class="value">
      {{ value() }}
      @if (unit()) {
        <small>{{ unit() }}</small>
      }
    </p>
    <p class="change">
      @if (deltaText(); as text) {
        <span class="delta" [class]="tone()">{{ text }}</span>
        <span>{{ compareLabel() }}</span>
      } @else {
        <span>{{ note() || '–' }}</span>
      }
    </p>
    @if (trend(); as values) {
      @if (values.length > 1) {
        <app-ad-sparkline
          class="spark"
          [values]="values"
          [height]="34"
          [range]="range()"
        />
      }
    }
    @if (deltaText() && note()) {
      <p class="note">{{ note() }}</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      padding: 20px 22px;
      border: 1px solid #dbe2ec;
      border-radius: 4px;
      background: #fff;
    }
    .label {
      color: #4d70a4;
      font-size: 13px;
      font-weight: 500;
    }
    .value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .value small {
      margin-left: 2px;
      color: #4d70a4;
      font-size: 14px;
      font-weight: 300;
      letter-spacing: 0;
    }
    .change {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 6px;
      min-height: 20px;
      color: #6c86ae;
      font-size: 12px;
    }
    .delta {
      display: inline-flex;
      align-items: center;
      height: 20px;
      padding: 0 7px;
      border-radius: 99px;
      background: #eff2f6;
      color: #4d70a4;
      font-size: 11px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .delta.good {
      background: #e6f4ef;
      color: #006b4b;
    }
    .delta.bad {
      background: #fcefec;
      color: #a8290f;
    }
    .spark {
      margin-top: 10px;
    }
    .spark + .note {
      margin-top: 0;
    }
    .note {
      margin-top: auto;
      padding-top: 8px;
      color: #6c86ae;
      font-size: 12px;
    }
    @media (max-width: 640px) {
      :host {
        padding: 16px;
      }
    }
  `,
})
export class AdKpiComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly unit = input('');
  /** Change as a share (relative) or in points (`points`). */
  readonly delta = input<number | null>(null);
  readonly points = input(false);
  /** Which direction is good; null shows the change neutral. */
  readonly good = input<'up' | 'down' | null>('up');
  readonly compareLabel = input('zur Vorperiode');
  readonly note = input('');
  readonly trend = input<readonly number[] | null>(null);
  readonly range = input<[number, number] | null>(null);

  protected readonly deltaText = computed(() => {
    const delta = this.delta();
    if (delta === null || !Number.isFinite(delta)) {
      return null;
    }
    const value = delta * 100;
    const rounded =
      Math.abs(value) < 10 ? Math.round(value * 10) / 10 : Math.round(value);
    const text = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 1 }).format(
      Math.abs(rounded),
    );
    const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '±';
    return `${sign}${text} ${this.points() ? '%-Pkt.' : '%'}`;
  });

  protected readonly tone = computed(() => {
    const delta = this.delta() ?? 0;
    const good = this.good();
    if (!good || Math.abs(delta) < 0.005) {
      return 'flat';
    }
    return delta > 0 === (good === 'up') ? 'good' : 'bad';
  });
}
