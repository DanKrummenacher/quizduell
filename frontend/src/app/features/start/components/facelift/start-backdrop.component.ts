import { Component, input, signal } from '@angular/core';

export type StartBackdropKind = 'aurora' | 'grid' | 'spotlight';

/**
 * TEMPORARY (variants): a layer behind the start page. The spotlight
 * follows the mouse; on touch screens it wanders by itself.
 */
@Component({
  selector: 'app-start-backdrop',
  template: `
    @switch (kind()) {
      @case ('aurora') {
        <i class="blob"></i><i class="blob"></i><i class="blob"></i>
      }
      @case ('grid') {
        <span class="grid"></span>
        <i class="beam is-h"></i><i class="beam is-v"></i><i class="beam is-h2"></i>
      }
      @default {
        <span class="light"></span>
      }
    }
  `,
  styleUrl: './start-backdrop.component.scss',
  host: {
    'aria-hidden': 'true',
    '[class]': "'is-' + kind()",
    '[class.is-tracking]': 'tracking()',
    '[style.--x.px]': 'x()',
    '[style.--y.px]': 'y()',
    '(window:pointermove)': 'onPointerMove($event)',
  },
})
export class StartBackdropComponent {
  readonly kind = input.required<StartBackdropKind>();

  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly tracking = signal(false);

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }
    this.tracking.set(true);
    this.x.set(event.clientX);
    this.y.set(event.clientY);
  }
}
