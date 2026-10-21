// TEMPORARY: the course of one duel as a proportional bar (development only).
import { Component, computed, input } from '@angular/core';
import { formatDuration, type TimelineSegment } from '../proposal-store';

/**
 * One duel from the countdown to the last reveal: every part as wide as it
 * lasts, so the effect of a setting is visible at once.
 */
@Component({
  selector: 'app-duel-timeline',
  template: `
    <div class="bar" role="img" [attr.aria-label]="'Ein Duell dauert ' + total()">
      @for (segment of segments(); track $index) {
        <span
          class="segment"
          [class]="segment.kind"
          [style.flex-grow]="segment.seconds"
          [title]="segment.label + ' · ' + segment.seconds + ' s'"
        >
          @if (segment.kind === 'question' && showLabels()) {
            <span class="label">{{ segment.label }}</span>
          }
        </span>
      }
    </div>
    <div class="legend" aria-hidden="true">
      <span><i class="dot countdown"></i>Start</span>
      <span><i class="dot question"></i>Antworten</span>
      <span><i class="dot reveal"></i>Auflösung</span>
      <strong class="total">{{ total() }}</strong>
    </div>
  `,
  styles: `
    @use '@css-ch/web-design-tokens/colors';
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;

    :host {
      display: block;
    }

    .bar {
      display: flex;
      gap: functions.rem(3);
      height: functions.rem(40);
    }

    .segment {
      display: grid;
      place-items: center;
      min-width: functions.rem(4);
      border-radius: functions.rem(3);
      overflow: hidden;
      transition: flex-grow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .countdown {
      background-color: #8098be;
    }

    .question {
      background-color: colors.$dt-color-darkblue-100;
    }

    .reveal {
      background-color: colors.$dt-color-basil-dark;
    }

    .label {
      font-size: functions.rem(12);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: colors.$dt-color-white-100;
      white-space: nowrap;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: functions.rem(6) functions.rem(16);
      margin-top: functions.rem(12);
      font-size: functions.rem(14);
      color: colors.$dt-color-darkblue-70;

      span {
        display: inline-flex;
        align-items: center;
        gap: functions.rem(6);
      }
    }

    .dot {
      width: functions.rem(10);
      height: functions.rem(10);
      border-radius: functions.rem(2);
    }

    .total {
      margin-left: auto;
      font-size: functions.rem(16);
      color: colors.$dt-color-darkblue-100;
    }
  `,
})
export class DuelTimelineComponent {
  readonly segments = input.required<TimelineSegment[]>();
  readonly seconds = input.required<number>();
  /** Labels in the question parts, where there is room for them. */
  readonly showLabels = input(true);

  protected readonly total = computed(() => formatDuration(this.seconds()));
}
