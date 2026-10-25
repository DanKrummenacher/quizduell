import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import '@css-ch/components/icon';
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { formatInt, formatSeconds } from '../core/format';

const LURE_SHARE = 0.3;

/**
 * How a question was answered: one row per answer with its share. The correct
 * answer is green; a wrong one that is picked more than the correct one is
 * red, the rest stays neutral, so the eye goes to what matters.
 */
@Component({
  selector: 'app-ad-answer-distribution',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (picked() === 0) {
      <p class="empty">
        @if (question().stats.answers > 0) {
          Die Verteilung auf die Antworten wird seit dem letzten Update erfasst und
          erscheint mit den nächsten Duellen.
        } @else {
          Noch nicht gespielt. Die Verteilung erscheint nach den ersten Duellen.
        }
      </p>
    } @else {
      <ol class="rows">
        @for (row of rows(); track row.letter) {
          <li class="row" [class.correct]="row.correct" [class.lure]="row.lure">
            <span class="letter">{{ row.letter }}</span>
            <span class="text">{{ row.text }}</span>
            @if (row.correct) {
              <span class="tag ok"
                ><css-icon icon="checkmark" size="xs"></css-icon>Richtig</span
              >
            } @else if (row.lure) {
              <span class="tag bad">Lockt</span>
            }
            <span class="share">{{ row.share }} %</span>
            <span class="bar"><span [style.width.%]="row.width"></span></span>
          </li>
        }
      </ol>
    }
    @if (footer()) {
      <p class="foot">
        {{ formatInt(question().stats.answers) }} Antworten ·
        {{ formatInt(question().stats.timeouts) }} ohne Antwort · Ø
        {{ formatSeconds(question().stats.avgAnswerMs) }}
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
      color: #00327d;
    }
    .rows {
      display: grid;
      gap: 14px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .row {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr) auto auto;
      grid-template-rows: auto 6px;
      align-items: center;
      column-gap: 8px;
      row-gap: 6px;
    }
    .letter {
      display: grid;
      grid-row: span 2;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: #eff2f6;
      color: #4d70a4;
      font-size: 12px;
      font-weight: 700;
    }
    .correct .letter {
      background: #00875e;
      color: #fff;
    }
    .lure .letter {
      background: #d53419;
      color: #fff;
    }
    .text {
      margin-right: 4px;
      overflow: hidden;
      font-size: 14px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      height: 20px;
      padding: 0 7px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 500;
    }
    .tag.ok {
      background: #e6f4ef;
      color: #006b4b;
    }
    .tag.bad {
      background: #fcefec;
      color: #a8290f;
    }
    .share {
      grid-column: 4;
      min-width: 38px;
      font-size: 14px;
      font-weight: 700;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .bar {
      grid-column: 2 / -1;
      height: 6px;
      border-radius: 3px;
      background: #eff2f6;
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      border-radius: 3px;
      background: #b9c7dc;
      transition: width 0.4s ease;
    }
    .correct .bar span {
      background: #00875e;
    }
    .lure .bar span {
      background: #d53419;
    }
    .empty {
      margin: 0;
      padding: 14px 16px;
      border-radius: 4px;
      background: #fafbfc;
      color: #4d70a4;
      font-size: 13px;
      line-height: 1.5;
    }
    .foot {
      margin: 16px 0 0;
      color: #6c86ae;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class AdAnswerDistributionComponent {
  readonly question = input.required<AdminQuestion>();
  readonly footer = input(true);

  protected readonly formatInt = formatInt;
  protected readonly formatSeconds = formatSeconds;

  protected readonly picked = computed(() =>
    this.question().stats.picks.reduce((sum, value) => sum + value, 0),
  );

  protected readonly rows = computed(() => {
    const q = this.question();
    const picks = q.stats.picks;
    const total = Math.max(this.picked(), 1);
    const max = Math.max(...picks, 1);
    const correctPicks = picks[q.correctIndex] ?? 0;
    // Same rule as the server's hint: the most picked wrong answer lures when
    // it gets at least 30 % and more than the correct one.
    let lure = -1;
    picks.forEach((value, index) => {
      if (index !== q.correctIndex && value > (picks[lure] ?? -1)) {
        lure = index;
      }
    });
    const lureValue = picks[lure] ?? 0;
    const luring = lureValue > correctPicks && lureValue / total >= LURE_SHARE;
    return q.options.map((text, index) => {
      const value = picks[index] ?? 0;
      return {
        letter: ANSWER_LETTERS[index] ?? '',
        text,
        correct: index === q.correctIndex,
        lure: luring && index === lure,
        share: Math.round((value / total) * 100),
        width: (value / max) * 100,
      };
    });
  });
}
