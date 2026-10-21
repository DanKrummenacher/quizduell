// TEMPORARY: proposal F, one round of a duel edited by dragging (development only).
import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { ProposalStore } from '../proposal-store';

type Handle = 'question' | 'reveal';

/**
 * One round – answering and the reveal – as a bar on a fixed scale. The
 * ends of both parts can be dragged (or moved with the arrow keys); the
 * number of rounds is set next to it.
 */
@Component({
  selector: 'app-round-editor',
  template: `
    @if (store.form(); as f) {
      <div class="round">
        <div class="track" #track>
          <div
            class="part question"
            [style.width.%]="pos(f.questionDurationSec)"
          ></div>
          <div
            class="part reveal"
            [style.left.%]="pos(f.questionDurationSec)"
            [style.width.%]="pos(f.revealDurationSec)"
          ></div>

          <span
            class="handle"
            role="slider"
            tabindex="0"
            aria-label="Sekunden pro Frage"
            [attr.aria-valuemin]="limits().q.min"
            [attr.aria-valuemax]="limits().q.max"
            [attr.aria-valuenow]="f.questionDurationSec"
            [style.left.%]="pos(f.questionDurationSec)"
            (pointerdown)="grab($event, 'question')"
            (keydown)="key($event, 'question')"
            ><span class="bubble"
              >Antworten {{ f.questionDurationSec }} s</span
            ></span
          >
          <span
            class="handle reveal-handle"
            role="slider"
            tabindex="0"
            aria-label="Sekunden für die Auflösung"
            [attr.aria-valuemin]="limits().r.min"
            [attr.aria-valuemax]="limits().r.max"
            [attr.aria-valuenow]="f.revealDurationSec"
            [style.left.%]="pos(f.questionDurationSec + f.revealDurationSec)"
            (pointerdown)="grab($event, 'reveal')"
            (keydown)="key($event, 'reveal')"
            ><span class="bubble">Auflösung {{ f.revealDurationSec }} s</span></span
          >
        </div>
        <div class="scale" aria-hidden="true">
          @for (tick of ticks(); track tick) {
            <span [style.left.%]="pos(tick)">{{ tick }} s</span>
          }
        </div>
      </div>
    }
  `,
  styles: `
    @use '@css-ch/calc-design-tokens/miscs';
    @use '@css-ch/calc-helpers/styles' as functions;
    @use '../kit';

    .round {
      padding: functions.rem(40) functions.rem(12) 0;
    }

    .track {
      position: relative;
      height: functions.rem(56);
      border-radius: functions.rem(4);
      background:
        repeating-linear-gradient(
          90deg,
          transparent 0 calc(10% - 1px),
          rgba(0, 50, 125, 0.08) calc(10% - 1px) 10%
        ),
        kit.$fill;
      touch-action: none;
    }

    .part {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      display: flex;
      align-items: center;
      padding: 0 functions.rem(12);
      overflow: hidden;
      border-radius: functions.rem(4) 0 0 functions.rem(4);
      background-color: kit.$blue;
      color: kit.$white;
      transition:
        width 0.08s linear,
        left 0.08s linear;

      &.reveal {
        border-radius: 0 functions.rem(4) functions.rem(4) 0;
        background-color: kit.$green;
      }
    }

    // The values above the handles: answering to the left, the reveal to
    // the right, so they never cover each other.
    .bubble {
      position: absolute;
      bottom: calc(100% + #{functions.rem(6)});
      right: 50%;
      padding: functions.rem(3) functions.rem(8);
      border-radius: functions.rem(4) functions.rem(4) 0 functions.rem(4);
      background-color: kit.$blue;
      font-size: functions.rem(12);
      font-weight: miscs.$css-ui-font-weight-bold;
      color: kit.$white;
      white-space: nowrap;
      pointer-events: none;

      .reveal-handle & {
        right: auto;
        left: 50%;
        border-radius: functions.rem(4) functions.rem(4) functions.rem(4) 0;
        background-color: kit.$green;
      }
    }

    .handle {
      position: absolute;
      top: functions.rem(-6);
      bottom: functions.rem(-6);
      width: functions.rem(20);
      margin-left: functions.rem(-10);
      cursor: ew-resize;
      transition: left 0.08s linear;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: functions.rem(6);
        margin-left: functions.rem(-3);
        border-radius: functions.rem(3);
        background-color: kit.$white;
        box-shadow:
          0 0 0 functions.rem(2) kit.$blue,
          0 functions.rem(2) functions.rem(6) rgba(0, 0, 0, 0.2);
      }

      &.reveal-handle::before {
        box-shadow:
          0 0 0 functions.rem(2) kit.$green,
          0 functions.rem(2) functions.rem(6) rgba(0, 0, 0, 0.2);
      }

      &:focus-visible {
        outline: none;

        &::before {
          box-shadow: 0 0 0 functions.rem(4) kit.$cyan;
        }
      }
    }

    .scale {
      position: relative;
      height: functions.rem(24);
      margin-top: functions.rem(6);
      font-size: functions.rem(12);
      color: kit.$muted;

      span {
        position: absolute;
        transform: translateX(-50%);
      }
    }
  `,
})
export class RoundEditorComponent {
  protected readonly store = inject(ProposalStore);
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  protected readonly limits = computed(() => ({
    q: this.store.limit('questionDurationSec'),
    r: this.store.limit('revealDurationSec'),
  }));
  /** The scale: the longest possible round. */
  private readonly span = computed(() => this.limits().q.max + this.limits().r.max);
  protected readonly ticks = computed(() => {
    const step = this.span() > 60 ? 20 : 10;
    return Array.from(
      { length: Math.floor(this.span() / step) + 1 },
      (_, i) => i * step,
    );
  });

  protected pos(seconds: number): number {
    return (seconds / this.span()) * 100;
  }

  protected grab(event: PointerEvent, handle: Handle): void {
    const element = this.track()?.nativeElement;
    if (!element) {
      return;
    }
    event.preventDefault();
    (event.target as HTMLElement).focus();
    const rect = element.getBoundingClientRect();
    const move = (e: PointerEvent) => {
      const seconds = Math.round(
        ((e.clientX - rect.left) / rect.width) * this.span(),
      );
      this.set(handle, seconds);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  protected key(event: KeyboardEvent, handle: Handle): void {
    const f = this.store.form();
    if (!f) {
      return;
    }
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowUp'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? -1
          : 0;
    if (delta) {
      event.preventDefault();
      const end =
        handle === 'question'
          ? f.questionDurationSec
          : f.questionDurationSec + f.revealDurationSec;
      this.set(handle, end + delta);
    }
  }

  /** Sets the end of a part, kept within the limits. */
  private set(handle: Handle, end: number): void {
    const f = this.store.form();
    if (!f) {
      return;
    }
    const clamp = (value: number, limit: { min: number; max: number }) =>
      Math.min(limit.max, Math.max(limit.min, value));
    if (handle === 'question') {
      this.store.setNumber('questionDurationSec', clamp(end, this.limits().q));
    } else {
      this.store.setNumber(
        'revealDurationSec',
        clamp(end - f.questionDurationSec, this.limits().r),
      );
    }
  }
}
