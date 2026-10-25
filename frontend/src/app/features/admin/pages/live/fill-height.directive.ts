import { DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';

/** Reports the height of its element, so a chart can fill it. */
@Directive({ selector: '[appFillHeight]' })
export class FillHeightDirective {
  readonly appFillHeight = output<number>();

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        this.appFillHeight.emit(Math.round(entry.contentRect.height));
      }
    });
    observer.observe(element);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
